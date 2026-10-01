import { describe, expect, it } from "vitest";
import { FakeJointDetector } from "../detection/FakeJointDetector.js";
import { runDraftDetection } from "./runDraftDetection.js";

describe("runDraftDetection", () => {
  it("resolves a confident detection to its draft Pose Data", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(
      detector,
      ["fixtures/model-photos/trikonasana-standard.jpg"],
      { assumeSymmetric: false },
    );

    expect(result.resolved).toBe(true);
    if (!result.resolved) throw new Error("expected resolution");
    expect(result.poseData.bones.root).toEqual({ x: 0, y: 0, rotation: 0 });
    expect(result.mirroredBones).toEqual([]);
  });

  it("rejects with 'no-person-detected' and never resolves Pose Data", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(
      detector,
      ["fixtures/model-photos/no-person-in-frame.jpg"],
      { assumeSymmetric: false },
    );

    expect(result).toEqual({ resolved: false, rejectionReason: "no-person-detected" });
  });

  it("rejects a paired joint failure when the operator says the pose isn't symmetrical", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(
      detector,
      ["fixtures/model-photos/low-confidence-detection.jpg"],
      { assumeSymmetric: false },
    );

    expect(result).toEqual({
      resolved: false,
      rejectionReason: "unresolvable-joint",
      bone: "shinR",
      joint: "rightAnkle",
      confidence: 0.22,
      mirrorAttempted: false,
    });
  });

  it("mirrors a paired joint failure from its confident counterpart when the operator says the pose is symmetrical", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(
      detector,
      ["fixtures/model-photos/low-confidence-detection.jpg"],
      { assumeSymmetric: true },
    );

    expect(result.resolved).toBe(true);
    if (!result.resolved) throw new Error("expected resolution");
    expect(result.mirroredBones).toEqual(["shinR"]);
  });

  it("rejects an unpaired joint (nose) regardless of the symmetry answer", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(
      detector,
      ["fixtures/model-photos/missing-joint-detection.jpg"],
      { assumeSymmetric: true },
    );

    expect(result).toEqual({
      resolved: false,
      rejectionReason: "unresolvable-joint",
      bone: "head",
      joint: "nose",
      confidence: 0,
      mirrorAttempted: false,
    });
  });
});
