// All drawing: the gallery floor, crates, shadows, vision cones, the thief,
// guards, cameras, loot, exit and the HUD. One frame shows the whole room.

import { ROOM, CRATES, SHADOWS, LOOT, EXIT, pointInRect } from './world.js';
import { CONE_RANGE, CONE_HALF } from './guards.js';

function conePath(ctx, x, y, dir, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, dir, range, half, fill, stroke) {
  conePath(ctx, x, y, dir, range, half);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawWorld(ctx, game) {
  const { thief, guards, cameras, lootTaken, alarm } = game;

  // Floor: dark parquet with a subtle checker.
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.fillStyle = '#1e1e2c';
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
    if ((x + y) % 2 === 0) ctx.fillRect(x * 80, y * 80, 80, 80);
  }
  // Gold carpet runner down the middle of the gallery.
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(ROOM.w / 2 - 130, ROOM.wall, 260, ROOM.h - 2 * ROOM.wall);

  // Shadow patches: darker, safer floor.
  for (const s of SHADOWS) {
    ctx.fillStyle = 'rgba(8, 10, 26, 0.75)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120, 130, 200, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
  }

  // Exit door, bottom-left, with a green glow.
  ctx.fillStyle = alarm >= 100 ? '#3a1a1a' : '#17351f';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#3ddc74';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#7be495';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 7);

  // Loot targets.
  for (const item of LOOT) {
    if (lootTaken.has(item.id)) continue;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 3 + item.x);
    if (item.kind === 'painting') {
      ctx.fillStyle = '#3a2c14';
      ctx.fillRect(item.x - 42, item.y - 30, 84, 60);
      ctx.strokeStyle = `rgba(255, 210, 90, ${0.55 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(item.x - 42, item.y - 30, 84, 60);
      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('🖼', item.x, item.y + 5);
      ctx.fillStyle = '#e8d27a';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(item.name, item.x, item.y + 48);
    } else if (item.kind === 'gem') {
      ctx.fillStyle = 'rgba(90, 200, 255, 0.12)';
      ctx.beginPath(); ctx.arc(item.x, item.y, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(120, 210, 255, ${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(item.x, item.y, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16); ctx.lineTo(item.x + 13, item.y);
      ctx.lineTo(item.x, item.y + 16); ctx.lineTo(item.x - 13, item.y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cfeeff';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(item.name, item.x, item.y + 50);
    } else {
      // The vault safe: a steel door in the floor's east corner.
      ctx.fillStyle = '#2c2f36';
      ctx.fillRect(item.x - 40, item.y - 40, 80, 80);
      ctx.strokeStyle = `rgba(255, 210, 90, ${0.55 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(item.x - 40, item.y - 40, 80, 80);
      ctx.strokeStyle = '#8a8f9a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(item.x, item.y, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e8d27a';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(item.name, item.x, item.y + 56);
    }
  }

  // Crates: wooden cover.
  for (const c of CRATES) {
    ctx.fillStyle = '#4a3419';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#5d4222';
    ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
    ctx.strokeStyle = '#2e2010';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
  }

  // Vision cones first (under the figures), redder as the alarm climbs.
  const heat = Math.min(1, alarm / 60);
  for (const g of guards) {
    const fill = g.alert > 0.25
      ? `rgba(255, 60, 40, ${0.16 + 0.16 * g.alert})`
      : `rgba(255, 190, 60, ${0.10 + 0.08 * heat})`;
    drawCone(ctx, g.x, g.y, g.dir, CONE_RANGE, CONE_HALF, fill, 'rgba(255,190,60,0.35)');
  }
  for (const cam of cameras) {
    if (cam.disabled) continue;
    drawCone(ctx, cam.x, cam.y, cam.angle, cam.range, cam.halfAngle,
      `rgba(255, 90, 90, ${0.10 + 0.08 * heat})`, 'rgba(255,90,90,0.4)');
  }

  // Cameras: small wall mounts with a lens dot.
  for (const cam of cameras) {
    ctx.fillStyle = cam.disabled ? '#333' : '#5a5f6a';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cam.disabled ? '#222' : '#ff5a5a';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2); ctx.fill();
    if (cam.disabled) {
      ctx.fillStyle = '#8a8f9a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', cam.x, cam.y - 16);
    }
  }

  // Guards: navy uniforms with a facing tick and an alert "!" when suspicious.
  for (const g of guards) {
    ctx.fillStyle = '#2b3a6e';
    ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d7dcec';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 20, g.y + Math.sin(g.dir) * 20);
    ctx.stroke();
    if (g.alert > 0.25) {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    }
  }

  // The thief: a black-clad figure with a mask stripe, gold outline.
  ctx.fillStyle = '#0d0d12';
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = thief.sneaking ? '#7fd4ff' : '#e8c85a';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.dir) * 18, thief.y + Math.sin(thief.dir) * 18);
  ctx.stroke();

  // A tossed coin ringing on the floor.
  if (thief.coin) {
    const r = 6 + 2 * Math.sin(game.time * 10);
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(thief.coin.x, thief.coin.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,74,0.5)';
    ctx.beginPath(); ctx.arc(thief.coin.x, thief.coin.y, r + 8, 0, Math.PI * 2); ctx.stroke();
  }

  // Walls: a heavy gold-trimmed border.
  ctx.strokeStyle = '#6b5a2e';
  ctx.lineWidth = ROOM.wall;
  ctx.strokeRect(ROOM.wall / 2, ROOM.wall / 2, ROOM.w - ROOM.wall, ROOM.h - ROOM.wall);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.wall - 1, ROOM.wall - 1, ROOM.w - 2 * ROOM.wall + 2, ROOM.h - 2 * ROOM.wall + 2);
}

