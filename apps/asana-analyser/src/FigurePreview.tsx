import { useEffect, useRef } from "react";
import { DragonBonesFigureRenderer, type FigureRenderer, type PoseData } from "@y-v2/asana-content";

const RIG_ASSET_URLS = {
  skeletonUrl: "/rig/rig_ske.json",
  textureAtlasUrl: "/rig/rig_tex.json",
  textureUrl: "/rig/rig_tex.png",
};

export function FigurePreview({ poseData }: { poseData: PoseData }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<FigureRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    DragonBonesFigureRenderer.create(container, RIG_ASSET_URLS).then((renderer) => {
      if (cancelled) {
        return;
      }
      rendererRef.current = renderer;
      renderer.render({ poseData, muscleAnnotations: [], activeLayers: [] });
    });

    return () => {
      cancelled = true;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.render({ poseData, muscleAnnotations: [], activeLayers: [] });
  }, [poseData]);

  return <div ref={containerRef} style={{ width: 360, height: 480 }} />;
}
