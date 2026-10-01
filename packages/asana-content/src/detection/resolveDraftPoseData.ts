import type { BoneTransform, ContactPoint, DetectedJoints, JointReading, PoseData } from "../domain.js";
import type { JointName } from "./keypoints.js";

// Which way the person's head/face points in the photo: toward the camera (a front-on shot), or toward the
// left/right of the frame (a profile shot — this applies whether the person is upright and photographed from
// the side, or lying down with the camera to their side; in both cases "left"/"right" is whichever way their
// head/face points). Currently only consulted for lying-down poses (see deriveRootRotation below), to pick which
// horizontal direction the torso tilts — but captured generally since it's also meant to help resolve the
// detector's own left/right joint labeling for profile shots, a future use not yet wired up.
export type FacingDirection = "left" | "right" | "camera";

const PRONE_CONTACT_POINTS: ContactPoint[] = ["chest", "belly"];
const SUPINE_CONTACT_POINTS: ContactPoint[] = ["upperBack", "lowerBack", "sacrum", "backOfHead"];
const INVERTED_CONTACT_POINTS: ContactPoint[] = ["crownOfHead", "forehead"];

// MVP heuristic, not derived from photo geometry: which Contact Points the operator marks as touching the floor
// tells us the body's overall orientation relative to gravity (upright / lying face-down / lying face-up /
// upside-down), which is otherwise invisible to the detector — BlazePose has no way to know "this photo shows
// someone lying down" versus "standing," since both can produce similar-looking 2D limb angles. This only sets
// root's rotation (the whole body's coarse tilt); the real spine curve is still always hand-authored afterward.
function deriveRootRotation(groundContactPoints: ContactPoint[], facingDirection: FacingDirection): number {
  const isLyingDown =
    groundContactPoints.some((point) => PRONE_CONTACT_POINTS.includes(point)) ||
    groundContactPoints.some((point) => SUPINE_CONTACT_POINTS.includes(point));
  const isInverted = groundContactPoints.some((point) => INVERTED_CONTACT_POINTS.includes(point));

  if (isInverted) {
    return Math.PI;
  }
  if (isLyingDown) {
    if (facingDirection === "left") {
      return -Math.PI / 2;
    }
    if (facingDirection === "right") {
      return Math.PI / 2;
    }
  }
  return 0;
}

const BONE_NAMES = [
  "root",
  "head",
  "upperArmL",
  "upperArmR",
  "forearmL",
  "forearmR",
  "thighL",
  "thighR",
  "shinL",
  "shinR",
] as const;

export type DetectedBoneName = (typeof BONE_NAMES)[number];

interface BoneConfig {
  mirror: DetectedBoneName | null;
  requiredJoints: JointName[];
}

// DragonBones composes each bone's rendered transform as origin (bind pose) + offset + animationPose, so a
// PoseData bone position of {x:0, y:0} means "use the Rig's own bind-pose position, unchanged" — the detector
// only ever contributes rotation, never a position adjustment.
const BONE_REST_POSITION: Pick<BoneTransform, "x" | "y"> = { x: 0, y: 0 };

const BONE_CONFIG: Record<DetectedBoneName, BoneConfig> = {
  root: { mirror: null, requiredJoints: [] },
  head: { mirror: null, requiredJoints: ["nose", "leftShoulder", "rightShoulder"] },
  upperArmL: { mirror: "upperArmR", requiredJoints: ["leftShoulder", "leftElbow"] },
  upperArmR: { mirror: "upperArmL", requiredJoints: ["rightShoulder", "rightElbow"] },
  // forearmL/R also need the shoulder: DragonBones composes rotation as parent.rotation + own.rotation, so
  // the forearm's own rotation must be expressed relative to the upper arm's absolute angle (computed from
  // shoulder+elbow) — otherwise the upper arm's rotation gets double-counted once composed down the chain.
  forearmL: { mirror: "forearmR", requiredJoints: ["leftShoulder", "leftElbow", "leftWrist"] },
  forearmR: { mirror: "forearmL", requiredJoints: ["rightShoulder", "rightElbow", "rightWrist"] },
  thighL: { mirror: "thighR", requiredJoints: ["leftHip", "leftKnee"] },
  thighR: { mirror: "thighL", requiredJoints: ["rightHip", "rightKnee"] },
  // shinL/R likewise need the hip, to express their rotation relative to the thigh's absolute angle.
  shinL: { mirror: "shinR", requiredJoints: ["leftHip", "leftKnee", "leftAnkle"] },
  shinR: { mirror: "shinL", requiredJoints: ["rightHip", "rightKnee", "rightAnkle"] },
};

