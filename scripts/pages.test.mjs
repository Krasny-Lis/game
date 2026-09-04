import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const output = resolve('dist/slot-game/browser');
const html = await readFile(resolve(output, 'index.html'), 'utf8');
const site = new URL('https://krasny-lis.github.io/game/');

test('the built page uses the repository subdirectory', () => {
  assert.match(html, /<base\s+href="\/game\/"\s*\/?\s*>/);
  assert.match(html, /<app-root><\/app-root>/);
});

test('all script and stylesheet links resolve to published files under /game/', async () => {
  const tags = html.match(/<(?:script|link)\b[^>]*>/g) ?? [];
  const paths = tags.flatMap(tag => {
    const path = tag.match(/\b(?:src|href)="([^"]+)"/);
    return path ? [path[1]] : [];
  });
  assert.ok(paths.some(path => path.endsWith('.js')), 'JavaScript bundle is missing');
  assert.ok(paths.some(path => path.endsWith('.css')), 'Stylesheet is missing');

  for (const path of paths) {
    const url = new URL(path, site);
    assert.equal(url.origin, site.origin);
    assert.ok(url.pathname.startsWith('/game/'), `Invalid Pages path: ${path}`);
    const file = resolve(output, url.pathname.slice('/game/'.length));
    assert.ok((await stat(file)).isFile(), `Missing output file: ${path}`);
  }
});

test('production scripts use hashed names for cache refreshes', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
  assert.ok(scripts.length > 0);
  for (const [, path] of scripts) {
    assert.match(path, /-[A-Za-z0-9]+\.js$/);
  }
});
