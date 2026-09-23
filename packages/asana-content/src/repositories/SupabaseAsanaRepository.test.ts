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
      rotation_annotations: [{ bone: "upperBack", direction: "right" }],
      ground_contact_annotations: [{ point: "heelL" }],
      load_annotations: [{ point: "heelL", load_fraction: 0.5 }],
      body_contact_annotations: [{ point_a: "palmL", point_b: "bigToeL", contact_type: "grasp" }],
      drishti_annotations: { point: "noseTip" },
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
      rotationAnnotations: [{ bone: "upperBack", direction: "right" }],
      groundContactAnnotations: [{ point: "heelL" }],
      loadAnnotations: [{ point: "heelL", loadFraction: 0.5 }],
      bodyContactAnnotations: [{ pointA: "palmL", pointB: "bigToeL", contactType: "grasp" }],
      drishtiAnnotation: { point: "noseTip" },
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
  const EMPTY_ANNOTATIONS = {
    muscleAnnotations: [],
    rotationAnnotations: [],
    groundContactAnnotations: [],
    loadAnnotations: [],
    bodyContactAnnotations: [],
    drishtiAnnotation: null,
  };

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
      ...EMPTY_ANNOTATIONS,
    });

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(from).toHaveBeenNthCalledWith(3, "pose_data");
    expect(from).toHaveBeenCalledTimes(3);
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
      ...EMPTY_ANNOTATIONS,
    });

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(from).toHaveBeenNthCalledWith(3, "pose_data");
    expect(from).toHaveBeenCalledTimes(3);
  });

  it("inserts every populated annotation table, in order, after Pose Data", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "asana-1" }, error: null }))
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "variant-1" }, error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    await repository.saveAsanaVariant({
      sanskritName: "Trikonasana",
      variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      muscleAnnotations: [{ muscleId: "obliques-right", state: "working", roleDescription: "Side-bends." }],
      rotationAnnotations: [{ bone: "upperBack", direction: "right" }],
      groundContactAnnotations: [{ point: "heelL" }],
      loadAnnotations: [{ point: "heelL", loadFraction: 0.5 }],
      bodyContactAnnotations: [{ pointA: "palmL", pointB: "bigToeL", contactType: "grasp" }],
      drishtiAnnotation: { point: "noseTip" },
    });

    expect(from).toHaveBeenNthCalledWith(1, "asanas");
    expect(from).toHaveBeenNthCalledWith(2, "asana_variants");
    expect(from).toHaveBeenNthCalledWith(3, "pose_data");
    expect(from).toHaveBeenNthCalledWith(4, "muscle_annotations");
    expect(from).toHaveBeenNthCalledWith(5, "rotation_annotations");
    expect(from).toHaveBeenNthCalledWith(6, "ground_contact_annotations");
    expect(from).toHaveBeenNthCalledWith(7, "load_annotations");
    expect(from).toHaveBeenNthCalledWith(8, "body_contact_annotations");
    expect(from).toHaveBeenNthCalledWith(9, "drishti_annotations");
    expect(from).toHaveBeenCalledTimes(9);
  });

  it("skips inserting a table whose annotation list is empty or whose Drishti Annotation is null", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "asana-1" }, error: null }))
      .mockReturnValueOnce(insertThenSelectBuilder({ data: { id: "variant-1" }, error: null }))
      .mockReturnValueOnce(insertOnlyBuilder({ error: null }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseAsanaRepository(client);

    await repository.saveAsanaVariant({
      sanskritName: "Trikonasana",
      variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      ...EMPTY_ANNOTATIONS,
    });

    expect(from).toHaveBeenCalledTimes(3);
  });
});
