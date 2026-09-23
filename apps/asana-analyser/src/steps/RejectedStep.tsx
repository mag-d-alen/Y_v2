import type { DetectionRejectionReason } from "@y-v2/asana-content";
import { REJECTION_MESSAGES } from "../wizardState.js";

export function RejectedStep({
  reason,
  onRetry,
}: {
  reason: DetectionRejectionReason;
  onRetry: () => void;
}) {
  return (
    <section>
      <h2>Detection rejected</h2>
      <p role="alert">{REJECTION_MESSAGES[reason]}</p>
      <p>No manual correction is available for the detector's own output — pick different or better photos and retry.</p>
      <button type="button" onClick={onRetry}>
        Try different photos
      </button>
    </section>
  );
}
