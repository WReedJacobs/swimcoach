import type { MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing'
import PoolFloor from './PoolFloor'
import type { HeroPalette } from './tokenColors'

interface HeroSceneProps {
  palette: HeroPalette
  scrollRef: MutableRefObject<number>
  /** Desktop-only extras: the higher caustic octave + the film-grain pass. */
  heavyFx: boolean
  /** Pixel-ratio cap; lower on mobile to keep fill-rate down. */
  dprMax: number
}

export default function HeroScene({ palette, scrollRef, heavyFx, dprMax }: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, dprMax]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      {/* Clear colour = abyssal bg token (the pool quad covers it, but it
          keeps the frame the right colour during load / on resize). */}
      <color attach="background" args={[palette.bg]} />

      <PoolFloor palette={palette} scrollRef={scrollRef} detail={heavyFx ? 1 : 0} />

      <EffectComposer>
        {/* Only the brightest caustic ridges bloom, so they read as sunlit
            glints on the water rather than a uniform glow. */}
        <Bloom intensity={0.55} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
        {heavyFx ? <Noise opacity={0.025} /> : <></>}
      </EffectComposer>
    </Canvas>
  )
}
