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

      const variants = await repository.listAsanaVariants(sanskritName);
      expect(variants).toEqual([{ tradition: "ashtanga", ashtangaSeries: null, label: "standard" }]);
    } finally {
      await client.from("asanas").delete().eq("sanskrit_name", sanskritName);
    }
  });
});
