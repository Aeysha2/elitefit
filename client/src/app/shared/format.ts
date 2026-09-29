/** « 2026-10-04 » ou « 2026-10-04 10:00:00 » → « 04/10/2026 » */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
