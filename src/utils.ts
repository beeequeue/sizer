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
          .map((column, i) => column.padEnd(maxColWidths[i] + 1, " "))
          .join("")}`,
      "",
    )
    .replace(/(^\n|\n$)/g, "")

  console.log(output)
}
