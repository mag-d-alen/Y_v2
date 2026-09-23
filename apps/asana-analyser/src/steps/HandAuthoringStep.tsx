import { useState } from "react";
import {
  addBodyContactAnnotation,
  addGroundContactAnnotation,
  addLoadAnnotation,
  addRotationAnnotation,
  setDrishtiAnnotation,
  setSpineBone,
  setSpineCurvaturePresent,
  type BodyContactType,
  type ContactPoint,
  type DrishtiPoint,
  type HandAuthoredContentDraft,
  type LimbRotationBone,
  type LimbRotationDirection,
  type TorsoRotationBone,
  type TorsoRotationDirection,
} from "@y-v2/asana-content";
import type { SpineBone } from "@y-v2/asana-content";
import {
  BODY_CONTACT_TYPES,
  CONTACT_POINTS,
  DRISHTI_POINTS,
  LIMB_ROTATION_BONES,
  TORSO_ROTATION_BONES,
} from "../domainOptions.js";

const SPINE_BONES: SpineBone[] = ["pelvis", "lowerBack", "upperBack"];
const ROTATION_BONE_OPTIONS: (LimbRotationBone | TorsoRotationBone)[] = [...LIMB_ROTATION_BONES, ...TORSO_ROTATION_BONES];

function isTorsoBone(bone: string): bone is TorsoRotationBone {
  return (TORSO_ROTATION_BONES as readonly string[]).includes(bone);
}

