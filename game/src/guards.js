// Patrolling guards: they walk their route, pause at waypoints, and watch a
// vision cone. Spotting the thief raises the alarm; touching the thief
// catches them on the spot. A ringing coin lures a nearby guard off route.

import { segmentBlocked, inShadow } from './world.js';

export const GUARD_RADIUS = 15;
export const CONE_RANGE = 225;
export const CONE_HALF = 0.56; // ~32 degrees each side
const CATCH_RADIUS = 24;

export class Guard {
  constructor(route) {
    this.route = route;
    this.wp = 0;
    this.x = route.waypoints[0].x;
    this.y = route.waypoints[0].y;
    this.dir = 0;
    this.pauseTimer = 0;
    this.investigate = null; // {x, y} coin landing spot under inspection
    this.inspectTimer = 0;
    this.alert = 0;          // 0..1, how suspicious this guard is right now
  }

  update(dt, thief) {
    // A ringing coin within earshot pulls the guard off patrol.
    if (thief.coin && !this.investigate) {
      const d = Math.hypot(thief.coin.x - this.x, thief.coin.y - this.y);
      if (d < 170) this.investigate = { x: thief.coin.x, y: thief.coin.y };
    }
    if (this.investigate) {
      const arrived = this.walkToward(this.investigate.x, this.investigate.y, dt, this.route.speed * 1.25);
      if (arrived) {
        this.inspectTimer += dt;
        if (this.inspectTimer > 2.2) { this.investigate = null; this.inspectTimer = 0; }
      }
      return;
    }
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      // Look around while pausing: slow scan of the room.
      this.dir += dt * 0.9;
      return;
    }
    const target = this.route.waypoints[this.wp];
    const arrived = this.walkToward(target.x, target.y, dt, this.route.speed);
    if (arrived) {
      this.pauseTimer = this.route.pause;
      this.wp = (this.wp + 1) % this.route.waypoints.length;
    }
  }

  walkToward(tx, ty, dt, speed) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return true;
    this.dir = Math.atan2(dy, dx);
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    return d - step < 4;
  }

  // How much this guard sees the thief right now: 0 = not seen, 1 = dead
  // centre of the cone at point-blank range. Crates block the view.
  seesThief(thief) {
    const dx = thief.x - this.x, dy = thief.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d > CONE_RANGE) return 0;
    let ang = Math.atan2(dy, dx) - this.dir;
    while (ang > Math.PI) ang -= 2 * Math.PI;
    while (ang < -Math.PI) ang += 2 * Math.PI;
    if (Math.abs(ang) > CONE_HALF) return 0;
    if (segmentBlocked(this.x, this.y, thief.x, thief.y)) return 0;
    const rangeFactor = 1 - (d / CONE_RANGE) * 0.75;
    const angleFactor = 1 - (Math.abs(ang) / CONE_HALF) * 0.6;
    let seen = rangeFactor * angleFactor;
    if (thief.sneaking) seen *= 0.55;
    if (inShadow(thief.x, thief.y)) seen *= 0.5;
    return seen;
  }

  touchesThief(thief) {
    return Math.hypot(thief.x - this.x, thief.y - this.y) < CATCH_RADIUS;
  }
}
