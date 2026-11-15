/**
 * File sizes in the units GitHub itself prints: binary divisors labelled
 * KB/MB, with three significant digits ("2.86 KB", "45.6 KB", "1.5 MB").
 */

const UNITS = ['KB', 'MB', 'GB', 'TB'];

/** Drop the decimal part when it is only zeros ("1.00" -> "1"). */
function trimZeros(value) {
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

/**
 * Human-readable size for a byte count, or '' when it is not a number.
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  const value = bytes;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
  if (value < 1024) return `${Math.round(value)} B`;
  let scaled = value / 1024;
  let unit = 0;
  while (scaled >= 1024 && unit < UNITS.length - 1) {
    scaled /= 1024;
    unit += 1;
  }
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return `${trimZeros(scaled.toFixed(digits))} ${UNITS[unit]}`;
}
