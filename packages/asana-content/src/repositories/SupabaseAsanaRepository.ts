import type { SupabaseClient } from "@supabase/supabase-js";
import type { AsanaRepository, AsanaVariantRef, SaveAsanaVariantInput } from "../AsanaRepository.js";
import type { AsanaVariantContent, BoneTransform, MuscleState, Tradition } from "../domain.js";

interface PoseDataRow {
  bones: Record<string, BoneTransform>;
}

interface MuscleAnnotationRow {
  muscle_id: string;
  state: MuscleState;
  role_description: string;
}

interface AsanaVariantRow {
  tradition: Tradition;
  ashtanga_series: number | null;
  label: string;
  asana: { sanskrit_name: string } | { sanskrit_name: string }[];
  pose_data: PoseDataRow | PoseDataRow[];
  muscle_annotations: MuscleAnnotationRow[];
}

function toOne<T>(value: T | T[]): T {
  if (!Array.isArray(value)) {
    return value;
  }
  const [first] = value;
  if (!first) {
    throw new Error("Expected exactly one related row but got none");
  }
  return first;
}

export class SupabaseAsanaRepository implements AsanaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAsanaVariant(variantId: string): Promise<AsanaVariantContent> {
    const { data, error } = await this.client
      .from("asana_variants")
      .select(
        `
        tradition,
        ashtanga_series,
        label,
        asana:asanas ( sanskrit_name ),
        pose_data ( bones ),
        muscle_annotations ( muscle_id, state, role_description )
      `,
      )
      .eq("id", variantId)
      .single<AsanaVariantRow>();

    if (error) {
      throw error;
    }

    const asana = toOne(data.asana);
    const poseDataRow = toOne(data.pose_data);

    return {
      asana: { sanskritName: asana.sanskrit_name },
      variant: { tradition: data.tradition, ashtangaSeries: data.ashtanga_series, label: data.label },
      poseData: { bones: poseDataRow.bones },
      muscleAnnotations: data.muscle_annotations.map((row) => ({
        muscleId: row.muscle_id,
        state: row.state,
        roleDescription: row.role_description,
      })),
    };
  }

  async listAsanaVariants(sanskritName: string): Promise<AsanaVariantRef[]> {
    const { data: asanaRow, error: asanaError } = await this.client
      .from("asanas")
      .select("id")
      .eq("sanskrit_name", sanskritName)
      .maybeSingle<{ id: string }>();

    if (asanaError) {
      throw asanaError;
    }

    if (!asanaRow) {
      return [];
    }

    const { data, error } = await this.client
      .from("asana_variants")
      .select("tradition, ashtanga_series, label")
      .eq("asana_id", asanaRow.id)
      .returns<{ tradition: Tradition; ashtanga_series: number | null; label: string }[]>();

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      tradition: row.tradition,
      ashtangaSeries: row.ashtanga_series,
      label: row.label,
    }));
  }

  async saveAsanaVariant(input: SaveAsanaVariantInput): Promise<void> {
    const asanaId = await this.findOrCreateAsana(input.sanskritName);

    const { data: variantRow, error: variantError } = await this.client
      .from("asana_variants")
      .insert({
        asana_id: asanaId,
        tradition: input.variant.tradition,
        ashtanga_series: input.variant.ashtangaSeries,
        label: input.variant.label,
      })
      .select("id")
      .single<{ id: string }>();

    if (variantError) {
      throw variantError;
    }

    const { error: poseDataError } = await this.client
      .from("pose_data")
      .insert({ asana_variant_id: variantRow.id, bones: input.poseData.bones });

    if (poseDataError) {
      throw poseDataError;
    }
  }

  private async findOrCreateAsana(sanskritName: string): Promise<string> {
    const { data, error } = await this.client
      .from("asanas")
      .upsert({ sanskrit_name: sanskritName }, { onConflict: "sanskrit_name" })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

    return data.id;
  }
}
