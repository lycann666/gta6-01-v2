// Teluk Surya simulation: player, cars, traffic, pedestrians, police, wanted
// level, combat, pickups and particles. All systems live here.

import { WORLD, TUNE, PALETTE } from './config.js';
import { resolveCircleRects, clampToWorld, pointInRects } from './city.js';

function spawnTrafficCar(city, rng) {
  const vertical = rng.chance(0.5);
  const road = vertical
    ? city.vertical[Math.floor(rng.next() * city.vertical.length)]
    : city.horizontal[Math.floor(rng.next() * city.horizontal.length)];
  const t = rng.range(0.15, 0.85);
  const pos = vertical
    ? { x: road + (rng.chance(0.5) ? 18 : -18), y: WORLD.h * t }
    : { x: WORLD.w * t, y: road + (rng.chance(0.5) ? 18 : -18) };
  return {
    x: pos.x,
    y: pos.y,
    angle: vertical ? Math.PI / 2 : 0,
    speed: rng.range(TUNE.trafficSpeed * 0.7, TUNE.trafficSpeed),
    color: rng.pick(PALETTE.car),
    kind: 'traffic',
    axis: vertical ? 'v' : 'h',
    dir: rng.chance(0.5) ? 1 : -1,
    road,
    id: 't' + Math.floor(rng.next() * 1e9).toString(36),
  };
}

function spawnPed(city, rng) {
  const road = city.vertical[Math.floor(rng.next() * city.vertical.length)];
  return {
    x: Math.max(60, Math.min(WORLD.w - 320, road + rng.range(-90, 90))),
    y: rng.range(120, WORLD.h - 480),
    angle: rng.range(0, Math.PI * 2),
    speed: rng.range(TUNE.pedSpeed * 0.7, TUNE.pedSpeed * 1.2),
    color: rng.pick(PALETTE.ped),
    tx: 0,
    ty: 0,
    down: 0,
    id: 'p' + Math.floor(rng.next() * 1e9).toString(36),
  };
}

function spawnPickup(city, rng, kind) {
  const road = city.horizontal[Math.floor(rng.next() * city.horizontal.length)];
  return {
    x: Math.max(80, Math.min(WORLD.w - 340, rng.range(150, WORLD.w - 400))),
    y: road + rng.range(-40, 40),
    kind: kind || (rng.chance(0.5) ? 'health' : 'ammo'),
    bob: rng.range(0, Math.PI * 2),
  };
}

export function createWorld(city, rng) {
  const w = {
    rng,
    player: {
      x: 620, y: 620, angle: -Math.PI / 2, speed: 0, onFoot: true,
      health: 100, ammo: 12, car: null, punchCd: 0, shootCd: 0, hurtCd: 0,
    },
    cars: [],
    peds: [],
    cops: [],
    pickups: [],
    bullets: [],
    parts: [],
    wanted: 0,
    wantedTimer: 0,
    cash: 0,
    time: 0,
    busted: false,
    wasted: false,
    shake: 0,
  };
  for (let i = 0; i < 10; i++) {
    const road = city.vertical[Math.floor(rng.next() * city.vertical.length)];
    const y = rng.range(200, WORLD.h - 500);
    w.cars.push({
      x: road + (rng.chance(0.5) ? 26 : -26), y,
      angle: rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2,
      speed: 0, color: rng.pick(PALETTE.car), kind: 'parked',
      id: 'park' + i,
    });
  }
  for (let i = 0; i < 12; i++) w.cars.push(spawnTrafficCar(city, rng));
  for (let i = 0; i < 22; i++) {
    const p = spawnPed(city, rng);
    p.tx = p.x;
    p.ty = p.y;
    w.peds.push(p);
  }
  for (let i = 0; i < 8; i++) w.pickups.push(spawnPickup(city, rng));
  return w;
}

function blockedRects(city) {
  // Buildings plus the harbour water (the pier strip stays walkable).
  return city.buildings.concat([
    { x: WORLD.w - 250, y: 0, w: 250, h: WORLD.h - 380 },
  ]);
}

function moveOnFoot(w, city, input, dt) {
  const p = w.player;
  const mv = input.moveVector();
  const run = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  const speed = run ? TUNE.runSpeed : TUNE.walkSpeed;
  const nx = p.x + mv.x * speed * dt;
  const ny = p.y + mv.y * speed * dt;
  if (mv.x !== 0 || mv.y !== 0) p.angle = Math.atan2(mv.y, mv.x);
  const fixed = resolveCircleRects(nx, ny, 14, blockedRects(city));
  p.x = fixed.x;
  p.y = fixed.y;
  const c = clampToWorld(p.x, p.y, 20);
  p.x = c.x;
  p.y = c.y;
  p.speed = mv.x !== 0 || mv.y !== 0 ? speed : 0;
}

