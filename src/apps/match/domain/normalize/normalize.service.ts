export function normalizeSkill(raw: string): string {

  let text = raw.toLowerCase().trim()

  // bỏ mọi ký hiệu trừ chữ, số, +, #
  text = text.replace(/[^a-z0-9+#]/g, "")

  return text
}