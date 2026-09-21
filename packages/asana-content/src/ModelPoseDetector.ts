import type { DetectionResult } from "./domain.js";

export interface ModelPoseDetector {
  detect(photoPaths: string[]): Promise<DetectionResult>;
}
