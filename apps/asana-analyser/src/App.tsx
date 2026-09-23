import { useState } from "react";
import {
  createHandAuthoredContentDraft,
  finalizeHandAuthoredContent,
  runDraftDetection,
  toSaveAsanaVariantInput,
  type AsanaVariantContent,
} from "@y-v2/asana-content";
import { asanaRepository } from "./supabaseClient.js";
import { HttpJointDetector, fetchPhotoPathsInFolder } from "./HttpJointDetector.js";
import { PhotoInputStep } from "./steps/PhotoInputStep.js";
import { RejectedStep } from "./steps/RejectedStep.js";
import { DraftReviewStep } from "./steps/DraftReviewStep.js";
import { MetadataStep } from "./steps/MetadataStep.js";
import { HandAuthoringStep } from "./steps/HandAuthoringStep.js";
import { PublishStep } from "./steps/PublishStep.js";
import type { VariantMetadata, WizardState } from "./wizardState.js";

const detector = new HttpJointDetector();

export function App() {
  const [state, setState] = useState<WizardState>({ step: "photo-input", folderPath: "", error: null });
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);

  async function runDetection(folderPath: string) {
    setState({ step: "detecting", folderPath });
    try {
      const photoPaths = await fetchPhotoPathsInFolder(folderPath);
      if (photoPaths.length === 0) {
        setState({
          step: "photo-input",
          folderPath,
          error: `No .jpg/.jpeg/.png photos found in "${folderPath}"`,
        });
        return;
      }

      const result = await runDraftDetection(detector, photoPaths);
      if (!result.accepted) {
        setState({ step: "rejected", folderPath, reason: result.rejectionReason });
        return;
      }

      setState({ step: "draft-review", folderPath, poseData: result.poseData });
    } catch (error) {
      setState({ step: "photo-input", folderPath, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (state.step === "photo-input") {
    return <PhotoInputStep initialFolderPath={state.folderPath} error={state.error} onSubmit={runDetection} />;
  }

  if (state.step === "detecting") {
    return <p>Running detection on photos in "{state.folderPath}"…</p>;
  }

  if (state.step === "rejected") {
    return (
      <RejectedStep
        reason={state.reason}
        onRetry={() => setState({ step: "photo-input", folderPath: state.folderPath, error: null })}
      />
    );
  }

  if (state.step === "draft-review") {
    return (
      <DraftReviewStep
        poseData={state.poseData}
        onAccept={() => setState({ step: "metadata", folderPath: state.folderPath, poseData: state.poseData })}
        onReject={() => setState({ step: "photo-input", folderPath: state.folderPath, error: null })}
      />
    );
  }

  if (state.step === "metadata") {
    const { folderPath, poseData } = state;
    return (
      <MetadataStep
        onSubmit={(metadata: VariantMetadata) =>
          setState({ step: "hand-authoring", folderPath, poseData, metadata, draft: createHandAuthoredContentDraft() })
        }
      />
    );
  }

  if (state.step === "hand-authoring") {
    return (
      <HandAuthoringStep
        folderPath={state.folderPath}
        draft={state.draft}
        onChange={(draft) => setState({ ...state, draft })}
        onContinue={() => {
          const content: AsanaVariantContent = finalizeHandAuthoredContent(state.draft, {
            asana: { sanskritName: state.metadata.sanskritName },
            variant: {
              tradition: state.metadata.tradition,
              ashtangaSeries: state.metadata.ashtangaSeries,
              label: state.metadata.label,
            },
            poseData: state.poseData,
          });
          setPublishStatus("idle");
          setPublishError(null);
          setState({ step: "publish", content });
        }}
      />
    );
  }

  if (state.step === "publish") {
    const { content } = state;
    return (
      <PublishStep
        content={content}
        status={publishStatus}
        error={publishError}
        onPublish={async () => {
          setPublishStatus("publishing");
          try {
            await asanaRepository.saveAsanaVariant(toSaveAsanaVariantInput(content));
            setPublishStatus("idle");
            setState({ step: "published" });
          } catch (error) {
            setPublishStatus("error");
            setPublishError(error instanceof Error ? error.message : String(error));
          }
        }}
      />
    );
  }

  return (
    <section>
      <h2>Published</h2>
      <p>
        The Asana Variant was published successfully. Delete the Model Photos from disk now — this tool never
        uploaded or stored them anywhere.
      </p>
      <button type="button" onClick={() => setState({ step: "photo-input", folderPath: "", error: null })}>
        Author another Variant
      </button>
    </section>
  );
}
