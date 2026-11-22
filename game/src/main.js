// Midnight Vault Job — game loop and rules.
// One gallery, one thief, three guards, two cameras, five treasures.
// Steal 3, reach the exit. Alarm at 100% or a guard's hands on you: caught.

import { ROOM, LOOT, LOOT_NEEDED, EXIT, THIEF_START, GUARD_ROUTES, CAMERAS, pointInRect } from './world.js';
import { Thief, THIEF_RADIUS } from './thief.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { drawWorld, drawHud, drawTitle, drawEnd } from './render.js';

// Alarm rises this fast (per second) at full visibility; detection quality
// scales it down. It decays slowly while nobody sees the thief.
const ALARM_RATE = 34;
const ALARM_DECAY = 5.5;
const GRAB_RANGE = 78;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  state: 'title', // title | play | win | lose
  time: 0,
  alarm: 0,
  lootTaken: new Set(),
  lootNeeded: LOOT_NEEDED,
  thief: new Thief(THIEF_START.x, THIEF_START.y),
  guards: GUARD_ROUTES.map((r) => new Guard(r)),
  cameras: CAMERAS.map((c) => new Camera(c)),
  input: new Input(canvas),
  sound: new Sound(),
  startFlash: 0,
  loseReason: '',
  endTime: '',
  stepTimer: 0,
  blipTimer: 0,
  nearLoot() {
    for (const item of LOOT) {
      if (this.lootTaken.has(item.id)) continue;
      if (Math.hypot(item.x - this.thief.x, item.y - this.thief.y) < GRAB_RANGE) return item;
    }
    return null;
  },
};

function reset() {
  // Clear any stale input so the fresh game (or the win/lose screen) waits
  // for a new key press or click instead of instantly restarting.
  game.input.anyKey = false;
  game.input.takeClicks();
  game.input.takeEmp();
  game.state = 'play';
  game.time = 0;
  game.alarm = 0;
  game.lootTaken = new Set();
  game.thief.reset(THIEF_START.x, THIEF_START.y);
  game.guards = GUARD_ROUTES.map((r) => new Guard(r));
  game.cameras = CAMERAS.map((c) => new Camera(c));
  game.loseReason = '';
  game.endTime = '';
}

function formatTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function grabLoot(item) {
  game.lootTaken.add(item.id);
  game.sound.loot();
}

function update(dt) {
  game.time += dt;
  const thief = game.thief;
  thief.update(dt, game.input.keys);

  if (game.input.takeEmp()) {
    if (thief.useEmp()) game.sound.emp();
  }

  // Mouse clicks: grab loot up close, otherwise toss a coin.
  for (const click of game.input.takeClicks()) {
    game.sound.ensure();
    const near = game.nearLoot();
    if (near && Math.hypot(near.x - click.x, near.y - click.y) < 90) {
      grabLoot(near);
      continue;
    }
    if (thief.throwCoin(click.x, click.y)) game.sound.coin();
  }

  // Walking over loot grabs it too — the quick-fingered thief pockets it.
  const near = game.nearLoot();
  if (near && Math.hypot(near.x - thief.x, near.y - thief.y) < 30) grabLoot(near);

  // Footsteps.
  if (thief.moving) {
    game.stepTimer -= dt;
    if (game.stepTimer <= 0) {
      game.sound.step();
      game.stepTimer = thief.sneaking ? 0.55 : 0.32;
    }
  }

  // Detection: guards and cameras feed the alarm.
  let seen = 0;
  for (const g of game.guards) {
    g.update(dt, thief);
    const s = g.seesThief(thief);
    g.alert = Math.max(0, Math.min(1, g.alert + (s > 0 ? dt * 2 : -dt * 1.5)));
    seen = Math.max(seen, s);
    if (g.touchesThief(thief)) {
      endGame(false, 'A guard grabbed you by the collar.');
      return;
    }
  }
  for (const cam of game.cameras) {
    cam.update(dt, thief.empTimer);
    seen = Math.max(seen, cam.seesThief(thief));
  }

  if (seen > 0) {
    game.alarm += ALARM_RATE * seen * dt;
    game.blipTimer -= dt;
    if (game.blipTimer <= 0) {
      game.sound.alarmBlip(Math.min(1, game.alarm / 100));
      game.blipTimer = 0.9 - 0.55 * Math.min(1, game.alarm / 100);
    }
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM_DECAY * dt);
  }

  if (game.alarm >= 100) {
    endGame(false, 'The alarm hit 100% — the gallery locked down around you.');
    return;
  }

  // Win: enough loot and back at the exit door.
  if (game.lootTaken.size >= game.lootNeeded &&
      pointInRect(thief.x, thief.y, EXIT)) {
    endGame(true);
  }
}

function endGame(won, reason) {
  game.state = won ? 'win' : 'lose';
  game.endTime = formatTime(game.time);
  game.loseReason = reason || '';
  // The end screen must wait for a fresh press: drop the keys/clicks that
  // were already down during play, or it would restart on the next frame.
  game.input.anyKey = false;
  game.input.takeClicks();
  game.input.takeEmp();
  if (won) game.sound.win(); else game.sound.lose();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (game.state === 'title') {
    game.startFlash += dt;
    if (game.input.anyKey || game.input.takeClicks().length > 0) {
      game.sound.ensure();
      reset();
    }
  } else if (game.state === 'play') {
    update(dt);
  } else {
    if (game.input.anyKey || game.input.takeClicks().length > 0) {
      game.input.anyKey = false;
      reset();
    }
  }

  drawWorld(ctx, game);
  if (game.state === 'play') drawHud(ctx, game);
  else if (game.state === 'title') drawTitle(ctx, game);
  else drawEnd(ctx, game);

  requestAnimationFrame(frame);
}

// Expose the live state for automated play-testing (no network, same page).
window.__game = game;
requestAnimationFrame(frame);
