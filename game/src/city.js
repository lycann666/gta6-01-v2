// City generation for Teluk Surya: a road grid, building blocks, parks, a
// harbour strip on the east edge and a beach along the south edge.

import { WORLD, PALETTE } from './config.js';

export function buildCity(rng) {
  const { w, h, roadGap, roadWidth } = WORLD;
  const vertical = [];
  const horizontal = [];
  for (let x = roadGap / 2; x < w; x += roadGap) vertical.push(x);
  for (let y = roadGap / 2; y < h; y += roadGap) horizontal.push(y);

  const buildings = [];
  const parks = [];
  const half = roadWidth / 2 + 16;
  for (let row = 0; row < horizontal.length - 1; row++) {
    for (let col = 0; col < vertical.length - 1; col++) {
      const x0 = vertical[col] + half;
      const y0 = horizontal[row] + half;
      const x1 = vertical[col + 1] - half;
      const y1 = horizontal[row + 1] - half;
      // Keep the harbour (far east) and the beach (far south) clear.
      if (x0 > w - 420 || y0 > h - 380) continue;
      if (rng.chance(0.16)) {
        parks.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        continue;
      }
      const bw = (x1 - x0) * rng.range(0.42, 0.62);
      const bh = (y1 - y0) * rng.range(0.42, 0.62);
      const bx = x0 + (x1 - x0 - bw) / 2 + rng.range(-8, 8);
      const by = y0 + (y1 - y0 - bh) / 2 + rng.range(-8, 8);
      buildings.push({
        x: bx,
        y: by,
        w: bw,
        h: bh,
        color: rng.pick(PALETTE.building),
        roof: rng.chance(0.5),
      });
    }
  }

  // Trees: a few inside every park, plus street trees along the sidewalks
  // (just off the road edge, so they never block a building or a lane).
  const trees = [];
  for (const pk of parks) {
    const n = 3 + Math.floor(rng.next() * 3);
    for (let i = 0; i < n; i++) {
      trees.push({
        x: pk.x + 24 + rng.next() * Math.max(10, pk.w - 48),
        y: pk.y + 24 + rng.next() * Math.max(10, pk.h - 48),
        r: rng.range(9, 14),
      });
    }
  }
  for (const vx of vertical) {
    for (let y = roadGap; y < h - roadGap; y += roadGap) {
      if (rng.chance(0.55)) {
        trees.push({ x: vx + (rng.chance(0.5) ? 47 : -47), y: y + rng.range(-140, 140), r: rng.range(9, 13) });
      }
    }
  }
  for (const hy of horizontal) {
    for (let x = roadGap; x < w - 420; x += roadGap) {
      if (rng.chance(0.5)) {
        trees.push({ x: x + rng.range(-140, 140), y: hy + (rng.chance(0.5) ? 47 : -47), r: rng.range(9, 13) });
      }
    }
  }

  return {
    vertical,
    horizontal,
    buildings,
    parks,
    trees,
    water: { x0: w - 260, y0: 0, w: 260, h: h - 380 },
    beach: { x0: 0, y0: h - 380, w: w - 260, h: 380 },
    dock: { x: w - 300, y: 300, w: 46, h: 560 },
    pier: { x: w - 320, y: 900, w: 70, h: 260 },
  };
}

// Push a circle (x, y, r) out of every rect it overlaps. Returns corrected pos.
export function resolveCircleRects(x, y, r, rects) {
  for (const b of rects) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 0.01) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      } else {
        y = b.y - r;
      }
    }
  }
  return { x, y };
}

export function pointInRects(x, y, rects) {
  for (const b of rects) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

export function clampToWorld(x, y, margin) {
  return {
    x: Math.max(margin, Math.min(WORLD.w - margin, x)),
    y: Math.max(margin, Math.min(WORLD.h - margin, y)),
  };
}

// Nearest point on the road network (used to spawn traffic and parked cars).
export function nearestRoadPoint(x, y, city, rng) {
  let best = null;
  let bestD = Infinity;
  for (const vx of city.vertical) {
    const d = Math.abs(x - vx);
    if (d < bestD) {
      bestD = d;
      best = { x: vx, y, axis: 'v' };
    }
  }
  for (const hy of city.horizontal) {
    const d = Math.abs(y - hy);
    if (d < bestD) {
      bestD = d;
      best = { x, y: hy, axis: 'h' };
    }
  }
  return best;
}
