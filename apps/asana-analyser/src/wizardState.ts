import type {
  AsanaVariantContent,
  DetectionRejectionReason,
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

export type WizardState =
  | { step: "photo-input"; folderPath: string; error: string | null }
  | { step: "detecting"; folderPath: string }
  | { step: "rejected"; folderPath: string; reason: DetectionRejectionReason }
  | { step: "draft-review"; folderPath: string; poseData: PoseData }
  | { step: "metadata"; folderPath: string; poseData: PoseData }
  | {
      step: "hand-authoring";
      folderPath: string;
      poseData: PoseData;
      metadata: VariantMetadata;
      draft: HandAuthoredContentDraft;
    }
  | { step: "publish"; content: AsanaVariantContent }
  | { step: "published" };

export const REJECTION_MESSAGES: Record<DetectionRejectionReason, string> = {
  "no-person-detected": "No person was detected in these photos. Try a clearer, fully-in-frame photo.",
  "missing-required-joint": "The detector couldn't read one of the required joints. Try a photo with the full body visible.",
  "low-confidence-joint": "The detector read a required joint with low confidence. Try a sharper or better-lit photo.",
};