export const MIN_JOINT_CONFIDENCE = 0.3;

function midpoint(a: JointReading, b: JointReading): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Every bone in the Rig binds pointing local +Y ("down") or, for head, local -Y ("up") — see
// .scratch/asana-analyser/research-dragonbones-rotation-convention.md for the derivation, from DragonBones' and
// PixiJS' own source, of why a target (dx,dy) requires atan2(-dx,dy) for a +Y bind direction ("down") and
// atan2(dx,-dy) for a -Y bind direction ("up"): rendering happens in Y-down screen space, where the standard
// rotation matrix traces clockwise, so the naive atan2(dx,dy) silently mirrors the horizontal component.
function angleFromAxis(
  from: { x: number; y: number },
  to: { x: number; y: number },
  axis: "up" | "down",
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return axis === "up" ? Math.atan2(dx, -dy) : Math.atan2(-dx, dy);
}

function isUsable(joints: Record<string, JointReading>, name: JointName): boolean {
  const joint = joints[name];
  return !!joint && joint.confidence >= MIN_JOINT_CONFIDENCE;
}

// The absolute (image-space) angle a bone segment makes, independent of any parent bone — this is what a
// detector can actually observe from two joint positions.
function absoluteSegmentRotation(from: JointReading, to: JointReading): number {
  return angleFromAxis(from, to, "down");
}

// DragonBones composes each bone's rendered rotation as parent.rotation + own.rotation (bind-pose rotation is
// always 0 on this Rig). pelvis/lowerBack/upperBack are always 0 in this draft (the detector can't see spine
// curvature at all — see spec.md's Further Notes), so head/upperArmL/R/thighL/R's parent effectively contributes
// only `rootRotation`, and their own rotation must subtract it — otherwise root's rotation gets double-counted
// once composed down the chain. forearmL/R and shinL/R are one level further: their parent (upperArmL/R,
// thighL/R) already carries a real, non-zero absolute rotation of its own, so their own rotation must be
// expressed *relative to that parent's absolute angle* instead (root's contribution already cancels out through
// that subtraction, so it doesn't need to appear again here).
function computeDirectRotation(
  bone: DetectedBoneName,
  joints: Record<string, JointReading>,
  rootRotation: number,
): number | null {
  const requiredJoints = BONE_CONFIG[bone].requiredJoints;
  if (!requiredJoints.every((name) => isUsable(joints, name))) {
    return null;
  }

  switch (bone) {
    case "root":
      return rootRotation;
    case "head": {
      const shoulderMid = midpoint(joints.leftShoulder as JointReading, joints.rightShoulder as JointReading);
      return angleFromAxis(shoulderMid, joints.nose as JointReading, "up") - rootRotation;
    }
    case "upperArmL":
      return (
        absoluteSegmentRotation(joints.leftShoulder as JointReading, joints.leftElbow as JointReading) - rootRotation
      );
    case "upperArmR":
      return (
        absoluteSegmentRotation(joints.rightShoulder as JointReading, joints.rightElbow as JointReading) -
        rootRotation
      );
    case "forearmL":
      return (
        absoluteSegmentRotation(joints.leftElbow as JointReading, joints.leftWrist as JointReading) -
        absoluteSegmentRotation(joints.leftShoulder as JointReading, joints.leftElbow as JointReading)
      );
    case "forearmR":
      return (
        absoluteSegmentRotation(joints.rightElbow as JointReading, joints.rightWrist as JointReading) -
        absoluteSegmentRotation(joints.rightShoulder as JointReading, joints.rightElbow as JointReading)
      );
    case "thighL":
      return absoluteSegmentRotation(joints.leftHip as JointReading, joints.leftKnee as JointReading) - rootRotation;
    case "thighR":
      return (
        absoluteSegmentRotation(joints.rightHip as JointReading, joints.rightKnee as JointReading) - rootRotation
      );
    case "shinL":
      return (
        absoluteSegmentRotation(joints.leftKnee as JointReading, joints.leftAnkle as JointReading) -
        absoluteSegmentRotation(joints.leftHip as JointReading, joints.leftKnee as JointReading)
      );
    case "shinR":
      return (
        absoluteSegmentRotation(joints.rightKnee as JointReading, joints.rightAnkle as JointReading) -
        absoluteSegmentRotation(joints.rightHip as JointReading, joints.rightKnee as JointReading)
      );
  }
}

