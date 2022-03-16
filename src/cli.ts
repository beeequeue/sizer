import { format } from "bytes"
import { program } from "commander"
import glob from "fast-glob"

import { getCompressedFileSizes } from "./compress"
import { printRows } from "./utils"

type Options = {
  brotli?: boolean
  json?: boolean
}

void (async () => {
  const command = program
    .name("sizer")
    .version(`sizer v${PKG_VERSION}`)
    .argument("<glob>", "File path glob to analyze")
    .option("-B, --brotli", "Compress using Brotli (slow!)")
    .option("--json", "Output in JSON format")
    .action(async (fileGlob: string, { brotli, json }: Options) => {
      const filePaths = await glob(fileGlob, { onlyFiles: true, unique: true })

      const entries = await getCompressedFileSizes(filePaths, brotli)

      if (json) {
        console.log(JSON.stringify(entries, null, 2))
        return
      }

      printRows([
        ["Path", "Size", brotli ? "Brotli" : "Gzip", "Diff%"],
        ...entries.map(({ filePath, original, compressed, difference }) => [
          filePath,
          format(original),
          format(compressed),
          `${((difference / original) * 100).toFixed(0)}%`,
        ]),
      ])
    })
    .showSuggestionAfterError()
    .exitOverride()

  await command.parseAsync(process.argv).catch(() => null)
})()
