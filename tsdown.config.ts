import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"

import { cache } from "empathic/package"
import { inject } from "postject"
import { x } from "tinyexec"
import { which } from "tinywhich"
import { defineConfig } from "tsdown"
import { createUnplugin } from "unplugin"

import pkgJson from "./package.json" with { type: "json" }

const cacheDir = path.relative(
  process.cwd(),
  cache("unplugin-node-sea", { create: true })!,
)
const configPath = path.join(cacheDir, "sea.json")
const blobPath = path.join(cacheDir, "sea.blob")

const cleanCacheDir = () => {
  fs.rmSync(cacheDir, { recursive: true, force: true })
  fs.mkdirSync(cacheDir, { recursive: true })
}

type SeaConfig = {
  main: string
  output: string
  disableExperimentalSEAWarning?: boolean
  useSnapshot?: boolean
  useCodeCache: boolean
  assets?: Record<string, string>
}

type Options = {
  name?: string
  codeCache?: boolean
  v8Snapshot?: boolean
}

const seaPlugin = createUnplugin<Options | undefined>(
  ({ name, codeCache = true, v8Snapshot = false } = {}) => {
    let execName =
      name ?? (pkgJson.name.includes("/") ? pkgJson.name.split("/")[1] : pkgJson.name)

    let platform = "unknown"
    if (process.platform === "win32") platform = "win"
    if (process.platform === "darwin") platform = "mac"
    if (process.platform === "linux") platform = "linux"
    execName += `-${process.arch}-${platform}`

    if (process.platform === "win32") {
      execName += ".exe"
    }
    const execPath = path.join(cacheDir, execName)

    let nodeExecPromise: Promise<void> | null = null

    return {
      name: "unplugin-node-sea",
      enforce: "post",

      buildStart: async () => {
        cleanCacheDir()

        const { promise, resolve } = Promise.withResolvers<void>()
        nodeExecPromise = promise

        await fsp.copyFile(process.execPath, execPath)

        // Remove exec signing
        if (process.platform === "win32" && which("signtool") != null) {
          await x("signtool", ["remove", "/s", execName], {
            nodeOptions: { cwd: path.resolve(cacheDir) },
          })
        }
        // todo: remove signing on more platforms

        resolve()
      },

      // todo: more bundlers

      rolldown: {
        outputOptions(options) {
          if (options.format !== "commonjs" && options.format !== "cjs") {
            this.error("Node SEA only supports CommonJS. Set `output.format` to `cjs`.")
          }

          if (codeCache) {
            if (options.inlineDynamicImports === false) {
              this.warn(
                "Node SEA only supports compile cache without `import()` statements. If your code has any, either disable `codeCache` or enable `output.inlineDynamicImports`.",
              )
            }

            options.inlineDynamicImports = true
          }

          return options
        },

        async writeBundle(_, output) {
          const outDir = (this as never as { outputOptions: { dir: string } })
            .outputOptions.dir
          let entryPoint: string | null = null
          const assets = new Map<string, string>()

          for (const file of Object.values(output)) {
            // TODO: check that no file contains `import()`

            if (file.type === "chunk" && file.isEntry) {
              entryPoint = path.join(outDir, file.fileName)
            } else {
              if (codeCache && file.type === "chunk" && file.isDynamicEntry) {
                // TODO: error
                this.warn(
                  `Found a dynamic chunk with codeCache enabled. This is not supported by Node.`,
                )
              }
              assets.set(file.fileName, path.join(outDir, file.fileName))
            }
          }
          if (entryPoint == null) throw new Error("No entry point found")

          const distExecDir = path.join(path.dirname(outDir), "dist-exec")

          fs.cpSync(entryPoint, path.join(cacheDir, path.basename(entryPoint)))

          // Create SEA config
          const config = {
            main: entryPoint,
            output: blobPath,
            // Only works without import()
            // https://nodejs.org/api/single-executable-applications.html#v8-code-cache-support
            useCodeCache: codeCache,
            // https://nodejs.org/api/single-executable-applications.html#startup-snapshot-support
            useSnapshot: v8Snapshot,
          } satisfies SeaConfig as SeaConfig
          if (assets.size !== 0) {
            config.assets = Object.fromEntries(assets)
            // TODO: test assets
          }

          this.debug(JSON.stringify(config, null, 2))
          fs.writeFileSync(configPath, JSON.stringify(config))

          // Generate SEA blob from config
          await x(process.execPath, ["--experimental-sea-config", configPath])
          const blob = fs.readFileSync(blobPath)

          // Copy Node executable
          await nodeExecPromise

          // Inject SEA blob into node exec
          await inject(execPath, "NODE_SEA_BLOB", blob, {
            sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
          })

          fs.mkdirSync(distExecDir, { recursive: true })
          fs.renameSync(execPath, path.join(distExecDir, execName))
          this.info(
            `Executable created at \`${path.relative(process.cwd(), path.join(distExecDir, execName))}\``,
          )

          cleanCacheDir()
        },
      },
    }
  },
)

export default defineConfig({
  entry: "src/cli.ts",
  outDir: "dist",

  define: {
    PKG_VERSION: JSON.stringify(pkgJson.version),
  },

  platform: "node",
  target: "node20",
  format: "cjs",
  minify: false,
  fixedExtension: true,

  plugins: [seaPlugin.rolldown()],
})
