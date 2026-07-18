varying vec2 vUv;

// Fullscreen pass: the [2,2] plane spans clip space, so we output its vertex
// positions directly and ignore the camera — a flat, top-down look at the
// pool floor. All the look is done in the fragment shader.
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
