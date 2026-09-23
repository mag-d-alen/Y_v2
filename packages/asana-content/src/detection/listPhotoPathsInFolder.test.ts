import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { listPhotoPathsInFolder } from "./listPhotoPathsInFolder.js";

describe("listPhotoPathsInFolder", () => {
  let folderPath: string | undefined;

  afterEach(() => {
    if (folderPath) {
      rmSync(folderPath, { recursive: true, force: true });
      folderPath = undefined;
    }
  });

  it("lists only .jpg/.jpeg/.png files, sorted, as absolute paths", () => {
    folderPath = mkdtempSync(join(tmpdir(), "model-photos-"));
    writeFileSync(join(folderPath, "b.png"), "");
    writeFileSync(join(folderPath, "a.jpg"), "");
    writeFileSync(join(folderPath, "c.jpeg"), "");
    writeFileSync(join(folderPath, "notes.txt"), "");

    const photoPaths = listPhotoPathsInFolder(folderPath);

    expect(photoPaths).toEqual([join(folderPath, "a.jpg"), join(folderPath, "b.png"), join(folderPath, "c.jpeg")]);
  });

  it("returns an empty array when the folder has no photos", () => {
    folderPath = mkdtempSync(join(tmpdir(), "model-photos-"));
    writeFileSync(join(folderPath, "notes.txt"), "");

    expect(listPhotoPathsInFolder(folderPath)).toEqual([]);
  });
});
