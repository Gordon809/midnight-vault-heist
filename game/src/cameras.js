// Security cameras: wall-mounted, sweeping a vision cone back and forth.
// They raise the alarm like guards do, but they never move — and one EMP
// burst blinds them all for a few seconds.

import { segmentBlocked, inShadow } from './world.js';

export class Camera {
  constructor(spec) {
    this.x = spec.x; this.y = spec.y;
    this.baseAngle = spec.baseAngle;
    this.sweep = spec.sweep;
    this.speed = spec.speed;
    this.range = spec.range;
    this.halfAngle = spec.halfAngle;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = spec.baseAngle;
    this.disabled = false;
  }

  update(dt, empTimer) {
    this.disabled = empTimer > 0;
    if (this.disabled) return;
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
  }

  seesThief(thief) {
    if (this.disabled) return 0;
    const dx = thief.x - this.x, dy = thief.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d > this.range) return 0;
    let ang = Math.atan2(dy, dx) - this.angle;
    while (ang > Math.PI) ang -= 2 * Math.PI;
    while (ang < -Math.PI) ang += 2 * Math.PI;
    if (Math.abs(ang) > this.halfAngle) return 0;
    if (segmentBlocked(this.x, this.y, thief.x, thief.y)) return 0;
    const rangeFactor = 1 - (d / this.range) * 0.7;
    const angleFactor = 1 - (Math.abs(ang) / this.halfAngle) * 0.5;
    let seen = rangeFactor * angleFactor;
    if (thief.sneaking) seen *= 0.6;
    if (inShadow(thief.x, thief.y)) seen *= 0.5;
    return seen;
  }
}
