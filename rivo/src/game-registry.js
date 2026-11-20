(() => {
  'use strict';
  const entries = new Map();
  const slug = /^[a-z0-9-]{2,40}$/;
  function register(adapter) {
    if (!adapter || !slug.test(adapter.id || '') || typeof adapter.create !== 'function' || typeof adapter.verify !== 'string') {
      throw new TypeError('A game adapter requires an id, create(context), and server verifier key.');
    }
    if (entries.has(adapter.id)) throw new Error(`Game adapter already registered: ${adapter.id}`);
    entries.set(adapter.id, Object.freeze({
      id: adapter.id,
      version: Number.isInteger(adapter.version) ? adapter.version : 1,
      nameKey: adapter.nameKey || `game.${adapter.id}.name`,
      descriptionKey: adapter.descriptionKey || `game.${adapter.id}.description`,
      verify: adapter.verify,
      create: adapter.create,
      result: typeof adapter.result === 'function' ? adapter.result : result => result
    }));
    return entries.get(adapter.id);
  }
  function get(id) { return entries.get(String(id)) || null; }
  function catalogReady(catalog) {
    return (catalog || []).filter(item => item.playable && get(item.id));
  }
  globalThis.RivoGames = Object.freeze({ register, get, catalogReady, ids:() => [...entries.keys()] });

  // The initial real verifier; the other visual concepts are intentionally not registered.
  register({
    id:'aiguillage', version:1, nameKey:'game.aiguillage.name', descriptionKey:'game.aiguillage.description', verify:'submit-aiguillage',
    create:({ seed, kind }) => ({ id:'aiguillage', seed, kind })
  });
})();
