import {
  PREVIEW_CACHE_ENTRIES,
  PREVIEW_PDF_MAX_BYTES,
  PREVIEW_TEXT_MAX_BYTES,
} from '../../core/constants.js';
import { Codes, logError } from '../../core/debug.js';
import { el } from '../../utils/dom.js';
import { formatSize } from '../../utils/size.js';
import { renderBinaryCard, renderEmptyCard, renderFailureCard, renderTooLargeCard } from './cards.js';
import { renderCode } from './code.js';
import { countLines, highlightLanguage, previewKind } from './kind.js';
import { renderMarkdown } from './markdown.js';

const FILE_PATH = /^\/([^/]+)\/([^/]+)\/(?:blob|blame|raw)\/(.+)$/;

/** Rendered results survive while the user browses the same file again. */
const cache = new Map();
/** HEAD answers are stable for the session, so one probe per raw address. */
const headCache = new Map();

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function directoryOf(relative) {
  const slash = relative.lastIndexOf('/');
  return slash < 0 ? '' : relative.slice(0, slash);
}

/** Repository coordinates for relative link rewriting, null when unknown. */
function resolvePreviewContext(file) {
  let pathname;
  try {
    pathname = new URL(file.href || file.rawUrl, location.href).pathname;
  } catch {
    return null;
  }
  const match = FILE_PATH.exec(pathname);
  if (!match) return null;
  const tail = match[3];
  const encoded = encodePath(file.relative || '');
  if (!encoded || !tail.endsWith(encoded)) return null;
  const ref = tail.slice(0, tail.length - encoded.length).replace(/\/$/, '');
  if (!ref) return null;
  return {
    owner: safeDecode(match[1]),
    repo: safeDecode(match[2]),
    ref: safeDecode(ref),
    dir: directoryOf(file.relative || ''),
  };
}

function sizeError(limit) {
  return Object.assign(new Error('Preview size limit exceeded'), { tooLarge: true, limit });
}

function remember(key, result) {
  if (result.dispose) return result;
  cache.set(key, result);
  while (cache.size > PREVIEW_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  return result;
}

async function fetchText(file, signal) {
  const response = await fetch(file.rawUrl, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > PREVIEW_TEXT_MAX_BYTES) {
    throw sizeError(PREVIEW_TEXT_MAX_BYTES);
  }
  const blob = await response.blob();
  if (blob.size > PREVIEW_TEXT_MAX_BYTES) throw sizeError(PREVIEW_TEXT_MAX_BYTES);
  return { text: await blob.text(), size: blob.size };
}

async function fetchBlob(file, signal) {
  const response = await fetch(file.rawUrl, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > PREVIEW_PDF_MAX_BYTES) {
    throw sizeError(PREVIEW_PDF_MAX_BYTES);
  }
  const blob = await response.blob();
  if (blob.size > PREVIEW_PDF_MAX_BYTES) throw sizeError(PREVIEW_PDF_MAX_BYTES);
  return { blob, size: blob.size };
}

/** Content type and length from one session-cached HEAD; unknown on failure. */
async function headInfo(rawUrl, signal) {
  if (headCache.has(rawUrl)) return headCache.get(rawUrl);
  const info = { type: '', size: null };
  try {
    const response = await fetch(rawUrl, {
      method: 'HEAD',
      credentials: 'same-origin',
      signal,
    });
    if (response.ok) {
      info.type = response.headers.get('content-type') || '';
      const length = Number(response.headers.get('content-length'));
      info.size = Number.isFinite(length) && length >= 0 ? length : null;
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
  }
  headCache.set(rawUrl, info);
  return info;
}

function imageResult(file) {
  const image = el('img', 'gp-preview__image');
  image.src = file.rawUrl;
  image.alt = file.name;
  return { node: image };
}

function mediaResult(file, kind) {
  const node = el(kind === 'video' ? 'video' : 'audio', 'gp-preview__media');
  node.controls = true;
  node.preload = 'metadata';
  node.src = file.rawUrl;
  if (kind === 'video') node.playsInline = true;
  return {
    node,
    dispose() {
      node.pause();
      node.removeAttribute('src');
      node.load();
    },
  };
}

async function pdfResult(file, signal) {
  const { blob, size } = await fetchBlob(file, signal);
  if (size === 0) return { node: renderEmptyCard(), meta: { size: 0 } };
  const url = URL.createObjectURL(blob);
  const frame = el('iframe', 'gp-preview__pdf');
  frame.title = file.name;
  frame.src = url;
  return {
    node: frame,
    meta: { size },
    dispose() {
      URL.revokeObjectURL(url);
    },
  };
}

function binaryResult(file, size) {
  if (size === 0) return { node: renderEmptyCard(), meta: { size: 0 } };
  return {
    node: renderBinaryCard({ ...file, size: formatSize(size) }),
    meta: { size },
  };
}

async function textResult(file, kind, mode, signal) {
  const { text, size } = await fetchText(file, signal);
  if (size === 0) return { node: renderEmptyCard(), meta: { size: 0 } };
  const meta = { size, lines: countLines(text) };
  if (kind === 'markdown' && mode === 'preview') {
    const context = resolvePreviewContext(file) || { owner: '', repo: '', ref: '', dir: '' };
    const node = await renderMarkdown(text, {
      name: file.name,
      relative: file.relative,
      owner: context.owner,
      repo: context.repo,
      ref: context.ref,
    });
    return { node, meta, copyText: text, sourceMode: true };
  }
  const language = kind === 'markdown' ? 'markdown' : highlightLanguage(file.name);
  const node = renderCode(text, language);
  return kind === 'markdown'
    ? { node, meta, copyText: text, sourceMode: true }
    : { node, meta, copyText: text };
}

/**
 * Render one file for the preview modal. Failures come back as a card;
 * only an abort (the user moved on) is rethrown for the shell to ignore.
 * @param {{name: string, href: string, rawUrl: string, relative: string}} file
 * @param {{mode?: 'preview'|'source', signal?: AbortSignal}} [options]
 * @returns {Promise<{node: HTMLElement, meta?: {size?: number, lines?: number},
 *   copyText?: string, sourceMode?: boolean, dispose?: () => void}>}
 */
export async function loadPreview(file, options = {}) {
  const mode = options.mode === 'source' ? 'source' : 'preview';
  const key = `${file.rawUrl}::${mode}`;
  if (cache.has(key)) return cache.get(key);
  try {
    let kind = previewKind(file.name, '');
    let info = null;
    if (kind === 'binary') {
      info = await headInfo(file.rawUrl, options.signal);
      kind = previewKind(file.name, info.type);
    }
    if (kind === 'image') return remember(key, imageResult(file));
    if (kind === 'video' || kind === 'audio') return mediaResult(file, kind);
    if (kind === 'pdf') return remember(key, await pdfResult(file, options.signal));
    if (kind === 'binary') return remember(key, binaryResult(file, info?.size));
    return remember(key, await textResult(file, kind, mode, options.signal));
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (error?.tooLarge) {
      return remember(key, { node: renderTooLargeCard({ ...file, limit: error.limit }) });
    }
    logError(Codes.FILE_PREVIEW, 'Failed to load a file preview', {
      rawUrl: file.rawUrl,
      error,
    });
    return remember(key, { node: renderFailureCard(file) });
  }
}
