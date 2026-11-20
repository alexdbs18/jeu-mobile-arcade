// Implement the Rivo host contract in each new game package.
// The host owns the attempt id and only accepts a result from its server verifier.
export const adapter = {
  id: 'replace-with-game-slug',
  version: 1,
  nameKey: 'game.replace-with-game-slug.name',
  descriptionKey: 'game.replace-with-game-slug.description',
  verify: 'submit-replace-with-game-slug',
  create({ root, seed, mode, language, onProgress, onFinish }) {
    // Mount the game in root. Use seed so every player receives the same challenge.
    // onFinish sends raw events to the named server verifier; it never sets points.
    throw new Error('Implement the game UI and rules before registering it as playable.');
  }
};
