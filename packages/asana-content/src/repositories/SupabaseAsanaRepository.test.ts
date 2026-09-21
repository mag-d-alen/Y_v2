import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAsanaRepository } from "./SupabaseAsanaRepository.js";

function readBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    returns: vi.fn(async () => result),
  };
  return builder;
}

function insertThenSelectBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    insert: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => result),
  };
  return builder;
}

function insertOnlyBuilder(result: { error: unknown }) {
  return { insert: vi.fn(async () => result) };
}

describe("SupabaseAsanaRepository getAsanaVariant", () => {
  it("maps a joined asana_variants row into AsanaVariantContent", async () => {
    const row = {
      tradition: "ashtanga",
      ashtanga_series: 1,
      label: "standard",
      asana: { sanskrit_name: "Trikonasana" },
      pose_data: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      muscle_annotations: [
        { muscle_id: "obliques-right", state: "working", role_description: "Side-bends the torso." },
      ],
    };
    const from = vi.fn(() => readBuilder({ data: row, error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    const content = await repository.getAsanaVariant("variant-1");

    expect(from).toHaveBeenCalledWith("asana_variants");
    expect(content).toEqual({
      asana: { sanskritName: "Trikonasana" },
      variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      muscleAnnotations: [
        { muscleId: "obliques-right", state: "working", roleDescription: "Side-bends the torso." },
      ],
    });
  });

  it("throws the underlying error when the read fails", async () => {
    const from = vi.fn(() => readBuilder({ data: null, error: new Error("boom") }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    await expect(repository.getAsanaVariant("variant-1")).rejects.toThrow("boom");
  });
});

describe("SupabaseAsanaRepository listAsanaVariants", () => {
  it("returns the variants for an existing asana", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(readBuilder({ data: { id: "asana-1" }, error: null }))
      .mockReturnValueOnce(
        readBuilder({
          data: [{ tradition: "ashtanga", ashtanga_series: 1, label: "standard" }],
          error: null,
        }),
      );
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    const variants = await repository.listAsanaVariants("Trikonasana");

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(variants).toEqual([{ tradition: "ashtanga", ashtangaSeries: 1, label: "standard" }]);
  });

  it("returns an empty list when the asana hasn't been authored yet", async () => {
    const from = vi.fn(() => readBuilder({ data: null, error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    const variants = await repository.listAsanaVariants("Vrksasana");

    expect(variants).toEqual([]);
  });
});

describe("SupabaseAsanaRepository saveAsanaVariant", () => {
  it("finds or creates the Asana before inserting the Variant and Pose Data", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "asana-1" }, error: null }))
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "variant-1" }, error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    await repository.saveAsanaVariant({
      sanskritName: "Vrksasana",
      variant: { tradition: "vinyasa", ashtangaSeries: null, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
    });

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(from).toHaveBeenNthCalledWith(3, "pose_data");
  });

  it("attaches an Iyengar variant to the same Asana Trikonasana already resolves to, tagged with its Ashtanga series", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "asana-1" }, error: null }))
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "variant-2" }, error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    await repository.saveAsanaVariant({
      sanskritName: "Trikonasana",
      variant: { tradition: "iyengar", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
    });

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(from).toHaveBeenNthCalledWith(3, "pose_data");
  });
});
