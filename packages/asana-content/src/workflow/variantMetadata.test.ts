import { describe, expect, it } from "vitest";
import { validateVariantMetadata, type VariantMetadataInput } from "./variantMetadata.js";

const VALID: VariantMetadataInput = {
  sanskritName: "Trikonasana",
  tradition: "ashtanga",
  ashtangaSeries: 1,
  label: "standard",
};

describe("validateVariantMetadata", () => {
  it("accepts complete metadata", () => {
    expect(validateVariantMetadata(VALID)).toEqual({ valid: true, errors: {} });
  });

  it("accepts a null ashtangaSeries", () => {
    expect(validateVariantMetadata({ ...VALID, ashtangaSeries: null })).toEqual({ valid: true, errors: {} });
  });

  it("rejects a blank Sanskrit name", () => {
    const result = validateVariantMetadata({ ...VALID, sanskritName: "  " });

    expect(result.valid).toBe(false);
    expect(result.errors.sanskritName).toBeDefined();
  });

  it("rejects an unselected tradition", () => {
    const result = validateVariantMetadata({ ...VALID, tradition: "" });

    expect(result.valid).toBe(false);
    expect(result.errors.tradition).toBeDefined();
  });

  it("rejects a blank label", () => {
    const result = validateVariantMetadata({ ...VALID, label: "" });

    expect(result.valid).toBe(false);
    expect(result.errors.label).toBeDefined();
  });

  it("reports every invalid field at once", () => {
    const result = validateVariantMetadata({ sanskritName: "", tradition: "", ashtangaSeries: null, label: "" });

    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(["label", "sanskritName", "tradition"]);
  });
});
