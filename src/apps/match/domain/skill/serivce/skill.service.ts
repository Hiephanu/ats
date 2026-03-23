import { prisma } from "@/libs/prisma";

export const expandSkill = async (skillId: string) => {
  const relations =  await getRelatedSkills(skillId);

  return relations.map(r => r.toSkill);
}

export const getRelatedSkills = (skillId: string) => {
  return prisma.skillRelation.findMany({
    where: {
      fromSkillId: skillId,
      type: {
        in: ["RELATED", "ESSENTIAL"]
      }
    },
    include: {
      toSkill: true
    }
  })
}

export async function getFullSkillPath(skillId: string) {
  const results = await prisma.$queryRaw`
    WITH RECURSIVE SkillPath AS (
        -- Gốc: Kỹ năng bắt đầu
        SELECT id, canonical_name, 1 as level
        FROM skill
        WHERE id = ${skillId}

        UNION ALL

        -- Đệ quy: Tìm các to_skill_id có quan hệ 'PARENT'
        SELECT s.id, s.canonical_name, sp.level + 1
        FROM skill s
        INNER JOIN skill_relation sr ON s.id = sr.to_skill_id
        INNER JOIN SkillPath sp ON sr.from_skill_id = sp.id
        WHERE sr.type = 'PARENT' AND sp.level < 10 -- Giới hạn 10 cấp để tránh vòng lặp vô tận
    )
    SELECT DISTINCT * FROM SkillPath ORDER BY level ASC;
  `;
  return results;
}