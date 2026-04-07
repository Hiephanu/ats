import fs from "fs"
import { parse, Parser } from "csv-parse"

export const streamCsv = async (
  filePath: string,
  onRow: (row: Record<string, string>) => Promise<void>
) => {
  return new Promise((resolve, reject) => {
    const parser: Parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    })

    const stream = fs.createReadStream(filePath)

    stream
      .pipe(parser)
      .on("data", async (row: Record<string, string>) => {
        stream.pause()
        await onRow(row)
        stream.resume()
      })
      .on("end", resolve)
      .on("error", reject)
  })
}