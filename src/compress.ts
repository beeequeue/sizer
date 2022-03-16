import { promises as fs } from "fs"
import { promisify } from "util"
import { brotliCompress, gzip as gzipCompress } from "zlib"

const compress = {
  gzip: promisify(gzipCompress),
  brotli: promisify(brotliCompress),
}

export type Result = {
  filePath: string
  original: number
  compressed: number
  difference: number
}

export const getCompressedFileSizes = async (filePaths: string[], brotli?: boolean) => {
  return await Promise.all(
    filePaths.map(async (filePath) => {
      const contents = await fs.readFile(filePath)
      const compressed = await (brotli
        ? compress.brotli(contents)
        : compress.gzip(contents, { level: 9 }))

      return {
        filePath,
        original: contents.length,
        compressed: compressed.byteLength,
        difference: compressed.byteLength - contents.length,
      } as Result
    }),
  )
}
