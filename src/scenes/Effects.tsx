import {
  Bloom,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { qualityTiers } from "../config/palette";
import { useWorldState } from "../hooks/useAppState";

/**
 * Cinematic grade for the narrative world: emissive cores bloom, the frame
 * falls off toward the edges and a faint grain keeps the deep blacks from
 * banding. `ToneMapping` is part of the chain because three skips a material's
 * tone mapping whenever it renders into a target instead of the screen — the
 * composer would otherwise lose the ACES curve the scene was lit for.
 *
 * The grade is tuned per theme instead of switching the chain off, so toggling
 * light/dark changes exposure rather than remounting the renderer.
 */
export default function Effects() {
  const { theme, quality } = useWorldState();
  const tiers = qualityTiers[quality];

  if (!tiers.effects) return null;

  const dark = theme === "dark";

  return (
    <EffectComposer multisampling={tiers.multisampling} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        radius={0.74}
        intensity={dark ? 0.95 : 0.34}
        luminanceThreshold={dark ? 0.55 : 0.84}
        luminanceSmoothing={0.28}
      />
      <Noise opacity={dark ? 0.035 : 0.018} blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.26} darkness={dark ? 0.62 : 0.16} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
