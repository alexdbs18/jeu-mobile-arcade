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
  assert.match(app, /<title>Rivo · Atelier de jeu<\/title>/);
  assert.match(app, /id="stage"/);
  assert.match(app, /rebond-playfield/);
  assert.doesNotMatch(app, /INLINE_(?:STYLE|SCRIPTS)|POSE_(?:FOCUS|WIN|LOSE)|TOY_(?:WAGON|PHOTO|TRACE|MIROIR)/);
});

test('la configuration linguistique propose les six langues du brief', async () => {
  const source = await readFile(new URL('rivo/src/i18n.js', root), 'utf8');
  for (const language of ['fr','en','es','de','it','pt']) assert.match(source, new RegExp(`['"]${language}['"]`));
  assert.match(source, /function detect\(\)/);
  assert.match(source, /function apply\(root, language\)/);
  const i18n = await import('../rivo/src/i18n.js');
  assert.deepEqual(globalThis.RivoI18n.supported, ['fr','en','es','de','it','pt']);
  for (const language of globalThis.RivoI18n.supported) {
    assert.ok(globalThis.RivoI18n.translate('Classement', language));
    assert.match(globalThis.RivoI18n.locale(language), /^[a-z]{2}-[A-Z]{2}$/);
  }
});

test('seuls les jeux munis d’un adaptateur client peuvent être comptés comme prêts', async () => {
  await import('../rivo/src/game-registry.js');
  const catalog = [
    {id:'aiguillage',playable:true},
    {id:'concept-visuel',playable:true},
    {id:'jeu-inactif',playable:false}
  ];
  assert.deepEqual(globalThis.RivoGames.catalogReady(catalog).map(game=>game.id), ['aiguillage']);
  assert.equal(globalThis.RivoGames.get('aiguillage').verify, 'submit-aiguillage');
});

test('l’Arcade Lab contient quinze prototypes et plafonne chaque run à une minute', async () => {
  await import('../rivo/src/game-lab.js');
  const catalog=globalThis.RivoGameLab.catalog();
  assert.equal(catalog.length,15);
  assert.equal(catalog.filter(game=>game.type==='Arcade').length,11);
  assert.equal(catalog.filter(game=>game.type==='Logique').length,4);
  const source=await readFile(new URL('rivo/src/game-lab.js',root),'utf8');
  assert.match(source,/MAX=60/);
});

test('les pages et feuilles de style embarquent toutes leurs ressources locales', async () => {
  const pending = ['rivo/index.html', 'rivo/arcade-electrique.html', 'rivo/couleurs.html'];
  const seen = new Set();
  while (pending.length) {
    const path = pending.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const file = new URL(path, root);
    const source = await readFile(file, 'utf8');
    // An inline script may contain HTML templates whose URLs are resolved at runtime.
    const markup = source.replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, '$1</script>');
    const refs = path.endsWith('.css')
      ? [...source.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)].map(m => m[1])
      : [...markup.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]);
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
  for (const image of ['focus', 'win', 'lose', 'wagon', 'photo', 'trace', 'miroir']) {
    assert.equal((await stat(new URL(`rivo/src/assets/${image}.webp`, root))).isFile(), true);
  }
  for (const image of ['frog.webp','axolotl.png','fox.png','penguin.png','rabbit.png','cat.png','octopus.png','hedgehog.png','bee.png','dragon.png']) {
    assert.equal((await stat(new URL(`rivo/src/assets/characters/${image}`, root))).isFile(), true);
  }
  // L’ancienne maquette utilise encore ses réactions de grenouille externes.
  for (const mood of ['focus', 'win', 'lose']) {
    assert.equal((await stat(new URL(`rivo/assets/frog-${mood}.webp`, root))).isFile(), true);
  }
});