export function drawHud(ctx, game) {
  const { alarm, lootTaken, lootNeeded, thief, time } = game;
  // Top bar.
  ctx.fillStyle = 'rgba(5, 5, 12, 0.85)';
  ctx.fillRect(0, 0, ROOM.w, 46);
  ctx.fillStyle = '#e8d27a';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT JOB', 16, 29);

  // Alarm meter.
  const ax = 330, ay = 13, aw = 300, ah = 20;
  ctx.fillStyle = '#222';
  ctx.fillRect(ax, ay, aw, ah);
  const alarmColor = alarm < 40 ? '#3ddc74' : alarm < 75 ? '#ffb13d' : '#ff4030';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, ay, aw * Math.min(1, alarm / 100), ah);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`ALARM ${Math.floor(alarm)}%`, ax + aw + 12, 29);

  // Loot counter, tools, timer.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LOOT ${lootTaken.size}/${lootNeeded} (of 5)`, 800, 29);
  ctx.fillText(`🪙 ${thief.coins}   ⚡ EMP ${thief.emp}${thief.empTimer > 0 ? ` (${Math.ceil(thief.empTimer)}s)` : ''}`, 990, 29);
  const mins = Math.floor(time / 60), secs = Math.floor(time % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1210, 29);

  // Objective line.
  ctx.fillStyle = '#c9c9d6';
  ctx.font = '14px Georgia, serif';
  const objective = lootTaken.size >= lootNeeded
    ? 'You have enough — get to the EXIT, bottom-left!'
    : `Steal ${lootNeeded - lootTaken.size} more piece${lootNeeded - lootTaken.size > 1 ? 's' : ''} of loot, then reach the EXIT.`;
  ctx.fillText(objective, 16, 72);

  // "Click to grab" prompt when standing next to loot.
  const near = game.nearLoot();
  if (near && game.state === 'play') {
    ctx.fillStyle = 'rgba(5,5,12,0.85)';
    ctx.fillRect(430, 100, 420, 34);
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Click to grab the ${near.name}!`, 640, 122);
    ctx.textAlign = 'left';
  }
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(5, 5, 14, 0.88)';
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c85a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('MIDNIGHT VAULT JOB', 640, 240);
  ctx.fillStyle = '#e8e8f0';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('One gallery. Three guards. Two cameras. Five treasures.', 640, 300);
  ctx.fillText('Take three — then vanish through the service door.', 640, 336);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#b9b9c9';
  ctx.fillText('WASD / arrows — move      Shift — sneak (slower, harder to see)', 640, 420);
  ctx.fillText('Click the floor — toss a coin to lure a guard (3 coins)', 640, 452);
  ctx.fillText('Click loot up close — grab it      E — EMP: blind the cameras (once)', 640, 484);
  ctx.fillText('Hide in the shadows and behind crates. If the alarm hits 100%, you are caught.', 640, 516);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText(game.startFlash > 0 ? 'Click or press any key to begin' : 'Click or press any key to begin', 640, 600);
  ctx.fillStyle = '#8a8aa0';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('An original game — no assets, sounds or names borrowed from anywhere.', 640, 660);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, game) {
  ctx.fillStyle = game.state === 'win' ? 'rgba(10, 30, 14, 0.88)' : 'rgba(30, 8, 8, 0.88)';
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.textAlign = 'center';
  if (game.state === 'win') {
    ctx.fillStyle = '#7be495';
    ctx.font = 'bold 60px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY!', 640, 320);
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '24px Georgia, serif';
    ctx.fillText(`You slipped out with ${game.lootTaken.size} treasures in ${game.endTime}.`, 640, 380);
    ctx.fillText('The gallery never knew you were there.', 640, 420);
  } else {
    ctx.fillStyle = '#ff6a5a';
    ctx.font = 'bold 60px Georgia, serif';
    ctx.fillText('CAUGHT!', 640, 320);
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '24px Georgia, serif';
    ctx.fillText(game.loseReason || 'The guards closed in.', 640, 380);
    ctx.fillText(`Loot taken: ${game.lootTaken.size} of 5. The vault keeps the rest.`, 640, 420);
  }
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Click or press any key to play again', 640, 500);
  ctx.textAlign = 'left';
}
