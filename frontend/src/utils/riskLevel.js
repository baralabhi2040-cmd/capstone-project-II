export function getRiskBadgeClass(level) {
  const safeLevel = String(level || "").toUpperCase();

  if (safeLevel === "LOW") return "badge-success";
  if (safeLevel === "MEDIUM") return "badge-warning";
  if (safeLevel === "HIGH" || safeLevel === "CRITICAL") return "badge-danger";
  return "badge-neutral";
}