import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SupabaseAsanaRepository } from "./SupabaseAsanaRepository.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.VITE_SUPABASE_SECRET_KEY;

describe.skipIf(!supabaseUrl || !supabaseSecretKey)("SupabaseAsanaRepository (integration)", () => {
  it("round-trips a saved Asana Variant through getAsanaVariant and listAsanaVariants", async () => {
    const client = createClient(supabaseUrl as string, supabaseSecretKey as string);
    const repository = new SupabaseAsanaRepository(client);
    const sanskritName = `Test Asana ${Date.now()}`;

    await repository.saveAsanaVariant({
      sanskritName,
      variant: { tradition: "ashtanga", ashtangaSeries: null, label: "standard" },
      poseData: { bones: { root: { x: 1, y: 2, rotation: 0.5 } } },
      muscleAnnotations: [],
      rotationAnnotations: [],
      groundContactAnnotations: [],
      loadAnnotations: [],
      bodyContactAnnotations: [],
      drishtiAnnotation: null,
    });

    try {
      const { data: asanaRow, error: asanaError } = await client
        .from("asanas")
        .select("id")
        .eq("sanskrit_name", sanskritName)
        .single();
      if (asanaError) {
        throw asanaError;
      }

      const { data: variantRow, error: variantError } = await client
        .from("asana_variants")
        .select("id")
        .eq("asana_id", asanaRow.id)
        .single();
      if (variantError) {
        throw variantError;
      }

      const content = await repository.getAsanaVariant(variantRow.id);

      expect(content.asana.sanskritName).toBe(sanskritName);
      expect(content.variant).toEqual({ tradition: "ashtanga", ashtangaSeries: null, label: "standard" });
      expect(content.poseData.bones.root).toEqual({ x: 1, y: 2, rotation: 0.5 });
      expect(content.muscleAnnotations).toEqual([]);
      expect(content.rotationAnnotations).toEqual([]);
      expect(content.groundContactAnnotations).toEqual([]);
      expect(content.loadAnnotations).toEqual([]);
      expect(content.bodyContactAnnotations).toEqual([]);
      expect(content.drishtiAnnotation).toBeNull();

      const variants = await repository.listAsanaVariants(sanskritName);
      expect(variants).toEqual([{ tradition: "ashtanga", ashtangaSeries: null, label: "standard" }]);
    } finally {
      await client.from("asanas").delete().eq("sanskrit_name", sanskritName);
    }
  });

  it("round-trips all six annotation tables for a fully hand-authored Asana Variant", async () => {
    const client = createClient(supabaseUrl as string, supabaseSecretKey as string);
    const repository = new SupabaseAsanaRepository(client);
    const sanskritName = `Test Asana Full ${Date.now()}`;

    await repository.saveAsanaVariant({
      sanskritName,
      variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      muscleAnnotations: [
        { muscleId: "obliques-right", state: "working", roleDescription: "Side-bends the torso." },
      ],
      rotationAnnotations: [{ bone: "upperBack", direction: "right" }],
      groundContactAnnotations: [{ point: "heelL" }],
      loadAnnotations: [{ point: "heelL", loadFraction: 0.6 }],
      bodyContactAnnotations: [{ pointA: "palmL", pointB: "bigToeL", contactType: "grasp" }],
      drishtiAnnotation: { point: "noseTip" },
    });

    try {
      const { data: asanaRow, error: asanaError } = await client
        .from("asanas")
        .select("id")
        .eq("sanskrit_name", sanskritName)
        .single();
      if (asanaError) {
        throw asanaError;
      }

      const { data: variantRow, error: variantError } = await client
        .from("asana_variants")
        .select("id")
        .eq("asana_id", asanaRow.id)
        .single();
      if (variantError) {
        throw variantError;
      }

      const content = await repository.getAsanaVariant(variantRow.id);

      expect(content.muscleAnnotations).toEqual([
        { muscleId: "obliques-right", state: "working", roleDescription: "Side-bends the torso." },
      ]);
      expect(content.rotationAnnotations).toEqual([{ bone: "upperBack", direction: "right" }]);
      expect(content.groundContactAnnotations).toEqual([{ point: "heelL" }]);
      expect(content.loadAnnotations).toEqual([{ point: "heelL", loadFraction: 0.6 }]);
      expect(content.bodyContactAnnotations).toEqual([{ pointA: "palmL", pointB: "bigToeL", contactType: "grasp" }]);
      expect(content.drishtiAnnotation).toEqual({ point: "noseTip" });
    } finally {
      await client.from("asanas").delete().eq("sanskrit_name", sanskritName);
    }
  });
});
