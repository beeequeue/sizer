/* eslint-disable @typescript-eslint/naming-convention */

import type { Options } from "./cli"
import type { Result } from "./compress"

export const printRows = <Tuple extends ReadonlyArray<string>>(rows: Array<Tuple>) => {
  const maxColWidths = rows.reduce((accum, row) => {
    for (const [i, column] of row.entries()) {
      const width = column.length
      if (accum[i] >= width) continue

      accum[i] = width
    }

    return accum
  }, [] as number[])

  const output = rows
    .reduce(
      (accum, row) =>
        `${accum}\n${row
          .map((column, i) => column.padEnd(maxColWidths[i] + 2, " "))
          .join("")}`,
      "",
    )
    .replace(/(^\n|\n$)/g, "")

  console.log(output)
}

export const sortingFunctions: Record<
  NonNullable<Options["sort"]>,
  (a: Result, b: Result) => number
> = {
  "name-asc": (a, b) => a.filePath.localeCompare(b.filePath),
  "name-desc": (a, b) => a.filePath.localeCompare(b.filePath) * -1,
  "size-asc": (a, b) => a.original - b.original,
  "size-desc": (a, b) => b.original - a.original,
}
