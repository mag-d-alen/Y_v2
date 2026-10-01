import {
  resolveDraftPoseData,
  type DraftPoseDataResolution,
  type ResolveDraftPoseDataOptions,
} from "../detection/resolveDraftPoseData.js";
import type { JointDetector } from "../JointDetector.js";

export type DraftDetectionResult = DraftPoseDataResolution;

export async function runDraftDetection(
  detector: JointDetector,
  photoPaths: string[],
  options: ResolveDraftPoseDataOptions,
): Promise<DraftDetectionResult> {
  const detectedJoints = await detector.detect(photoPaths);
  return resolveDraftPoseData(detectedJoints, options);
}
