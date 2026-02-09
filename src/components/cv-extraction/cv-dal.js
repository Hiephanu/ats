export async function saveCvMetadata(metadata) {
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dataDir = join(process.cwd(), "data");
  const dataFile = join(dataDir, "cv-metadata.json");

  await mkdir(dataDir, { recursive: true });

  let existing = [];
  try {
    const contents = await readFile(dataFile, "utf-8");
    existing = JSON.parse(contents);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  existing.push(metadata);
  await writeFile(dataFile, JSON.stringify(existing, null, 2));
}
