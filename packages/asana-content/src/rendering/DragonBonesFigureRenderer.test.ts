import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockBone = {
  offset: { x: 0, y: 0, rotation: 0 },
  invalidUpdate: vi.fn(),
  global: { x: 0, y: 0 },
  parent: null as null | { global: { x: number; y: number } },
};
const mockTorsoDisplay = { tint: 0, eventMode: "auto", cursor: "", on: vi.fn() };
const mockTorsoSlot = { name: "torso", display: mockTorsoDisplay };
const mockHeadDisplay = { tint: 0, eventMode: "auto", cursor: "", on: vi.fn() };
const mockHeadSlot = { name: "head", display: mockHeadDisplay };
const mockArmature = {
  getBone: vi.fn(() => mockBone),
  getBones: vi.fn(() => [mockBone]),
  getSlot: vi.fn((name: string) => (name === "head" ? mockHeadSlot : mockTorsoSlot)),
  getSlots: vi.fn(() => [mockTorsoSlot]),
  advanceTime: vi.fn(),
};
const mockArmatureDisplay = { armature: mockArmature, x: 0, y: 0, addChild: vi.fn() };
const mockFactory = {
  parseDragonBonesData: vi.fn(),
  parseTextureAtlasData: vi.fn(),
  buildArmatureDisplay: vi.fn(() => mockArmatureDisplay),
  getDragonBonesData: vi.fn(() => null),
  getTextureAtlasData: vi.fn(() => null),
};

vi.mock("pixi-dragonbones-runtime", () => ({
  PixiFactory: { factory: mockFactory },
}));

vi.mock("pixi.js", () => {
  class Application {
    canvas = {};
    screen = { width: 100, height: 100 };
    stage = { addChild: vi.fn() };
    async init(_options: unknown) {}
    destroy = vi.fn();
  }
  class Graphics {
    clear = vi.fn(() => this);
    moveTo = vi.fn(() => this);
    lineTo = vi.fn(() => this);
    stroke = vi.fn(() => this);
  }
  return {
    Application,
    Graphics,
    Assets: { load: vi.fn(async () => ({})) },
  };
});

const { DragonBonesFigureRenderer } = await import("./DragonBonesFigureRenderer.js");

const ASSETS = {
  skeletonUrl: "/rig/rig_ske.json",
  textureAtlasUrl: "/rig/rig_tex.json",
  textureUrl: "/rig/rig_tex.png",
};

