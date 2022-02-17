import { defineConfig } from "tsup"

export default defineConfig({
  entryPoints: ["src/index.ts"],

  platform: "node",
  target: "node14",
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
})
