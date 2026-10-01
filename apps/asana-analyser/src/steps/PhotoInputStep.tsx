import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import type { ContactPoint, FacingDirection } from "@y-v2/asana-content";
import type { PhotoInput } from "../wizardState.js";
import { CONTACT_POINTS } from "../domainOptions.js";

const FACING_DIRECTIONS: readonly FacingDirection[] = ["camera", "left", "right"];

function describeFacingDirection(direction: FacingDirection): string {
  switch (direction) {
    case "camera":
      return "Facing the camera (a front-on shot)";
    case "left":
      return "Facing sideways, head/face toward the left of the photo";
    case "right":
      return "Facing sideways, head/face toward the right of the photo";
  }
}

export function PhotoInputStep({
  initial,
  error,
  onSubmit,
}: {
  initial: PhotoInput;
  error: string | null;
  onSubmit: (photos: PhotoInput) => void;
}) {
  const [mainFolderPath, setMainFolderPath] = useState(initial.mainFolderPath);
  const [otherSideFolderPath, setOtherSideFolderPath] = useState(initial.otherSideFolderPath ?? "");
  const [assumeSymmetric, setAssumeSymmetric] = useState(initial.assumeSymmetric);
  const [groundContactPoints, setGroundContactPoints] = useState<ContactPoint[]>(initial.groundContactPoints);
  const [facingDirection, setFacingDirection] = useState<FacingDirection>(initial.facingDirection);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit({
        mainFolderPath: mainFolderPath.trim(),
        otherSideFolderPath: otherSideFolderPath.trim() === "" ? null : otherSideFolderPath.trim(),
        assumeSymmetric,
        groundContactPoints,
        facingDirection,
      });
    },
    [mainFolderPath, otherSideFolderPath, assumeSymmetric, groundContactPoints, facingDirection, onSubmit],
  );

  const handleMainFolderPathChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setMainFolderPath(event.target.value);
  }, []);

  const handleOtherSideFolderPathChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setOtherSideFolderPath(event.target.value);
  }, []);

  const handleAssumeSymmetricChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAssumeSymmetric(event.target.checked);
  }, []);

  const handleFacingDirectionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFacingDirection(event.target.value as FacingDirection);
  }, []);

  const handleGroundContactPointToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const point = event.target.value as ContactPoint;
    setGroundContactPoints((current) =>
      event.target.checked ? [...current, point] : current.filter((existing) => existing !== point),
    );
  }, []);

  return (
    <section>
      <h2>1. Point at Model Photos</h2>
      <p>Enter the local folder path(s) containing this Asana Variant's Model Photos.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Main photo folder
            <input
              type="text"
              value={mainFolderPath}
              onChange={handleMainFolderPathChange}
              placeholder="/Users/you/model-photos/trikonasana"
              size={50}
            />
          </label>
        </div>
        <div>
          <label>
            Other side photo folder (optional — a second angle showing the opposite side, if you have one)
            <input
              type="text"
              value={otherSideFolderPath}
              onChange={handleOtherSideFolderPathChange}
              placeholder="/Users/you/model-photos/trikonasana-other-side"
              size={50}
            />
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={assumeSymmetric} onChange={handleAssumeSymmetricChange} />
            This pose is left-right symmetrical (a joint hidden on one side can be estimated from the other)
          </label>
        </div>
        <fieldset>
          <legend>Which way does the person face in this photo?</legend>
          {FACING_DIRECTIONS.map((direction) => (
            <div key={direction}>
              <label>
                <input
                  type="radio"
                  name="facingDirection"
                  value={direction}
                  checked={facingDirection === direction}
                  onChange={handleFacingDirectionChange}
                />
                {describeFacingDirection(direction)}
              </label>
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend>Which points touch the floor? (helps position the draft figure correctly)</legend>
          {CONTACT_POINTS.map((point) => (
            <label key={point} style={{ marginRight: "1em", display: "inline-block" }}>
              <input
                type="checkbox"
                value={point}
                checked={groundContactPoints.includes(point)}
                onChange={handleGroundContactPointToggle}
              />
              {point}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={mainFolderPath.trim().length === 0}>
          Run detection
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
