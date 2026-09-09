export function normalizePersonName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function namesMatch(comedianName: string, candidate: string) {
  const comedian = normalizePersonName(comedianName);
  const other = normalizePersonName(candidate);
  if (!comedian || !other) return false;
  if (comedian === other) return true;
  if (other.startsWith(`${comedian} `) || other.includes(` ${comedian} `)) {
    return true;
  }
  const comedianParts = comedian.split(" ");
  const otherParts = other.split(" ");
  if (comedianParts.length >= 2) {
    const first = comedianParts[0];
    const last = comedianParts[comedianParts.length - 1];
    if (otherParts.includes(first) && otherParts.includes(last)) return true;
  }
  return false;
}
