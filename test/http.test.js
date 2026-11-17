import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../src/utils/http.js';

test('the GM transport resolves non-2xx responses and normalizes headers', async () => {
  globalThis.GM_xmlhttpRequest = (options) => {
    assert.equal(options.headers['If-None-Match'], 'W/"a"');
    options.onload({
      status: 304,
      responseText: '',
      responseHeaders: 'ETag: W/"a"\r\nX-RateLimit-Remaining: 42\r\n',
    });
  };
  const result = await request({
    url: 'https://api.github.com/user',
    headers: { 'If-None-Match': 'W/"a"' },
  });
  assert.equal(result.status, 304);
  assert.equal(result.headers['x-ratelimit-remaining'], '42');
  delete globalThis.GM_xmlhttpRequest;
});

test('a GM network failure rejects', async () => {
  globalThis.GM_xmlhttpRequest = (options) => options.onerror();
  await assert.rejects(request({ url: 'https://api.github.com/user' }), /Network request failed/);
  delete globalThis.GM_xmlhttpRequest;
});

test('requestText still rejects on a non-2xx status', async () => {
  globalThis.GM_xmlhttpRequest = (options) => options.onload({ status: 403, responseText: 'nope' });
  const { requestText } = await import('../src/features/translate/providers/request.js');
  await assert.rejects(requestText({ url: 'https://api.github.com/user' }), (error) => error.status === 403);
  delete globalThis.GM_xmlhttpRequest;
});
