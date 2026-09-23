import { useState } from "react";
import { validateVariantMetadata, type Tradition } from "@y-v2/asana-content";
import { TRADITIONS } from "../domainOptions.js";
import type { VariantMetadata } from "../wizardState.js";

export function MetadataStep({ onSubmit }: { onSubmit: (metadata: VariantMetadata) => void }) {
  const [sanskritName, setSanskritName] = useState("");
  const [tradition, setTradition] = useState<Tradition | "">("");
  const [ashtangaSeries, setAshtangaSeries] = useState("");
  const [label, setLabel] = useState("standard");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <section>
      <h2>3. Asana Variant metadata</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const input = {
            sanskritName,
            tradition,
            ashtangaSeries: ashtangaSeries.trim() === "" ? null : Number(ashtangaSeries),
            label,
          };
          const validation = validateVariantMetadata(input);
          if (!validation.valid) {
            setErrors(validation.errors);
            return;
          }
          onSubmit({ ...input, tradition: tradition as Tradition });
        }}
      >
        <div>
          <label>
            Sanskrit name
            <input type="text" value={sanskritName} onChange={(event) => setSanskritName(event.target.value)} />
          </label>
          {errors.sanskritName && <span role="alert">{errors.sanskritName}</span>}
        </div>
        <div>
          <label>
            Tradition
            <select value={tradition} onChange={(event) => setTradition(event.target.value as Tradition | "")}>
              <option value="">Select a tradition</option>
              {TRADITIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {errors.tradition && <span role="alert">{errors.tradition}</span>}
        </div>
        <div>
          <label>
            Ashtanga series (leave blank if not applicable)
            <input
              type="number"
              min={1}
              max={6}
              value={ashtangaSeries}
              onChange={(event) => setAshtangaSeries(event.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Label
            <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          {errors.label && <span role="alert">{errors.label}</span>}
        </div>
        <button type="submit">Continue to hand-authored content</button>
      </form>
    </section>
  );
}
