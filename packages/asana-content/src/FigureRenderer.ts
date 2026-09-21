import type { MuscleAnnotation, PoseData } from "./domain.js";

export type Layer = "muscle" | "skeleton" | "chakra";

export interface RenderInput {
  poseData: PoseData;
  muscleAnnotations: MuscleAnnotation[];
  activeLayers: Layer[];
}

export interface FigureRenderer {
  render(input: RenderInput): void;
  onMuscleTap(handler: (muscleId: string) => void): void;
}
