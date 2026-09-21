import type { FigureRenderer, RenderInput } from "../FigureRenderer.js";

export class FakeFigureRenderer implements FigureRenderer {
  lastRender: RenderInput | undefined;
  private readonly tapHandlers: Array<(muscleId: string) => void> = [];

  render(input: RenderInput): void {
    this.lastRender = input;
  }

  onMuscleTap(handler: (muscleId: string) => void): void {
    this.tapHandlers.push(handler);
  }

  simulateMuscleTap(muscleId: string): void {
    for (const handler of this.tapHandlers) {
      handler(muscleId);
    }
  }
}
