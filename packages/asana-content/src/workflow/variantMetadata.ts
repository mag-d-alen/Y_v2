import type { Tradition } from "../domain.js";

export interface VariantMetadataInput {
  sanskritName: string;
  tradition: Tradition | "";
  ashtangaSeries: number | null;
  label: string;
}

export interface VariantMetadataValidation {
  valid: boolean;
  errors: Partial<Record<keyof VariantMetadataInput, string>>;
}

export function validateVariantMetadata(input: VariantMetadataInput): VariantMetadataValidation {
  const errors: VariantMetadataValidation["errors"] = {};

  if (input.sanskritName.trim().length === 0) {
    errors.sanskritName = "Sanskrit name is required";
  }
  if (input.tradition === "") {
    errors.tradition = "Tradition is required";
  }
  if (input.label.trim().length === 0) {
    errors.label = "Label is required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
