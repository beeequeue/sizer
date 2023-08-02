import { defineConfig } from "tsup"
import pkgJson from "./package.json"

export default defineConfig({
  entry: ["src/cli.ts"],

  define: {
    PKG_VERSION: JSON.stringify(pkgJson.version),
  },

  platform: "node",
  target: "node18",
  format: ["esm"],
  clean: true,
  minify: true,
  sourcemap: true,
})
