import { describe, expect, it } from "vitest";
import type { DetectedJoints, JointReading } from "../domain.js";
import { resolveDraftPoseData } from "./resolveDraftPoseData.js";

function joint(x: number, y: number, confidence: number): JointReading {
  return { x, y, confidence };
}

const CONFIDENT_STANDING: DetectedJoints = {
  personDetected: true,
  joints: {
    nose: joint(0, 20, 0.95),
    leftShoulder: joint(-15, 40, 0.92),
    rightShoulder: joint(15, 40, 0.93),
    leftElbow: joint(-15, 70, 0.91),
    rightElbow: joint(15, 70, 0.9),
    leftWrist: joint(-15, 100, 0.88),
    rightWrist: joint(15, 100, 0.9),
    leftHip: joint(-10, 100, 0.94),
    rightHip: joint(10, 100, 0.94),
    leftKnee: joint(-10, 130, 0.9),
    rightKnee: joint(10, 130, 0.89),
    leftAnkle: joint(-10, 160, 0.85),
    rightAnkle: joint(10, 160, 0.87),
  },
};

const PRECISE_GEOMETRY: DetectedJoints = {
  personDetected: true,
  joints: {
    nose: joint(50, -50, 0.9),
    leftShoulder: joint(0, 0, 0.9),
    rightShoulder: joint(100, 0, 0.9),
    leftElbow: joint(10, 10, 0.9),
    rightElbow: joint(90, 10, 0.9),
    leftWrist: joint(10, 20, 0.9),
    rightWrist: joint(90, 20, 0.9),
    leftHip: joint(0, 50, 0.9),
    rightHip: joint(100, 50, 0.9),
    leftKnee: joint(-10, 60, 0.9),
    rightKnee: joint(110, 60, 0.9),
    leftAnkle: joint(-10, 80, 0.9),
    rightAnkle: joint(110, 80, 0.9),
  },
};

describe("resolveDraftPoseData", () => {
  it("computes exact rotation values from joint geometry (angleFromAxis, midpoint), each relative to its parent bone", () => {
    const result = resolveDraftPoseData(PRECISE_GEOMETRY, { assumeSymmetric: false });

    expect(result.resolved).toBe(true);
    if (!result.resolved) throw new Error("expected resolution");
    const { bones } = result.poseData;

    // root is always 0 in this draft — the detector never derives an overall torso orientation (see spec.md).
    expect(bones.root?.rotation).toBeCloseTo(0);
    // nose (50,-50) is directly "up" from the shoulder midpoint (50,0) -> facing straight up, rotation 0.
    expect(bones.head?.rotation).toBeCloseTo(0);
    // leftElbow (10,10) is down-and-right of leftShoulder (0,0): in DragonBones' Y-down screen space, a +Y-bind
    // bone's rotation traces clockwise, so "down-and-right" is -45 degrees, not +45 (see
    // .scratch/asana-analyser/research-dragonbones-rotation-convention.md).
    expect(bones.upperArmL?.rotation).toBeCloseTo(-Math.PI / 4);
    // rightElbow (90,10) is down-and-left of rightShoulder (100,0) -> +45 degrees.
    expect(bones.upperArmR?.rotation).toBeCloseTo(Math.PI / 4);
    // leftWrist is directly below leftElbow (0 degrees absolute), but upperArmL is -45 degrees absolute, so the
    // forearm's rotation *relative to the upper arm* must be +45 degrees to still point straight down in world space.
    expect(bones.forearmL?.rotation).toBeCloseTo(Math.PI / 4);
    expect(bones.forearmR?.rotation).toBeCloseTo(-Math.PI / 4);
    // leftKnee (-10,60) is down-and-left of leftHip (0,50) -> +45 degrees absolute.
    expect(bones.thighL?.rotation).toBeCloseTo(Math.PI / 4);
    // rightKnee (110,60) is down-and-right of rightHip (100,50) -> -45 degrees absolute.
    expect(bones.thighR?.rotation).toBeCloseTo(-Math.PI / 4);
    // leftAnkle is directly below leftKnee (0 degrees absolute), relative to thighL's +45 degrees -> -45 degrees.
    expect(bones.shinL?.rotation).toBeCloseTo(-Math.PI / 4);
    expect(bones.shinR?.rotation).toBeCloseTo(Math.PI / 4);
  });

  it("rejects with 'no-person-detected' when no person was found", () => {
    const detectedJoints: DetectedJoints = { personDetected: false, joints: {} };

    const result = resolveDraftPoseData(detectedJoints, { assumeSymmetric: false });

    expect(result).toEqual({ resolved: false, rejectionReason: "no-person-detected" });
  });

  it("resolves every bone directly when every joint is confidently read", () => {
    const result = resolveDraftPoseData(CONFIDENT_STANDING, { assumeSymmetric: false });

    expect(result.resolved).toBe(true);
    if (!result.resolved) throw new Error("expected resolution");
    expect(result.mirroredBones).toEqual([]);
    expect(result.poseData.bones.shinR).toMatchObject({ x: 0, y: 0 });
  });

  it("rejects an unpaired bone (head/nose) outright, symmetry assumption notwithstanding", () => {
    const { nose: _nose, ...joints } = CONFIDENT_STANDING.joints;
    const detectedJoints: DetectedJoints = { personDetected: true, joints };

    const result = resolveDraftPoseData(detectedJoints, { assumeSymmetric: true });

    expect(result).toEqual({
      resolved: false,
      rejectionReason: "unresolvable-joint",
      bone: "head",
      joint: "nose",
      confidence: 0,
      mirrorAttempted: false,
    });
  });

  it("rejects a paired bone's failure when the operator said the pose is not symmetrical", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: { ...CONFIDENT_STANDING.joints, rightAnkle: joint(10, 160, 0.05) },
    };

    const result = resolveDraftPoseData(detectedJoints, { assumeSymmetric: false });

    expect(result).toEqual({
      resolved: false,
      rejectionReason: "unresolvable-joint",
      bone: "shinR",
      joint: "rightAnkle",
      confidence: 0.05,
      mirrorAttempted: false,
    });
  });

  it("mirrors a failed paired bone from its confident counterpart when the operator said the pose is symmetrical", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: { ...CONFIDENT_STANDING.joints, rightAnkle: joint(10, 160, 0.05) },
    };

    const result = resolveDraftPoseData(detectedJoints, { assumeSymmetric: true });

    expect(result.resolved).toBe(true);
    if (!result.resolved) throw new Error("expected resolution");
    expect(result.mirroredBones).toEqual(["shinR"]);
    expect(result.poseData.bones.shinR?.rotation).toBeCloseTo(-(result.poseData.bones.shinL?.rotation ?? NaN));
  });

  it("rejects when both sides of a pair fail even with symmetry assumed, reporting mirrorAttempted", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: { ...CONFIDENT_STANDING.joints, leftAnkle: joint(-10, 160, 0.05), rightAnkle: joint(10, 160, 0.05) },
    };

    const result = resolveDraftPoseData(detectedJoints, { assumeSymmetric: true });

    expect(result).toEqual({
      resolved: false,
      rejectionReason: "unresolvable-joint",
      bone: "shinL",
      joint: "leftAnkle",
      confidence: 0.05,
      mirrorAttempted: true,
    });
  });
});
