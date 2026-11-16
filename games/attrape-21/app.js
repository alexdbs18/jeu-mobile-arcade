import { CONFIG, Game, FrameLoop, pointsFor, stageAt } from './game.js';

const $ = id => document.getElementById(id);
const storage = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, String(value)); return true; } catch { return false; } }
};
const params = new URLSearchParams(location.search);
let seed = (params.get('seed') || storage.get('attrape21.seed', CONFIG.defaultSeed)).slice(0, 48);
let game = new Game(seed);
let record = Math.max(0, Number(storage.get('attrape21.record', 0)) || 0);
let soundEnabled = storage.get('attrape21.sound', 'false') === 'true';
let audioContext;
let resultSaved = false;
let lastCountdown = -1;
let lastStage = -1;
let geometry = { width: 0, height: 0, tileSize: CONFIG.tileSize };
const nodes = new Map();
const effectAnimations = new Set();
let lastUI = {};

function text(id, value) {
  if (lastUI[id] !== value) { $(id).textContent = value; lastUI[id] = value; }
}
function announce(message) { $('announcement').textContent = message; }
function setScreen(name) {
  for (const id of ['home', 'game-screen', 'results']) $(id).hidden = id !== name;
  $('pause').hidden = name !== 'game-screen';
}
function measure() {
  $('cabinet').classList.toggle('compact', $('cabinet').clientHeight < 750);
  const rect = $('arena').getBoundingClientRect();
  geometry = { width: rect.width, height: rect.height,
    tileSize: Math.min(CONFIG.tileSize, Math.floor(rect.width / 4 - CONFIG.tileGap), Math.floor(rect.height * .19)) };
  // Keep targets at least 48 px in landscape / unusually short embedded windows.
  geometry.tileSize = Math.max(48, geometry.tileSize);
  $('arena').style.setProperty('--tile-size', `${geometry.tileSize}px`);
}
new ResizeObserver(measure).observe($('arena'));
window.addEventListener('resize', measure);

function unlockAudio() {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch { /* Sound is optional; the game remains fully playable. */ }
}
function tone(frequency, delay = 0, duration = .08, volume = .045) {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const t = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + .008);
  gain.gain.exponentialRampToValueAtTime(.001, t + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(t); oscillator.stop(t + duration + .02);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function updateSound() {
  $('sound').classList.toggle('sound-enabled', soundEnabled);
  $('sound').setAttribute('aria-pressed', String(soundEnabled));
  $('sound').setAttribute('aria-label', soundEnabled ? 'Couper le son' : 'Activer le son');
  $('sound').title = soundEnabled ? 'Couper le son' : 'Activer le son';
}
$('sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  storage.set('attrape21.sound', soundEnabled);
  updateSound(); unlockAudio(); tone(580);
});

function clearEffects() {
  for (const animation of effectAnimations) animation.cancel();
  effectAnimations.clear();
  $('effects').replaceChildren();
  $('target-feedback').replaceChildren();
  $('target').classList.remove('has-feedback');
  $('target').classList.remove('hit', 'bust');
}
function ephemeral(element) {
  $('effects').append(element);
  element.addEventListener('animationend', () => element.remove(), { once: true });
}
function feedback(event, tile, node) {
  const position = node.dataset;
  const pop = document.createElement('span');
  pop.className = 'tile-pop'; pop.textContent = `+${tile.value}`;
  Object.assign(pop.style, { left: position.x + 'px', top: position.y + 'px', width: geometry.tileSize + 'px', height: geometry.tileSize + 'px' });
  ephemeral(pop);
  if (event.kind === 'tap') { $('target-feedback').replaceChildren(); $('target').classList.remove('has-feedback'); tone(300 + tile.value * 32, 0, .06, .025); return; }
  $('target-feedback').replaceChildren();
  const el = document.createElement('div');
  el.className = `feedback ${event.kind}`;
  const headline = document.createElement('strong'), detail = document.createElement('span');
  headline.textContent = event.kind === 'success' ? '21 !' : `${event.total} — Trop haut`;
  detail.textContent = `+${event.points} pts`;
  el.append(headline, detail);
  $('target-feedback').append(el); $('target').classList.add('has-feedback');
  el.addEventListener('animationend', () => { el.remove(); if (!$('target-feedback').childElementCount) $('target').classList.remove('has-feedback'); }, { once: true });
  $('target').classList.remove('hit', 'bust');
  void $('target').offsetWidth;
  $('target').classList.add(event.kind === 'success' ? 'hit' : 'bust');
  if (event.kind === 'success') {
    tone(523, 0, .12); tone(659, .07, .12); tone(784, .14, .2);
    announce(`21 ! ${event.points} points. Série de ${game.state.combo}.`);
    if (navigator.vibrate) navigator.vibrate(18);
  } else {
    tone(180, 0, .13, .035); tone(135, .07, .16, .025);
    announce(`${event.total}, trop haut. Somme et série remises à zéro.`);
  }
}
function tap(id) {
  const node = nodes.get(id);
  if (!node) return;
  const event = game.hit(id, performance.now());
  if (!event) { if (game.state.status === 'ended') finish(); return; }
  const tile = game.sequence.find(t => t.id === id);
  node.remove(); nodes.delete(id);
  feedback(event, tile, node);
  renderHUD();
}
$('tiles').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const tile = event.target.closest('.tile');
  if (!tile) return;
  event.preventDefault();
  tap(tile.dataset.id);
});
$('tiles').addEventListener('click', event => {
  // Fallback for keyboard, screen readers and click-only input devices.
  // Pointerdown already consumed the id, so a following click cannot count it twice.
  const tile = event.target.closest('.tile'); if (tile) tap(tile.dataset.id);
});

