import type { JointDetector } from "../JointDetector.js";
import type { DetectedJoints } from "../domain.js";
import { FIXTURE_DETECTED_JOINTS } from "./fixtures.js";

export class FakeJointDetector implements JointDetector {
  private readonly detections: Map<string, DetectedJoints>;

  constructor(seed: Record<string, DetectedJoints> = FIXTURE_DETECTED_JOINTS) {
    this.detections = new Map(Object.entries(seed));
  }

  async detect(photoPaths: string[]): Promise<DetectedJoints> {
    const [photoPath] = photoPaths;
    if (!photoPath) {
      throw new Error("detect() requires at least one photo path");
    }

    const detectedJoints = this.detections.get(photoPath);
    if (!detectedJoints) {
      throw new Error(`No fixture DetectedJoints for photo path "${photoPath}"`);
    }
    return detectedJoints;
  }
}
