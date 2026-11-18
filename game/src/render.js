// Rendering for Teluk Surya: the city, entities, effects, HUD and minimap.
// Top-down 2D canvas, camera follows the player.

import { WORLD, PALETTE, TUNE, STORY } from './config.js';
import { missionName } from './missions.js';

const VIEW_W = 1280;
const VIEW_H = 720;

function drawCar(ctx, x, y, angle, color, isCop) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-19, -11, 38, 24);
  ctx.fillStyle = color;
  roundRect(ctx, -18, -10, 36, 20, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.fillRect(2, -8, 8, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(-16, -10, 5, 4);
  ctx.fillRect(-16, 6, 5, 4);
  ctx.fillRect(13, -10, 5, 4);
  ctx.fillRect(13, 6, 5, 4);
  if (isCop) {
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(-6, -11, 5, 4);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(1, -11, 5, 4);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLISI', 0, 3);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCity(ctx, city, cam) {
  // Ground.
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(cam.x, cam.y, VIEW_W, VIEW_H);
  // Beach.
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, city.beach.y0 - cam.y, VIEW_W, city.beach.h);
  // Harbour water.
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(city.water.x0 - cam.x, 0, city.water.w, city.water.h);
  ctx.fillStyle = PALETTE.deepWater;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(city.water.x0 - cam.x + 30, 120 + i * 130 - cam.y, 180, 8);
  }
  // Dock + pier.
  ctx.fillStyle = PALETTE.dock;
  ctx.fillRect(city.dock.x - cam.x, city.dock.y - cam.y, city.dock.w, city.dock.h);
  ctx.fillRect(city.pier.x - cam.x, city.pier.y - cam.y, city.pier.w, city.pier.h);
  // Parks.
  for (const pk of city.parks) {
    ctx.fillStyle = PALETTE.park;
    ctx.fillRect(pk.x - cam.x, pk.y - cam.y, pk.w, pk.h);
    ctx.fillStyle = '#4e8a3f';
    for (let i = 0; i < 4; i++) {
      const tx = pk.x + 30 + ((i * 53) % Math.max(20, pk.w - 60));
      const ty = pk.y + 30 + ((i * 37) % Math.max(20, pk.h - 60));
      ctx.beginPath();
      ctx.arc(tx - cam.x, ty - cam.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Roads.
  ctx.fillStyle = PALETTE.road;
  for (const vx of city.vertical) {
    ctx.fillRect(vx - WORLD.roadWidth / 2 - cam.x, 0, WORLD.roadWidth, VIEW_H);
  }
  for (const hy of city.horizontal) {
    ctx.fillRect(0, hy - WORLD.roadWidth / 2 - cam.y, VIEW_W, WORLD.roadWidth);
  }
  // Lane dashes.
  ctx.fillStyle = PALETTE.roadLine;
  for (const vx of city.vertical) {
    for (let y = Math.floor(cam.y / 48) * 48; y < cam.y + VIEW_H; y += 48) {
      ctx.fillRect(vx - 2 - cam.x, y - cam.y, 4, 22);
    }
  }
  for (const hy of city.horizontal) {
    for (let x = Math.floor(cam.x / 48) * 48; x < cam.x + VIEW_W; x += 48) {
      ctx.fillRect(x - cam.x, hy - 2 - cam.y, 22, 4);
    }
  }
  // Sidewalks.
  ctx.strokeStyle = PALETTE.sidewalk;
  ctx.lineWidth = 4;
  for (const vx of city.vertical) {
    ctx.beginPath();
    ctx.moveTo(vx - WORLD.roadWidth / 2 - 7 - cam.x, 0);
    ctx.lineTo(vx - WORLD.roadWidth / 2 - 7 - cam.x, VIEW_H);
    ctx.moveTo(vx + WORLD.roadWidth / 2 + 7 - cam.x, 0);
    ctx.lineTo(vx + WORLD.roadWidth / 2 + 7 - cam.x, VIEW_H);
    ctx.stroke();
  }
  // Buildings: darker rim, top shade, lighter roof inset and a rooftop box.
  for (const b of city.buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, 8);
    if (b.roof) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + 8 - cam.x, b.y + 8 - cam.y, b.w - 16, b.h - 16);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(b.x + b.w / 2 - 10 - cam.x, b.y + b.h / 2 - 10 - cam.y, 20, 20);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(b.x + 12 - cam.x, b.y + 12 - cam.y, 20, 14);
  }
  // Trees: shadow ring, canopy, highlight.
  for (const t of city.trees) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(t.x - cam.x + 2, t.y - cam.y + 3, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f7d32';
    ctx.beginPath();
    ctx.arc(t.x - cam.x, t.y - cam.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(t.x - cam.x - 2, t.y - cam.y - 2, t.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEntities(ctx, w, m, cam) {
  // Pickups.
  for (const pk of w.pickups) {
    const bob = Math.sin(pk.bob) * 3;
    ctx.save();
    ctx.translate(pk.x - cam.x, pk.y - cam.y + bob);
    ctx.fillStyle = pk.kind === 'health' ? '#ff5d5d' : '#ffd23d';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pk.kind === 'health' ? '+' : 'A', 0, 1);
    ctx.restore();
  }
  // Mission target marker.
  if (!m.done) {
    const tx = m.target.x - cam.x;
    const ty = m.target.y - cam.y;
    const pulse = 1 + Math.sin(w.time * 4) * 0.12;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#ffd23d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(-9, -16);
    ctx.lineTo(9, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Direction arrow at screen edge when the target is off-screen.
    if (tx < 40 || tx > VIEW_W - 40 || ty < 40 || ty > VIEW_H - 40) {
      const cx = Math.max(50, Math.min(VIEW_W - 50, tx));
      const cy = Math.max(50, Math.min(VIEW_H - 50, ty));
      const a = Math.atan2(ty - VIEW_H / 2, tx - VIEW_W / 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = '#ffd23d';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -11);
      ctx.lineTo(-10, 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  // Pedestrians.
  for (const ped of w.peds) {
    ctx.save();
    ctx.translate(ped.x - cam.x, ped.y - cam.y);
    if (ped.down > 0) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#888';
    } else {
      ctx.rotate(ped.angle);
      ctx.fillStyle = ped.color;
    }
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(5, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Cars (parked + traffic + player car).
  for (const car of w.cars) {
    drawCar(ctx, car.x - cam.x, car.y - cam.y, car.angle, car.color, false);
    if (car.missionCar) {
      ctx.save();
      ctx.translate(car.x - cam.x, car.y - cam.y - 30);
      ctx.fillStyle = '#2f6fd9';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ SEDAN BIRU', 0, 0);
      ctx.restore();
    }
  }
  // Police.
  for (const cop of w.cops) {
    drawCar(ctx, cop.x - cam.x, cop.y - cam.y, cop.angle, cop.color, true);
  }
  // Bullets.
  ctx.fillStyle = '#ffe66d';
  for (const b of w.bullets) {
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Particles.
  for (const pt of w.parts) {
    ctx.globalAlpha = Math.max(0, pt.life * 2);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x - cam.x, pt.y - cam.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Player on foot.
  const p = w.player;
  if (p.onFoot) {
    ctx.save();
    ctx.translate(p.x - cam.x, p.y - cam.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(6, -3, 10, 6);
    ctx.restore();
  }
}

function drawMinimap(ctx, w, m, city) {
  const mw = 210;
  const mh = 158;
  const mx = VIEW_W - mw - 14;
  const my = 14;
  const sx = mw / WORLD.w;
  const sy = mh / WORLD.h;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#101418';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#ffffff55';
  ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#2e7fb8';
  ctx.fillRect(mx + city.water.x0 * sx, my, city.water.w * sx, city.water.h * sy);
  ctx.fillStyle = '#e3cd96';
  ctx.fillRect(mx, my + city.beach.y0 * sy, city.beach.w * sx, city.beach.h * sy);
  ctx.fillStyle = '#3d3f45';
  for (const vx of city.vertical) ctx.fillRect(mx + vx * sx - 1, my, 2, mh);
  for (const hy of city.horizontal) ctx.fillRect(mx, my + hy * sy - 1, mw, 2);
  if (!m.done) {
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.arc(mx + m.target.x * sx, my + m.target.y * sy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#4fc3f7';
  for (const cop of w.cops) {
    ctx.beginPath();
    ctx.arc(mx + cop.x * sx, my + cop.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(mx + w.player.x * sx, my + w.player.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx + w.player.x * sx, my + w.player.y * sy, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, w, m) {
  const p = w.player;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(12, 12, 300, 96);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Uang: $' + w.cash, 24, 22);
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('★'.repeat(w.wanted) + '☆'.repeat(Math.max(0, 5 - w.wanted)), 24, 48);
  ctx.fillStyle = '#ff5d5d';
  ctx.fillRect(24, 76, 150, 12);
  ctx.fillStyle = '#57d977';
  ctx.fillRect(24, 76, 150 * Math.max(0, p.health / 100), 12);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText('Nyawa ' + Math.ceil(p.health), 182, 75);
  ctx.fillText(p.onFoot ? 'Jalan kaki' : 'Mengemudi  ' + Math.round(Math.abs(p.speed) * 0.36) + ' km/j', 24, 92);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText('Peluru: ' + p.ammo, 220, 92);
  // Mission line.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(12, VIEW_H - 64, 560, 52);
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Misi ' + (m.index + 1) + '/5 — ' + missionName(m) + '  ·  ' + m.targetLabel, 24, VIEW_H - 54);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  const brief = m.message.length > 78 ? m.message.slice(0, 78) + '…' : m.message;
  ctx.fillText(brief, 24, VIEW_H - 32);
  if (m.flash > 0) {
    ctx.fillStyle = '#57d977';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PEKERJAAN SELESAI!', VIEW_W / 2, 120);
  }
  if (w.musicOn) {
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('♪ Musik ON (N)', VIEW_W - 16, VIEW_H - 16);
  }
  ctx.restore();
}

function drawScreen(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,12,20,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 310 + i * 32));
  ctx.restore();
}

export function drawGame(ctx, w, m, city, cam, mode) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  if (w.shake > 0) ctx.translate((Math.random() - 0.5) * w.shake, (Math.random() - 0.5) * w.shake);
  drawCity(ctx, city, cam);
  drawEntities(ctx, w, m, cam);
  ctx.restore();
  drawMinimap(ctx, w, m, city);
  drawHud(ctx, w, m);
  if (mode === 'title') {
    drawScreen(ctx, STORY.title, [
      STORY.subtitle,
      '',
      'Dimas Anggara berutang besar pada Laras Wulandari, sang pengatur kota.',
      'Lima pekerjaan, satu malam, dan utang itu lunas — kalau polisi tidak menangkapnya dulu.',
      '',
      w.best > 0 ? 'Uang terbaik sejauh ini: $' + w.best : 'Belum ada uang tersimpan — mulai malam pertamamu.',
      '',
      STORY.controlsHint,
      '',
      'Tekan ENTER atau klik untuk mulai',
    ], '#ffd23d');
  } else if (mode === 'pause') {
    drawScreen(ctx, 'JEDA', ['Tekan P untuk lanjut', 'Progres tersimpan otomatis'], '#fff');
  } else if (mode === 'busted') {
    drawScreen(ctx, 'TERTANGKAP!', ['Polisi menangkapmu di tengah kota.', 'Tekan ENTER untuk coba lagi'], '#ff5d5d');
  } else if (mode === 'wasted') {
    drawScreen(ctx, 'GAME OVER', ['Dimas tumbang di jalanan Teluk Surya.', 'Tekan ENTER untuk coba lagi'], '#ff5d5d');
  } else if (mode === 'win') {
    drawScreen(ctx, 'UTANG LUNAS!', [
      'Lima pekerjaan selesai. Laras melunasi utang Dimas.',
      'Uang terkumpul: $' + w.cash,
      '',
      'Tekan ENTER untuk main lagi',
    ], '#57d977');
  }
}

export { VIEW_W, VIEW_H };
