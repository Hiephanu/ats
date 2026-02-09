export type CvMetadata = {
  originalName: string;
  filePath: string;
  extractedTextLength: number;
  pages: number;
  extractedAt: string;
};

export async function saveCvMetadata(metadata: CvMetadata) {
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dataDir = join(process.cwd(), "data");
  const dataFile = join(dataDir, "cv-metadata.json");

  await mkdir(dataDir, { recursive: true });

  let existing: CvMetadata[] = [];
  try {
    const contents = await readFile(dataFile, "utf-8");
    existing = JSON.parse(contents) as CvMetadata[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  existing.push(metadata);
  await writeFile(dataFile, JSON.stringify(existing, null, 2));
}
