import test from 'node:test';
import assert from 'node:assert/strict';

const logger = await import('../src/core/logger/index.js');
const { Codes, configureLogger, createLogger, isLoggingEnabled, getLogEntries, dumpLog, clearLog } = logger;

function captureConsole() {
  const calls = [];
  const originals = { error: console.error, warn: console.warn, info: console.info };
  for (const level of Object.keys(originals)) {
    console[level] = (...args) => calls.push({ level, args });
  }
  return {
    calls,
    restore() {
      Object.assign(console, originals);
    },
  };
}

test('disabled logging prints nothing and stores nothing', () => {
  configureLogger({ enabled: false });
  const capture = captureConsole();
  try {
    createLogger('gallery').error(Codes.GALLERY_FAILED, 'boom', { a: 1 });
    assert.equal(capture.calls.length, 0);
    assert.deepEqual(getLogEntries(), []);
    assert.equal(isLoggingEnabled(), false);
  } finally {
    capture.restore();
  }
});

test('enabled logging records a structured entry and prints one console call', () => {
  configureLogger({ enabled: true });
  clearLog();
  const capture = captureConsole();
  try {
    const log = createLogger('file-preview');
    log.error(Codes.FILE_PREVIEW, 'Failed to load', { rawUrl: '/x', error: new Error('nope') });
    const entries = getLogEntries();
    assert.equal(entries.length, 1);
    const [entry] = entries;
    assert.equal(entry.level, 'error');
    assert.equal(entry.code, 'GP-1501');
    assert.equal(entry.module, 'file-preview');
    assert.equal(entry.message, 'Failed to load');
    assert.deepEqual(entry.details, { rawUrl: '/x' });
    assert.equal(entry.error.message, 'nope');
    assert.equal(entry.repeats, 1);
    assert.match(entry.time, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0].level, 'error');
    assert.match(String(capture.calls[0].args[0]), /GP-1501/);
    assert.match(String(capture.calls[0].args[0]), /file-preview/);
  } finally {
    capture.restore();
  }
});

test('info entries carry no code and use console.info', () => {
  configureLogger({ enabled: true });
  clearLog();
  const capture = captureConsole();
  try {
    createLogger('file-ages').info('no surface yet');
    const [entry] = getLogEntries();
    assert.equal(entry.code, null);
    assert.equal(entry.level, 'info');
    assert.equal(capture.calls[0].level, 'info');
  } finally {
    capture.restore();
  }
});

test('consecutive identical entries collapse into repeats', () => {
  configureLogger({ enabled: true });
  clearLog();
  const capture = captureConsole();
  try {
    const log = createLogger('file-icons');
    log.warn(Codes.FILE_ICONS, 'invalid row selector');
    log.warn(Codes.FILE_ICONS, 'invalid row selector');
    const entries = getLogEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].repeats, 2);
    assert.equal(capture.calls.length, 1);
  } finally {
    capture.restore();
  }
});

test('an error with an unreadable stack still produces an entry', () => {
  const capture = captureConsole();
  try {
    configureLogger({ enabled: true });
    clearLog();
    const error = new Error('hidden');
    Object.defineProperty(error, 'stack', { configurable: true, get() { throw new Error('no'); } });
    createLogger('settings').error(Codes.SETTINGS_PERSIST, 'save failed', { error });
    const entries = getLogEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].error.message, 'hidden');
    assert.equal(entries[0].error.stack, '[Unreadable]');
  } finally {
    capture.restore();
    configureLogger({ enabled: false });
  }
});

test('the buffer is capped and an Error passed as details is extracted', () => {
  configureLogger({ enabled: true });
  clearLog();
  const capture = captureConsole();
  try {
    const log = createLogger('translate');
    for (let i = 0; i < 305; i += 1) log.info(`line ${i}`);
    const entries = getLogEntries();
    assert.equal(entries.length, 300);
    assert.equal(entries[0].message, 'line 5');

    clearLog();
    log.warn(Codes.TRANSLATE_CACHE, 'cache failed', new Error('quota'));
    const [entry] = getLogEntries();
    assert.equal(entry.error.message, 'quota');
    assert.equal(entry.details, undefined);
  } finally {
    capture.restore();
  }
});

test('dumpLog describes the app and reset disables and clears', () => {
  configureLogger({ enabled: true });
  clearLog();
  const capture = captureConsole();
  try {
    createLogger('settings').info('hello');
    const dump = dumpLog();
    assert.equal(typeof dump.app.startedAt, 'string');
    assert.equal(dump.entries.length, 1);
  } finally {
    capture.restore();
  }

  configureLogger({ enabled: false });
  assert.equal(isLoggingEnabled(), false);
  assert.deepEqual(getLogEntries(), []);
});
