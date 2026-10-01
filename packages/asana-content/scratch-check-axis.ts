import { BlazePoseJointDetector } from "./src/detection/BlazePoseJointDetector.js";

async function main(): Promise<void> {
  const photoPath = process.argv[2];
  if (!photoPath) {
    throw new Error("usage: tsx scratch-check-axis.ts <photo-path>");
  }

  const detector = new BlazePoseJointDetector();
  const result = await detector.detect([photoPath]);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
