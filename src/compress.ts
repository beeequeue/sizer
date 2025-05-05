import { promises as fs } from "node:fs"
import { promisify } from "node:util"
import zlib from "node:zlib"

const compress = {
  gzip: promisify(zlib.gzip),
  brotli: promisify(zlib.brotliCompress),
  zstd: promisify(zlib.zstdCompress),
}

export type Result = {
  filePath: string
  original: number
  compressed: number
  difference: number
}

export const getCompressedFileSizes = async (
  filePaths: string[],
  compression: keyof typeof compress,
) => {
  return Promise.all(
    filePaths.map(async (filePath) => {
      const contents = await fs.readFile(filePath)

      let options: zlib.ZlibOptions | zlib.BrotliOptions | zlib.ZstdOptions | undefined
      switch (compression) {
        case "gzip":
          options = { level: 9 } satisfies zlib.ZlibOptions
          break
        case "zstd":
          options = {
            params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 },
          } satisfies zlib.ZstdOptions
          break
        case "brotli":
          break
      }

      const compressed = await compress[compression](contents, options)

      return {
        filePath,
        original: contents.length,
        compressed: compressed.byteLength,
        difference: compressed.byteLength - contents.length,
      } as Result
    }),
  )
}
