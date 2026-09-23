import type {
  Asana,
  AsanaVariant,
  AsanaVariantContent,
  BodyContactAnnotation,
  BoneTransform,
  DrishtiAnnotation,
  GroundContactAnnotation,
  LoadAnnotation,
  PoseData,
  RotationAnnotation,
} from "../domain.js";

export type SpineBone = "pelvis" | "lowerBack" | "upperBack";

export interface HandAuthoredContentDraft {
  spineCurvaturePresent: boolean | null;
  spineBones: Partial<Record<SpineBone, BoneTransform>>;
  rotationAnnotations: RotationAnnotation[];
  groundContactAnnotations: GroundContactAnnotation[];
  loadAnnotations: LoadAnnotation[];
  bodyContactAnnotations: BodyContactAnnotation[];
  drishtiAnnotation: DrishtiAnnotation | null;
}

export interface HandAuthoredContentBase {
  asana: Pick<Asana, "sanskritName">;
  variant: Pick<AsanaVariant, "tradition" | "ashtangaSeries" | "label">;
  poseData: PoseData;
}

export function createHandAuthoredContentDraft(): HandAuthoredContentDraft {
  return {
    spineCurvaturePresent: null,
    spineBones: {},
    rotationAnnotations: [],
    groundContactAnnotations: [],
    loadAnnotations: [],
    bodyContactAnnotations: [],
    drishtiAnnotation: null,
  };
}

export function setSpineCurvaturePresent(
  draft: HandAuthoredContentDraft,
  spineCurvaturePresent: boolean,
): HandAuthoredContentDraft {
  return { ...draft, spineCurvaturePresent };
}

export function setSpineBone(
  draft: HandAuthoredContentDraft,
  bone: SpineBone,
  transform: BoneTransform,
): HandAuthoredContentDraft {
  return { ...draft, spineBones: { ...draft.spineBones, [bone]: transform } };
}

export function addRotationAnnotation(
  draft: HandAuthoredContentDraft,
  annotation: RotationAnnotation,
): HandAuthoredContentDraft {
  return { ...draft, rotationAnnotations: [...draft.rotationAnnotations, annotation] };
}

export function addGroundContactAnnotation(
  draft: HandAuthoredContentDraft,
  annotation: GroundContactAnnotation,
): HandAuthoredContentDraft {
  return { ...draft, groundContactAnnotations: [...draft.groundContactAnnotations, annotation] };
}

export function addLoadAnnotation(
  draft: HandAuthoredContentDraft,
  annotation: LoadAnnotation,
): HandAuthoredContentDraft {
  const hasMatchingGroundContact = draft.groundContactAnnotations.some((g) => g.point === annotation.point);
  if (!hasMatchingGroundContact) {
    throw new Error(
      `Cannot add a Load Annotation for "${annotation.point}" without a matching Ground Contact Annotation`,
    );
  }
  return { ...draft, loadAnnotations: [...draft.loadAnnotations, annotation] };
}

export function addBodyContactAnnotation(
  draft: HandAuthoredContentDraft,
  annotation: BodyContactAnnotation,
): HandAuthoredContentDraft {
  return { ...draft, bodyContactAnnotations: [...draft.bodyContactAnnotations, annotation] };
}

export function setDrishtiAnnotation(
  draft: HandAuthoredContentDraft,
  drishtiAnnotation: DrishtiAnnotation | null,
): HandAuthoredContentDraft {
  return { ...draft, drishtiAnnotation };
}

export function finalizeHandAuthoredContent(
  draft: HandAuthoredContentDraft,
  base: HandAuthoredContentBase,
): AsanaVariantContent {
  if (draft.spineCurvaturePresent === null) {
    throw new Error("Cannot finalize: the spine curvature yes/no question hasn't been answered");
  }

  const spineBones = draft.spineCurvaturePresent ? draft.spineBones : {};

  return {
    asana: base.asana,
    variant: base.variant,
    poseData: { bones: { ...base.poseData.bones, ...spineBones } },
    muscleAnnotations: [],
    rotationAnnotations: draft.rotationAnnotations,
    groundContactAnnotations: draft.groundContactAnnotations,
    loadAnnotations: draft.loadAnnotations,
    bodyContactAnnotations: draft.bodyContactAnnotations,
    drishtiAnnotation: draft.drishtiAnnotation,
  };
}
