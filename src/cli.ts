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

      const totals = entries.reduce(
        (accum, { original, compressed, difference }) => {
          accum.original += original
          accum.compressed += compressed
          accum.difference += difference

          return accum
        },
        { original: 0, compressed: 0, difference: 0 },
      )

      printRows([
        ["Path", "Size", brotli ? "Brotli" : "Gzip", "Diff%"],
        ["----", "----", "----", "-----"],
        ...entries.map(({ filePath, original, compressed, difference }) => [
          filePath,
          format(original),
          format(compressed),
          `${((difference / original) * 100).toFixed(0)}%`,
        ]),
        ["-----", "------", "------", "----"],
        [
          "Total",
          format(totals.original),
          format(totals.compressed),
          `${((totals.difference / totals.original) * 100).toFixed(0)}%`,
        ],
      ])
    })
    .showSuggestionAfterError()
    .exitOverride()

  await command.parseAsync(process.argv).catch(() => null)
})()
