export function normalizeSkill(raw: string): string {
  let text = raw.toLowerCase().trim()
  text = text.replace(/[^a-z0-9+#]/g, "")
  return text
}