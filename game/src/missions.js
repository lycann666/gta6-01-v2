// Mission flow for Teluk Surya: five jobs from fixer Laras. Each mission has
// steps with a target point; arriving completes the step, and finishing a
// mission pays cash. The controller only reads world state — it never moves
// the player itself.

import { WORLD, TUNE, MISSION_DEFS } from './config.js';

function farPoint(w, rng, minD, maxD) {
  const p = w.player;
  for (let tries = 0; tries < 24; tries++) {
    const x = rng.range(150, WORLD.w - 400);
    const y = rng.range(150, WORLD.h - 450);
    if (Math.hypot(x - p.x, y - p.y) > minD && Math.hypot(x - p.x, y - p.y) < maxD) {
      return { x, y };
    }
  }
  return { x: 600, y: 600 };
}

export function createMissions(city, rng) {
  return {
    index: 0, // which mission (0..4), 5 = all done
    step: 0,
    target: { x: WORLD.w - 285, y: 1030 }, // pier, first job
    targetLabel: 'Dermaga',
    timer: 0,
    delivered: 0,
    packageTargets: [],
    escapeTimer: 0,
    done: false,
    message: MISSION_DEFS[0].brief,
    flash: 0,
  };
}

export function missionName(m) {
  if (m.index >= MISSION_DEFS.length) return 'Selesai';
  return MISSION_DEFS[m.index].name;
}

function setTarget(m, x, y, label) {
  m.target = { x, y };
  m.targetLabel = label;
}

function completeMission(w, m, fx) {
  const def = MISSION_DEFS[m.index];
  w.cash += def.reward;
  fx.sfx.jingle();
  fx.sfx.coin();
  m.flash = 2.2;
  m.index += 1;
  m.step = 0;
  m.delivered = 0;
  if (m.index >= MISSION_DEFS.length) {
    m.done = true;
    m.message = 'Semua pekerjaan selesai! Laras melunasi utangmu. Pergi ke kapal? Tidak — kamu bebas.';
    return;
  }
  const next = MISSION_DEFS[m.index];
  m.message = 'Pekerjaan selesai! +' + def.reward + ' uang. Berikutnya: ' + next.name + ' — ' + next.brief;
  startMission(w, m, fx);
}

function startMission(w, m, fx) {
  const rng = w.rng;
  const idx = m.index;
  if (idx === 0) {
    setTarget(m, WORLD.w - 285, 1030, 'Dermaga');
  } else if (idx === 1) {
    // Mark one parked car as the target sedan and paint it blue.
    const parked = w.cars.filter((c) => c.kind === 'parked');
    const car = parked[Math.floor(rng.next() * parked.length)] || w.cars[0];
    car.missionCar = true;
    car.color = '#2f6fd9';
    setTarget(m, car.x, car.y, 'Sedan Biru');
    m.message = MISSION_DEFS[1].brief;
  } else if (idx === 2) {
    m.packageTargets = [
      farPoint(w, rng, 300, 1400),
      farPoint(w, rng, 500, 1600),
      farPoint(w, rng, 500, 1800),
    ];
    m.delivered = 0;
    setTarget(m, m.packageTargets[0].x, m.packageTargets[0].y, 'Paket 1/3');
    m.message = MISSION_DEFS[2].brief;
  } else if (idx === 3) {
    w.wanted = Math.max(w.wanted, 3);
    m.escapeTimer = 60;
    setTarget(m, 420, 420, 'Rumah Aman');
    m.message = MISSION_DEFS[3].brief;
  } else if (idx === 4) {
    w.wanted = Math.max(w.wanted, 4);
    setTarget(m, WORLD.w - 285, 480, 'Kapal');
    m.message = MISSION_DEFS[4].brief;
  }
}

export function updateMissions(w, m, city, dt, fx) {
  if (m.done) return;
  if (m.flash > 0) m.flash -= dt;
  const p = w.player;
  const idx = m.index;
  const d = Math.hypot(p.x - m.target.x, p.y - m.target.y);

  if (idx === 0) {
    if (d < TUNE.missionRadius) completeMission(w, m, fx);
  } else if (idx === 1) {
    if (m.step === 0) {
      // Reach the blue sedan, then steal it (E).
      if (d < TUNE.missionRadius && p.onFoot) {
        m.message = 'Itu dia sedan birunya. Tekan E untuk mencuri!';
      }
      if (!p.onFoot && p.car && p.car.missionCar) {
        m.step = 1;
        setTarget(m, 500, WORLD.h - 500, 'Titik Serah Terima');
        m.message = 'Bagus! Sekarang antar sedan ini ke titik serah terima di barat daya.';
      }
    } else if (d < TUNE.missionRadius) {
      completeMission(w, m, fx);
    }
  } else if (idx === 2) {
    if (d < TUNE.missionRadius) {
      m.delivered += 1;
      fx.sfx.coin();
      w.cash += 60;
      if (m.delivered >= 3) {
        completeMission(w, m, fx);
      } else {
        const t = m.packageTargets[m.delivered];
        setTarget(m, t.x, t.y, 'Paket ' + (m.delivered + 1) + '/3');
        m.message = 'Paket ' + m.delivered + '/3 terkirim (+60). Lanjut ke alamat berikutnya.';
      }
    }
  } else if (idx === 3) {
    m.escapeTimer -= dt;
    if (m.escapeTimer <= 0) {
      // Survived the raid: the heat drops and the safe house counts.
      w.wanted = 0;
      m.message = 'Razia reda. Sekarang sembunyi di rumah aman.';
      if (d < TUNE.missionRadius) completeMission(w, m, fx);
      else setTarget(m, 420, 420, 'Rumah Aman');
    } else {
      m.message = 'Bertahan dari razia! ' + Math.ceil(m.escapeTimer) + ' detik lagi — lalu ke rumah aman.';
    }
  } else if (idx === 4) {
    if (d < TUNE.missionRadius) completeMission(w, m, fx);
  }
}

export function beginMissions(w, m, fx) {
  startMission(w, m, fx);
}
