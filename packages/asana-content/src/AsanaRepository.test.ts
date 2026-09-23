import { describe, expect, it } from "vitest";
import { toSaveAsanaVariantInput } from "./AsanaRepository.js";
import type { AsanaVariantContent } from "./domain.js";

const CONTENT: AsanaVariantContent = {
  asana: { sanskritName: "Trikonasana" },
  variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
  poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
  muscleAnnotations: [],
  rotationAnnotations: [{ bone: "upperBack", direction: "right" }],
  groundContactAnnotations: [{ point: "heelL" }],
  loadAnnotations: [{ point: "heelL", loadFraction: 0.5 }],
  bodyContactAnnotations: [],
  drishtiAnnotation: { point: "noseTip" },
};

describe("toSaveAsanaVariantInput", () => {
  it("flattens asana.sanskritName and carries every annotation list through unchanged", () => {
    expect(toSaveAsanaVariantInput(CONTENT)).toEqual({
      sanskritName: "Trikonasana",
      variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
      poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
      muscleAnnotations: [],
      rotationAnnotations: [{ bone: "upperBack", direction: "right" }],
      groundContactAnnotations: [{ point: "heelL" }],
      loadAnnotations: [{ point: "heelL", loadFraction: 0.5 }],
      bodyContactAnnotations: [],
      drishtiAnnotation: { point: "noseTip" },
    });
  });
});
