import { useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import vertexShader from './shaders/caustics.vert.glsl'
import fragmentShader from './shaders/caustics.frag.glsl'
import type { HeroPalette } from './tokenColors'

interface PoolFloorProps {
  palette: HeroPalette
  scrollRef: MutableRefObject<number>
  /** 1 = extra caustic octave (desktop), 0 = lighter (mobile). */
  detail: number
}

// Deep-pool-blue art direction (seeded from tokens, then pushed to a dark blue
// so it sits in the site's dark palette); caustics are the aqua primary pulled
// toward cool cyan/white.
const DEEP_BLUE = new THREE.Color(0.03, 0.11, 0.24)
const CAUSTIC_CYAN = new THREE.Color(0.5, 0.85, 1.0)

interface Uniforms {
  [key: string]: THREE.IUniform
  uTime: THREE.IUniform<number>
  uScroll: THREE.IUniform<number>
  uResolution: THREE.IUniform<THREE.Vector2>
  uWater: THREE.IUniform<THREE.Color>
  uWaterDeep: THREE.IUniform<THREE.Color>
  uCaustic: THREE.IUniform<THREE.Color>
  uCausticHot: THREE.IUniform<THREE.Color>
  uDetail: THREE.IUniform<number>
}

function makeUniforms(palette: HeroPalette, detail: number): Uniforms {
  return {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uWater: { value: palette.bg.clone().lerp(DEEP_BLUE, 0.7) },
    uWaterDeep: { value: palette.bg.clone() },
    uCaustic: { value: palette.primary.clone().lerp(CAUSTIC_CYAN, 0.55) },
    uCausticHot: { value: palette.bright.clone() },
    uDetail: { value: detail },
  }
}

export default function PoolFloor({ palette, scrollRef, detail }: PoolFloorProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => makeUniforms(palette, detail), [palette, detail])

  useFrame((state, delta) => {
    const mat = materialRef.current
    if (mat) {
      mat.uniforms.uTime.value = state.clock.elapsedTime
      // Ease the travel toward the raw scroll position instead of snapping to
      // it: a quick flick of the wheel then glides to rest, so the floor feels
      // like it's coasting through water rather than jerking. Frame-rate
      // independent (exponential smoothing on delta); ~6 = a soft ~0.15s lag.
      const target = scrollRef.current
      const k = 1 - Math.exp(-6 * delta)
      mat.uniforms.uScroll.value += (target - mat.uniforms.uScroll.value) * k
      mat.uniforms.uResolution.value.set(state.size.width, state.size.height)
    }
  })

  // Fullscreen quad: the [2,2] plane spans clip space and the vertex shader
  // outputs it directly (camera-independent), so the floor fills the viewport.
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
