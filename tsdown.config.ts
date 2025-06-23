import { defineConfig } from "tsdown"

import pkgJson from "./package.json" with { type: "json" }

export default defineConfig({
  entry: "src/cli.ts",
  outDir: "dist",
  exe: {
    enabled: true,
    seaConfig: { disableExperimentalSEAWarning: true, execArgvExtension: "cli" },
  },

  define: {
    PKG_VERSION: JSON.stringify(pkgJson.version),
  },

  platform: "node",
  format: "esm",
  minify: "dce-only",
  fixedExtension: true,
}) as never
