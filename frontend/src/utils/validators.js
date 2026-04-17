export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}