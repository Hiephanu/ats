import { prisma } from "../../../libs/prisma";


// skill.repository.ts
export const saveSkillWithAliases = async (skillData) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Lưu Skill (Gốc)
      const skill = await tx.skill.upsert({
        where: { normalizedCanonical: skillData.normalizedCanonical },
        update: {
          description: skillData.description,
          // Cập nhật các trường khác nếu cần
        },
        create: {
          id: skillData.id,
          sourceId: skillData.sourceId,
          canonical: skillData.canonical,
          normalizedCanonical: skillData.normalizedCanonical,
          skillType: skillData.skillType,
          reuseLevel: skillData.reuseLevel,
          description: skillData.description,
        },
      });
  
      // 2. Lưu Aliases hàng loạt (dùng createMany để nhanh hơn)
      if (skillData.aliases?.length > 0) {
        // Xóa alias cũ hoặc dùng logic để chỉ thêm cái mới
        // Để đơn giản và chính xác, ta có thể lọc các alias chưa tồn tại
        const aliasData = skillData.aliases.map(a => ({
          skillId: skill.id,
          raw: a.raw,
          normalized: a.normalized,
          type: a.type
        }));
  
        // Prisma 7/Postgres hỗ trợ bỏ qua nếu trùng
        await tx.skillAlias.createMany({
          data: aliasData,
          skipDuplicates: true,
        });
      }
  
      return skill;
    });
  };