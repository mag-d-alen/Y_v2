import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-converter";
import sharp from "sharp";
import type { JointDetector } from "../JointDetector.js";
import type { DetectedJoints, JointReading } from "../domain.js";
import { JOINT_NAMES, type JointName } from "./keypoints.js";

function toJointName(blazePoseKeypointName: string): JointName | undefined {
  const camelCase = blazePoseKeypointName.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
  return (JOINT_NAMES as readonly string[]).includes(camelCase) ? (camelCase as JointName) : undefined;
}

async function loadPixelTensor(photoPath: string): Promise<tf.Tensor3D> {
  const { data, info } = await sharp(photoPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return tf.tensor3d(data, [info.height, info.width, info.channels], "int32");
}

export class BlazePoseJointDetector implements JointDetector {
  private detectorPromise: Promise<poseDetection.PoseDetector> | undefined;

  private getDetector(): Promise<poseDetection.PoseDetector> {
    if (!this.detectorPromise) {
      this.detectorPromise = (async () => {
        await tf.setBackend("cpu");
        await tf.ready();
        return poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
          runtime: "tfjs",
          modelType: "heavy",
        });
      })();
    }
    return this.detectorPromise;
  }

  async detect(photoPaths: string[]): Promise<DetectedJoints> {
    if (photoPaths.length === 0) {
      throw new Error("detect() requires at least one photo path");
    }

    const detector = await this.getDetector();
    const bestJoints = new Map<JointName, JointReading>();

    for (const photoPath of photoPaths) {
      const pixels = await loadPixelTensor(photoPath);
      let poses: poseDetection.Pose[];
      try {
        poses = await detector.estimatePoses(pixels, { maxPoses: 1 });
      } finally {
        pixels.dispose();
      }

      const [pose] = poses;
      const worldKeypoints = pose?.keypoints3D ?? pose?.keypoints;
      if (!worldKeypoints) {
        continue;
      }

      for (const keypoint of worldKeypoints) {
        const jointName = keypoint.name ? toJointName(keypoint.name) : undefined;
        if (!jointName) {
          continue;
        }

        const confidence = keypoint.score ?? 0;
        const bestSoFar = bestJoints.get(jointName);
        if (!bestSoFar || confidence > bestSoFar.confidence) {
          bestJoints.set(jointName, { x: keypoint.x, y: keypoint.y, z: keypoint.z, confidence });
        }
      }
    }

    if (bestJoints.size === 0) {
      return { personDetected: false, joints: {} };
    }

    return { personDetected: true, joints: Object.fromEntries(bestJoints) };
  }
}
