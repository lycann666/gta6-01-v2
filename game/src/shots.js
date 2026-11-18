// Deterministic screenshot scenes: ?shot=start|drive|chase|mission&seed=1
// stages a real simulated moment, then the loop paints it and sets
// window.__shotReady so the capture knows the frame is done.

import { WORLD, TUNE } from './config.js';
import { makeRng } from './rng.js';

function placeTrafficNear(w, city, cx, cy, count, rng) {
  for (let i = 0; i < count; i++) {
    const road = city.horizontal[Math.floor(rng.next() * city.horizontal.length)];
    const car = {
      x: cx + rng.range(-420, 420),
      y: road + (rng.chance(0.5) ? 18 : -18),
      angle: rng.chance(0.5) ? 0 : Math.PI,
      speed: rng.range(TUNE.trafficSpeed * 0.7, TUNE.trafficSpeed),
      color: ['#d94f3d', '#3d7fd9', '#e8b73a', '#7ac74f', '#e8e8e8'][i % 5],
      kind: 'traffic',
      axis: 'h',
      dir: rng.chance(0.5) ? 1 : -1,
      road,
      id: 'shot-t' + i,
    };
    w.cars.push(car);
  }
}

function placePedsNear(w, cx, cy, count, rng) {
  for (let i = 0; i < count; i++) {
    const ped = {
      x: cx + rng.range(-260, 260),
      y: cy + rng.range(-180, 180),
      angle: rng.range(0, Math.PI * 2),
      speed: 55,
      color: ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5'][i % 4],
      tx: cx, ty: cy, down: 0,
      id: 'shot-p' + i,
    };
    ped.tx = ped.x + rng.range(-120, 120);
    ped.ty = ped.y + rng.range(-120, 120);
    w.peds.push(ped);
  }
}

export function stageShot(w, m, city, name, seed) {
  const rng = makeRng(seed || 1);
  const p = w.player;
  if (name === 'start') {
    // On foot at the pier: harbour water, dock and beach in frame, HUD live.
    p.x = 2760;
    p.y = 1050;
    p.angle = 0;
    p.onFoot = true;
    placeTrafficNear(w, city, 2600, 1050, 4, rng);
    placePedsNear(w, 2760, 1050, 5, rng);
    m.index = 0;
    m.target = { x: WORLD.w - 285, y: 1030 };
    m.targetLabel = 'Dermaga';
    m.message = 'Temui Laras di dermaga timur.';
  } else if (name === 'drive') {
    // Driving down a main road with traffic around.
    p.x = 1000;
    p.y = 1000;
    p.angle = 0;
    p.onFoot = false;
    const car = w.cars.find((c) => c.kind === 'parked') || w.cars[0];
    car.kind = 'player';
    car.color = '#d94f3d';
    car.speed = 260;
    car.x = 1000;
    car.y = 1000;
    car.angle = 0;
    p.car = car;
    p.speed = 260;
    placeTrafficNear(w, city, 1000, 1000, 6, rng);
    placePedsNear(w, 1000, 1000, 4, rng);
    m.index = 1;
    m.target = { x: 500, y: WORLD.h - 500 };
    m.targetLabel = 'Titik Serah Terima';
    m.message = 'Antar sedan ini ke titik serah terima.';
  } else if (name === 'chase') {
    // Three-star police chase while driving east along the main road.
    p.x = 1400;
    p.y = 1400;
    p.angle = 0;
    p.onFoot = false;
    const car = w.cars.find((c) => c.kind === 'parked') || w.cars[0];
    car.kind = 'player';
    car.color = '#e8b73a';
    car.speed = 320;
    car.x = 1400;
    car.y = 1400;
    car.angle = 0;
    p.car = car;
    p.speed = 320;
    w.wanted = 3;
    w.cops = [];
    for (let i = 0; i < 3; i++) {
      w.cops.push({
        x: 1400 - 260 - i * 40,
        y: 1400 + (i - 1) * 70,
        angle: 0,
        speed: 300,
        color: '#1d4ed8',
        kind: 'cop',
        hp: 60,
        disabled: 0,
        ramCd: 0,
        id: 'shot-c' + i,
      });
    }
    placeTrafficNear(w, city, 1400, 1400, 4, rng);
    m.index = 3;
    m.target = { x: 420, y: 420 };
    m.targetLabel = 'Rumah Aman';
    m.message = 'Bertahan dari razia! 42 detik lagi.';
    m.escapeTimer = 42;
  } else {
    // Mission 2: the blue sedan, player on foot closing in.
    const parked = w.cars.filter((c) => c.kind === 'parked');
    const car = parked[2] || parked[0];
    car.missionCar = true;
    car.color = '#2f6fd9';
    car.x = 1240;
    car.y = 1000;
    car.angle = 0;
    p.x = 1150;
    p.y = 940;
    p.angle = Math.atan2(car.y - p.y, car.x - p.x);
    p.onFoot = true;
    placeTrafficNear(w, city, 1240, 1000, 3, rng);
    placePedsNear(w, 1240, 1000, 3, rng);
    m.index = 1;
    m.step = 0;
    m.target = { x: car.x, y: car.y };
    m.targetLabel = 'Sedan Biru';
    m.message = 'Curi sedan biru itu. Tekan E untuk masuk.';
  }
  // Keep the camera centred on the action.
  return {
    x: Math.max(0, Math.min(WORLD.w - 1280, p.x - 640)),
    y: Math.max(0, Math.min(WORLD.h - 720, p.y - 360)),
  };
}
