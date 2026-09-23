import { describe, expect, it } from "vitest";
import type { DetectedJoints, JointReading } from "../domain.js";
import { evaluateDetectedJoints } from "./evaluateDetectedJoints.js";

function joint(confidence: number): JointReading {
  return { x: 0, y: 0, confidence };
}

const CONFIDENT_JOINTS = {
  nose: joint(0.9),
  leftShoulder: joint(0.9),
  rightShoulder: joint(0.9),
  leftElbow: joint(0.9),
  rightElbow: joint(0.9),
  leftWrist: joint(0.9),
  rightWrist: joint(0.9),
  leftHip: joint(0.9),
  rightHip: joint(0.9),
  leftKnee: joint(0.9),
  rightKnee: joint(0.9),
  leftAnkle: joint(0.9),
  rightAnkle: joint(0.9),
};

describe("evaluateDetectedJoints", () => {
  it("accepts a detection where every required joint is present and confident", () => {
    const detectedJoints: DetectedJoints = { personDetected: true, joints: CONFIDENT_JOINTS };

    expect(evaluateDetectedJoints(detectedJoints)).toEqual({ accepted: true, rejectionReason: null });
  });

  it("rejects when no person was detected", () => {
    const detectedJoints: DetectedJoints = { personDetected: false, joints: {} };

    expect(evaluateDetectedJoints(detectedJoints)).toEqual({
      accepted: false,
      rejectionReason: "no-person-detected",
    });
  });

  it("rejects when a required joint is missing", () => {
    const { rightAnkle: _rightAnkle, ...joints } = CONFIDENT_JOINTS;
    const detectedJoints: DetectedJoints = { personDetected: true, joints };

    expect(evaluateDetectedJoints(detectedJoints)).toEqual({
      accepted: false,
      rejectionReason: "missing-required-joint",
    });
  });

  it("rejects when a required joint's confidence is below the threshold", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: { ...CONFIDENT_JOINTS, rightAnkle: joint(0.22) },
    };

    expect(evaluateDetectedJoints(detectedJoints)).toEqual({
      accepted: false,
      rejectionReason: "low-confidence-joint",
    });
  });

  it("accepts a joint sitting exactly at the confidence threshold", () => {
    const detectedJoints: DetectedJoints = {
      personDetected: true,
      joints: { ...CONFIDENT_JOINTS, rightAnkle: joint(0.5) },
    };

    expect(evaluateDetectedJoints(detectedJoints).accepted).toBe(true);
  });
});
