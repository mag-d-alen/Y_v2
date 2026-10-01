import { MIN_JOINT_CONFIDENCE, type DraftPoseDataResolution } from "./resolveDraftPoseData.js";

export type RejectedDraftDetection = Extract<DraftPoseDataResolution, { resolved: false }>;

export function describeRejection(rejection: RejectedDraftDetection): string {
  if (rejection.rejectionReason === "no-person-detected") {
    return "No person was detected in this photo.";
  }

  const confidencePct = Math.round(rejection.confidence * 100);
  const thresholdPct = Math.round(MIN_JOINT_CONFIDENCE * 100);
  const base = `The detector couldn't resolve the "${rejection.bone}" bone — its "${rejection.joint}" joint read at ${confidencePct}% confidence (below the ${thresholdPct}% threshold).`;

  if (rejection.mirrorAttempted) {
    return `${base} Mirroring from the opposite side was attempted too, but that side also failed — this joint likely isn't visible from this angle on either side. Try a different angle, or a photo that shows this part of the body more clearly.`;
  }

  if (rejection.bone === "head") {
    return `${base} This bone has no opposite side to mirror from, so a different photo is the only remedy.`;
  }

  return `${base} If this pose is left-right symmetrical, try marking it as symmetrical and running detection again — the opposite side can stand in for this joint. Otherwise, try a different photo, or add an "other side" photo that shows this joint directly.`;
}
