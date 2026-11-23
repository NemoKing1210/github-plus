import { avatarUrlFor } from './surfaces.js';

export const AVATAR_CLASS = 'gp-list-avatar';

/**
 * The list avatar is decorative: the login follows it, so it carries an empty
 * alt and stays out of the accessibility tree. A missing avatar route (a
 * GitHub App, a deleted account) removes the node instead of leaving a broken
 * image in GitHub's metadata line.
 */
export function renderAvatar(login) {
  const image = document.createElement('img');
  image.className = AVATAR_CLASS;
  image.src = avatarUrlFor(login);
  image.dataset.gpAvatar = login;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.width = 16;
  image.height = 16;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => image.remove());
  return image;
}

/** Place one avatar before the author control; idempotent for repeated scans. */
export function placeAvatar(author, login) {
  const previous = author.previousElementSibling;
  if (previous && previous.classList.contains(AVATAR_CLASS)) {
    if (previous.dataset.gpAvatar !== login) {
      previous.dataset.gpAvatar = login;
      previous.src = avatarUrlFor(login);
    }
    return previous;
  }
  const image = renderAvatar(login);
  author.parentNode?.insertBefore(image, author);
  return image;
}

/** Remove every injected avatar under `root`. */
export function clearAvatars(root) {
  const images = root.querySelectorAll(`.${AVATAR_CLASS}`);
  for (let i = 0; i < images.length; i += 1) images[i].remove();
}
