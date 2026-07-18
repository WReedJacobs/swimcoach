uniform float uTime;
uniform float uScroll;     // 0..1 page scroll — swims you forward down the pool
uniform vec2 uResolution;
uniform vec3 uWater;       // mid water (deep pool blue)
uniform vec3 uWaterDeep;   // deepest water / lane + edge shadow (token: bg)
uniform vec3 uCaustic;     // caustic light (cool aqua/cyan)
uniform vec3 uCausticHot;  // hottest caustic (aqua->white)
uniform float uDetail;     // 1 = extra octave (desktop), 0 = mobile

varying vec2 vUv;

#include ./noise.glsl

float ridged(vec3 p) { return 1.0 - abs(snoise(p)); }

// Domain-warped, multi-octave ridged noise sharpened into thin bright lines,
// with high time factors so the light visibly ripples and crawls.
float caustics(vec2 uv, float t) {
  float warp = snoise(vec3(uv * 1.8, t * 0.18)) * 0.5;
  vec3 q = vec3(uv * 4.5 + warp, t * 0.28);
  float c = ridged(q);
  c += 0.5 * ridged(q * 2.0 + 5.0);
  float norm = 1.5;
  if (uDetail > 0.5) {
    c += 0.25 * ridged(q * 4.0 + 11.0);
    norm = 1.75;
  }
  c /= norm;
  return pow(clamp(c, 0.0, 1.0), 3.4);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = vUv;
  // Aspect-corrected, centred coords; y is the swim / travel axis.
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Forward travel: idle drift + scroll. +travel streams the floor top -> bottom
  // (toward and past you) as you swim forward. The scroll term is deliberately
  // gentle so a full page scroll glides ~1.6 pool-lengths past rather than
  // whipping by (the ref is also eased in the render loop).
  float travel = uTime * 0.1 + uScroll * 1.6;

  // ---- water base with a soft depth vignette (darker toward the edges) ----
  float vig = smoothstep(1.3, 0.15, length(p));
  vec3 col = mix(uWaterDeep, uWater, vig);

  // ---- solid black lane lines: 3 lanes across the width, a guide line down
  // each lane centre with a "T" at each pool end. No ropes/barriers. ----
  float lanes = 3.0;
  float lx = uv.x * lanes;
  float dxLane = abs(fract(lx) - 0.5) / lanes;         // dist to nearest lane centre

  float ly = uv.y + travel;
  float poolLen = 1.15;
  float yy = fract(ly / poolLen);                      // 0..1 within one pool length
  float lineY = smoothstep(0.03, 0.05, yy) * (1.0 - smoothstep(0.95, 0.97, yy)); // gaps at the walls
  float lineX = 1.0 - smoothstep(0.009, 0.014, dxLane); // thick guide line
  float guide = lineX * lineY;
  float tY = max(1.0 - smoothstep(0.0, 0.007, abs(yy - 0.09)),
                 1.0 - smoothstep(0.0, 0.007, abs(yy - 0.91)));
  float tX = 1.0 - smoothstep(0.03, 0.042, dxLane);    // wider than the guide line
  float black = max(guide, tX * tY);
  float blackRim = max(smoothstep(0.014, 0.02, dxLane) - smoothstep(0.02, 0.032, dxLane), 0.0) * lineY;
  col = mix(col, uWaterDeep * 0.04, black);
  col += uCaustic * blackRim * 0.18;                   // faint light-catching edge

  // ---- caustics on top (light moves over the black lines) ----
  vec2 cuv = vec2(p.x, p.y + travel);
  float c = caustics(cuv, uTime);
  float c2 = caustics(cuv * 1.06 + vec2(3.1, 1.7), uTime * 1.2 + 4.0); // overlapping web
  c = max(c, c2 * 0.85);
  vec3 caustic = mix(uCaustic, uCausticHot, smoothstep(0.4, 1.0, c));
  col += caustic * c * 1.05 * (1.0 - black * 0.7);

  gl_FragColor = vec4(col, 1.0);
}
