import type { DetectedJoints } from "../domain.js";
import { REQUIRED_JOINTS } from "./mapDetectedJointsToPoseData.js";

export const MIN_JOINT_CONFIDENCE = 0.5;

export type DetectionRejectionReason = "no-person-detected" | "missing-required-joint" | "low-confidence-joint";

export type DetectionEvaluation =
  | { accepted: true; rejectionReason: null }
  | { accepted: false; rejectionReason: DetectionRejectionReason };

export function evaluateDetectedJoints(detectedJoints: DetectedJoints): DetectionEvaluation {
  if (!detectedJoints.personDetected) {
    return { accepted: false, rejectionReason: "no-person-detected" };
  }

  for (const name of REQUIRED_JOINTS) {
    if (!detectedJoints.joints[name]) {
      return { accepted: false, rejectionReason: "missing-required-joint" };
    }
  }

  for (const name of REQUIRED_JOINTS) {
    if ((detectedJoints.joints[name]?.confidence ?? 0) < MIN_JOINT_CONFIDENCE) {
      return { accepted: false, rejectionReason: "low-confidence-joint" };
    }
  }

  return { accepted: true, rejectionReason: null };
}
