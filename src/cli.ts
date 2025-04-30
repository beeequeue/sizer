import { format } from "bytes"
import { Option, program } from "commander"
import { globSync } from "tinyglobby"

import { getCompressedFileSizes } from "./compress.js"
import { printRows, sortingFunctions } from "./utils.js"

export type Options = {
  sort: "name-asc" | "name-desc" | "size-asc" | "size-desc"
  ignore?: string
  brotli?: boolean
  json?: boolean
}

void (async () => {
  const command = program
    .name("sizer")
    .version(`sizer v${PKG_VERSION}`)
    .argument("<glob>", "File path glob to analyze")
    .addOption(
      new Option("-s, --sort <type>", "Change how files are sorted in the output")
        .choices(["size-asc", "size-desc", "name-asc", "name-desc"])
        .default("size-desc"),
    )
    .option("-i, --ignore <glob>", "Glob of files to exclude from output")
    .option("-B, --brotli", "Compress using Brotli (slow!)")
    .option("--json", "Output in JSON format")
    .action(async (fileGlob: string, { sort, ignore, brotli, json }: Options) => {
      const filePaths = globSync(fileGlob, {
        onlyFiles: true,
        expandDirectories: false,
        ignore: ignore != null ? [ignore] : undefined,
      })

      let entries = await getCompressedFileSizes(filePaths, brotli)

      entries = entries.sort(sortingFunctions[sort])

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
