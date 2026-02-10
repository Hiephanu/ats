import fs from 'fs';
import { parse } from 'csv-parse';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

const escoTransformer = new Transform({
  objectMode: true,
  transform(row, encoding, callback) {
    try {
      if (row.status !== 'released' || !row.preferredLabel) {
        return callback();
      }

      const rawCanonical = row.preferredLabel.trim();
      const skillData = {
        id: row.conceptUri?.split('/').pop(),
        canonical: rawCanonical
      };

      callback(null, skillData);
    } catch (err) {
      callback(err);
    }
  }
});

export const importEscoSkills = async (filePath, dbRepository) => {
  const parser = parse({
    columns: true,
    relax_quotes: true,
    skip_empty_lines: true
  });

  try {
    await pipeline(
      fs.createReadStream(filePath),
      parser,
      escoTransformer,
      async function* (source) {
        for await (const chunk of source) {
          await dbRepository.saveSkill(chunk); 
        }
      }
    );
    console.log('✅ Import hoàn tất sạch sẽ!');
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
};