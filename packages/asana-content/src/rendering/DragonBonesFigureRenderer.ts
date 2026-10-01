import * as PIXI from "pixi.js";
import { PixiFactory, type PixiArmatureDisplay } from "pixi-dragonbones-runtime";
import type { FigureRenderer, RenderInput } from "../FigureRenderer.js";
import type { MuscleState } from "../domain.js";

export interface RigAssetUrls {
  skeletonUrl: string;
  textureAtlasUrl: string;
  textureUrl: string;
}

const MUSCLE_STATE_COLORS: Record<MuscleState, number> = {
  working: 0xe0563f,
  lengthening: 0x3f9ee0,
  shortened: 0xe0c23f,
  neutral: 0xb0b0b0,
};

// The placeholder Rig reuses one plain gray 8x8 rectangle for every slot, scaled per bone. Without a distinct
// color per body region, overlapping/adjacent bones (e.g. the three stacked spine segments) are visually
// indistinguishable. This is a base tint applied before muscle-annotation tinting, which can still override it.
const BONE_REGION_COLORS: Partial<Record<string, number>> = {
  pelvis: 0x5b7fbd,
  lowerBack: 0x6e8ec9,
  upperBack: 0x8098d3,
  head: 0xdb8a3f,
  upperArmL: 0x4caf50,
  upperArmR: 0x4caf50,
  forearmL: 0x81c784,
  forearmR: 0x81c784,
  thighL: 0x9c64d1,
  thighR: 0x9c64d1,
  shinL: 0xc19ee0,
  shinR: 0xc19ee0,
};

const SKELETON_LINE_COLOR = 0x2b2b2b;

export class DragonBonesFigureRenderer implements FigureRenderer {
  private readonly tapHandlers: Array<(muscleId: string) => void> = [];

  private constructor(
    private readonly app: PIXI.Application,
    private readonly armatureDisplay: PixiArmatureDisplay,
    private readonly skeletonGraphics: PIXI.Graphics,
  ) {}

  static async create(container: HTMLElement, assets: RigAssetUrls): Promise<DragonBonesFigureRenderer> {
    const factory = PixiFactory.factory;

    const [skeletonData, textureAtlasData, texture] = await Promise.all([
      fetch(assets.skeletonUrl).then((response) => response.json()),
      fetch(assets.textureAtlasUrl).then((response) => response.json()),
      PIXI.Assets.load<PIXI.Texture>(assets.textureUrl),
    ]);

    const textureAtlasName = (textureAtlasData as { name?: string }).name ?? null;
    if (!textureAtlasName || !factory.getTextureAtlasData(textureAtlasName)) {
      factory.parseTextureAtlasData(textureAtlasData, texture);
    }

    const skeletonName = (skeletonData as { name?: string }).name ?? null;
    if (!skeletonName || !factory.getDragonBonesData(skeletonName)) {
      factory.parseDragonBonesData(skeletonData);
    }

    const armatureDisplay = factory.buildArmatureDisplay("Rig", undefined, undefined, textureAtlasName ?? undefined);
    if (!armatureDisplay) {
      throw new Error("Failed to build the placeholder Rig armature display");
    }

    const app = new PIXI.Application();
    await app.init({ resizeTo: container, backgroundAlpha: 0 });
    container.appendChild(app.canvas);
    armatureDisplay.x = app.screen.width / 2;
    armatureDisplay.y = app.screen.height / 2;
    app.stage.addChild(armatureDisplay);

    const skeletonGraphics = new PIXI.Graphics();
    armatureDisplay.addChild(skeletonGraphics);

    return new DragonBonesFigureRenderer(app, armatureDisplay, skeletonGraphics);
  }

  render(input: RenderInput): void {
    const armature = this.armatureDisplay.armature;

    for (const [boneName, transform] of Object.entries(input.poseData.bones)) {
      const bone = armature.getBone(boneName);
      if (!bone) {
        continue;
      }
      bone.offset.x = transform.x;
      bone.offset.y = transform.y;
      bone.offset.rotation = transform.rotation;
      bone.invalidUpdate();
    }

    for (const [boneName, color] of Object.entries(BONE_REGION_COLORS)) {
      const display = armature.getSlot(boneName)?.display as PIXI.Sprite | null | undefined;
      if (display) {
        display.tint = color as number;
      }
    }

    armature.advanceTime(0);
    this.skeletonGraphics.clear();
    if (input.activeLayers.includes("skeleton")) {
      for (const bone of armature.getBones()) {
        const parent = bone.parent;
        if (!parent) {
          continue;
        }
        this.skeletonGraphics.moveTo(parent.global.x, parent.global.y).lineTo(bone.global.x, bone.global.y);
      }
      this.skeletonGraphics.stroke({ width: 2, color: SKELETON_LINE_COLOR });
    }

    const muscleLayerActive = input.activeLayers.includes("muscle");
    for (const annotation of input.muscleAnnotations) {
      const slot = armature.getSlot(annotation.muscleId);
      const display = slot?.display as PIXI.Sprite | null | undefined;
      if (display) {
        display.tint = muscleLayerActive ? MUSCLE_STATE_COLORS[annotation.state] : 0xffffff;
      }
    }
  }

  destroy(): void {
    this.app.destroy({ removeView: true }, { children: true });
  }

  onMuscleTap(handler: (muscleId: string) => void): void {
    const alreadyWired = this.tapHandlers.length > 0;
    this.tapHandlers.push(handler);
    if (alreadyWired) {
      return;
    }

    for (const slot of this.armatureDisplay.armature.getSlots()) {
      const display = slot.display as PIXI.Sprite | null;
      if (!display) {
        continue;
      }
      display.eventMode = "static";
      display.cursor = "pointer";
      display.on("pointertap", () => {
        for (const tapHandler of this.tapHandlers) {
          tapHandler(slot.name);
        }
      });
    }
  }
}
