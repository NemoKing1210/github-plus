import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE =
  'https://raw.githubusercontent.com/NemoKing1210/github-plus/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2018',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'GitHub Plus',
          ru: 'GitHub Plus',
          'zh-CN': 'GitHub Plus',
          es: 'GitHub Plus',
          'pt-BR': 'GitHub Plus',
          de: 'GitHub Plus',
          fr: 'GitHub Plus',
          ja: 'GitHub Plus',
          ko: 'GitHub Plus',
          pl: 'GitHub Plus',
        },
        namespace: 'https://github.com/NemoKing1210/github-plus',
        version: pkg.version,
        description: {
          '': 'Improves GitHub functionality',
          ru: 'Улучшает функционал GitHub',
          'zh-CN': '改善 GitHub 的功能',
          es: 'Mejora la funcionalidad de GitHub',
          'pt-BR': 'Melhora a funcionalidade do GitHub',
          de: 'Verbessert die Funktionalität von GitHub',
          fr: 'Améliore les fonctionnalités de GitHub',
          ja: 'GitHub の機能を改善',
          ko: 'GitHub 기능 개선',
          pl: 'Poprawia funkcjonalność GitHub',
        },
        author: 'NemoKing1210',
        tag: ['github', 'gallery'],
        homepageURL: 'https://github.com/NemoKing1210/github-plus',
        supportURL: 'https://github.com/NemoKing1210/github-plus/issues',
        updateURL: `${RAW_BASE}/github-plus.user.js`,
        downloadURL: `${RAW_BASE}/github-plus.user.js`,
        license: 'MIT',
        icon: 'https://github.com/favicon.ico',
        match: ['https://github.com/*', 'https://gist.github.com/*'],
        'run-at': 'document-idle',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'github-plus.user.js',
        metaFileName: true,
      },
    }),
  ],
});
