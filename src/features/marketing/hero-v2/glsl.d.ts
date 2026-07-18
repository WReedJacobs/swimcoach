// Ambient module declarations for `.glsl` shader imports, kept inside the
// hero-v2 folder so deleting the folder removes them cleanly (tsconfig
// `include: ["src"]` still picks them up while present). vite-plugin-glsl
// resolves these imports to compiled shader strings at build time.
declare module '*.glsl' {
  const value: string
  export default value
}
