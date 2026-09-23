import type { AsanaVariantContent } from "@y-v2/asana-content";

export function PublishStep({
  content,
  status,
  error,
  onPublish,
}: {
  content: AsanaVariantContent;
  status: "idle" | "publishing" | "error";
  error: string | null;
  onPublish: () => void;
}) {
  return (
    <section>
      <h2>5. Publish</h2>
      <p>
        {content.asana.sanskritName} — {content.variant.tradition}
        {content.variant.ashtangaSeries ? ` series ${content.variant.ashtangaSeries}` : ""} ({content.variant.label})
      </p>
      <button type="button" disabled={status === "publishing"} onClick={onPublish}>
        {status === "publishing" ? "Publishing…" : "Publish to Supabase"}
      </button>
      {status === "error" && error && <p role="alert">{error}</p>}
    </section>
  );
}
