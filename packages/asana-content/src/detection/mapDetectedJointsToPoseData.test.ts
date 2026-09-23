import { describe, expect, it } from "vitest";
import type { DetectedJoints, JointReading } from "../domain.js";
import { mapDetectedJointsToPoseData } from "./mapDetectedJointsToPoseData.js";

function joint(x: number, y: number): JointReading {
  return { x, y, confidence: 1 };
}

const STANDING_STRAIGHT: DetectedJoints = {
  personDetected: true,
  joints: {
    nose: joint(0, 20),
    leftShoulder: joint(-15, 40),
    rightShoulder: joint(15, 40),
    leftElbow: joint(-15, 70),
    rightElbow: joint(15, 70),
    leftWrist: joint(-15, 100),
    rightWrist: joint(15, 100),
    leftHip: joint(-10, 100),
    rightHip: joint(10, 100),
    leftKnee: joint(-10, 130),
    rightKnee: joint(10, 130),
    leftAnkle: joint(-10, 160),
    rightAnkle: joint(10, 160),
  },
};

describe("mapDetectedJointsToPoseData", () => {
  it("maps a person standing straight to a neutral Pose Data (all rotations zero)", () => {
    const poseData = mapDetectedJointsToPoseData(STANDING_STRAIGHT);

    expect(poseData).toEqual({
      bones: {
        root: { x: 0, y: 0, rotation: 0 },
        head: { x: 0, y: -30, rotation: 0 },
        upperArmL: { x: -20, y: -10, rotation: 0 },
        upperArmR: { x: 20, y: -10, rotation: 0 },
        forearmL: { x: 0, y: 20, rotation: 0 },
        forearmR: { x: 0, y: 20, rotation: 0 },
        thighL: { x: -10, y: 10, rotation: 0 },
        thighR: { x: 10, y: 10, rotation: 0 },
        shinL: { x: 0, y: 20, rotation: 0 },
        shinR: { x: 0, y: 20, rotation: 0 },
      },
    });
  });

  it("derives each bone's rotation independently from the corresponding joint vector", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: {
        leftHip: joint(0, 0),
        rightHip: joint(50, 0),
        leftShoulder: joint(50, 200),
        rightShoulder: joint(70, 200),
        nose: joint(0, 200),
        leftElbow: joint(80, 170),
        rightElbow: joint(40, 170),
        leftWrist: joint(110, 200),
        rightWrist: joint(10, 200),
        leftKnee: joint(10, 0),
        rightKnee: joint(40, 0),
        leftAnkle: joint(10, -10),
        rightAnkle: joint(40, 10),
      },
    };

    const poseData = mapDetectedJointsToPoseData(detectedJoints);

    expect(poseData.bones.root?.rotation).toBeCloseTo(0);
    expect(poseData.bones.head?.rotation).toBeCloseTo(-Math.PI / 2);
    expect(poseData.bones.upperArmL?.rotation).toBeCloseTo((3 * Math.PI) / 4);
    expect(poseData.bones.upperArmR?.rotation).toBeCloseTo((-3 * Math.PI) / 4);
    expect(poseData.bones.forearmL?.rotation).toBeCloseTo(Math.PI / 4);
    expect(poseData.bones.forearmR?.rotation).toBeCloseTo(-Math.PI / 4);
    expect(poseData.bones.thighL?.rotation).toBeCloseTo(Math.PI / 2);
    expect(poseData.bones.thighR?.rotation).toBeCloseTo(-Math.PI / 2);
    expect(poseData.bones.shinL?.rotation).toBeCloseTo(Math.PI);
    expect(poseData.bones.shinR?.rotation).toBeCloseTo(0);
  });

  it("keeps every bone's x/y at the Rig's rest position, varying only rotation", () => {
    const poseData = mapDetectedJointsToPoseData(STANDING_STRAIGHT);

    expect(poseData.bones.head).toMatchObject({ x: 0, y: -30 });
    expect(poseData.bones.upperArmR).toMatchObject({ x: 20, y: -10 });
  });

  it("throws when no person was detected", () => {
    const detectedJoints: DetectedJoints = { personDetected: false, joints: {} };

    expect(() => mapDetectedJointsToPoseData(detectedJoints)).toThrow(/no person detected/i);
  });

  it("throws naming the missing joint when a required joint is absent", () => {
    const { leftAnkle: _leftAnkle, ...joints } = STANDING_STRAIGHT.joints;
    const detectedJoints: DetectedJoints = { personDetected: true, joints };

    expect(() => mapDetectedJointsToPoseData(detectedJoints)).toThrow(/leftAnkle/);
  });
});
