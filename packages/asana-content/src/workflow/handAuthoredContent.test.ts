import { describe, expect, it } from "vitest";
import {
  addBodyContactAnnotation,
  addGroundContactAnnotation,
  addLoadAnnotation,
  addRotationAnnotation,
  createHandAuthoredContentDraft,
  finalizeHandAuthoredContent,
  setDrishtiAnnotation,
  setSpineBone,
  setSpineCurvaturePresent,
} from "./handAuthoredContent.js";

const BASE = {
  asana: { sanskritName: "Trikonasana" },
  variant: { tradition: "ashtanga" as const, ashtangaSeries: 1, label: "standard" },
  poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
};

describe("handAuthoredContent draft", () => {
  it("starts with the spine question unanswered and every annotation list empty", () => {
    const draft = createHandAuthoredContentDraft();

    expect(draft.spineCurvaturePresent).toBeNull();
    expect(draft.rotationAnnotations).toEqual([]);
    expect(draft.groundContactAnnotations).toEqual([]);
    expect(draft.loadAnnotations).toEqual([]);
    expect(draft.bodyContactAnnotations).toEqual([]);
    expect(draft.drishtiAnnotation).toBeNull();
  });

  it("blocks finalizing until the spine curvature question is answered", () => {
    const draft = createHandAuthoredContentDraft();

    expect(() => finalizeHandAuthoredContent(draft, BASE)).toThrow(/spine curvature/i);
  });

  it("omits the spine bones from the published Pose Data when the answer is 'no', even if bones were typed in first", () => {
    let draft = createHandAuthoredContentDraft();
    draft = setSpineBone(draft, "pelvis", { x: 0, y: 0, rotation: 0.3 });
    draft = setSpineCurvaturePresent(draft, false);

    const content = finalizeHandAuthoredContent(draft, BASE);

    expect(content.poseData.bones.pelvis).toBeUndefined();
  });

  it("includes the entered spine bones in the published Pose Data when the answer is 'yes'", () => {
    let draft = createHandAuthoredContentDraft();
    draft = setSpineBone(draft, "pelvis", { x: 0, y: 0, rotation: 0.3 });
    draft = setSpineBone(draft, "upperBack", { x: 0, y: 0, rotation: -0.2 });
    draft = setSpineCurvaturePresent(draft, true);

    const content = finalizeHandAuthoredContent(draft, BASE);

    expect(content.poseData.bones.pelvis).toEqual({ x: 0, y: 0, rotation: 0.3 });
    expect(content.poseData.bones.upperBack).toEqual({ x: 0, y: 0, rotation: -0.2 });
    expect(content.poseData.bones.lowerBack).toBeUndefined();
    expect(content.poseData.bones.root).toEqual({ x: 0, y: 0, rotation: 0 });
  });

  it("publishes empty lists and a null Drishti Annotation when none of the five annotation types were entered", () => {
    const draft = setSpineCurvaturePresent(createHandAuthoredContentDraft(), false);

    const content = finalizeHandAuthoredContent(draft, BASE);

    expect(content.rotationAnnotations).toEqual([]);
    expect(content.groundContactAnnotations).toEqual([]);
    expect(content.loadAnnotations).toEqual([]);
    expect(content.bodyContactAnnotations).toEqual([]);
    expect(content.drishtiAnnotation).toBeNull();
    expect(content.muscleAnnotations).toEqual([]);
  });

  it("accumulates each annotation type independently", () => {
    let draft = createHandAuthoredContentDraft();
    draft = addRotationAnnotation(draft, { bone: "upperBack", direction: "right" });
    draft = addGroundContactAnnotation(draft, { point: "heelL" });
    draft = addLoadAnnotation(draft, { point: "heelL", loadFraction: 0.7 });
    draft = addBodyContactAnnotation(draft, { pointA: "palmL", pointB: "bigToeL", contactType: "grasp" });
    draft = setDrishtiAnnotation(draft, { point: "noseTip" });
    draft = setSpineCurvaturePresent(draft, false);

    const content = finalizeHandAuthoredContent(draft, BASE);

    expect(content.rotationAnnotations).toEqual([{ bone: "upperBack", direction: "right" }]);
    expect(content.groundContactAnnotations).toEqual([{ point: "heelL" }]);
    expect(content.loadAnnotations).toEqual([{ point: "heelL", loadFraction: 0.7 }]);
    expect(content.bodyContactAnnotations).toEqual([{ pointA: "palmL", pointB: "bigToeL", contactType: "grasp" }]);
    expect(content.drishtiAnnotation).toEqual({ point: "noseTip" });
  });

  it("rejects a Load Annotation for a point with no matching Ground Contact Annotation", () => {
    const draft = createHandAuthoredContentDraft();

    expect(() => addLoadAnnotation(draft, { point: "heelL", loadFraction: 0.5 })).toThrow(
      /ground contact/i,
    );
  });

  it("accepts a Load Annotation once the matching Ground Contact Annotation has been added", () => {
    let draft = createHandAuthoredContentDraft();
    draft = addGroundContactAnnotation(draft, { point: "heelL" });

    draft = addLoadAnnotation(draft, { point: "heelL", loadFraction: 0.5 });

    expect(draft.loadAnnotations).toEqual([{ point: "heelL", loadFraction: 0.5 }]);
  });
});
