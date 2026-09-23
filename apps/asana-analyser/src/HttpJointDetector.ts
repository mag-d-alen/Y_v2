import type { DetectedJoints, JointDetector } from "@y-v2/asana-content";

export async function fetchPhotoPathsInFolder(folderPath: string): Promise<string[]> {
  const response = await fetch("/api/list-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderPath }),
  });
  const body = (await response.json()) as { photoPaths?: string[]; error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to list photos in folder");
  }
  return body.photoPaths ?? [];
}

export class HttpJointDetector implements JointDetector {
  async detect(photoPaths: string[]): Promise<DetectedJoints> {
    const response = await fetch("/api/detect-pose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoPaths }),
    });
    const body = (await response.json()) as DetectedJoints & { error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? "Detection failed");
    }
    return body;
  }
}
