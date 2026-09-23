import { useState } from "react";

export function PhotoInputStep({
  initialFolderPath,
  error,
  onSubmit,
}: {
  initialFolderPath: string;
  error: string | null;
  onSubmit: (folderPath: string) => void;
}) {
  const [folderPath, setFolderPath] = useState(initialFolderPath);

  return (
    <section>
      <h2>1. Point at a Model Photo folder</h2>
      <p>Enter the local folder path containing this Asana Variant's Model Photos.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(folderPath.trim());
        }}
      >
        <input
          type="text"
          value={folderPath}
          onChange={(event) => setFolderPath(event.target.value)}
          placeholder="/Users/you/model-photos/trikonasana"
          size={50}
        />
        <button type="submit" disabled={folderPath.trim().length === 0}>
          Run detection
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
