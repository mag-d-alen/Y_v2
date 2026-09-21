import { describe, expect, it } from "vitest";
import { FixtureAsanaRepository } from "./FixtureAsanaRepository.js";
import { FIXTURE_ASANA_VARIANTS } from "./fixtures.js";

describe("FixtureAsanaRepository", () => {
  it("returns the seeded content for a known variant id", async () => {
    const repository = new FixtureAsanaRepository();

    const content = await repository.getAsanaVariant("trikonasana-ashtanga");

    expect(content).toEqual(FIXTURE_ASANA_VARIANTS["trikonasana-ashtanga"]);
  });

  it("rejects for an unknown variant id", async () => {
    const repository = new FixtureAsanaRepository();

    await expect(repository.getAsanaVariant("does-not-exist")).rejects.toThrow(
      /does-not-exist/,
    );
  });

  it("records saveAsanaVariant calls for assertions", async () => {
    const repository = new FixtureAsanaRepository();
    const poseData = { bones: { root: { x: 0, y: 0, rotation: 0 } } };

    await repository.saveAsanaVariant({
      sanskritName: "Vrksasana",
      variant: { tradition: "vinyasa", ashtangaSeries: null, label: "standard" },
      poseData,
    });

    expect(repository.savedVariants).toEqual([
      {
        sanskritName: "Vrksasana",
        variant: { tradition: "vinyasa", ashtangaSeries: null, label: "standard" },
        poseData,
      },
    ]);
  });

  it("lists the variants seeded for a given asana", async () => {
    const repository = new FixtureAsanaRepository();

    const variants = await repository.listAsanaVariants("Trikonasana");

    expect(variants).toEqual([{ tradition: "ashtanga", ashtangaSeries: 1, label: "standard" }]);
  });

  it("returns no variants for an asana that hasn't been authored yet", async () => {
    const repository = new FixtureAsanaRepository();

    const variants = await repository.listAsanaVariants("Vrksasana");

    expect(variants).toEqual([]);
  });
});
