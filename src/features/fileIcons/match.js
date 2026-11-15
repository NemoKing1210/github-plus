import {
  DEFAULT_FILE,
  DEFAULT_FOLDER,
  EXTENSIONS,
  FILE_NAMES,
  FOLDER_NAMES,
} from './iconSet.generated.js';

/** Lower-cased lookup index; the manifest stores names in mixed case. */
function index(table) {
  const out = {};
  for (const key of Object.keys(table)) {
    const lower = key.toLowerCase();
    if (!(lower in out)) out[lower] = table[key];
  }
  return out;
}

const FILES = index(FILE_NAMES);
const FOLDERS = index(FOLDER_NAMES);
const EXT = index(EXTENSIONS);

/** Every extension suffix of a filename, longest first (`a.spec.ts` → `spec.ts`, `ts`). */
function extensionCandidates(name) {
  const candidates = [];
  let dot = name.indexOf('.');
  while (dot !== -1 && dot < name.length - 1) {
    candidates.push(name.slice(dot + 1));
    dot = name.indexOf('.', dot + 1);
  }
  return candidates;
}

/**
 * Icon id for a file or folder name. Pure: no DOM, no i18n, no side effects.
 * Unknown names resolve to the generic file/folder icon.
 */
export function pickIcon(name, kind = 'file', { folders = true, specialNames = true } = {}) {
  const key = String(name ?? '').trim().toLowerCase();
  if (!key) return kind === 'folder' ? DEFAULT_FOLDER : DEFAULT_FILE;
  if (kind === 'folder') return folders ? FOLDERS[key] || DEFAULT_FOLDER : DEFAULT_FOLDER;
  if (specialNames && FILES[key]) return FILES[key];
  const candidates = extensionCandidates(key);
  for (let i = 0; i < candidates.length; i += 1) {
    if (EXT[candidates[i]]) return EXT[candidates[i]];
  }
  return DEFAULT_FILE;
}
