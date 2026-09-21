export type Tradition = "ashtanga" | "iyengar" | "vinyasa";

export interface Asana {
  id: string;
  sanskritName: string;
}

export interface AsanaVariant {
  id: string;
  asanaId: string;
  tradition: Tradition;
  ashtangaSeries: number | null;
  label: string;
}

export interface BoneTransform {
  x: number;
  y: number;
  rotation: number;
}

export interface PoseData {
  bones: Record<string, BoneTransform>;
}

export type MuscleState = "working" | "lengthening" | "shortened" | "neutral";

export interface MuscleAnnotation {
  muscleId: string;
  state: MuscleState;
  roleDescription: string;
}

export interface AsanaVariantContent {
  asana: Pick<Asana, "sanskritName">;
  variant: Pick<AsanaVariant, "tradition" | "ashtangaSeries" | "label">;
  poseData: PoseData;
  muscleAnnotations: MuscleAnnotation[];
}

export interface JointReading {
  x: number;
  y: number;
  confidence: number;
}

export interface DetectionResult {
  personDetected: boolean;
  joints: Record<string, JointReading>;
}
