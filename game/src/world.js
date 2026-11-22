// Level layout for the Midnight Vault Job: one gallery/vault floor the thief
// crosses in a single frame. Walls, cover crates, shadow patches, loot
// targets, patrol routes, cameras and the exit are all defined here.

export const ROOM = { w: 1280, h: 800, wall: 24 };

// Crates block movement and block line of sight. They are the cover the
// thief hides behind between patrol gaps.
export const CRATES = [
  { x: 220, y: 300, w: 110, h: 70 },   // west crate row
  { x: 220, y: 430, w: 110, h: 70 },
  { x: 560, y: 430, w: 120, h: 70 },  // centre crate
  { x: 560, y: 560, w: 120, h: 70 },
  { x: 860, y: 300, w: 110, h: 70 },  // east crate row
  { x: 860, y: 430, w: 110, h: 70 },
  { x: 980, y: 560, w: 110, h: 70 },
  { x: 380, y: 130, w: 90, h: 56 },   // top gallery plinth row
  { x: 820, y: 130, w: 90, h: 56 },
];

// Shadow patches: standing in one halves how fast the alarm rises.
export const SHADOWS = [
  { x: 150, y: 560, w: 150, h: 130 },
  { x: 470, y: 210, w: 160, h: 110 },
  { x: 1000, y: 180, w: 150, h: 120 },
  { x: 700, y: 600, w: 160, h: 120 },
];

// Loot targets. Collect any 3 of the 5, then reach the exit to win.
export const LOOT = [
  { id: 'painting-blue', kind: 'painting', name: 'Blue Madonna', x: 150, y: 96, value: 400 },
  { id: 'painting-gold', kind: 'painting', name: 'Golden Duchess', x: 640, y: 96, value: 600 },
  { id: 'painting-crimson', kind: 'painting', name: 'Crimson Count', x: 1130, y: 96, value: 500 },
  { id: 'gem', kind: 'gem', name: 'Star of Aurelia', x: 640, y: 330, value: 900 },
  { id: 'safe', kind: 'safe', name: 'Vault Safe', x: 1120, y: 640, value: 800 },
];

export const LOOT_NEEDED = 3;

// The exit: the service door the thief slipped in through, bottom-left.
export const EXIT = { x: 24, y: 690, w: 150, h: 86 };

export const THIEF_START = { x: 100, y: 730 };

export const GUARD_ROUTES = [
  // Top gallery guard, sweeps the paintings.
  { waypoints: [{ x: 300, y: 190 }, { x: 980, y: 190 }, { x: 980, y: 300 }, { x: 300, y: 300 }], speed: 58, pause: 1.2 },
  // Middle floor guard, crosses the crates.
  { waypoints: [{ x: 200, y: 500 }, { x: 640, y: 500 }, { x: 640, y: 640 }, { x: 200, y: 640 }], speed: 52, pause: 1.6 },
  // East guard, watches the safe and the crimson painting.
  { waypoints: [{ x: 1090, y: 210 }, { x: 1090, y: 560 }], speed: 62, pause: 1.0 },
];

export const CAMERAS = [
  // Ceiling camera over the top gallery, sweeps left-right.
  { x: 640, y: 30, baseAngle: Math.PI / 2, sweep: 1.05, speed: 0.55, range: 270, halfAngle: 0.5 },
  // Wall camera on the east side, sweeps up-down across the safe.
  { x: 1252, y: 420, baseAngle: Math.PI, sweep: 0.8, speed: 0.7, range: 260, halfAngle: 0.48 },
];

// --- geometry helpers -------------------------------------------------------

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

// True when the segment a->b crosses any crate (walls are the room border,
// handled by clamping). Used for line-of-sight checks.
export function segmentBlocked(ax, ay, bx, by) {
  for (const c of CRATES) {
    if (segmentIntersectsRect(ax, ay, bx, by, c)) return true;
  }
  return false;
}

function segmentIntersectsRect(ax, ay, bx, by, r) {
  // Liang-Barsky clipping: the segment enters the rect iff the clipped
  // parameter interval is non-empty.
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - r.x, r.x + r.w - ax, ay - r.y, r.y + r.h - ay];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

export function inShadow(x, y) {
  for (const s of SHADOWS) if (pointInRect(x, y, s)) return true;
  return false;
}
