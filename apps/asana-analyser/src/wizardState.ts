import type { RejectedDraftDetection } from "@y-v2/asana-content";
import type {
  AsanaVariantContent,
  ContactPoint,
  FacingDirection,
  HandAuthoredContentDraft,
  PoseData,
  Tradition,
} from "@y-v2/asana-content";

export interface VariantMetadata {
  sanskritName: string;
  tradition: Tradition;
  ashtangaSeries: number | null;
  label: string;
}

export interface PhotoInput {
  mainFolderPath: string;
  otherSideFolderPath: string | null;
  assumeSymmetric: boolean;
  groundContactPoints: ContactPoint[];
  facingDirection: FacingDirection;
}

export type WizardState =
  | { step: "photo-input"; initial: PhotoInput; error: string | null }
  | { step: "detecting"; photos: PhotoInput }
  | { step: "rejected"; photos: PhotoInput; rejection: RejectedDraftDetection }
  | { step: "draft-review"; photos: PhotoInput; poseData: PoseData; mirroredBones: string[] }
  | { step: "metadata"; photos: PhotoInput; poseData: PoseData }
  | {
      step: "hand-authoring";
      photos: PhotoInput;
      poseData: PoseData;
      metadata: VariantMetadata;
      draft: HandAuthoredContentDraft;
    }
  | { step: "publish"; content: AsanaVariantContent }
  | { step: "published" };
