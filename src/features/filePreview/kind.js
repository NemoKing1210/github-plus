/**
 * What a file is, decided from its name first and its served content type
 * only when the name says nothing. GitHub serves markdown through the raw
 * route as `text/plain`, so a generic textual type must never override an
 * extension that is more specific.
 */

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdown', 'mkdn', 'mkd']);

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'apng',
  'bmp',
  'ico',
  'svg',
]);

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv']);

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac']);

/** Extension → highlight.js language id; every key is also a code extension. */
const LANGUAGES = new Map([
  ['js', 'javascript'],
  ['mjs', 'javascript'],
  ['cjs', 'javascript'],
  ['jsx', 'javascript'],
  ['ts', 'typescript'],
  ['mts', 'typescript'],
  ['cts', 'typescript'],
  ['tsx', 'typescript'],
  ['json', 'json'],
  ['jsonc', 'json'],
  ['json5', 'json'],
  ['html', 'xml'],
  ['htm', 'xml'],
  ['xml', 'xml'],
  ['xsl', 'xml'],
  ['xsd', 'xml'],
  ['svg', 'xml'],
  ['plist', 'xml'],
  ['mdx', 'markdown'],
  ['css', 'css'],
  ['scss', 'scss'],
  ['sass', 'scss'],
  ['less', 'less'],
  ['yml', 'yaml'],
  ['yaml', 'yaml'],
  ['toml', 'ini'],
  ['ini', 'ini'],
  ['cfg', 'ini'],
  ['conf', 'ini'],
  ['properties', 'properties'],
  ['sh', 'bash'],
  ['bash', 'bash'],
  ['zsh', 'bash'],
  ['fish', 'bash'],
  ['ps1', 'powershell'],
  ['psm1', 'powershell'],
  ['psd1', 'powershell'],
  ['bat', 'dos'],
  ['cmd', 'dos'],
  ['py', 'python'],
  ['pyw', 'python'],
  ['rb', 'ruby'],
  ['gemspec', 'ruby'],
  ['rake', 'ruby'],
  ['gemfile', 'ruby'],
  ['rakefile', 'ruby'],
  ['php', 'php'],
  ['java', 'java'],
  ['kt', 'kotlin'],
  ['kts', 'kotlin'],
  ['swift', 'swift'],
  ['go', 'go'],
  ['rs', 'rust'],
  ['c', 'c'],
  ['h', 'c'],
  ['cc', 'cpp'],
  ['cpp', 'cpp'],
  ['cxx', 'cpp'],
  ['hpp', 'cpp'],
  ['hh', 'cpp'],
  ['hxx', 'cpp'],
  ['cs', 'csharp'],
  ['m', 'objectivec'],
  ['mm', 'objectivec'],
  ['sql', 'sql'],
  ['graphql', 'graphql'],
  ['gql', 'graphql'],
  ['lua', 'lua'],
  ['pl', 'perl'],
  ['pm', 'perl'],
  ['r', 'r'],
  ['scala', 'scala'],
  ['dart', 'dart'],
  ['ex', 'elixir'],
  ['exs', 'elixir'],
  ['erl', 'erlang'],
  ['hrl', 'erlang'],
  ['hs', 'haskell'],
  ['clj', 'clojure'],
  ['cljs', 'clojure'],
  ['groovy', 'groovy'],
  ['gradle', 'groovy'],
  ['proto', 'protobuf'],
  ['diff', 'diff'],
  ['patch', 'diff'],
  ['dockerfile', 'dockerfile'],
  ['makefile', 'makefile'],
  ['mk', 'makefile'],
  ['cmake', 'cmake'],
  ['txt', 'plaintext'],
  ['log', 'plaintext'],
  ['csv', 'plaintext'],
  ['tsv', 'plaintext'],
  ['env', 'plaintext'],
  ['lock', 'plaintext'],
  ['vim', 'vim'],
  ['wasm', 'wasm'],
  ['http', 'http'],
  ['nginx', 'nginx'],
]);

/** Extensionless names that are text even though nothing about them says so. */
const CODE_NAMES = new Map([
  ['dockerfile', 'dockerfile'],
  ['makefile', 'makefile'],
  ['gnumakefile', 'makefile'],
  ['readme', 'plaintext'],
  ['license', 'plaintext'],
  ['licence', 'plaintext'],
  ['notice', 'plaintext'],
  ['authors', 'plaintext'],
  ['contributors', 'plaintext'],
  ['changelog', 'plaintext'],
  ['codeowners', 'plaintext'],
  ['procfile', 'plaintext'],
  ['gemfile', 'ruby'],
  ['rakefile', 'ruby'],
  ['vagrantfile', 'ruby'],
  ['jenkinsfile', 'groovy'],
]);

function baseName(name) {
  return String(name || '').slice(String(name || '').lastIndexOf('/') + 1);
}

function extension(name) {
  const file = baseName(name);
  const dot = file.lastIndexOf('.');
  return dot < 0 ? '' : file.slice(dot + 1).toLowerCase();
}

function languageOf(name) {
  return LANGUAGES.get(extension(name)) || CODE_NAMES.get(baseName(name).toLowerCase()) || '';
}

function isTextualType(type) {
  return (
    type.startsWith('text/') ||
    type.endsWith('+json') ||
    type.endsWith('+xml') ||
    type === 'application/json' ||
    type === 'application/xml' ||
    type === 'application/yaml' ||
    type === 'application/x-yaml' ||
    type === 'application/toml' ||
    type === 'application/javascript' ||
    type === 'application/x-javascript' ||
    type === 'application/ecmascript' ||
    type === 'application/x-sh' ||
    type === 'application/x-shellscript' ||
    type === 'application/x-httpd-php' ||
    type === 'application/sql' ||
    type === 'application/graphql'
  );
}

function kindFromContentType(contentType) {
  const type = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (isTextualType(type)) return 'code';
  return 'binary';
}

/**
 * The surface a file opens in: rendered markdown, highlighted code, inline
 * media, an embedded PDF or the generic binary card.
 * @param {string} name
 * @param {string} [contentType]
 * @returns {'markdown'|'code'|'image'|'pdf'|'video'|'audio'|'binary'}
 */
export function previewKind(name, contentType = '') {
  const ext = extension(name);
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (languageOf(name)) return 'code';
  return kindFromContentType(contentType);
}

/**
 * highlight.js language id for a file name, '' when it is not highlighted.
 * @param {string} name
 * @returns {string}
 */
export function highlightLanguage(name) {
  return languageOf(name);
}

/**
 * Visual line count, treating a trailing newline as ending the last line
 * rather than starting an empty one.
 * @param {string} text
 * @returns {number}
 */
export function countLines(text) {
  if (!text) return 0;
  let lines = 1;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) lines += 1;
  }
  return text.endsWith('\n') ? lines - 1 : lines;
}
