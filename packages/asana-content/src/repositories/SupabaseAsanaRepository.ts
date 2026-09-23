import type { SupabaseClient } from "@supabase/supabase-js";
import type { AsanaRepository, AsanaVariantRef, SaveAsanaVariantInput } from "../AsanaRepository.js";
import type {
  AsanaVariantContent,
  BodyContactType,
  BoneTransform,
  ContactPoint,
  DrishtiPoint,
  LimbRotationBone,
  LimbRotationDirection,
  MuscleState,
  RotationAnnotation,
  TorsoRotationBone,
  TorsoRotationDirection,
  Tradition,
} from "../domain.js";

interface PoseDataRow {
  bones: Record<string, BoneTransform>;
}

interface MuscleAnnotationRow {
  muscle_id: string;
  state: MuscleState;
  role_description: string;
}

interface RotationAnnotationRow {
  bone: LimbRotationBone | TorsoRotationBone;
  direction: LimbRotationDirection | TorsoRotationDirection;
}

interface GroundContactAnnotationRow {
  point: ContactPoint;
}

interface LoadAnnotationRow {
  point: ContactPoint;
  load_fraction: number;
}

interface BodyContactAnnotationRow {
  point_a: ContactPoint;
  point_b: ContactPoint;
  contact_type: BodyContactType;
}

interface DrishtiAnnotationRow {
  point: DrishtiPoint;
}

interface AsanaVariantRow {
  tradition: Tradition;
  ashtanga_series: number | null;
  label: string;
  asana: { sanskrit_name: string } | { sanskrit_name: string }[];
  pose_data: PoseDataRow | PoseDataRow[];
  muscle_annotations: MuscleAnnotationRow[];
  rotation_annotations: RotationAnnotationRow[];
  ground_contact_annotations: GroundContactAnnotationRow[];
  load_annotations: LoadAnnotationRow[];
  body_contact_annotations: BodyContactAnnotationRow[];
  drishti_annotations: DrishtiAnnotationRow | DrishtiAnnotationRow[] | null;
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

function toOneOrNull<T>(value: T | T[] | null): T | null {
  if (value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return value;
  }
  const [first] = value;
  return first ?? null;
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
        muscle_annotations ( muscle_id, state, role_description ),
        rotation_annotations ( bone, direction ),
        ground_contact_annotations ( point ),
        load_annotations ( point, load_fraction ),
        body_contact_annotations ( point_a, point_b, contact_type ),
        drishti_annotations ( point )
      `,
      )
      .eq("id", variantId)
      .single<AsanaVariantRow>();

    if (error) {
      throw error;
    }

    const asana = toOne(data.asana);
    const poseDataRow = toOne(data.pose_data);
    const drishtiRow = toOneOrNull(data.drishti_annotations);

    return {
      asana: { sanskritName: asana.sanskrit_name },
      variant: { tradition: data.tradition, ashtangaSeries: data.ashtanga_series, label: data.label },
      poseData: { bones: poseDataRow.bones },
      muscleAnnotations: data.muscle_annotations.map((row) => ({
        muscleId: row.muscle_id,
        state: row.state,
        roleDescription: row.role_description,
      })),
      rotationAnnotations: data.rotation_annotations.map(
        (row) => ({ bone: row.bone, direction: row.direction }) as RotationAnnotation,
      ),
      groundContactAnnotations: data.ground_contact_annotations.map((row) => ({ point: row.point })),
      loadAnnotations: data.load_annotations.map((row) => ({ point: row.point, loadFraction: row.load_fraction })),
      bodyContactAnnotations: data.body_contact_annotations.map((row) => ({
        pointA: row.point_a,
        pointB: row.point_b,
        contactType: row.contact_type,
      })),
      drishtiAnnotation: drishtiRow ? { point: drishtiRow.point } : null,
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

    const asanaVariantId = variantRow.id;

    const { error: poseDataError } = await this.client
      .from("pose_data")
      .insert({ asana_variant_id: asanaVariantId, bones: input.poseData.bones });

    if (poseDataError) {
      throw poseDataError;
    }

    await this.insertRows(
      "muscle_annotations",
      input.muscleAnnotations.map((annotation) => ({
        asana_variant_id: asanaVariantId,
        muscle_id: annotation.muscleId,
        state: annotation.state,
        role_description: annotation.roleDescription,
      })),
    );

    await this.insertRows(
      "rotation_annotations",
      input.rotationAnnotations.map((annotation) => ({
        asana_variant_id: asanaVariantId,
        bone: annotation.bone,
        direction: annotation.direction,
      })),
    );

    await this.insertRows(
      "ground_contact_annotations",
      input.groundContactAnnotations.map((annotation) => ({
        asana_variant_id: asanaVariantId,
        point: annotation.point,
      })),
    );

    await this.insertRows(
      "load_annotations",
      input.loadAnnotations.map((annotation) => ({
        asana_variant_id: asanaVariantId,
        point: annotation.point,
        load_fraction: annotation.loadFraction,
      })),
    );

    await this.insertRows(
      "body_contact_annotations",
      input.bodyContactAnnotations.map((annotation) => ({
        asana_variant_id: asanaVariantId,
        point_a: annotation.pointA,
        point_b: annotation.pointB,
        contact_type: annotation.contactType,
      })),
    );

    await this.insertRows(
      "drishti_annotations",
      input.drishtiAnnotation ? [{ asana_variant_id: asanaVariantId, point: input.drishtiAnnotation.point }] : [],
    );
  }

  private async insertRows(table: string, rows: Record<string, unknown>[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    const { error } = await this.client.from(table).insert(rows);
    if (error) {
      throw error;
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
