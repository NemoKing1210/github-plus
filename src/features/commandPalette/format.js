/** Presentation helpers shared by the palette shell and its details pane. */

/** Compact counts: plain below a thousand, one decimal above (`1.2k`, `12.3k`, `1.2M`). */
export function formatCount(value) {
  const number = Number(value) || 0;
  const magnitude = Math.abs(number);
  if (magnitude < 1000) return String(Math.round(number));
  const suffix = magnitude >= 1_000_000 ? 'M' : 'k';
  const scaled = magnitude >= 1_000_000 ? number / 1_000_000 : number / 1000;
  return `${scaled.toFixed(1).replace(/\.0$/, '')}${suffix}`;
}

/**
 * A localized "time ago" string. `Intl.RelativeTimeFormat` supplies the
 * wording, so every UI locale reads naturally without new translation keys.
 */
export function relativeTime(iso, { now = Date.now(), locale = 'en' } = {}) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return '';
  const diff = time - now;
  const magnitude = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });
  const units = [
    [60_000, 1000, 'second'],
    [3_600_000, 60_000, 'minute'],
    [86_400_000, 3_600_000, 'hour'],
    [2_592_000_000, 86_400_000, 'day'],
    [31_536_000_000, 2_592_000_000, 'month'],
    [Infinity, 31_536_000_000, 'year'],
  ];
  const [, divisor, unit] = units.find(([limit]) => magnitude < limit);
  return formatter.format(Math.round(diff / divisor), unit);
}
