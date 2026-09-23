import type {
  AsanaVariantContent,
  BodyContactAnnotation,
  DrishtiAnnotation,
  GroundContactAnnotation,
  LoadAnnotation,
  MuscleAnnotation,
  PoseData,
  RotationAnnotation,
  Tradition,
} from "./domain.js";

export interface AsanaVariantRef {
  tradition: Tradition;
  ashtangaSeries: number | null;
  label: string;
}

export interface SaveAsanaVariantInput {
  sanskritName: string;
  variant: AsanaVariantRef;
  poseData: PoseData;
  muscleAnnotations: MuscleAnnotation[];
  rotationAnnotations: RotationAnnotation[];
  groundContactAnnotations: GroundContactAnnotation[];
  loadAnnotations: LoadAnnotation[];
  bodyContactAnnotations: BodyContactAnnotation[];
  drishtiAnnotation: DrishtiAnnotation | null;
}

export interface AsanaRepository {
  getAsanaVariant(variantId: string): Promise<AsanaVariantContent>;

  listAsanaVariants(sanskritName: string): Promise<AsanaVariantRef[]>;

  saveAsanaVariant(input: SaveAsanaVariantInput): Promise<void>;
}

export function toSaveAsanaVariantInput(content: AsanaVariantContent): SaveAsanaVariantInput {
  return {
    sanskritName: content.asana.sanskritName,
    variant: content.variant,
    poseData: content.poseData,
    muscleAnnotations: content.muscleAnnotations,
    rotationAnnotations: content.rotationAnnotations,
    groundContactAnnotations: content.groundContactAnnotations,
    loadAnnotations: content.loadAnnotations,
    bodyContactAnnotations: content.bodyContactAnnotations,
    drishtiAnnotation: content.drishtiAnnotation,
  };
}
