import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockBone = { offset: { x: 0, y: 0, rotation: 0 }, invalidUpdate: vi.fn() };
const mockTorsoDisplay = { tint: 0, eventMode: "auto", cursor: "", on: vi.fn() };
const mockTorsoSlot = { name: "torso", display: mockTorsoDisplay };
const mockArmature = {
  getBone: vi.fn(() => mockBone),
  getSlot: vi.fn(() => mockTorsoSlot),
  getSlots: vi.fn(() => [mockTorsoSlot]),
};
const mockArmatureDisplay = { armature: mockArmature, x: 0, y: 0 };
const mockFactory = {
  parseDragonBonesData: vi.fn(),
  parseTextureAtlasData: vi.fn(),
  buildArmatureDisplay: vi.fn(() => mockArmatureDisplay),
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
  }
  return {
    Application,
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
    expect(mockFactory.buildArmatureDisplay).toHaveBeenCalledWith("Rig");
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
});
