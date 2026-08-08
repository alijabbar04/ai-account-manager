/** Human runway phrasing, matching the brief's example sentences. */
export function runwayText(nickname: string, days: number): string {
  const d = Math.floor(days);
  if (d <= 0) return `Your ${nickname} credits are effectively exhausted at the current burn rate.`;
  return `Your ${nickname} credits are projected to last ${d} day${d === 1 ? "" : "s"} at the current burn rate.`;
}
