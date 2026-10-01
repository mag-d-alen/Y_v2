import type { PoseData } from "@y-v2/asana-content";
import { FigurePreview } from "../FigurePreview.js";

export function DraftReviewStep({
  poseData,
  mirroredBones,
  onAccept,
  onReject,
}: {
  poseData: PoseData;
  mirroredBones: string[];
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <section>
      <h2>2. Review the draft Model Figure</h2>
      <p>
        This preview reflects only the detector's own output (arms, legs, head) — the spine is deliberately left
        neutral and is hand-authored in a later step.
      </p>
      {mirroredBones.length > 0 && (
        <p role="alert">
          Estimated by mirroring the opposite side, not directly detected: {mirroredBones.join(", ")}. Look closely
          at these in the preview — if this pose isn't actually symmetrical, reject and try a different photo or add
          an "other side" photo instead.
        </p>
      )}
      <FigurePreview poseData={poseData} />
      <button type="button" onClick={onAccept}>
        Accept draft
      </button>
      <button type="button" onClick={onReject}>
        Reject, try different photos
      </button>
    </section>
  );
}