export function HandAuthoringStep({
  folderPath,
  draft,
  onChange,
  onContinue,
}: {
  folderPath: string;
  draft: HandAuthoredContentDraft;
  onChange: (draft: HandAuthoredContentDraft) => void;
  onContinue: () => void;
}) {
  const [rotationBone, setRotationBone] = useState<LimbRotationBone | TorsoRotationBone | "">("");
  const [rotationDirection, setRotationDirection] = useState<LimbRotationDirection | TorsoRotationDirection | "">("");
  const [groundContactPoint, setGroundContactPoint] = useState<ContactPoint | "">("");
  const [loadPoint, setLoadPoint] = useState<ContactPoint | "">("");
  const [loadFraction, setLoadFraction] = useState("0.5");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bodyContactPointA, setBodyContactPointA] = useState<ContactPoint | "">("");
  const [bodyContactPointB, setBodyContactPointB] = useState<ContactPoint | "">("");
  const [bodyContactType, setBodyContactType] = useState<BodyContactType | "">("");

  const availableLoadPoints = draft.groundContactAnnotations.map((annotation) => annotation.point);

  return (
    <section>
      <h2>4. Hand-authored content</h2>
      <p>
        Model Photos: <code>{folderPath}</code> — open them in DragonBones or your image viewer alongside this
        step; this tool only ever reads them by local path and never displays or uploads the photos themselves.
      </p>

      <fieldset>
        <legend>Spine (pose in DragonBones against the Model Photo, then transcribe the values here)</legend>
        {SPINE_BONES.map((bone) => {
          const transform = draft.spineBones[bone] ?? { x: 0, y: 0, rotation: 0 };
          return (
            <div key={bone}>
              <span>{bone}</span>
              {(["x", "y", "rotation"] as const).map((field) => (
                <label key={field}>
                  {field}
                  <input
                    type="number"
                    step="any"
                    value={transform[field]}
                    onChange={(event) =>
                      onChange(
                        setSpineBone(draft, bone, { ...transform, [field]: Number(event.target.value) }),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          );
        })}
      </fieldset>

      <fieldset>
        <legend>Is spine curvature present in this Variant?</legend>
        <label>
          <input
            type="radio"
            name="spine-curvature"
            checked={draft.spineCurvaturePresent === true}
            onChange={() => onChange(setSpineCurvaturePresent(draft, true))}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            name="spine-curvature"
            checked={draft.spineCurvaturePresent === false}
            onChange={() => onChange(setSpineCurvaturePresent(draft, false))}
          />
          No
        </label>
      </fieldset>

      <fieldset>
        <legend>Rotation Annotations ({draft.rotationAnnotations.length})</legend>
        <ul>
          {draft.rotationAnnotations.map((annotation, index) => (
            <li key={index}>
              {annotation.bone}: {annotation.direction}
            </li>
          ))}
        </ul>
        <select value={rotationBone} onChange={(event) => { setRotationBone(event.target.value as typeof rotationBone); setRotationDirection(""); }}>
          <option value="">Select a bone</option>
          {ROTATION_BONE_OPTIONS.map((bone) => (
            <option key={bone} value={bone}>
              {bone}
            </option>
          ))}
        </select>
        <select value={rotationDirection} onChange={(event) => setRotationDirection(event.target.value as typeof rotationDirection)}>
          <option value="">Select a direction</option>
          {(rotationBone && isTorsoBone(rotationBone) ? ["left", "right"] : ["internal", "external"]).map((direction) => (
            <option key={direction} value={direction}>
              {direction}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!rotationBone || !rotationDirection}
          onClick={() => {
            if (!rotationBone || !rotationDirection) {
              return;
            }
            const annotation = isTorsoBone(rotationBone)
              ? { bone: rotationBone, direction: rotationDirection as TorsoRotationDirection }
              : { bone: rotationBone, direction: rotationDirection as LimbRotationDirection };
            onChange(addRotationAnnotation(draft, annotation));
            setRotationBone("");
            setRotationDirection("");
          }}
        >
          Add Rotation Annotation
        </button>
      </fieldset>

      <fieldset>
        <legend>Ground Contact Annotations ({draft.groundContactAnnotations.length})</legend>
        <ul>
          {draft.groundContactAnnotations.map((annotation, index) => (
            <li key={index}>{annotation.point}</li>
          ))}
        </ul>
        <select value={groundContactPoint} onChange={(event) => setGroundContactPoint(event.target.value as ContactPoint | "")}>
          <option value="">Select a point</option>
          {CONTACT_POINTS.map((point) => (
            <option key={point} value={point}>
              {point}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!groundContactPoint}
          onClick={() => {
            if (!groundContactPoint) {
              return;
            }
            onChange(addGroundContactAnnotation(draft, { point: groundContactPoint }));
            setGroundContactPoint("");
          }}
        >
          Add Ground Contact Annotation
        </button>
      </fieldset>

      <fieldset>
        <legend>Load Annotations ({draft.loadAnnotations.length})</legend>
        <ul>
          {draft.loadAnnotations.map((annotation, index) => (
            <li key={index}>
              {annotation.point}: {annotation.loadFraction}
            </li>
          ))}
        </ul>
        {availableLoadPoints.length === 0 ? (
          <p>Add a Ground Contact Annotation first — a Load Annotation needs a matching contact point.</p>
        ) : (
          <>
            <select value={loadPoint} onChange={(event) => setLoadPoint(event.target.value as ContactPoint | "")}>
              <option value="">Select a point</option>
              {availableLoadPoints.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={1}
              step="0.05"
              value={loadFraction}
              onChange={(event) => setLoadFraction(event.target.value)}
            />
            <button
              type="button"
              disabled={!loadPoint}
              onClick={() => {
                if (!loadPoint) {
                  return;
                }
                try {
                  onChange(addLoadAnnotation(draft, { point: loadPoint, loadFraction: Number(loadFraction) }));
                  setLoadPoint("");
                  setLoadError(null);
                } catch (error) {
                  setLoadError(error instanceof Error ? error.message : String(error));
                }
              }}
            >
              Add Load Annotation
            </button>
          </>
        )}
        {loadError && <p role="alert">{loadError}</p>}
      </fieldset>

      <fieldset>
        <legend>Body Contact Annotations ({draft.bodyContactAnnotations.length})</legend>
        <ul>
          {draft.bodyContactAnnotations.map((annotation, index) => (
            <li key={index}>
              {annotation.pointA} {annotation.contactType} {annotation.pointB}
            </li>
          ))}
        </ul>
        <select value={bodyContactPointA} onChange={(event) => setBodyContactPointA(event.target.value as ContactPoint | "")}>
          <option value="">Point A</option>
          {CONTACT_POINTS.map((point) => (
            <option key={point} value={point}>
              {point}
            </option>
          ))}
        </select>
        <select value={bodyContactPointB} onChange={(event) => setBodyContactPointB(event.target.value as ContactPoint | "")}>
          <option value="">Point B</option>
          {CONTACT_POINTS.map((point) => (
            <option key={point} value={point}>
              {point}
            </option>
          ))}
        </select>
        <select value={bodyContactType} onChange={(event) => setBodyContactType(event.target.value as BodyContactType | "")}>
          <option value="">Contact type</option>
          {BODY_CONTACT_TYPES.map((contactType) => (
            <option key={contactType} value={contactType}>
              {contactType}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!bodyContactPointA || !bodyContactPointB || !bodyContactType}
          onClick={() => {
            if (!bodyContactPointA || !bodyContactPointB || !bodyContactType) {
              return;
            }
            onChange(
              addBodyContactAnnotation(draft, {
                pointA: bodyContactPointA,
                pointB: bodyContactPointB,
                contactType: bodyContactType,
              }),
            );
            setBodyContactPointA("");
            setBodyContactPointB("");
            setBodyContactType("");
          }}
        >
          Add Body Contact Annotation
        </button>
      </fieldset>

      <fieldset>
        <legend>Drishti Annotation (at most one)</legend>
        <select
          value={draft.drishtiAnnotation?.point ?? ""}
          onChange={(event) => {
            const value = event.target.value as DrishtiPoint | "";
            onChange(setDrishtiAnnotation(draft, value === "" ? null : { point: value }));
          }}
        >
          <option value="">None</option>
          {DRISHTI_POINTS.map((point) => (
            <option key={point} value={point}>
              {point}
            </option>
          ))}
        </select>
      </fieldset>

      <button type="button" disabled={draft.spineCurvaturePresent === null} onClick={onContinue}>
        Continue to publish
      </button>
    </section>
  );
}
