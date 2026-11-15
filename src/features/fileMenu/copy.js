/**
 * Whether a file's bytes are worth putting on the clipboard as text.
 *
 * The raw route answers with the server's own type; a binary type wins over a
 * textual-looking extension. When no type is sent, the extension decides.
 */
const TEXT_TYPES = /^(text\/|application\/(json|xml|javascript|ecmascript|x-javascript|x-httpd-php|x-sh|x-yaml|yaml|sql)|image\/svg\+xml)/i;

const TEXT_EXTENSIONS = /\.(txt|text|md|markdown|mdx|json|jsonc|json5|ya?ml|toml|ini|cfg|conf|csv|tsv|log|xml|svg|html?|css|scss|sass|less|styl|js|jsx|mjs|cjs|ts|tsx|mts|cts|vue|svelte|astro|py|rb|go|rs|java|kt|kts|swift|c|h|cc|cpp|cxx|hpp|cs|php|sh|bash|zsh|fish|ps1|bat|sql|graphql|gql|lock|env|properties|gradle|cmake|dockerfile|makefile|gitignore|gitattributes|editorconfig)$/i;

const BARE_NAMES = /^(dockerfile|makefile|gnumakefile|readme|license|licence|notice|authors|contributors|changelog|codeowners|procfile|gemfile|rakefile|brewfile|vagrantfile|jenkinsfile)$/i;

/**
 * @param {string} contentType the response's `Content-Type`, possibly empty
 * @param {string} name the file's name or path
 * @returns {boolean}
 */
export function isCopyableContent(contentType, name) {
  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  if (type) return TEXT_TYPES.test(type);
  const base = (name || '').slice((name || '').lastIndexOf('/') + 1);
  if (BARE_NAMES.test(base)) return true;
  return TEXT_EXTENSIONS.test(base);
}