function worstJointFor(bone: DetectedBoneName, joints: Record<string, JointReading>): { joint: JointName; confidence: number } {
  const requiredJoints = BONE_CONFIG[bone].requiredJoints;
  let worstJoint: JointName = requiredJoints[0] as JointName;
  let worstConfidence = Infinity;
  for (const name of requiredJoints) {
    const confidence = joints[name]?.confidence ?? 0;
    if (confidence < worstConfidence) {
      worstConfidence = confidence;
      worstJoint = name;
    }
  }
  return { joint: worstJoint, confidence: worstConfidence === Infinity ? 0 : worstConfidence };
}

export interface ResolveDraftPoseDataOptions {
  assumeSymmetric: boolean;
  groundContactPoints: ContactPoint[];
  facingDirection: FacingDirection;
}

export type DraftPoseDataResolution =
  | { resolved: true; poseData: PoseData; mirroredBones: DetectedBoneName[] }
  | {
      resolved: false;
      rejectionReason: "no-person-detected";
    }
  | {
      resolved: false;
      rejectionReason: "unresolvable-joint";
      bone: DetectedBoneName;
      joint: JointName;
      confidence: number;
      mirrorAttempted: boolean;
    };

export function resolveDraftPoseData(
  detectedJoints: DetectedJoints,
  options: ResolveDraftPoseDataOptions,
): DraftPoseDataResolution {
  if (!detectedJoints.personDetected) {
    return { resolved: false, rejectionReason: "no-person-detected" };
  }

  const joints = detectedJoints.joints;
  const rootRotation = deriveRootRotation(options.groundContactPoints, options.facingDirection);
  const directRotation: Partial<Record<DetectedBoneName, number>> = {};
  for (const bone of BONE_NAMES) {
    const rotation = computeDirectRotation(bone, joints, rootRotation);
    if (rotation !== null) {
      directRotation[bone] = rotation;
    }
  }

  const resolvedRotation: Partial<Record<DetectedBoneName, number>> = { ...directRotation };
  const mirroredBones: DetectedBoneName[] = [];

  if (options.assumeSymmetric) {
    for (const bone of BONE_NAMES) {
      if (resolvedRotation[bone] !== undefined) {
        continue;
      }
      const mirror = BONE_CONFIG[bone].mirror;
      const mirrorRotation = mirror ? directRotation[mirror] : undefined;
      if (mirrorRotation !== undefined) {
        resolvedRotation[bone] = -mirrorRotation;
        mirroredBones.push(bone);
      }
    }
  }

  for (const bone of BONE_NAMES) {
    if (resolvedRotation[bone] === undefined) {
      const { joint, confidence } = worstJointFor(bone, joints);
      const mirrorAttempted = options.assumeSymmetric && BONE_CONFIG[bone].mirror !== null;
      return { resolved: false, rejectionReason: "unresolvable-joint", bone, joint, confidence, mirrorAttempted };
    }
  }

  const bones: Record<string, BoneTransform> = {};
  for (const bone of BONE_NAMES) {
    bones[bone] = { ...BONE_REST_POSITION, rotation: resolvedRotation[bone] as number };
  }

  return { resolved: true, poseData: { bones }, mirroredBones };
}