function renderHUD() {
  const state = game.state;
  text('score', state.score.toLocaleString('fr-FR'));
  text('combo', state.combo ? `×${state.combo}` : '—');
  text('sum', state.sum);
  text('remaining', state.sum ? `Il manque ${21 - state.sum}` : 'À toi de jouer');
  $('remaining').classList.toggle('near', state.sum >= 15);
  text('next-points', `PROCHAIN 21 · +${pointsFor(state.combo + 1)}`);
  $('sum-fill').style.transform = `scaleX(${state.sum / 21})`;
  const seconds = Math.ceil((CONFIG.roundMs - state.elapsed) / 1000);
  if (lastUI.time !== seconds) { $('time').replaceChildren(document.createTextNode(seconds), Object.assign(document.createElement('span'), { textContent: 's' })); lastUI.time = seconds; }
  $('time-fill').style.transform = `scaleX(${1 - state.elapsed / CONFIG.roundMs})`;
  $('game-screen').classList.toggle('urgent', state.elapsed >= 20_000);
  const stage = stageAt(state.elapsed);
  if (stage.at !== lastStage) {
    lastStage = stage.at; text('stage', stage.label);
    if (stage.at > 0) { tone(660, 0, .09, .02); announce(stage.label); }
  }
}
function renderTiles() {
  const visible = game.visible();
  const live = new Set(visible.map(t => t.id));
  for (const [id, node] of nodes) if (!live.has(id)) { node.remove(); nodes.delete(id); }
  for (const tile of visible) {
    let node = nodes.get(tile.id);
    if (!node) {
      node = document.createElement('button');
      node.className = `tile ${tile.value <= 3 ? 'small' : tile.value <= 5 ? 'medium' : ''}`;
      node.textContent = tile.value;
      node.dataset.id = tile.id;
      node.setAttribute('aria-label', `Ajouter ${tile.value}`);
      $('tiles').append(node); nodes.set(tile.id, node);
    }
    const progress = (game.state.elapsed - tile.at) / tile.fallMs;
    const x = (tile.column + .5) * geometry.width / 4 - geometry.tileSize / 2;
    // Spawn fully visible at the entry line; disappear when the top reaches the exit.
    const y = progress * geometry.height;
    node.style.transform = `translate3d(${x}px,${y}px,0)`;
    node.dataset.x = x; node.dataset.y = y;
    // Keep a partly clipped tile out of keyboard focus near the exit.
    node.tabIndex = y < geometry.height - 30 ? 0 : -1;
  }
}
function frame(now) {
  game.tick(now);
  if (game.state.status === 'ended') { finish(); return false; }
  if (!['countdown', 'running'].includes(game.state.status)) return false;
  const counting = game.state.status === 'countdown';
  $('countdown').hidden = !counting;
  if (counting && lastCountdown !== game.state.countdown) {
    lastCountdown = game.state.countdown;
    text('count', lastCountdown);
    $('countdown').classList.remove('pulse'); void $('countdown').offsetWidth; $('countdown').classList.add('pulse');
    tone(450, 0, .06, .025);
  }
  renderHUD(); renderTiles();
  return true;
}
const loop = new FrameLoop(requestAnimationFrame.bind(window), cancelAnimationFrame.bind(window), frame);
function start() {
  loop.stop(); clearEffects(); nodes.clear(); $('tiles').replaceChildren();
  resultSaved = false; lastCountdown = -1; lastStage = -1;
  $('pause-overlay').hidden = true; $('game-screen').inert = false; $('pause').disabled = false;
  $('sound').disabled = false; $('cabinet').querySelector('.brand').removeAttribute('tabindex');
  setScreen('game-screen'); measure(); unlockAudio();
  game.start(performance.now());
  frame(performance.now()); loop.start();
}
function finish() {
  loop.stop();
  if (resultSaved) return;
  resultSaved = true;
  clearEffects(); nodes.clear(); $('tiles').replaceChildren();
  $('pause-overlay').hidden = true;
  const state = game.state;
  const isRecord = state.score > record;
  record = Math.max(record, state.score);
  const saved = storage.set('attrape21.record', record);
  text('final-score', state.score.toLocaleString('fr-FR'));
  text('final-successes', state.successes);
  text('final-combo', state.bestCombo);
  text('final-record', record.toLocaleString('fr-FR'));
  text('home-record', record.toLocaleString('fr-FR'));
  text('result-sub', !saved ? 'Record gardé pour cette session uniquement.' : isRecord ? 'Tu viens de placer la barre plus haut.' : state.successes ? 'Le prochain record est à portée de doigt.' : 'Prends ton temps. Puis prends les bonnes tuiles.');
  $('new-record').hidden = !isRecord;
  setScreen('results'); $('replay').focus({ preventScroll: true });
  tone(784, 0, .12, .025); tone(523, .13, .2, .025);
  announce(`Partie terminée. ${state.score} points, ${state.successes} fois 21. Meilleure série : ${state.bestCombo}.`);
}
function pause() {
  if (!game.pause(performance.now())) { if (game.state.status === 'ended') finish(); return; }
  loop.stop();
  $('pause-overlay').hidden = false;
  $('game-screen').inert = true; $('pause').disabled = true; $('sound').disabled = true;
  $('cabinet').querySelector('.brand').tabIndex = -1;
  $('resume').focus({ preventScroll: true });
  for (const animation of [...$('effects').getAnimations({ subtree: true }), ...$('target-feedback').getAnimations({ subtree: true })]) { animation.pause(); effectAnimations.add(animation); }
  announce('Partie en pause.');
}
function resume() {
  if (document.hidden || !game.resume(performance.now())) return;
  $('pause-overlay').hidden = true; $('game-screen').inert = false; $('pause').disabled = false; $('sound').disabled = false;
  $('cabinet').querySelector('.brand').removeAttribute('tabindex');
  for (const animation of effectAnimations) animation.play(); effectAnimations.clear();
  unlockAudio(); frame(performance.now()); loop.start(); $('pause').focus({ preventScroll: true });
}
$('play').addEventListener('click', start);
$('replay').addEventListener('click', start);
$('pause').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('home-button').addEventListener('click', () => { loop.stop(); setScreen('home'); $('play').focus({ preventScroll: true }); });
$('cabinet').querySelector('.brand').addEventListener('click', event => {
  if (['running', 'countdown', 'paused'].includes(game.state.status)) { event.preventDefault(); return; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', pause);
window.addEventListener('blur', pause);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (game.state.status === 'paused') resume(); else pause(); }
  if (game.state.status === 'paused' && event.key === 'Tab') { event.preventDefault(); $('resume').focus(); }
});
$('seed-form').addEventListener('submit', event => {
  event.preventDefault();
  seed = $('seed').value.trim() || CONFIG.defaultSeed;
  game = new Game(seed);
  storage.set('attrape21.seed', seed); text('seed-label', seed);
  const url = new URL(location.href); url.searchParams.set('seed', seed); history.replaceState(null, '', url);
  $('seed').value = seed; $('seed-form').closest('details').open = false;
  $('play').focus();
});
$('seed').value = seed; text('seed-label', seed); text('home-record', record.toLocaleString('fr-FR'));
updateSound(); measure();

