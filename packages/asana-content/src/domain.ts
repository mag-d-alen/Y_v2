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

export type LimbRotationBone = "thighL" | "thighR" | "upperArmL" | "upperArmR" | "forearmL" | "forearmR";
export type LimbRotationDirection = "internal" | "external";

export interface LimbRotationAnnotation {
  bone: LimbRotationBone;
  direction: LimbRotationDirection;
}

export type TorsoRotationBone = "upperBack";
export type TorsoRotationDirection = "left" | "right";

export interface TorsoRotationAnnotation {
  bone: TorsoRotationBone;
  direction: TorsoRotationDirection;
}

export type RotationAnnotation = LimbRotationAnnotation | TorsoRotationAnnotation;

export type ContactPoint =
  | "crownOfHead"
  | "forehead"
  | "backOfHead"
  | "palmL"
  | "palmR"
  | "fingertipsL"
  | "fingertipsR"
  | "forearmL"
  | "forearmR"
  | "shoulderL"
  | "shoulderR"
  | "chest"
  | "sitBones"
  | "sacrum"
  | "outerHipL"
  | "outerHipR"
  | "upperBack"
  | "kneeL"
  | "kneeR"
  | "shinL"
  | "shinR"
  | "heelL"
  | "heelR"
  | "ballOfFootL"
  | "ballOfFootR"
  | "outerFootEdgeL"
  | "outerFootEdgeR"
  | "topOfFootL"
  | "topOfFootR"
  | "wristL"
  | "wristR"
  | "ankleL"
  | "ankleR"
  | "bigToeL"
  | "bigToeR"
  | "elbowL"
  | "elbowR"
  | "lowerBack"
  | "belly"
  | "backOfHandL"
  | "backOfHandR"
  | "backOfNeck"
  | "thighL"
  | "thighR";

export interface GroundContactAnnotation {
  point: ContactPoint;
}

export interface LoadAnnotation {
  point: ContactPoint;
  loadFraction: number;
}

export type BodyContactType = "grasp" | "touch" | "hook" | "press";

export interface BodyContactAnnotation {
  pointA: ContactPoint;
  pointB: ContactPoint;
  contactType: BodyContactType;
}

export type DrishtiPoint =
  | "noseTip"
  | "thirdEye"
  | "navel"
  | "hand"
  | "toes"
  | "farRight"
  | "farLeft"
  | "thumbs"
  | "upward";

export interface DrishtiAnnotation {
  point: DrishtiPoint;
}

export interface AsanaVariantContent {
  asana: Pick<Asana, "sanskritName">;
  variant: Pick<AsanaVariant, "tradition" | "ashtangaSeries" | "label">;
  poseData: PoseData;
  muscleAnnotations: MuscleAnnotation[];
  rotationAnnotations: RotationAnnotation[];
  groundContactAnnotations: GroundContactAnnotation[];
  loadAnnotations: LoadAnnotation[];
  bodyContactAnnotations: BodyContactAnnotation[];
  drishtiAnnotation: DrishtiAnnotation | null;
}

export interface JointReading {
  x: number;
  y: number;
  z?: number;
  confidence: number;
}

export interface DetectedJoints {
  personDetected: boolean;
  joints: Record<string, JointReading>;
}
