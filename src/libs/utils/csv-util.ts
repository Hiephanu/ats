import fs from "fs"
import { parse } from "csv-parse"

export const streamCsv = async (
  filePath: string,
  onRow: (row: any) => Promise<void>
) => {
  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const stream = fs.createReadStream(filePath)

    stream
      .pipe(parser)
      .on("data", async (row) => {
        stream.pause()
        await onRow(row)
        stream.resume()
      })
      .on("end", resolve)
      .on("error", reject)
  })
}