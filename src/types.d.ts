declare const PKG_VERSION: string

declare module "postject" {
  import type Buffer from "node:buffer"

  export function inject(
    execPath: string,
    resourceName: "NODE_SEA_BLOB" | string,
    resource: Buffer | ArrayBuffer, // TODO: maybe buffer?
    options?: {
      /** @default __POSTJECT */
      machoSegmentName?: string
      /** @default false */
      overwrite?: boolean
      /** @default POSTJECT_SENTINEL_fce680ab2cc467b6e072b8b5df1996b2 */
      sentinelFuse?:
        | "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"
        | "POSTJECT_SENTINEL_fce680ab2cc467b6e072b8b5df1996b2"
        | string
    },
  ): Promise<void>
}
