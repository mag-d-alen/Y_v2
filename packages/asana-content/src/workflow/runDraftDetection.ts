import { evaluateDetectedJoints, type DetectionRejectionReason } from "../detection/evaluateDetectedJoints.js";
import { mapDetectedJointsToPoseData } from "../detection/mapDetectedJointsToPoseData.js";
import type { PoseData } from "../domain.js";
import type { JointDetector } from "../JointDetector.js";

export type DraftDetectionResult =
  | { accepted: true; poseData: PoseData }
  | { accepted: false; rejectionReason: DetectionRejectionReason };

export async function runDraftDetection(
  detector: JointDetector,
  photoPaths: string[],
): Promise<DraftDetectionResult> {
  const detectedJoints = await detector.detect(photoPaths);
  const evaluation = evaluateDetectedJoints(detectedJoints);

  if (!evaluation.accepted) {
    return evaluation;
  }

  return { accepted: true, poseData: mapDetectedJointsToPoseData(detectedJoints) };
}
