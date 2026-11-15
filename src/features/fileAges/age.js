/**
 * Commit-age buckets for the file-ages feature: 1 is the oldest band, 10 the
 * newest, and 0 means the timestamp could not be read.
 *
 * The bands are narrow near the present and widen toward the past, so a
 * four-month-old file already reads as old while today's commit stays the
 * brightest point of the scale.
 */
import { AGE_BUCKET_COUNT } from '../../core/constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Upper bounds in days for every bucket above the oldest one. */
export const AGE_THRESHOLDS_DAYS = [3, 7, 14, 30, 60, 90, 120, 240, 548];

export function ageBucket(datetime, now = Date.now()) {
  const time = datetime instanceof Date
    ? datetime.getTime()
    : typeof datetime === 'number'
      ? datetime
      : Date.parse(datetime);
  if (!Number.isFinite(time)) return 0;
  const days = Math.max(0, (now - time) / DAY_MS);
  let bucket = AGE_BUCKET_COUNT;
  for (let index = 0; index < AGE_THRESHOLDS_DAYS.length; index += 1) {
    if (days <= AGE_THRESHOLDS_DAYS[index]) break;
    bucket -= 1;
  }
  return bucket;
}
