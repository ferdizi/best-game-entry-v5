// DREDGEWARD render: one clear job — draw every screen from world state.
// Title, shop, play (water, ruins, skiff, enemies, boss, HUD), win and lose.
// One coherent palette: deep teal water, amber salvage, coral danger.
import { BOSS, DIVES, PALETTE, SEABED, UPGRADES, VIEW, WATER_TOP } from './config.js';
import { BUOY, SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function bar(ctx, x, y, w, h, frac, fill, back) {
  ctx.fillStyle = back || '#0a1a24';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}
function drawBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, PALETTE.sky);
  g.addColorStop(0.12, PALETTE.waterTop);
  g.addColorStop(1, PALETTE.waterDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Sun rays through the water.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < 5; i += 1) {
    const x = 120 + i * 240 + Math.sin(world.time * 0.2 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 70, 0);
    ctx.lineTo(x + 190, VIEW.height);
    ctx.lineTo(x + 90, VIEW.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Surface line.
  ctx.fillStyle = 'rgba(127,212,193,0.35)';
  ctx.fillRect(0, WATER_TOP - 2, VIEW.width, 3);
  // Drowned ruins: broken columns and arches on the seabed.
  ctx.fillStyle = '#2c3e50';
  for (let i = 0; i < 7; i += 1) {
    const x = 60 + i * 180;
    const h = 60 + ((i * 37) % 70);
    ctx.fillRect(x, SEABED - h, 34, h);
    ctx.fillRect(x - 6, SEABED - h - 10, 46, 12);
    if (i % 2 === 0) { ctx.fillRect(x + 44, SEABED - h + 26, 60, 12); }
  }
  // Seabed.
  ctx.fillStyle = PALETTE.seabed;
  ctx.fillRect(0, SEABED, VIEW.width, VIEW.height - SEABED);
  ctx.fillStyle = PALETTE.sand;
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 173) % VIEW.width;
    ctx.beginPath();
    ctx.ellipse(x, SEABED + 14 + ((i * 29) % 26), 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Kelp swaying.
  ctx.strokeStyle = '#2f8f5f';
  ctx.lineWidth = 5;
  for (let i = 0; i < 12; i += 1) {
    const x = 40 + i * 108;
    const sway = Math.sin(world.time * 1.2 + i * 1.7) * 12;
    ctx.beginPath();
    ctx.moveTo(x, SEABED);
    ctx.quadraticCurveTo(x + sway, SEABED - 40, x + sway * 1.6, SEABED - 78);
    ctx.stroke();
  }
}
function drawBuoy(ctx, world) {
  const bob = Math.sin(world.time * 1.6) * 4;
  ctx.save();
  ctx.translate(BUOY.x, BUOY.y + bob);
  ctx.fillStyle = '#e8dcc3';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(-22, -6, 44, 12);
  ctx.fillStyle = '#c93a2e';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(7, -44);
  ctx.lineTo(-7, -44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(0, -48, 5 + Math.sin(world.time * 4) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The label is drawn with the HUD (after the top bar), never under it.
}
function drawSalvage(ctx, s, world) {
  const bob = Math.sin(world.time * 2 + s.bob) * 3;
  ctx.save();
  ctx.translate(s.x, s.y + bob);
  if (s.kind === 'chest') {
    ctx.fillStyle = '#7a4a21';
    rr(ctx, -16, -12, 32, 24, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.amber;
    ctx.fillRect(-16, -3, 32, 5);
    ctx.fillRect(-3, -12, 6, 24);
  } else if (s.kind === 'amphora') {
    ctx.fillStyle = '#b97e1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-5, -20, 10, 8);
  } else {
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(0, -4, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(-4, -20, 8, 8);
  }
  ctx.restore();
  // Sparkle so salvage reads at a glance.
  ctx.fillStyle = 'rgba(255,233,168,0.9)';
  const tw = Math.sin(world.time * 5 + s.bob) > 0;
  if (tw) { ctx.fillRect(s.x + 14, s.y - 18, 3, 3); ctx.fillRect(s.x - 18, s.y + 6, 3, 3); }
}
function drawEnemy(ctx, e, world) {
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.flash > 0) ctx.globalAlpha = 0.6;
  if (e.kind === 'mine') {
    ctx.fillStyle = '#3a2f22';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.coral;
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + world.time * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
      ctx.stroke();
    }
    ctx.fillStyle = Math.sin(world.time * 6) > 0 ? '#ff6b5e' : '#c93a2e';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'eel') {
    ctx.strokeStyle = '#7fd4c1';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 6;
      const x = -t * 34;
      const y = Math.sin(e.t * 8 + t * 5) * 7;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#0a1a24';
    ctx.beginPath();
    ctx.arc(2, -3, 2, 0, Math.PI * 2);
    ctx.arc(2, 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'crab') {
    ctx.fillStyle = '#ff9e5e';
    rr(ctx, -18, -10, 36, 20, 8);
    ctx.fill();
    ctx.strokeStyle = '#ff9e5e';
    ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 14, 8);
      ctx.lineTo(s * 22, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 18, -6);
      ctx.lineTo(s * 28, -14);
      ctx.stroke();
    }
    ctx.fillStyle = '#0a1a24';
    ctx.beginPath();
    ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#b48ce8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b48ce8';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6, 10);
      ctx.quadraticCurveTo(i * 8, 20, i * 6 + Math.sin(world.time * 5 + i) * 4, 26);
      ctx.stroke();
    }
    ctx.fillStyle = '#0a1a24';
    ctx.beginPath();
    ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // HP pips for tough enemies.
  if (e.hp > 1) {
    ctx.fillStyle = '#0a1a24';
    ctx.fillRect(e.x - 14, e.y - e.radius - 12, 28, 5);
    ctx.fillStyle = PALETTE.coral;
    ctx.fillRect(e.x - 14, e.y - e.radius - 12, 28 * (e.hp / 3), 5);
  }
}
function drawBoss(ctx, boss, world) {
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  if (boss.flash > 0) ctx.globalAlpha = 0.7;
  // Tail.
  ctx.strokeStyle = '#5a3d7a';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-90, Math.sin(world.time * 2) * 40, -130, Math.sin(world.time * 2 + 1) * 60);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#3d2b5c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3d7a';
  ctx.beginPath();
  ctx.ellipse(-8, -8, 40, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaws.
  const jaw = 0.35 + Math.sin(world.time * 3) * 0.2;
  ctx.fillStyle = '#2a1d40';
  ctx.beginPath();
  ctx.moveTo(30, -18);
  ctx.lineTo(78, -6 - jaw * 30);
  ctx.lineTo(78, 6 + jaw * 30);
  ctx.lineTo(30, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dcc3';
  for (let i = 0; i < 5; i += 1) {
    const x = 44 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x, -10 - jaw * 22);
    ctx.lineTo(x + 4, -2 - jaw * 14);
    ctx.lineTo(x + 8, -10 - jaw * 22);
    ctx.closePath();
    ctx.fill();
  }
  // Eyes.
  ctx.fillStyle = '#ff6b5e';
  ctx.beginPath();
  ctx.arc(28, -22, 7, 0, Math.PI * 2);
  ctx.arc(44, -14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1a24';
  ctx.beginPath();
  ctx.arc(28, -22, 3, 0, Math.PI * 2);
  ctx.arc(44, -14, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, BOSS.name, boss.x, boss.y - 78, 20, '#ff9e9e', 'center');
  text(ctx, BOSS.phases[world.bossPhase].name, boss.x, boss.y - 58, 13, '#e8dcc3', 'center');
}
function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.save();
  // Blink while invulnerable after a hit, so the player sees the grace time.
  if (world.hurtTimer > 0 && Math.sin(world.time * 24) > 0) ctx.globalAlpha = 0.45;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Hull / skiff.
  ctx.fillStyle = '#8a6f4d';
  rr(ctx, -24, -11, 48, 22, 9);
  ctx.fill();
  ctx.fillStyle = '#e8dcc3';
  rr(ctx, -14, -8, 26, 16, 6);
  ctx.fill();
  // Harpoon gun.
  ctx.fillStyle = '#3a2f22';
  ctx.fillRect(8, -3, 22, 6);
  ctx.fillStyle = PALETTE.amber;
  ctx.beginPath();
  ctx.arc(30, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Carried salvage crates on deck.
  for (let i = 0; i < p.carrying; i += 1) {
    ctx.fillStyle = '#b97e1a';
    ctx.fillRect(-20 + i * 12, -16, 10, 8);
  }
  ctx.restore();
  // Aim line (short, so it never hides the game).
  ctx.save();
  ctx.strokeStyle = 'rgba(242,177,52,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * 34, p.y + Math.sin(p.angle) * 34);
  ctx.lineTo(p.x + Math.cos(p.angle) * 90, p.y + Math.sin(p.angle) * 90);
  ctx.stroke();
  ctx.restore();
}
function drawHarpoons(ctx, world) {
  const p = world.player;
  for (const h of world.harpoons) {
    ctx.strokeStyle = '#e8dcc3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(h.x, h.y);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
    ctx.fill();
    if (h.kind === 'salvage' && h.target) {
      ctx.fillStyle = '#b97e1a';
      ctx.beginPath();
      ctx.arc(h.x, h.y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
function drawHud(ctx, world) {
  const dive = DIVES[world.diveIndex];
  // Top bar.
  ctx.fillStyle = 'rgba(10,26,36,0.88)';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(0, 64, VIEW.width, 3);
  text(ctx, `DIVE ${dive.dive}/8 — ${dive.name}`, 16, 26, 18, '#ffe9a8');
  text(ctx, `QUOTA ${world.banked}/${world.quota}  •  CARRYING ${world.player.carrying}/2`, 16, 50, 14, '#7fd4c1');
  text(ctx, `SCORE ${world.score}`, 430, 26, 16, '#e8dcc3');
  text(ctx, `GOLD ${world.gold}  •  KILLS ${world.stats.kills}`, 430, 50, 14, '#e8dcc3');
  text(ctx, 'HULL', 700, 26, 13, '#ff9e9e');
  bar(ctx, 750, 14, 150, 14, world.hull / world.maxHull, '#ff6b5e');
  text(ctx, `${Math.ceil(world.hull)}/${world.maxHull}`, 908, 26, 13, '#e8dcc3');
  text(ctx, 'OXYGEN', 700, 50, 13, '#7fd4c1');
  bar(ctx, 750, 38, 150, 14, world.oxygen / 100, '#7fd4c1');
  text(ctx, `${Math.ceil(world.oxygen)}%`, 908, 50, 13, '#e8dcc3');
  text(ctx, 'WASD move • MOUSE aim • CLICK harpoon', 1000, 26, 12, '#9fb8c4', 'left');
  text(ctx, `HULL T${world.upgrades.hull} • HRP T${world.upgrades.harpoon} • ENG T${world.upgrades.engine} • MAG T${world.upgrades.magnet}`, 1000, 50, 12, '#9fb8c4');
  text(ctx, '▼ BUOY — BANK SALVAGE HERE', BUOY.x, 132, 12, '#ffe9a8', 'center');
  // Boss bar.
  if (world.boss) {
    ctx.fillStyle = 'rgba(10,26,36,0.88)';
    rr(ctx, 340, 78, 600, 30, 8);
    ctx.fill();
    text(ctx, BOSS.name, 350, 99, 14, '#ff9e9e');
    bar(ctx, 560, 84, 360, 16, world.bossHp / BOSS.maxHp, '#b48ce8');
    text(ctx, `${Math.ceil(world.bossHp)}/${BOSS.maxHp}`, 928, 99, 13, '#e8dcc3');
  }
  // Dive timer + log.
  text(ctx, `TIME ${Math.floor(world.diveTime)}s`, 16, 92, 13, '#9fb8c4');
  const logs = world.log.slice(-2);
  logs.forEach((line, i) => text(ctx, line, 16, VIEW.height - 16 - (logs.length - 1 - i) * 18, 13, '#cfe3dc'));
  if (world.inked) {
    ctx.fillStyle = 'rgba(27,47,69,0.35)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'INKED — SLOW!', 640, 120, 20, '#b48ce8', 'center');
  }
}
function drawTitle(ctx, world) {
  drawBackground(ctx, world);
  ctx.fillStyle = 'rgba(7,34,46,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'DREDGEWARD', 640, 170, 84, '#f2b134', 'center');
  text(ctx, '— SALVAGE THE SUNKEN CITY —', 640, 210, 22, '#7fd4c1', 'center');
  text(ctx, 'The city sank. Its gold did not. Pilot your skiff, harpoon the wrecks,', 640, 268, 18, '#e8dcc3', 'center');
  text(ctx, 'haul salvage to the buoy — and break THE ABYSSAL MAW on dive 8.', 640, 294, 18, '#e8dcc3', 'center');
  ctx.fillStyle = 'rgba(242,177,52,0.12)';
  rr(ctx, 290, 330, 700, 150, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 2;
  rr(ctx, 290, 330, 700, 150, 12);
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', 640, 362, 16, '#f2b134', 'center');
  text(ctx, 'WASD / ARROWS — steer the skiff      MOUSE — aim the harpoon', 640, 390, 15, '#e8dcc3', 'center');
  text(ctx, 'CLICK / SPACE — fire & reel salvage      Bank it at the BUOY to count it', 640, 414, 15, '#e8dcc3', 'center');
  text(ctx, 'Oxygen bubbles refill O2  •  Repair kits fix the hull  •  Spend gold between dives', 640, 438, 15, '#e8dcc3', 'center');
  text(ctx, 'WIN: clear all 8 dives and break the Maw.   LOSE: hull 0 or oxygen 0.', 640, 462, 15, '#ff9e9e', 'center');
  text(ctx, '8 DIVES  •  4 ENEMY KINDS  •  4 UPGRADES x 3 TIERS  •  3-PHASE BOSS', 640, 530, 16, '#7fd4c1', 'center');
  if (Math.sin(world.time * 3) > -0.2) text(ctx, 'CLICK OR PRESS ENTER TO DIVE', 640, 600, 24, '#ffe9a8', 'center');
  if (world.best > 0) text(ctx, `BEST SCORE: ${world.best}`, 640, 640, 15, '#9fb8c4', 'center');
  text(ctx, 'P pause  •  M mute  •  R restart after the end', 640, 672, 13, '#9fb8c4', 'center');
}
function drawShop(ctx, world) {
  drawBackground(ctx, world);
  ctx.fillStyle = 'rgba(7,34,46,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const dive = DIVES[world.diveIndex];
  text(ctx, `DIVE ${dive.dive} CLEARED!`, 640, 110, 44, '#f2b134', 'center');
  text(ctx, `Next: DIVE ${dive.dive + 1} — ${DIVES[world.diveIndex + 1].name}   •   GOLD: ${world.gold}   •   SCORE: ${world.score}`, 640, 150, 18, '#e8dcc3', 'center');
  text(ctx, 'SPEND GOLD — click a card or press 1–4, then ENTER to dive on', 640, 190, 15, '#7fd4c1', 'center');
  UPGRADES.forEach((u, i) => {
    const tier = world.upgrades[u.id];
    const x = 130 + i * 265;
    const y = 230;
    const maxed = tier >= 3;
    const cost = maxed ? null : u.tiers[tier];
    const afford = cost !== null && world.gold >= cost;
    ctx.fillStyle = afford ? 'rgba(242,177,52,0.16)' : 'rgba(10,26,36,0.9)';
    rr(ctx, x, y, 240, 210, 12);
    ctx.fill();
    ctx.strokeStyle = afford ? PALETTE.amber : '#33505e';
    ctx.lineWidth = 2;
    rr(ctx, x, y, 240, 210, 12);
    ctx.stroke();
    text(ctx, `${i + 1}`, x + 16, y + 34, 18, '#9fb8c4');
    text(ctx, u.name, x + 120, y + 60, 16, '#ffe9a8', 'center');
    text(ctx, u.blurb, x + 120, y + 92, 13, '#e8dcc3', 'center');
    text(ctx, `TIER ${tier}/3  •  ${u.per} per tier`, x + 120, y + 122, 13, '#7fd4c1', 'center');
    if (maxed) text(ctx, 'MAXED OUT', x + 120, y + 170, 18, '#ff9e9e', 'center');
    else text(ctx, `COST ${cost} GOLD`, x + 120, y + 170, 18, afford ? '#f2b134' : '#9fb8c4', 'center');
  });
  if (Math.sin(world.time * 3) > -0.2) text(ctx, 'PRESS ENTER TO DIVE ON', 640, 520, 22, '#ffe9a8', 'center');
  text(ctx, `Hull ${Math.ceil(world.hull)}/${world.maxHull}  •  Harpoon dmg ${world.harpoonDamage}  •  Range ${world.harpoonRange}  •  Magnet ${world.magnet}`, 640, 560, 14, '#9fb8c4', 'center');
}
function drawOver(ctx, world) {
  drawBackground(ctx, world);
  ctx.fillStyle = world.won ? 'rgba(20,60,40,0.78)' : 'rgba(60,20,20,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (world.won) {
    text(ctx, 'THE CITY IS YOURS!', 640, 170, 64, '#f2b134', 'center');
    text(ctx, 'THE ABYSSAL MAW IS BROKEN — the Sunken City surfaces again.', 640, 220, 20, '#e8dcc3', 'center');
  } else {
    text(ctx, 'THE DEEP KEEPS ITS DEAD', 640, 170, 56, '#ff6b5e', 'center');
    text(ctx, world.loseReason === 'oxygen' ? 'Out of oxygen on the dive.' : 'Hull breached — the skiff went down.', 640, 220, 20, '#e8dcc3', 'center');
  }
  ctx.fillStyle = 'rgba(10,26,36,0.9)';
  rr(ctx, 390, 260, 500, 220, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 2;
  rr(ctx, 390, 260, 500, 220, 12);
  ctx.stroke();
  text(ctx, `FINAL SCORE  ${world.score}`, 640, 310, 24, '#ffe9a8', 'center');
  text(ctx, `Dives cleared  ${world.stats.divesCleared}/8`, 640, 350, 16, '#e8dcc3', 'center');
  text(ctx, `Salvage banked  ${world.stats.bankedTotal}    Enemies sunk  ${world.stats.kills}`, 640, 380, 16, '#e8dcc3', 'center');
  text(ctx, `Harpoons fired  ${world.stats.shots}    Gold held  ${world.gold}`, 640, 410, 16, '#e8dcc3', 'center');
  text(ctx, `BEST SCORE: ${Math.max(world.best, world.score)}`, 640, 448, 15, '#7fd4c1', 'center');
  if (Math.sin(world.time * 3) > -0.2) text(ctx, 'PRESS R OR CLICK TO DIVE AGAIN', 640, 540, 24, '#ffe9a8', 'center');
}
export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((world.rng() - 0.5) * world.shake, (world.rng() - 0.5) * world.shake);
  }
  if (world.screen === SCREEN_TITLE) { drawTitle(ctx, world); ctx.restore(); return; }
  if (world.screen === SCREEN_SHOP) { drawShop(ctx, world); ctx.restore(); return; }
  if (world.screen === SCREEN_OVER) { drawOver(ctx, world); ctx.restore(); return; }
  // Play screen.
  drawBackground(ctx, world);
  drawBuoy(ctx, world);
  for (const s of world.salvage) drawSalvage(ctx, s, world);
  for (const pk of world.pickups) {
    ctx.save();
    ctx.translate(pk.x, pk.y);
    if (pk.kind === 'oxygen') {
      ctx.strokeStyle = '#7fd4c1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10 + Math.sin(world.time * 4 + pk.x) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(127,212,193,0.4)';
      ctx.beginPath();
      ctx.arc(-3, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'O2', 0, 22, 11, '#7fd4c1', 'center');
    } else {
      ctx.fillStyle = '#ff6b5e';
      rr(ctx, -11, -9, 22, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#e8dcc3';
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillRect(-6, -2, 12, 4);
    }
    ctx.restore();
  }
  for (const ink of world.inks) {
    ctx.fillStyle = `rgba(27,47,69,${0.5 * (ink.life / ink.maxLife)})`;
    ctx.beginPath();
    ctx.arc(ink.x, ink.y, ink.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of world.enemies) drawEnemy(ctx, e, world);
  drawBoss(ctx, world.boss, world);
  drawPlayer(ctx, world);
  drawHarpoons(ctx, world);
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHud(ctx, world);
}
