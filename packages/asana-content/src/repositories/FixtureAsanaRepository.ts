import type { AsanaRepository, AsanaVariantRef, SaveAsanaVariantInput } from "../AsanaRepository.js";
import type { AsanaVariantContent } from "../domain.js";
import { FIXTURE_ASANA_VARIANTS } from "./fixtures.js";

export class FixtureAsanaRepository implements AsanaRepository {
  private readonly variants: Map<string, AsanaVariantContent>;
  readonly savedVariants: SaveAsanaVariantInput[] = [];

  constructor(seed: Record<string, AsanaVariantContent> = FIXTURE_ASANA_VARIANTS) {
    this.variants = new Map(Object.entries(seed));
  }

  async getAsanaVariant(variantId: string): Promise<AsanaVariantContent> {
    const content = this.variants.get(variantId);
    if (!content) {
      throw new Error(`No fixture Asana Variant for id "${variantId}"`);
    }
    return content;
  }

  async listAsanaVariants(sanskritName: string): Promise<AsanaVariantRef[]> {
    return [...this.variants.values()]
      .filter((content) => content.asana.sanskritName === sanskritName)
      .map((content) => content.variant);
  }

  async saveAsanaVariant(input: SaveAsanaVariantInput): Promise<void> {
    this.savedVariants.push(input);
  }
}
