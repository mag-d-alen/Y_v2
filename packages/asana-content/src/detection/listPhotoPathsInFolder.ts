import { readdirSync } from "node:fs";
import { extname, join } from "node:path";

const PHOTO_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

export function listPhotoPathsInFolder(folderPath: string): string[] {
  return readdirSync(folderPath)
    .filter((fileName) => PHOTO_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .sort()
    .map((fileName) => join(folderPath, fileName));
}
