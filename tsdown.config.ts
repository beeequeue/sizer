import { defineConfig } from "tsdown"

import pkgJson from "./package.json" with { type: "json" }

export default defineConfig({
  entry: "src/cli.ts",
  outDir: "dist",

  define: {
    PKG_VERSION: JSON.stringify(pkgJson.version),
  },

  platform: "node",
  target: "node18",
  format: "esm",
  fixedExtension: true,

  minify: false,
})
