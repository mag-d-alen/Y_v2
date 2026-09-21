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

export class DragonBonesFigureRenderer implements FigureRenderer {
  private readonly tapHandlers: Array<(muscleId: string) => void> = [];

  private constructor(
    private readonly app: PIXI.Application,
    private readonly armatureDisplay: PixiArmatureDisplay,
  ) {}

  static async create(container: HTMLElement, assets: RigAssetUrls): Promise<DragonBonesFigureRenderer> {
    const factory = PixiFactory.factory;

    const [skeletonData, textureAtlasData, texture] = await Promise.all([
      fetch(assets.skeletonUrl).then((response) => response.json()),
      fetch(assets.textureAtlasUrl).then((response) => response.json()),
      PIXI.Assets.load<PIXI.Texture>(assets.textureUrl),
    ]);

    factory.parseDragonBonesData(skeletonData);
    factory.parseTextureAtlasData(textureAtlasData, texture);

    const armatureDisplay = factory.buildArmatureDisplay("Rig");
    if (!armatureDisplay) {
      throw new Error("Failed to build the placeholder Rig armature display");
    }

    const app = new PIXI.Application();
    await app.init({ resizeTo: container, backgroundAlpha: 0 });
    container.appendChild(app.canvas);
    armatureDisplay.x = app.screen.width / 2;
    armatureDisplay.y = app.screen.height / 2;
    app.stage.addChild(armatureDisplay);

    return new DragonBonesFigureRenderer(app, armatureDisplay);
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

    const muscleLayerActive = input.activeLayers.includes("muscle");
    for (const annotation of input.muscleAnnotations) {
      const slot = armature.getSlot(annotation.muscleId);
      const display = slot?.display as PIXI.Sprite | null | undefined;
      if (display) {
        display.tint = muscleLayerActive ? MUSCLE_STATE_COLORS[annotation.state] : 0xffffff;
      }
    }
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
