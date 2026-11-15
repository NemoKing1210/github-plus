import { AGE_BUCKET_COUNT } from '../../core/constants.js';

const ACTIVE_CLASS = 'gp-age-date';

/**
 * Color the timestamp itself. The element already displays GitHub's relative
 * date, so the feature only adds its own class and leaves the markup and text
 * in place; `app.css` styles that class and nothing GitHub owns.
 */
export function paintAge(time, bucket) {
  time.classList.add(ACTIVE_CLASS, `gp-age--${bucket}`);
}

/** Remove the age classes from every timestamp the feature colored. */
export function clearAges() {
  const times = document.querySelectorAll(`.${ACTIVE_CLASS}`);
  for (let index = 0; index < times.length; index += 1) {
    times[index].classList.remove(ACTIVE_CLASS);
    for (let bucket = 1; bucket <= AGE_BUCKET_COUNT; bucket += 1) {
      times[index].classList.remove(`gp-age--${bucket}`);
    }
  }
}
