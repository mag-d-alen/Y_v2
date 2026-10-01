import { describeRejection, type RejectedDraftDetection } from "@y-v2/asana-content";

export function RejectedStep({
  rejection,
  onRetry,
}: {
  rejection: RejectedDraftDetection;
  onRetry: () => void;
}) {
  return (
    <section>
      <h2>Detection rejected</h2>
      <p role="alert">{describeRejection(rejection)}</p>
      <p>No manual correction is available for the detector's own output — pick different or better photos and retry.</p>
      <button type="button" onClick={onRetry}>
        Try different photos
      </button>
    </section>
  );
}
