// Teluk Surya — boot, game loop, screens, save and screenshot mode.
// The canvas is 1280x720; the camera follows the player across a 3200x2400 city.

import { WORLD, STORY, SAVE_KEY } from './config.js';
import { makeRng } from './rng.js';
import { buildCity } from './city.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, stepWorld } from './world.js';
import { createMissions, updateMissions, beginMissions } from './missions.js';
import { drawGame, VIEW_W, VIEW_H } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = parseInt(params.get('seed') || '7', 10);

const rng = makeRng(Number.isFinite(seedParam) ? seedParam : 7);
const city = buildCity(rng);
const input = createInput();
const audio = createAudio();
let world = createWorld(city, rng);
let missions = createMissions(city, rng);
let mode = 'title';
let cam = { x: 0, y: 0 };
let shotCam = null;
let painted = false;

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { best: 0, cash: 0 };
    const data = JSON.parse(raw);
    return { best: data.best || 0, cash: data.cash || 0 };
  } catch (e) {
    return { best: 0, cash: 0 };
  }
}

function saveGame() {
  try {
    const prev = loadSave();
    const best = Math.max(prev.best, world.cash);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ best, cash: world.cash }));
  } catch (e) {}
}

const save = loadSave();
world.cash = save.cash;
world.best = save.best;

function resetGame() {
  const keepCash = world.cash;
  const keepBest = world.best || 0;
  const fresh = makeRng((Math.random() * 1e9) | 0);
  world = createWorld(city, fresh);
  missions = createMissions(city, fresh);
  world.cash = keepCash;
  world.best = keepBest;
  beginMissions(world, missions, fx);
  mode = 'play';
  cam.x = Math.max(0, Math.min(WORLD.w - VIEW_W, world.player.x - VIEW_W / 2));
  cam.y = Math.max(0, Math.min(WORLD.h - VIEW_H, world.player.y - VIEW_H / 2));
}

// Effects the world calls back into: crimes raise the wanted level, the
// siren follows it, and mission completions are reported through the HUD.
const fx = {
  crime(n) {
    world.wanted = Math.min(5, world.wanted + n);
    if (world.wanted > 0) audio.sirenStart();
  },
  pickup() {},
  sfx: audio,
};

beginMissions(world, missions, fx);

function updateCamera(dt) {
  const p = world.player;
  const tx = Math.max(0, Math.min(WORLD.w - VIEW_W, p.x - VIEW_W / 2));
  const ty = Math.max(0, Math.min(WORLD.h - VIEW_H, p.y - VIEW_H / 2));
  const k = Math.min(1, dt * 5);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  if (mode === 'play') {
    stepWorld(world, city, input, dt, fx);
    updateMissions(world, missions, city, dt, fx);
    updateCamera(dt);
    if (world.player.car) audio.engineSet(Math.abs(world.player.speed) / 460);
    else audio.engineSet(0);
    if (world.wanted === 0) audio.sirenStop();
    if (world.busted) {
      mode = 'busted';
      audio.engineStop();
      audio.sirenStop();
      audio.musicStop();
      world.musicOn = false;
      saveGame();
      world.best = Math.max(world.best || 0, world.cash);
    } else if (world.wasted) {
      mode = 'wasted';
      audio.engineStop();
      audio.sirenStop();
      audio.musicStop();
      world.musicOn = false;
      saveGame();
      world.best = Math.max(world.best || 0, world.cash);
    } else if (missions.done) {
      mode = 'win';
      audio.engineStop();
      audio.sirenStop();
      audio.musicStop();
      world.musicOn = false;
      saveGame();
      world.best = Math.max(world.best || 0, world.cash);
    }
  }
  drawGame(ctx, world, missions, city, cam, mode);
  if (shotName && !painted) {
    painted = true;
    window.__shotReady = true;
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

function startGame() {
  audio.ensure();
  audio.musicStart();
  world.musicOn = audio.musicPlaying();
  if (mode === 'title' || mode === 'busted' || mode === 'wasted' || mode === 'win') {
    resetGame();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') {
    if (mode !== 'play') startGame();
  }
  if (e.code === 'KeyP' && mode === 'play') {
    mode = 'pause';
    audio.engineStop();
    audio.sirenStop();
    audio.musicStop();
    world.musicOn = false;
  } else if (e.code === 'KeyP' && mode === 'pause') {
    mode = 'play';
    audio.musicStart();
    world.musicOn = audio.musicPlaying();
  }
  if (e.code === 'KeyN') {
    world.musicOn = audio.musicToggle();
  }
  if (e.code === 'KeyM') {
    missions.message = 'Misi ' + (missions.index + 1) + '/5 — ' + missions.targetLabel;
  }
});
canvas.addEventListener('click', () => {
  audio.ensure();
  if (mode !== 'play') startGame();
});
canvas.addEventListener('mousedown', () => audio.ensure());

if (shotName) {
  // Deterministic screenshot: rebuild the world from seed 1, stage the
  // scene, and paint it once. No audio, no title overlay.
  const shotRng = makeRng(1);
  world = createWorld(city, shotRng);
  missions = createMissions(city, shotRng);
  shotCam = stageShot(world, missions, city, shotName, 1);
  cam = shotCam;
  mode = 'play';
  // One idle step so traffic and peds settle, then the frame paints.
  stepWorld(world, city, input, 0.016, fx);
  updateMissions(world, missions, city, 0.016, fx);
} else {
  cam.x = Math.max(0, Math.min(WORLD.w - VIEW_W, world.player.x - VIEW_W / 2));
  cam.y = Math.max(0, Math.min(WORLD.h - VIEW_H, world.player.y - VIEW_H / 2));
}

requestAnimationFrame(frame);
