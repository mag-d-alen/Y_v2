import { describe, expect, it } from "vitest";
import { FakeJointDetector } from "../detection/FakeJointDetector.js";
import { runDraftDetection } from "./runDraftDetection.js";

describe("runDraftDetection", () => {
  it("accepts a confident detection and returns its mapped draft Pose Data", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(detector, ["fixtures/model-photos/trikonasana-standard.jpg"]);

    expect(result.accepted).toBe(true);
    if (!result.accepted) {
      throw new Error("expected acceptance");
    }
    expect(result.poseData.bones.root).toEqual({ x: 0, y: 0, rotation: 0 });
  });

  it("rejects with 'no-person-detected' and never maps Pose Data", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(detector, ["fixtures/model-photos/no-person-in-frame.jpg"]);

    expect(result).toEqual({ accepted: false, rejectionReason: "no-person-detected" });
  });

  it("rejects with 'low-confidence-joint' for a low-confidence reading", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(detector, ["fixtures/model-photos/low-confidence-detection.jpg"]);

    expect(result).toEqual({ accepted: false, rejectionReason: "low-confidence-joint" });
  });

  it("rejects with 'missing-required-joint' when a required joint wasn't read", async () => {
    const detector = new FakeJointDetector();

    const result = await runDraftDetection(detector, ["fixtures/model-photos/missing-joint-detection.jpg"]);

    expect(result).toEqual({ accepted: false, rejectionReason: "missing-required-joint" });
  });
});
