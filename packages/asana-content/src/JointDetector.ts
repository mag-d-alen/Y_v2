import type { DetectedJoints } from "./domain.js";

export interface JointDetector {
  detect(photoPaths: string[]): Promise<DetectedJoints>;
}
