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
import type { PhotoInput, VariantMetadata, WizardState } from "./wizardState.js";

const detector = new HttpJointDetector();

const EMPTY_PHOTO_INPUT: PhotoInput = {
  mainFolderPath: "",
  otherSideFolderPath: null,
  assumeSymmetric: false,
  groundContactPoints: [],
  facingDirection: "camera",
};

function describePhotoFolders(photos: PhotoInput): string {
  return photos.otherSideFolderPath
    ? `${photos.mainFolderPath} (main), ${photos.otherSideFolderPath} (other side)`
    : photos.mainFolderPath;
}

export function App() {
  const [state, setState] = useState<WizardState>({ step: "photo-input", initial: EMPTY_PHOTO_INPUT, error: null });
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);

  async function runDetection(photos: PhotoInput) {
    setState({ step: "detecting", photos });
    try {
      const mainPhotoPaths = await fetchPhotoPathsInFolder(photos.mainFolderPath);
      if (mainPhotoPaths.length === 0) {
        setState({
          step: "photo-input",
          initial: photos,
          error: `No .jpg/.jpeg/.png photos found in "${photos.mainFolderPath}"`,
        });
        return;
      }

      const otherSidePhotoPaths = photos.otherSideFolderPath
        ? await fetchPhotoPathsInFolder(photos.otherSideFolderPath)
        : [];

      const result = await runDraftDetection(detector, [...mainPhotoPaths, ...otherSidePhotoPaths], {
        assumeSymmetric: photos.assumeSymmetric,
        groundContactPoints: photos.groundContactPoints,
        facingDirection: photos.facingDirection,
      });

      if (!result.resolved) {
        setState({ step: "rejected", photos, rejection: result });
        return;
      }

      setState({ step: "draft-review", photos, poseData: result.poseData, mirroredBones: result.mirroredBones });
    } catch (error) {
      setState({ step: "photo-input", initial: photos, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (state.step === "photo-input") {
    return <PhotoInputStep initial={state.initial} error={state.error} onSubmit={runDetection} />;
  }

  if (state.step === "detecting") {
    return <p>Running detection on photos in "{describePhotoFolders(state.photos)}"…</p>;
  }

  if (state.step === "rejected") {
    const handleRetry = () => setState({ step: "photo-input", initial: state.photos, error: null });
    return <RejectedStep rejection={state.rejection} onRetry={handleRetry} />;
  }

  if (state.step === "draft-review") {
    const handleAccept = () => setState({ step: "metadata", photos: state.photos, poseData: state.poseData });
    const handleReject = () => setState({ step: "photo-input", initial: state.photos, error: null });
    return (
      <DraftReviewStep
        poseData={state.poseData}
        mirroredBones={state.mirroredBones}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );
  }

  if (state.step === "metadata") {
    const { photos, poseData } = state;
    const handleMetadataSubmit = (metadata: VariantMetadata) =>
      setState({ step: "hand-authoring", photos, poseData, metadata, draft: createHandAuthoredContentDraft() });
    return <MetadataStep onSubmit={handleMetadataSubmit} />;
  }

  if (state.step === "hand-authoring") {
    const handleDraftChange = (draft: typeof state.draft) => setState({ ...state, draft });
    return (
      <HandAuthoringStep
        folderPath={describePhotoFolders(state.photos)}
        draft={state.draft}
        onChange={handleDraftChange}
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

  const handleAuthorAnother = () => setState({ step: "photo-input", initial: EMPTY_PHOTO_INPUT, error: null });
  return (
    <section>
      <h2>Published</h2>
      <p>
        The Asana Variant was published successfully. Delete the Model Photos from disk now — this tool never
        uploaded or stored them anywhere.
      </p>
      <button type="button" onClick={handleAuthorAnother}>
        Author another Variant
      </button>
    </section>
  );
}