function nearestCar(w, x, y, maxD) {
  let best = null;
  let bestD = maxD;
  for (const car of w.cars) {
    if (car.kind === 'player') continue;
    const d = Math.hypot(car.x - x, car.y - y);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

function tryEnterCar(w, fx) {
  const p = w.player;
  const car = nearestCar(w, p.x, p.y, 64);
  if (!car) return;
  if (car.kind !== 'player') {
    // Stealing a car is a crime — unless it is the mission's marked car.
    if (!car.missionCar) fx.crime(1, 'mencuri mobil');
    car.kind = 'player';
  }
  p.car = car;
  p.onFoot = false;
  p.x = car.x;
  p.y = car.y;
  p.angle = car.angle;
  p.speed = 0;
}

function exitCar(w) {
  const p = w.player;
  const car = p.car;
  if (!car) return;
  car.kind = 'parked';
  car.speed = 0;
  p.car = null;
  p.onFoot = true;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  p.speed = 0;
}

function driveCar(w, city, input, dt, fx) {
  const p = w.player;
  const car = p.car;
  const fwd = input.isDown('KeyW') || input.isDown('ArrowUp');
  const back = input.isDown('KeyS') || input.isDown('ArrowDown');
  const left = input.isDown('KeyA') || input.isDown('ArrowLeft');
  const right = input.isDown('KeyD') || input.isDown('ArrowRight');
  if (fwd) car.speed += TUNE.carAccel * dt;
  if (back) car.speed -= (car.speed > 10 ? TUNE.carBrake : TUNE.carAccel * 0.5) * dt;
  car.speed -= car.speed * TUNE.carDrag * dt;
  if (car.speed > TUNE.carMax) car.speed = TUNE.carMax;
  if (car.speed < -TUNE.carReverseMax) car.speed = -TUNE.carReverseMax;
  if (Math.abs(car.speed) > 12) {
    car.angle += ((right ? 1 : 0) - (left ? 1 : 0)) * TUNE.carTurn * (car.speed / TUNE.carMax) * dt * (car.speed < 0 ? -1 : 1);
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const fixed = resolveCircleRects(nx, ny, 17, blockedRects(city));
  if (Math.hypot(fixed.x - nx, fixed.y - ny) > 0.5 && Math.abs(car.speed) > 120) {
    car.speed *= 0.45;
    w.shake = 6;
    fx.sfx.noise(0.1, 0.12, 300);
  }
  car.x = fixed.x;
  car.y = fixed.y;
  const c = clampToWorld(car.x, car.y, 24);
  car.x = c.x;
  car.y = c.y;
  p.x = car.x;
  p.y = car.y;
  p.angle = car.angle;
  p.speed = car.speed;
  if (Math.abs(car.speed) > 40 && Math.random() < dt * 6) {
    w.parts.push({
      x: car.x - Math.cos(car.angle) * 20, y: car.y - Math.sin(car.angle) * 20,
      vx: -Math.cos(car.angle) * 20, vy: -Math.sin(car.angle) * 20,
      life: 0.5, color: '#88888888', size: 5,
    });
  }
}

function updateTraffic(w, city, dt) {
  for (const car of w.cars) {
    if (car.kind !== 'traffic') continue;
    // Slow down for a car ahead in the same lane.
    let ahead = Infinity;
    for (const other of w.cars) {
      if (other === car || other.kind === 'player') continue;
      if (car.axis === 'v' && Math.abs(other.x - car.x) < 34) {
        const gap = (other.y - car.y) * car.dir;
        if (gap > 0 && gap < ahead) ahead = gap;
      }
      if (car.axis === 'h' && Math.abs(other.y - car.y) < 34) {
        const gap = (other.x - car.x) * car.dir;
        if (gap > 0 && gap < ahead) ahead = gap;
      }
    }
    const target = ahead < 70 ? TUNE.trafficSpeed * 0.25 : TUNE.trafficSpeed;
    car.speed += Math.sign(target - car.speed) * 200 * dt;
    if (car.axis === 'v') {
      car.y += car.speed * car.dir * dt;
      car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      // Maybe turn at an intersection.
      for (const hy of city.horizontal) {
        if (Math.abs(car.y - hy) < 8 && w.rng.chance(dt * 0.35)) {
          car.axis = 'h';
          car.road = hy;
          car.dir = w.rng.chance(0.5) ? 1 : -1;
          car.y = hy + (w.rng.chance(0.5) ? 18 : -18);
          break;
        }
      }
      if (car.y < 60 || car.y > WORLD.h - 420) car.dir *= -1;
    } else {
      car.x += car.speed * car.dir * dt;
      car.angle = car.dir > 0 ? 0 : Math.PI;
      for (const vx of city.vertical) {
        if (Math.abs(car.x - vx) < 8 && w.rng.chance(dt * 0.35)) {
          car.axis = 'v';
          car.road = vx;
          car.dir = w.rng.chance(0.5) ? 1 : -1;
          car.x = vx + (w.rng.chance(0.5) ? 18 : -18);
          break;
        }
      }
      if (car.x < 60 || car.x > WORLD.w - 320) car.dir *= -1;
    }
  }
}

function updatePeds(w, city, dt, fx) {
  const p = w.player;
  for (const ped of w.peds) {
    if (ped.down > 0) {
      ped.down -= dt;
      continue;
    }
    const dx = ped.tx - ped.x;
    const dy = ped.ty - ped.y;
    const d = Math.hypot(dx, dy);
    // Flee a fast car nearby.
    const carNear = !p.onFoot && Math.hypot(p.x - ped.x, p.y - ped.y) < 110 && Math.abs(p.speed) > 120;
    if (carNear) {
      const fx2 = ped.x - p.x;
      const fy = ped.y - p.y;
      const fd = Math.hypot(fx2, fy) || 1;
      ped.x += (fx2 / fd) * TUNE.pedSpeed * 2.2 * dt;
      ped.y += (fy / fd) * TUNE.pedSpeed * 2.2 * dt;
      ped.angle = Math.atan2(fy, fx2);
      continue;
    }
    if (d < 12) {
      ped.tx = Math.max(80, Math.min(WORLD.w - 340, ped.x + w.rng.range(-320, 320)));
      ped.ty = Math.max(80, Math.min(WORLD.h - 420, ped.y + w.rng.range(-320, 320)));
      continue;
    }
    ped.x += (dx / d) * ped.speed * dt;
    ped.y += (dy / d) * ped.speed * dt;
    ped.angle = Math.atan2(dy, dx);
    // Run over by a moving car.
    if (!p.onFoot && Math.abs(p.speed) > 60 && Math.hypot(p.x - ped.x, p.y - ped.y) < 32) {
      ped.down = 5;
      fx.crime(1, 'menabrak pejalan kaki');
      fx.sfx.noise(0.15, 0.15, 400);
      w.shake = 5;
      for (let i = 0; i < 8; i++) {
        w.parts.push({ x: ped.x, y: ped.y, vx: w.rng.range(-90, 90), vy: w.rng.range(-90, 90), life: 0.5, color: '#e07a5f', size: 4 });
      }
    }
  }
}

function spawnCop(w, city) {
  const p = w.player;
  const ang = w.rng.range(0, Math.PI * 2);
  const d = w.rng.range(420, 620);
  let x = p.x + Math.cos(ang) * d;
  let y = p.y + Math.sin(ang) * d;
  x = Math.max(80, Math.min(WORLD.w - 340, x));
  y = Math.max(80, Math.min(WORLD.h - 420, y));
  return {
    x, y, angle: Math.atan2(p.y - y, p.x - x), speed: 0,
    color: PALETTE.cop, kind: 'cop', hp: 60, disabled: 0, ramCd: 0,
    id: 'cop' + Math.floor(w.rng.next() * 1e9).toString(36),
  };
}

function updateCops(w, city, dt, fx) {
  const p = w.player;
  const want = Math.min(w.wanted, 4);
  while (w.cops.length < want) w.cops.push(spawnCop(w, city));
  if (w.wanted === 0 && w.cops.length > 0) {
    // No heat: the patrol drifts away.
    if (w.rng.chance(dt * 0.5)) w.cops.pop();
  }
  for (const cop of w.cops) {
    if (cop.disabled > 0) {
      cop.disabled -= dt;
      cop.speed *= 0.9;
      continue;
    }
    const dx = p.x - cop.x;
    const dy = p.y - cop.y;
    const d = Math.hypot(dx, dy);
    const wantAngle = Math.atan2(dy, dx);
    let diff = wantAngle - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff));
    cop.speed += (TUNE.copSpeed - cop.speed) * Math.min(1, dt * 1.4);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    const fixed = resolveCircleRects(nx, ny, 17, blockedRects(city));
    cop.x = fixed.x;
    cop.y = fixed.y;
    cop.ramCd -= dt;
    if (d < 36 && cop.ramCd <= 0) {
      cop.ramCd = 0.9;
      if (p.onFoot) {
        w.busted = true;
        fx.sfx.busted();
      } else {
        p.health -= TUNE.copRamDamage;
        w.shake = 8;
        fx.sfx.noise(0.2, 0.2, 300);
        if (p.health <= 0) {
          w.wasted = true;
          fx.sfx.busted();
        }
      }
    }
  }
}

function updateBullets(w, dt, fx) {
  for (const b of w.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    // Hit a cop.
    for (const cop of w.cops) {
      if (Math.hypot(b.x - cop.x, b.y - cop.y) < 20) {
        cop.hp -= TUNE.bulletDamage;
        b.life = 0;
        if (cop.hp <= 0) cop.disabled = 4;
        fx.sfx.noise(0.08, 0.1, 900);
        break;
      }
    }
    if (b.life <= 0) continue;
    for (const ped of w.peds) {
      if (ped.down <= 0 && Math.hypot(b.x - ped.x, b.y - ped.y) < 14) {
        ped.down = 6;
        b.life = 0;
        fx.crime(1, 'menembak');
        break;
      }
    }
  }
  w.bullets = w.bullets.filter((b) => b.life > 0);
}

function updatePickups(w, city, dt, fx) {
  const p = w.player;
  for (let i = w.pickups.length - 1; i >= 0; i--) {
    const pk = w.pickups[i];
    pk.bob += dt * 3;
    if (Math.hypot(p.x - pk.x, p.y - pk.y) < TUNE.pickupRadius) {
      if (pk.kind === 'health') p.health = Math.min(100, p.health + 40);
      else p.ammo += 12;
      fx.sfx.pickup();
      fx.pickup(pk.kind);
      w.pickups.splice(i, 1);
      w.pickups.push(spawnPickup(city, w.rng));
    }
  }
}

function updateCombat(w, input, dt, fx) {
  const p = w.player;
  p.punchCd -= dt;
  p.shootCd -= dt;
  if (!input.wasPressed('KeyF') || p.punchCd > 0) return;
  p.punchCd = 0.38;
  if (p.onFoot && p.ammo > 0) {
    // Shoot toward the facing direction.
    p.ammo -= 1;
    p.shootCd = 0.2;
    const bx = p.x + Math.cos(p.angle) * 26;
    const by = p.y + Math.sin(p.angle) * 26;
    w.bullets.push({ x: bx, y: by, vx: Math.cos(p.angle) * 620, vy: Math.sin(p.angle) * 620, life: TUNE.bulletRange / 620 });
    fx.sfx.shot();
    fx.crime(1, 'menembak');
    w.shake = 2;
    return;
  }
  // Punch: nearest ped or cop in range takes a hit.
  let best = null;
  let bestD = TUNE.punchRange;
  for (const ped of w.peds) {
    if (ped.down > 0) continue;
    const d = Math.hypot(ped.x - p.x, ped.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = { kind: 'ped', e: ped };
    }
  }
  for (const cop of w.cops) {
    const d = Math.hypot(cop.x - p.x, cop.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = { kind: 'cop', e: cop };
    }
  }
  if (best) {
    fx.sfx.punch();
    const e = best.e;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    e.x += Math.cos(a) * 26;
    e.y += Math.sin(a) * 26;
    if (best.kind === 'ped') {
      e.down = 4;
      fx.crime(1, 'memukul warga');
    } else {
      e.disabled = 2.5;
      fx.crime(2, 'memukul polisi');
    }
    w.shake = 3;
  }
}

export function stepWorld(w, city, input, dt, fx) {
  w.time += dt;
  const p = w.player;
  if (p.hurtCd > 0) p.hurtCd -= dt;
  if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 22);

  if (input.wasPressed('KeyE')) {
    if (p.onFoot) tryEnterCar(w, fx);
    else exitCar(w);
  }
  if (p.onFoot) moveOnFoot(w, city, input, dt);
  else driveCar(w, city, input, dt, fx);

  updateTraffic(w, city, dt);
  updatePeds(w, city, dt, fx);
  updateCops(w, city, dt, fx);
  updateBullets(w, dt, fx);
  updatePickups(w, city, dt, fx);
  updateCombat(w, input, dt, fx);

  // Wanted decays once the police lose sight of the player.
  const nearestCop = w.cops.reduce((m, c) => Math.min(m, Math.hypot(c.x - p.x, c.y - p.y)), Infinity);
  if (w.wanted > 0 && nearestCop > 600) {
    w.wantedTimer += dt;
    if (w.wantedTimer > 6) {
      w.wanted -= 1;
      w.wantedTimer = 0;
    }
  } else {
    w.wantedTimer = 0;
  }
  // Slow health recovery while the heat is off.
  if (w.wanted === 0 && p.health < 100) p.health = Math.min(100, p.health + 1.2 * dt);

  for (let i = w.parts.length - 1; i >= 0; i--) {
    const pt = w.parts[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
    if (pt.life <= 0) w.parts.splice(i, 1);
  }
  if (p.health <= 0 && !w.wasted) {
    w.wasted = true;
    fx.sfx.busted();
  }
}
