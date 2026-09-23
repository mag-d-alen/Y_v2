import type {
  BodyContactType,
  ContactPoint,
  DrishtiPoint,
  LimbRotationBone,
  Tradition,
  TorsoRotationBone,
} from "@y-v2/asana-content";

export const TRADITIONS = ["ashtanga", "iyengar", "vinyasa"] as const satisfies readonly Tradition[];

export const LIMB_ROTATION_BONES = [
  "thighL",
  "thighR",
  "upperArmL",
  "upperArmR",
  "forearmL",
  "forearmR",
] as const satisfies readonly LimbRotationBone[];

export const TORSO_ROTATION_BONES = ["upperBack"] as const satisfies readonly TorsoRotationBone[];

export const CONTACT_POINTS = [
  "crownOfHead",
  "forehead",
  "backOfHead",
  "palmL",
  "palmR",
  "fingertipsL",
  "fingertipsR",
  "forearmL",
  "forearmR",
  "shoulderL",
  "shoulderR",
  "chest",
  "sitBones",
  "sacrum",
  "outerHipL",
  "outerHipR",
  "upperBack",
  "kneeL",
  "kneeR",
  "shinL",
  "shinR",
  "heelL",
  "heelR",
  "ballOfFootL",
  "ballOfFootR",
  "outerFootEdgeL",
  "outerFootEdgeR",
  "topOfFootL",
  "topOfFootR",
  "wristL",
  "wristR",
  "ankleL",
  "ankleR",
  "bigToeL",
  "bigToeR",
  "elbowL",
  "elbowR",
  "lowerBack",
  "belly",
  "backOfHandL",
  "backOfHandR",
  "backOfNeck",
  "thighL",
  "thighR",
] as const satisfies readonly ContactPoint[];

export const BODY_CONTACT_TYPES = [
  "grasp",
  "touch",
  "hook",
  "press",
] as const satisfies readonly BodyContactType[];

export const DRISHTI_POINTS = [
  "noseTip",
  "thirdEye",
  "navel",
  "hand",
  "toes",
  "farRight",
  "farLeft",
  "thumbs",
  "upward",
] as const satisfies readonly DrishtiPoint[];
