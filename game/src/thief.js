// The thief: movement, sneaking, the coin distraction and the camera EMP.

import { ROOM, CRATES, circleHitsRect, pointInRect, inShadow } from './world.js';

export const THIEF_RADIUS = 14;
const WALK_SPEED = 175;
const SNEAK_SPEED = 88;

export class Thief {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.dir = 0;            // facing angle, radians
    this.sneaking = false;
    this.moving = false;
    this.coins = 3;          // coin distractions left
    this.emp = 1;            // camera EMP charges left
    this.empTimer = 0;       // seconds of camera blackout remaining
    this.coin = null;        // {x, y, t} a coin ringing on the floor
    this.coinCooldown = 0;
  }

  reset(x, y) {
    this.x = x; this.y = y; this.dir = 0;
    this.sneaking = false; this.moving = false;
    this.coins = 3; this.emp = 1; this.empTimer = 0;
    this.coin = null; this.coinCooldown = 0;
  }

  // Move from keyboard input; axis-separated so the thief slides along walls.
  update(dt, keys) {
    let mx = 0, my = 0;
    if (keys.left) mx -= 1;
    if (keys.right) mx += 1;
    if (keys.up) my -= 1;
    if (keys.down) my += 1;
    this.sneaking = !!keys.sneak;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len; my /= len;
      this.dir = Math.atan2(my, mx);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      this.tryMove(mx * speed * dt, 0);
      this.tryMove(0, my * speed * dt);
    }
    if (this.empTimer > 0) this.empTimer -= dt;
    if (this.coinCooldown > 0) this.coinCooldown -= dt;
    if (this.coin) {
      this.coin.t -= dt;
      if (this.coin.t <= 0) this.coin = null;
    }
  }

  tryMove(dx, dy) {
    const nx = this.x + dx, ny = this.y + dy;
    const w = ROOM.wall;
    if (nx < w + THIEF_RADIUS || nx > ROOM.w - w - THIEF_RADIUS) return;
    if (ny < w + THIEF_RADIUS || ny > ROOM.h - w - THIEF_RADIUS) return;
    for (const c of CRATES) {
      if (circleHitsRect(nx, ny, THIEF_RADIUS, c)) return;
    }
    this.x = nx; this.y = ny;
  }

  // Click on the floor: toss a coin there if one is left and it is in range.
  // Guards who hear it walk over to look. Returns true when a coin flew.
  throwCoin(tx, ty) {
    if (this.coins <= 0 || this.coinCooldown > 0) return false;
    const d = Math.hypot(tx - this.x, ty - this.y);
    if (d > 340 || d < 24) return false;
    this.coins -= 1;
    this.coinCooldown = 0.6;
    this.coin = { x: tx, y: ty, t: 4 };
    return true;
  }

  // E key: one EMP burst that blinds every camera for 8 seconds.
  useEmp() {
    if (this.emp <= 0 || this.empTimer > 0) return false;
    this.emp -= 1;
    this.empTimer = 8;
    return true;
  }

  inShadowNow() { return inShadow(this.x, this.y); }
}
