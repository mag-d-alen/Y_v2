import type { BoneTransform, DetectedJoints, JointReading, PoseData } from "../domain.js";
import type { JointName } from "./keypoints.js";

const BONE_REST_POSITIONS = {
  root: { x: 0, y: 0 },
  head: { x: 0, y: -30 },
  upperArmL: { x: -20, y: -10 },
  upperArmR: { x: 20, y: -10 },
  forearmL: { x: 0, y: 20 },
  forearmR: { x: 0, y: 20 },
  thighL: { x: -10, y: 10 },
  thighR: { x: 10, y: 10 },
  shinL: { x: 0, y: 20 },
  shinR: { x: 0, y: 20 },
} satisfies Record<string, Pick<BoneTransform, "x" | "y">>;

export const REQUIRED_JOINTS: JointName[] = [
  "nose",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
];

function requireJoint(joints: Record<string, JointReading>, name: JointName): JointReading {
  const joint = joints[name];
  if (!joint) {
    throw new Error(`Missing required joint "${name}" for pose mapping`);
  }
  return joint;
}

function midpoint(a: JointReading, b: JointReading): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleFromAxis(
  from: { x: number; y: number },
  to: { x: number; y: number },
  axis: "up" | "down",
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return axis === "up" ? Math.atan2(dx, -dy) : Math.atan2(dx, dy);
}

export function mapDetectedJointsToPoseData(detectedJoints: DetectedJoints): PoseData {
  if (!detectedJoints.personDetected) {
    throw new Error("Cannot map Pose Data: no person detected");
  }

  for (const name of REQUIRED_JOINTS) {
    requireJoint(detectedJoints.joints, name);
  }

  const nose = requireJoint(detectedJoints.joints, "nose");
  const leftShoulder = requireJoint(detectedJoints.joints, "leftShoulder");
  const rightShoulder = requireJoint(detectedJoints.joints, "rightShoulder");
  const leftElbow = requireJoint(detectedJoints.joints, "leftElbow");
  const rightElbow = requireJoint(detectedJoints.joints, "rightElbow");
  const leftWrist = requireJoint(detectedJoints.joints, "leftWrist");
  const rightWrist = requireJoint(detectedJoints.joints, "rightWrist");
  const leftHip = requireJoint(detectedJoints.joints, "leftHip");
  const rightHip = requireJoint(detectedJoints.joints, "rightHip");
  const leftKnee = requireJoint(detectedJoints.joints, "leftKnee");
  const rightKnee = requireJoint(detectedJoints.joints, "rightKnee");
  const leftAnkle = requireJoint(detectedJoints.joints, "leftAnkle");
  const rightAnkle = requireJoint(detectedJoints.joints, "rightAnkle");

  const shoulderMid = midpoint(leftShoulder, rightShoulder);

  const boneAt = (name: keyof typeof BONE_REST_POSITIONS, rotation: number): BoneTransform => ({
    ...BONE_REST_POSITIONS[name],
    rotation,
  });

  return {
    bones: {
      root: boneAt("root", 0),
      head: boneAt("head", angleFromAxis(shoulderMid, nose, "up")),
      upperArmL: boneAt("upperArmL", angleFromAxis(leftShoulder, leftElbow, "down")),
      upperArmR: boneAt("upperArmR", angleFromAxis(rightShoulder, rightElbow, "down")),
      forearmL: boneAt("forearmL", angleFromAxis(leftElbow, leftWrist, "down")),
      forearmR: boneAt("forearmR", angleFromAxis(rightElbow, rightWrist, "down")),
      thighL: boneAt("thighL", angleFromAxis(leftHip, leftKnee, "down")),
      thighR: boneAt("thighR", angleFromAxis(rightHip, rightKnee, "down")),
      shinL: boneAt("shinL", angleFromAxis(leftKnee, leftAnkle, "down")),
      shinR: boneAt("shinR", angleFromAxis(rightKnee, rightAnkle, "down")),
    },
  };
}
