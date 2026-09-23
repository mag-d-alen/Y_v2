import { describe, expect, it } from "vitest";
import { FakeJointDetector } from "./FakeJointDetector.js";
import { FIXTURE_DETECTED_JOINTS } from "./fixtures.js";

describe("FakeJointDetector", () => {
  it("returns the seeded DetectedJoints for a known photo path", async () => {
    const detector = new FakeJointDetector();

    const detectedJoints = await detector.detect(["fixtures/model-photos/trikonasana-standard.jpg"]);

    expect(detectedJoints).toEqual(FIXTURE_DETECTED_JOINTS["fixtures/model-photos/trikonasana-standard.jpg"]);
  });

  it("returns a no-person-detected reading for its fixture path", async () => {
    const detector = new FakeJointDetector();

    const detectedJoints = await detector.detect(["fixtures/model-photos/no-person-in-frame.jpg"]);

    expect(detectedJoints.personDetected).toBe(false);
  });

  it("rejects for an unknown photo path", async () => {
    const detector = new FakeJointDetector();

    await expect(detector.detect(["not/a/fixture.jpg"])).rejects.toThrow(/not\/a\/fixture\.jpg/);
  });

  it("rejects when called with no photo paths", async () => {
    const detector = new FakeJointDetector();

    await expect(detector.detect([])).rejects.toThrow(/at least one photo path/);
  });

  it("looks up by the first photo path when seeded with custom fixtures", async () => {
    const custom = {
      "custom/photo.jpg": { personDetected: true, joints: {} },
    };
    const detector = new FakeJointDetector(custom);

    const detectedJoints = await detector.detect(["custom/photo.jpg", "custom/other.jpg"]);

    expect(detectedJoints).toEqual(custom["custom/photo.jpg"]);
  });
});
