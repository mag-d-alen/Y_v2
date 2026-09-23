import type { PoseData } from "@y-v2/asana-content";
import { FigurePreview } from "../FigurePreview.js";

export function DraftReviewStep({
  poseData,
  onAccept,
  onReject,
}: {
  poseData: PoseData;
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
