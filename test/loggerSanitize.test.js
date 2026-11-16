import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="panel" class="a b c"></div></body>', {
  url: 'https://github.com/o/r',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;

const { sanitizeValue, serializeError } = await import('../src/core/logger/sanitize.js');

test('a DOM node becomes a short selector-like descriptor', () => {
  const node = document.getElementById('panel');
  assert.equal(sanitizeValue(node), 'div#panel.a.b.c');
});

test('circular references are marked, not followed', () => {
  const value = { name: 'x' };
  value.self = value;
  assert.deepEqual(sanitizeValue(value), { name: 'x', self: '[Circular]' });
});

test('long strings, large arrays and wide objects are capped', () => {
  const text = 'a'.repeat(2500);
  const sanitized = sanitizeValue(text);
  assert.equal(sanitized.length, 2001);
  assert.ok(sanitized.endsWith('…'));

  assert.equal(sanitizeValue(Array.from({ length: 53 }, (_, i) => i)).length, 50);

  const wide = {};
  for (let i = 0; i < 53; i += 1) wide[`k${i}`] = i;
  assert.equal(Object.keys(sanitizeValue(wide)).length, 50);
});

test('deep nesting stops at the depth limit', () => {
  const deep = { a: { b: { c: { d: { e: { f: 'x' } } } } } };
  assert.equal(sanitizeValue(deep).a.b.c.d, '[Object]');
});

test('errors keep name, message, stack and nested causes', () => {
  const root = new Error('root');
  const error = new Error('top', { cause: root });
  const serialized = serializeError(error);
  assert.equal(serialized.name, 'Error');
  assert.equal(serialized.message, 'top');
  assert.match(serialized.stack, /top/);
  assert.equal(serialized.cause.message, 'root');
});

test('functions, dates, maps and sets are described', () => {
  function named() {}
  assert.equal(sanitizeValue(named), '[Function named]');
  assert.equal(sanitizeValue(new Date('2026-01-02T03:04:05.000Z')), '2026-01-02T03:04:05.000Z');
  assert.equal(sanitizeValue(new Map([[1, 2]])), '[Map(1)]');
  assert.equal(sanitizeValue(new Set([1])), '[Set(1)]');
});

test('a throwing getter does not escape', () => {
  const value = {};
  Object.defineProperty(value, 'bad', { enumerable: true, get() { throw new Error('no'); } });
  value.ok = 1;
  assert.deepEqual(sanitizeValue(value), { bad: '[Unreadable]', ok: 1 });
});

test('an error whose properties throw still yields a safe descriptor', () => {
  const error = new Error('safe');
  Object.defineProperty(error, 'name', { configurable: true, get() { throw new Error('no name'); } });
  Object.defineProperty(error, 'message', { configurable: true, get() { throw new Error('no message'); } });
  Object.defineProperty(error, 'stack', { configurable: true, get() { throw new Error('no stack'); } });
  Object.defineProperty(error, 'cause', { configurable: true, get() { throw new Error('no cause'); } });

  const serialized = serializeError(error);
  assert.equal(serialized.name, '[Unreadable]');
  assert.equal(serialized.message, '[Unreadable]');
  assert.equal(serialized.stack, '[Unreadable]');
  assert.equal('cause' in serialized, false);
});

test('undefined and primitives pass through', () => {
  assert.equal(sanitizeValue(undefined), undefined);
  assert.equal(sanitizeValue(3), 3);
  assert.equal(sanitizeValue(null), null);
});
