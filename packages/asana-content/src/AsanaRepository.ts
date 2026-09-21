import type { AsanaVariantContent, PoseData, Tradition } from "./domain.js";

export interface AsanaVariantRef {
  tradition: Tradition;
  ashtangaSeries: number | null;
  label: string;
}

export interface SaveAsanaVariantInput {
  sanskritName: string;
  variant: AsanaVariantRef;
  poseData: PoseData;
}

export interface AsanaRepository {
  getAsanaVariant(variantId: string): Promise<AsanaVariantContent>;

  listAsanaVariants(sanskritName: string): Promise<AsanaVariantRef[]>;

  saveAsanaVariant(input: SaveAsanaVariantInput): Promise<void>;
}