describe("DragonBonesFigureRenderer", () => {
  let container: { appendChild: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    container = { appendChild: vi.fn() };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ json: async () => ({}) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads and builds the placeholder Rig armature on create()", async () => {
    await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    expect(fetch).toHaveBeenCalledWith(ASSETS.skeletonUrl);
    expect(fetch).toHaveBeenCalledWith(ASSETS.textureAtlasUrl);
    expect(mockFactory.parseDragonBonesData).toHaveBeenCalled();
    expect(mockFactory.parseTextureAtlasData).toHaveBeenCalled();
    expect(mockFactory.buildArmatureDisplay).toHaveBeenCalledWith("Rig", undefined, undefined, undefined);
    expect(container.appendChild).toHaveBeenCalled();
  });

  it("applies Pose Data as bone offsets", async () => {
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    renderer.render({
      poseData: { bones: { torso: { x: 5, y: -10, rotation: 0.4 } } },
      muscleAnnotations: [],
      activeLayers: [],
    });

    expect(mockArmature.getBone).toHaveBeenCalledWith("torso");
    expect(mockBone.offset).toEqual({ x: 5, y: -10, rotation: 0.4 });
    expect(mockBone.invalidUpdate).toHaveBeenCalled();
  });

  it("tints each bone slot a distinct base color by body region", async () => {
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    renderer.render({ poseData: { bones: {} }, muscleAnnotations: [], activeLayers: [] });

    expect(mockHeadDisplay.tint).toBe(0xdb8a3f);
  });

  it("draws a connector line between each bone and its parent when the skeleton layer is active", async () => {
    const parentBone = { global: { x: 0, y: 0 } };
    const childBone = { global: { x: 10, y: 20 }, parent: parentBone };
    mockArmature.getBones.mockReturnValueOnce([parentBone as never, childBone as never]);
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);
    const skeletonGraphics = mockArmatureDisplay.addChild.mock.calls[0]?.[0] as InstanceType<
      typeof import("pixi.js").Graphics
    >;

    renderer.render({ poseData: { bones: {} }, muscleAnnotations: [], activeLayers: ["skeleton"] });

    expect(skeletonGraphics.moveTo).toHaveBeenCalledWith(0, 0);
    expect(skeletonGraphics.lineTo).toHaveBeenCalledWith(10, 20);
    expect(skeletonGraphics.stroke).toHaveBeenCalledWith({ width: 2, color: 0x2b2b2b });
  });

  it("does not draw connector lines when the skeleton layer is inactive", async () => {
    const parentBone = { global: { x: 0, y: 0 } };
    const childBone = { global: { x: 10, y: 20 }, parent: parentBone };
    mockArmature.getBones.mockReturnValueOnce([parentBone as never, childBone as never]);
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);
    const skeletonGraphics = mockArmatureDisplay.addChild.mock.calls[0]?.[0] as InstanceType<
      typeof import("pixi.js").Graphics
    >;

    renderer.render({ poseData: { bones: {} }, muscleAnnotations: [], activeLayers: [] });

    expect(skeletonGraphics.clear).toHaveBeenCalled();
    expect(skeletonGraphics.moveTo).not.toHaveBeenCalled();
    expect(skeletonGraphics.stroke).not.toHaveBeenCalled();
  });

  it("tints a slot by muscle state only when the muscle layer is active", async () => {
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    renderer.render({
      poseData: { bones: {} },
      muscleAnnotations: [{ muscleId: "torso", state: "working", roleDescription: "Stabilizes the spine." }],
      activeLayers: ["muscle"],
    });
    expect(mockTorsoDisplay.tint).toBe(0xe0563f);

    renderer.render({
      poseData: { bones: {} },
      muscleAnnotations: [{ muscleId: "torso", state: "working", roleDescription: "Stabilizes the spine." }],
      activeLayers: [],
    });
    expect(mockTorsoDisplay.tint).toBe(0xffffff);
  });

  it("reports taps by muscle id to every registered handler", async () => {
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);
    const handler = vi.fn();

    renderer.onMuscleTap(handler);

    expect(mockTorsoDisplay.eventMode).toBe("static");
    const tapCallback = mockTorsoDisplay.on.mock.calls[0]?.[1] as () => void;
    tapCallback();

    expect(handler).toHaveBeenCalledWith("torso");
  });

  it("skips re-parsing already-registered skeleton and texture atlas data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        json: async () => (url === ASSETS.skeletonUrl ? { name: "RigData" } : { name: "rig_tex" }),
      })),
    );
    mockFactory.getDragonBonesData.mockReturnValueOnce({} as never);
    mockFactory.getTextureAtlasData.mockReturnValueOnce([{}] as never);

    await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    expect(mockFactory.getDragonBonesData).toHaveBeenCalledWith("RigData");
    expect(mockFactory.getTextureAtlasData).toHaveBeenCalledWith("rig_tex");
    expect(mockFactory.parseDragonBonesData).not.toHaveBeenCalled();
    expect(mockFactory.parseTextureAtlasData).not.toHaveBeenCalled();
  });

  it("destroy() tears down only its own view, never the shared texture cache", async () => {
    const renderer = await DragonBonesFigureRenderer.create(container as unknown as HTMLElement, ASSETS);

    renderer.destroy();

    const app = (renderer as unknown as { app: { destroy: ReturnType<typeof vi.fn> } }).app;
    expect(app.destroy).toHaveBeenCalledWith({ removeView: true }, { children: true });
  });
});
