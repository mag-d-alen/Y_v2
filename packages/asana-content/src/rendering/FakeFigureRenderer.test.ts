import { describe, expect, it, vi } from "vitest";
import { FakeFigureRenderer } from "./FakeFigureRenderer.js";
import type { RenderInput } from "../FigureRenderer.js";

const RENDER_INPUT: RenderInput = {
  poseData: { bones: { root: { x: 0, y: 0, rotation: 0 } } },
  muscleAnnotations: [{ muscleId: "quadriceps-right", state: "working", roleDescription: "Extends the knee." }],
  activeLayers: ["muscle"],
};

describe("FakeFigureRenderer", () => {
  it("records the last render() call", () => {
    const renderer = new FakeFigureRenderer();

    renderer.render(RENDER_INPUT);

    expect(renderer.lastRender).toEqual(RENDER_INPUT);
  });

  it("invokes every registered tap handler on simulateMuscleTap", () => {
    const renderer = new FakeFigureRenderer();
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    renderer.onMuscleTap(handlerA);
    renderer.onMuscleTap(handlerB);

    renderer.simulateMuscleTap("quadriceps-right");

    expect(handlerA).toHaveBeenCalledWith("quadriceps-right");
    expect(handlerB).toHaveBeenCalledWith("quadriceps-right");
  });
});
