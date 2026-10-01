import { resolve } from "node:path";
import { listPhotoPathsInFolder } from "../detection/listPhotoPathsInFolder.js";
import { resolveDraftPoseData } from "../detection/resolveDraftPoseData.js";
import { describeRejection } from "../detection/describeRejection.js";
import { BlazePoseJointDetector } from "../detection/BlazePoseJointDetector.js";

async function main(): Promise<void> {
  const [folderArg, ...flags] = process.argv.slice(2);
  if (!folderArg) {
    console.error("Usage: pnpm detect-pose <path-to-local-model-photo-folder> [--symmetric]");
    process.exitCode = 1;
    return;
  }

  const assumeSymmetric = flags.includes("--symmetric");

  const folderPath = resolve(folderArg);
  const photoPaths = listPhotoPathsInFolder(folderPath);
  if (photoPaths.length === 0) {
    console.error(`No .jpg/.jpeg/.png photos found in "${folderPath}"`);
    process.exitCode = 1;
    return;
  }

  const detector = new BlazePoseJointDetector();
  const detectedJoints = await detector.detect(photoPaths);
  const resolution = resolveDraftPoseData(detectedJoints, {
    assumeSymmetric,
    groundContactPoints: [],
    facingDirection: "camera",
  });

  if (!resolution.resolved) {
    console.error(describeRejection(resolution));
    process.exitCode = 1;
    return;
  }

  if (resolution.mirroredBones.length > 0) {
    console.error(`Mirrored from the opposite side (verify visually): ${resolution.mirroredBones.join(", ")}`);
  }
  console.log(JSON.stringify(resolution.poseData, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
