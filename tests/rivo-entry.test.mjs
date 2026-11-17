import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('ouvrir le dépôt mène à l’interface Rivo', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const target = html.match(/http-equiv="refresh"\s+content="0;\s*url=([^";]+)"/i)?.[1];
  assert.ok(target, 'L’entrée doit ouvrir automatiquement le prototype.');
  const entry = new URL(target, root);
  assert.equal(entry.href, new URL('rivo/', root).href);
  const app = await readFile(new URL('index.html', entry), 'utf8');
  assert.match(app, /<title>Rivo · Mes ligues<\/title>/);
  assert.match(app, /id="app"/);
  assert.match(app, /src="app\.js/);
});

test('les pages et feuilles de style embarquent toutes leurs ressources locales', async () => {
  const pending = ['rivo/index.html', 'rivo/couleurs.html'];
  const seen = new Set();
  while (pending.length) {
    const path = pending.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const file = new URL(path, root);
    const source = await readFile(file, 'utf8');
    const refs = path.endsWith('.css')
      ? [...source.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)].map(m => m[1])
      : [...source.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]);
    for (const ref of refs) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
      const resolved = new URL(ref, file);
      resolved.search = '';
      resolved.hash = '';
      if (resolved.pathname.endsWith('/')) resolved.pathname += 'index.html';
      assert.equal((await stat(resolved)).isFile(), true, `${path} → ${ref}`);
      if (/\.(html|css)$/.test(resolved.pathname)) pending.push(resolved.href.slice(root.href.length));
    }
  }
  // Ces trois images sont choisies dynamiquement selon le résultat du joueur.
  for (const mood of ['focus', 'win', 'lose']) {
    assert.equal((await stat(new URL(`rivo/assets/frog-${mood}.webp`, root))).isFile(), true);
  }
});
