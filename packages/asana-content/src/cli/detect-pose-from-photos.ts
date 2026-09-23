import { resolve } from "node:path";
import { listPhotoPathsInFolder } from "../detection/listPhotoPathsInFolder.js";
import { mapDetectedJointsToPoseData } from "../detection/mapDetectedJointsToPoseData.js";
import { BlazePoseJointDetector } from "../detection/BlazePoseJointDetector.js";

async function main(): Promise<void> {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error("Usage: pnpm detect-pose <path-to-local-model-photo-folder>");
    process.exitCode = 1;
    return;
  }

  const folderPath = resolve(folderArg);
  const photoPaths = listPhotoPathsInFolder(folderPath);
  if (photoPaths.length === 0) {
    console.error(`No .jpg/.jpeg/.png photos found in "${folderPath}"`);
    process.exitCode = 1;
    return;
  }

  const detector = new BlazePoseJointDetector();
  const detectedJoints = await detector.detect(photoPaths);
  const poseData = mapDetectedJointsToPoseData(detectedJoints);

  console.log(JSON.stringify(poseData, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
