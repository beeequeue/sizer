#!/usr/bin/env node

import { format } from "bytes"
import Sade from "sade"
import { globSync } from "tinyglobby"

import { getCompressedFileSizes } from "./compress.js"
import { printRows, sortingFunctions } from "./utils.js"

export type Options = {
  sort: "name-asc" | "name-desc" | "size-asc" | "size-desc"
  ignore?: string
  brotli?: boolean
  zstd?: boolean
  json?: boolean
}

const program = Sade("sizer <glob>", true)

void (async () => {
  program
    .version(PKG_VERSION)
    .describe("🔢 A tiny CLI for checking file sizes with compression")
    .example("dist/**/*.js")
    .option(
      "-s, --sort",
      "Change how files are sorted in the output. One of size-asc, size-desc, name-asc, name-desc",
      "size-desc",
    )
    .option("-i, --ignore", "Glob of files to exclude from output")
    .option("-G, --gzip", "Compress using gzip (lvl 9) (default)")
    .option("-B, --brotli", "Compress using Brotli (slow!)")
    .option("-Z, --zstd", "Compress using Zstandard (lvl 19)")
    .option("--json", "Output in JSON format")
    .action(async (fileGlob: string, { sort, ignore, brotli, zstd, json }: Options) => {
      const filePaths = globSync(fileGlob.replace(/\\/g, "/"), {
        onlyFiles: true,
        expandDirectories: false,
        ignore: ignore != null ? [ignore] : undefined,
      })

      let entries = await getCompressedFileSizes(
        filePaths,
        zstd ? "zstd" : brotli ? "brotli" : "gzip",
      )

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
        ["Path", "Size", zstd ? "zstd" : brotli ? "brotli" : "gzip", "Diff%"],
        ["----", "----", "----", "-----"],
        ...entries.map(({ filePath, original, compressed, difference }) => [
          filePath,
          format(original)!,
          format(compressed)!,
          `${((difference / original) * 100).toFixed(0)}%`,
        ]),
        ["-----", "------", "------", "----"],
        [
          "Total",
          format(totals.original)!,
          format(totals.compressed)!,
          `${((totals.difference / totals.original) * 100).toFixed(0)}%`,
        ],
      ])
    })

  program.parse(process.argv)
})()
