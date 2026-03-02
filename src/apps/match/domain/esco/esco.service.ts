import fs from 'fs';
import { parse } from 'csv-parse';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
// import { saveSkillWithAliases } from '../../data-access/skill.repository';

// Hàm helper chuẩn hóa chuỗi để làm key tìm kiếm (Where)
const normalize = (text: string) => text?.toLowerCase().trim() || "";

const escoTransformer = new Transform({
  objectMode: true,
  transform(row, encoding, callback) {
    try {
      // Chỉ lấy những skill đã được release và có nhãn
      if (row.status !== 'released' || !row.preferredLabel) {
        return callback();
      }

      const rawCanonical = row.preferredLabel.trim();
      
      const skillData = {
        id: row.conceptUri?.split('/').pop(), // Lấy UUID cuối cùng của URI
        sourceId: row.conceptUri,
        canonical: rawCanonical,
        normalizedCanonical: normalize(rawCanonical), // Cực kỳ quan trọng để Prisma 'Where'
        description: row.description || "",
        skillType: row.skillType || "skill",
        reuseLevel: row.reuseLevel || "",
        // Xử lý Aliases từ cột altLabels (thường cách nhau bởi dấu | hoặc \n)
        aliases: row.altLabels ? row.altLabels.split('\n').map((a: string) => ({
          raw: a.trim(),
          normalized: normalize(a),
          type: 'ALTERNATIVE'
        })) : []
      };

      callback(null, skillData);
    } catch (err) {
      callback(err);
    }
  }
});

export const importEscoSkills = async (filePath: string) => {
  const parser = parse({
    columns: true, // Tự động lấy header của CSV làm key cho Object
    relax_quotes: true,
    skip_empty_lines: true
  });

  try {
    console.log('⏳ Đang bắt đầu import...');
    await pipeline(
      fs.createReadStream(filePath),
      parser,
      escoTransformer,
      async function* (source) {
        for await (const chunk of source) {
          // Mỗi chunk lúc này đã là 1 object đầy đủ field
          // await saveSkillWithAliases(chunk);
          console.log(`✅ Đã nạp: ${chunk.canonical}`);
        }
      }
    );
    console.log('🚀 Tất cả đã xong, Postgres đã thông nòng sạch sẽ!');
  } catch (error) {
    console.error('❌ Pipeline vấp cỏ:', error);
    throw error;
  }
};