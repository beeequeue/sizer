import { promises as fs } from "fs"
import { promisify } from "util"
import { gzip as gzipCompress, brotliCompress } from "zlib"

import { format } from "bytes"
import glob from "fast-glob"
import minimist from "minimist"

const compress = {
  gzip: promisify(gzipCompress),
  brotli: promisify(brotliCompress),
}

const { _, brotli } = minimist(process.argv.slice(2), {
  boolean: "brotli",
  alias: { B: "brotli" },
})

void (async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const filePaths = await glob(_, { onlyFiles: true, unique: true })

  const entries = await Promise.all(
    filePaths.map(async (filePath) => {
      const contents = await fs.readFile(filePath)
      const compressed = await (brotli
        ? compress.brotli(contents)
        : compress.gzip(contents, { level: 9 }))

      return [filePath, [contents.length, compressed.byteLength]] as const
    }),
  )

  for (const [filePath, sizes] of entries) {
    console.log(`${filePath}: ${format(sizes[0])} / ${format(sizes[1])}`)
  }
})()
