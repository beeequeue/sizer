import { defineConfig } from "tsup"
import pkgJson from "./package.json"

export default defineConfig({
  entryPoints: ["src/cli.ts"],

  define: {
    PKG_VERSION: JSON.stringify(pkgJson.version),
  },

  platform: "node",
  target: "node14",
  format: ["cjs"],
  clean: true,
  minify: true,
  sourcemap: true,
})
