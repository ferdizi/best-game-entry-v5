// DREDGEWARD world: one clear job — the whole simulation. Skiff movement,
// harpoon fire + reel, salvage hauling, four enemy kinds, pickups, oxygen,
// the eight dives, the shop upgrades and the three-phase boss. No drawing
// here; render.js draws whatever this state says.
import { BOSS, DIVES, ENEMIES, KILL_GOLD, OXYGEN_PICKUP, REPAIR_PICKUP, SALVAGE_GOLD, SALVAGE_SCORE, SEABED, START, UPGRADES, WATER_TOP } from './config.js';
import { mulberry32, range } from './random.js';
import { sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';

const FIRE_COOLDOWN = 0.45;
const CARRY_MAX = 2;
const BUOY = { x: 640, y: 58 };

function makeSalvage(rng, i) {
  const kinds = ['chest', 'amphora', 'bell'];
  const onBed = rng() < 0.55;
  return {
    id: i,
    kind: kinds[i % 3],
    x: range(rng, 90, 1190),
    y: onBed ? SEABED - 18 - rng() * 8 : range(rng, 180, 560),
    bob: rng() * Math.PI * 2,
    taken: false,
  };
}
function makeEnemy(rng, kind, dive) {
  const def = ENEMIES[kind];
  // Never spawn on top of the skiff's start (640, 200): re-roll until clear.
  let x; let y;
  for (let tries = 0; tries < 8; tries += 1) {
    x = range(rng, 120, 1160);
    y = kind === 'crab' ? SEABED - 22 : range(rng, 140, 580);
    if (Math.hypot(x - 640, y - 200) >= 240) break;
  }
  return {
    kind, x, y,
    vx: 0, vy: 0, hp: def.hp, radius: def.radius,
    t: rng() * 10, inkTimer: range(rng, 2, 4), flash: 0,
    seed: rng() * Math.PI * 2,
  };
}
function spawnPickups(world) {
  // Oxygen bubbles rise from seabed vents; a couple of repair kits float.
  for (let i = 0; i < 5; i += 1) {
    world.pickups.push({ kind: 'oxygen', x: range(world.rng, 90, 1190), y: SEABED - 30, vy: -22 });
  }
  world.pickups.push({ kind: 'repair', x: range(world.rng, 200, 1080), y: range(world.rng, 200, 420) });
  world.pickups.push({ kind: 'repair', x: range(world.rng, 200, 1080), y: range(world.rng, 200, 420) });
}

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: SCREEN_TITLE,
    diveIndex: 0,
    player: { x: 640, y: 220, vx: 0, vy: 0, angle: 0, carrying: 0 },
    hull: START.hull, maxHull: START.hull,
    oxygen: 100, oxygenMax: 100,
    gold: 0, score: 0, banked: 0, quota: 0,
    salvage: [], enemies: [], pickups: [], harpoons: [], particles: [], inks: [],
    boss: null, bossHp: 0, bossPhase: 0,
    time: 0, diveTime: 0, fireTimer: 0, bubbleTimer: 0,
    upgrades: { hull: 0, harpoon: 0, engine: 0, magnet: 0 },
    harpoonDamage: START.harpoonDamage, harpoonRange: START.harpoonRange,
    speed: START.speed, magnet: START.magnet,
    log: ['Welcome to the Sunken City, Dredgeward.'],
    won: false, loseReason: '',
    stats: { kills: 0, bankedTotal: 0, divesCleared: 0, shots: 0 },
    shake: 0, inked: 0, best: 0, hurtTimer: 0,
  };
}

export function beginGame(world) {
  world.diveIndex = 0;
  world.gold = 0; world.score = 0;
  world.upgrades = { hull: 0, harpoon: 0, engine: 0, magnet: 0 };
  world.harpoonDamage = START.harpoonDamage; world.harpoonRange = START.harpoonRange;
  world.speed = START.speed; world.magnet = START.magnet;
  world.maxHull = START.hull;
  world.stats = { kills: 0, bankedTotal: 0, divesCleared: 0, shots: 0 };
  world.won = false; world.loseReason = '';
  startDive(world, 0);
}

export function startDive(world, index) {
  const dive = DIVES[index];
  world.diveIndex = index;
  world.quota = dive.quota;
  world.banked = 0;
  world.oxygenMax = dive.oxygen;
  world.oxygen = 100;
  world.hull = world.maxHull;
  world.player = { x: 640, y: 200, vx: 0, vy: 0, angle: Math.PI / 2, carrying: 0 };
  world.salvage = [];
  world.enemies = [];
  world.pickups = [];
  world.harpoons = [];
  world.particles = [];
  world.inks = [];
  world.time = 0; world.diveTime = 0; world.fireTimer = 0; world.bubbleTimer = 0;
  world.inked = 0; world.hurtTimer = 0; world.lastHurtAt = -99;
  const rng = world.rng;
  for (let i = 0; i < dive.quota + 3; i += 1) world.salvage.push(makeSalvage(rng, i));
  for (let i = 0; i < dive.mines; i += 1) world.enemies.push(makeEnemy(rng, 'mine', dive));
  for (let i = 0; i < dive.eels; i += 1) world.enemies.push(makeEnemy(rng, 'eel', dive));
  for (let i = 0; i < dive.crabs; i += 1) world.enemies.push(makeEnemy(rng, 'crab', dive));
  for (let i = 0; i < dive.squids; i += 1) world.enemies.push(makeEnemy(rng, 'squid', dive));
  spawnPickups(world);
  if (dive.boss) {
    world.boss = { x: 640, y: 480, vx: 0, vy: 0, hp: BOSS.maxHp, radius: BOSS.radius, t: 0, charge: 0, chargeDir: 0, inkTimer: 3, flash: 0 };
    world.bossHp = BOSS.maxHp; world.bossPhase = 0;
  } else {
    world.boss = null; world.bossHp = 0; world.bossPhase = 0;
  }
  world.screen = SCREEN_PLAY;
  world.log = [`DIVE ${dive.dive} — ${dive.name}`, dive.blurb];
}

export function buyUpgrade(world, id) {
  const def = UPGRADES.find((u) => u.id === id);
  const tier = world.upgrades[id];
  if (!def || tier >= 3) return false;
  const cost = def.tiers[tier];
  if (world.gold < cost) return false;
  world.gold -= cost;
  world.upgrades[id] = tier + 1;
  if (id === 'hull') { world.maxHull += 25; world.hull = Math.min(world.maxHull, world.hull + 25); }
  if (id === 'harpoon') { world.harpoonDamage += 1; world.harpoonRange += 40; }
  if (id === 'engine') { world.speed = START.speed * (1 + 0.18 * world.upgrades.engine); }
  if (id === 'magnet') { world.magnet = START.magnet + 45 * world.upgrades.magnet; }
  world.log.push(`${def.name} upgraded to tier ${tier + 1}.`);
  return true;
}

export function continueFromShop(world) {
  if (world.diveIndex + 1 < DIVES.length) startDive(world, world.diveIndex + 1);
}

function burst(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng() * Math.PI * 2;
    const s = speed * (0.4 + world.rng() * 0.8);
    world.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, maxLife: 0.6, color, size: 2 + world.rng() * 3 });
  }
}
function damagePlayer(world, amount, audio, why) {
  // One second of invulnerability after a hit: without it a single touch
  // would deal damage every frame and the hull would vanish in a blink.
  if (world.hurtTimer > 0) return;
  world.hurtTimer = 1.2;
  world.lastHurtAt = world.time;
  world.hull -= amount;
  world.shake = Math.max(world.shake, 7);
  burst(world, world.player.x, world.player.y, '#ff6b5e', 10, 120);
  if (audio) sfx.hurt(audio);
  world.log.push(`${why} — hull -${amount}.`);
  if (world.hull <= 0) {
    world.hull = 0;
    endGame(world, false, 'hull');
  }
}
function endGame(world, won, reason) {
  world.won = won;
  world.loseReason = reason;
  world.screen = SCREEN_OVER;
  if (won) world.log.push('The city is yours again, Dredgeward.');
  else world.log.push(reason === 'oxygen' ? 'Out of oxygen. The deep keeps its dead.' : 'Hull breached. The skiff goes down.');
}
function diveCleared(world, audio) {
  const dive = DIVES[world.diveIndex];
  const bonus = 100 + world.diveIndex * 50 + Math.round(world.oxygen);
  world.score += bonus;
  world.gold += 40 + world.diveIndex * 10;
  world.stats.divesCleared += 1;
  world.log.push(`Dive ${dive.dive} cleared! Bonus +${bonus}.`);
  if (audio) sfx.win(audio);
  if (world.diveIndex + 1 >= DIVES.length) {
    endGame(world, true, '');
  } else {
    world.screen = SCREEN_SHOP;
  }
}
function killEnemy(world, enemy, audio) {
  const def = ENEMIES[enemy.kind];
  world.stats.kills += 1;
  world.score += def.score;
  world.gold += KILL_GOLD;
  burst(world, enemy.x, enemy.y, def.color, 16, 160);
  if (audio) sfx.explode(audio);
  world.log.push(`${def.name} destroyed. +${def.score}`);
  if (world.rng() < 0.3) world.pickups.push({ kind: 'repair', x: enemy.x, y: enemy.y });
  world.enemies = world.enemies.filter((e) => e !== enemy);
}
function fireHarpoon(world, input, audio) {
  const p = world.player;
  const dx = (input.mouseX ?? 640) - p.x;
  const dy = (input.mouseY ?? 360) - p.y;
  const angle = Math.atan2(dy, dx);
  p.angle = angle;
  world.harpoons.push({ x: p.x, y: p.y, angle, dist: 0, state: 'out', target: null, kind: null, speed: 620 });
  world.fireTimer = FIRE_COOLDOWN;
  world.stats.shots += 1;
  if (audio) sfx.shoot(audio);
}
function stepHarpoons(world, dt, audio) {
  const p = world.player;
  for (const h of world.harpoons) {
    if (h.state === 'out') {
      h.dist += h.speed * dt;
      h.x = p.x + Math.cos(h.angle) * h.dist;
      h.y = p.y + Math.sin(h.angle) * h.dist;
      // Hit an enemy?
      let hit = null;
      for (const e of world.enemies) {
        if (Math.hypot(e.x - h.x, e.y - h.y) < e.radius + 8) { hit = { kind: 'enemy', obj: e }; break; }
      }
      if (!hit && world.boss && Math.hypot(world.boss.x - h.x, world.boss.y - h.y) < world.boss.radius + 8) {
        hit = { kind: 'boss', obj: world.boss };
      }
      if (!hit) {
        for (const s of world.salvage) {
          if (!s.taken && Math.hypot(s.x - h.x, s.y - h.y) < 26) { hit = { kind: 'salvage', obj: s }; break; }
        }
      }
      if (hit) {
        h.target = hit.obj; h.kind = hit.kind; h.state = 'reel';
        if (hit.kind === 'enemy') {
          hit.obj.hp -= world.harpoonDamage;
          hit.obj.flash = 0.15;
          if (audio) sfx.hit(audio);
          if (hit.obj.hp <= 0) {
            if (hit.obj.kind === 'mine') { burst(world, hit.obj.x, hit.obj.y, '#ff6b5e', 18, 200); world.shake = 8; if (audio) sfx.explode(audio); world.enemies = world.enemies.filter((e) => e !== hit.obj); }
            else killEnemy(world, hit.obj, audio);
          }
          h.state = 'done';
        } else if (hit.kind === 'boss') {
          hit.obj.hp -= world.harpoonDamage * 10;
          world.bossHp = Math.max(0, hit.obj.hp);
          hit.obj.flash = 0.15;
          if (audio) sfx.hit(audio);
          h.state = 'done';
        } else {
          hit.obj.taken = true;
          if (audio) sfx.reel(audio);
        }
      } else if (h.dist >= world.harpoonRange) {
        h.state = 'reel';
      }
    } else if (h.state === 'reel') {
      // The tip flies back to the skiff, dragging salvage with it.
      const tx = p.x; const ty = p.y;
      const d = Math.hypot(tx - h.x, ty - h.y);
      const step = h.speed * 1.4 * dt;
      if (d <= step) {
        if (h.kind === 'salvage' && h.target) {
          if (p.carrying < CARRY_MAX) {
            p.carrying += 1;
            world.salvage = world.salvage.filter((s) => s !== h.target);
            if (audio) sfx.pickup(audio);
            world.log.push(`Salvage hauled aboard (${p.carrying}/${CARRY_MAX}). Take it to the buoy!`);
          } else {
            h.target.taken = false; // deck full: it slips back to the seabed
            world.log.push('Deck full! Bank salvage at the buoy first.');
          }
        }
        h.state = 'done';
      } else {
        h.x += ((tx - h.x) / d) * step;
        h.y += ((ty - h.y) / d) * step;
        if (h.kind === 'salvage' && h.target) { h.target.x = h.x; h.target.y = h.y; }
      }
    }
  }
  world.harpoons = world.harpoons.filter((h) => h.state !== 'done');
}
function stepEnemies(world, dt, audio) {
  const p = world.player;
  for (const e of [...world.enemies]) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const def = ENEMIES[e.kind];
    const dx = p.x - e.x; const dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    if (e.kind === 'mine') {
      e.x += Math.sin(e.t * 0.7 + e.seed) * def.speed * dt;
      e.y += Math.cos(e.t * 0.5 + e.seed) * 6 * dt;
      if (d < 30) {
        burst(world, e.x, e.y, '#ff6b5e', 22, 220);
        world.shake = 10;
        world.enemies = world.enemies.filter((x) => x !== e);
        damagePlayer(world, def.damage, audio, 'Spike Mine detonated');
        if (world.screen !== SCREEN_PLAY) return;
      }
    } else if (e.kind === 'eel') {
      const wob = Math.sin(e.t * 6) * 40;
      const nx = dx / d; const ny = dy / d;
      e.x += (nx * def.speed + -ny * wob * 0.4) * dt;
      e.y += (ny * def.speed + nx * wob * 0.4) * dt;
      if (d < e.radius + 20) {
        damagePlayer(world, def.damage, audio, 'Volt Eel shocked the hull');
        e.x -= (dx / d) * 60; e.y -= (dy / d) * 60; // knocked clear of the skiff
      }
    } else if (e.kind === 'crab') {
      e.x += Math.sign(dx) * def.speed * dt;
      e.y = SEABED - 22 + Math.sin(e.t * 3) * 2;
      if (d < e.radius + 22) {
        damagePlayer(world, def.damage, audio, 'Snapper Crab crushed the hull');
        e.x -= (dx / d) * 60; e.y -= (dy / d) * 60;
      }
    } else if (e.kind === 'squid') {
      e.x += (dx / d) * def.speed * 0.6 * dt;
      e.y += (dy / d) * def.speed * 0.6 * dt;
      e.inkTimer -= dt;
      if (e.inkTimer <= 0) {
        e.inkTimer = 4;
        world.inks.push({ x: e.x, y: e.y, life: 3, maxLife: 3, radius: 70 });
        world.log.push('Ink Squid clouded the water!');
      }
      if (d < e.radius + 20) {
        damagePlayer(world, def.damage, audio, 'Ink Squid rammed the hull');
        e.x -= (dx / d) * 60; e.y -= (dy / d) * 60;
      }
    }
    if (world.screen !== SCREEN_PLAY) return;
    // Magnet: loose salvage drifts toward a nearby skiff.
    for (const s of world.salvage) {
      if (s.taken) continue;
      const sd = Math.hypot(s.x - p.x, s.y - p.y);
      if (sd < world.magnet && sd > 1) {
        s.x += ((p.x - s.x) / sd) * 60 * dt;
        s.y += ((p.y - s.y) / sd) * 60 * dt;
      }
    }
  }
}
function stepBoss(world, dt, audio) {
  const boss = world.boss;
  if (!boss) return;
  boss.t += dt;
  if (boss.flash > 0) boss.flash -= dt;
  const phaseIndex = boss.hp > 200 ? 0 : boss.hp > 100 ? 1 : 2;
  if (phaseIndex !== world.bossPhase) {
    world.bossPhase = phaseIndex;
    world.log.push(`${BOSS.phases[phaseIndex].name} — the Maw changes!`);
    if (audio) sfx.boss(audio);
    burst(world, boss.x, boss.y, '#b48ce8', 30, 200);
    world.shake = 10;
  }
  const phase = BOSS.phases[phaseIndex];
  const p = world.player;
  const dx = p.x - boss.x; const dy = p.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  if (phaseIndex === 2 && boss.charge > 0) {
    boss.charge -= dt;
    boss.x += Math.cos(boss.chargeDir) * 340 * dt;
    boss.y += Math.sin(boss.chargeDir) * 340 * dt;
  } else {
    boss.x += (dx / d) * phase.speed * dt;
    boss.y += (dy / d) * phase.speed * dt * 0.7;
    if (phaseIndex === 2 && boss.t % 5 < dt) {
      boss.charge = 0.7;
      boss.chargeDir = Math.atan2(dy, dx);
      world.log.push('The Maw charges!');
    }
  }
  boss.x = Math.max(80, Math.min(1200, boss.x));
  boss.y = Math.max(160, Math.min(SEABED - 70, boss.y));
  if (phaseIndex >= 1) {
    boss.inkTimer -= dt;
    if (boss.inkTimer <= 0) {
      boss.inkTimer = phaseIndex === 2 ? 2.5 : 4;
      world.inks.push({ x: boss.x, y: boss.y, life: 3, maxLife: 3, radius: 90 });
    }
  }
  if (d < boss.radius + 22) {
    damagePlayer(world, phase.damage, audio, 'The Abyssal Maw bit the skiff');
    // Knock the boss back so it cannot chew the hull in one frame.
    boss.x -= (dx / d) * 120;
    boss.y -= (dy / d) * 120;
  }
  if (boss.hp <= 0) {
    burst(world, boss.x, boss.y, '#f2b134', 60, 260);
    burst(world, boss.x, boss.y, '#b48ce8', 40, 200);
    world.score += 500;
    world.gold += 150;
    world.log.push('THE ABYSSAL MAW IS BROKEN! +500');
    // The Maw's death scatters its brood: the endgame is the haul, not a swarm.
    for (const e of world.enemies) burst(world, e.x, e.y, '#7fd4c1', 8, 120);
    world.enemies = [];
    world.log.push("The Maw's brood scatters into the dark.");
    if (audio) sfx.win(audio);
    world.boss = null;
    world.bossHp = 0;
    if (world.banked >= world.quota) diveCleared(world, audio);
  }
}
function stepPickups(world, dt, audio) {
  const p = world.player;
  for (const pk of [...world.pickups]) {
    if (pk.kind === 'oxygen') {
      pk.y += pk.vy * dt;
      if (pk.y < WATER_TOP + 20) pk.y = SEABED - 30;
    }
    const d = Math.hypot(pk.x - p.x, pk.y - p.y);
    if (d < 34) {
      if (pk.kind === 'oxygen') { world.oxygen = Math.min(100, world.oxygen + OXYGEN_PICKUP); world.log.push(`Oxygen bubble! +${OXYGEN_PICKUP} O2.`); }
      else { world.hull = Math.min(world.maxHull, world.hull + REPAIR_PICKUP); world.log.push(`Repair kit! +${REPAIR_PICKUP} hull.`); }
      if (audio) sfx.pickup(audio);
      world.pickups = world.pickups.filter((x) => x !== pk);
    }
  }
  world.bubbleTimer -= dt;
  if (world.bubbleTimer <= 0) {
    world.bubbleTimer = 6;
    world.pickups.push({ kind: 'oxygen', x: range(world.rng, 90, 1190), y: SEABED - 30, vy: -22 });
  }
  // A repair kit drifts in now and then, so a hurt skiff can always recover.
  world.repairTimer = (world.repairTimer ?? 14) - dt;
  if (world.repairTimer <= 0) {
    world.repairTimer = 14;
    if (world.pickups.filter((pk) => pk.kind === 'repair').length < 3) {
      world.pickups.push({ kind: 'repair', x: range(world.rng, 150, 1130), y: range(world.rng, 200, 500) });
    }
  }
}

export function stepWorld(world, dt, input, audio) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  world.diveTime += dt;
  if (world.hurtTimer > 0) world.hurtTimer -= dt;
  // Hull patches itself slowly after 5 s without a hit: a careful diver
  // recovers, a reckless one does not. Never above max hull.
  if (world.time - (world.lastHurtAt ?? -99) > 5 && world.hull > 0) {
    world.hull = Math.min(world.maxHull, world.hull + 3 * dt);
  }
  const p = world.player;
  // Oxygen is the dive clock.
  world.oxygen -= (100 / world.oxygenMax) * dt;
  if (world.oxygen <= 0) {
    world.oxygen = 0;
    endGame(world, false, 'oxygen');
    if (audio) sfx.lose(audio);
    return;
  }
  // Steering: WASD / arrows, with drag. Ink halves the speed.
  const inked = world.inks.some((i) => Math.hypot(i.x - p.x, i.y - p.y) < i.radius);
  world.inked = inked ? 1 : 0;
  const speed = world.speed * (inked ? 0.5 : 1) * (p.carrying > 0 ? 0.92 : 1);
  let ax = 0; let ay = 0;
  const keys = input.keys || new Set();
  if (keys.has('w') || keys.has('arrowup')) ay -= 1;
  if (keys.has('s') || keys.has('arrowdown')) ay += 1;
  if (keys.has('a') || keys.has('arrowleft')) ax -= 1;
  if (keys.has('d') || keys.has('arrowright')) ax += 1;
  const len = Math.hypot(ax, ay) || 1;
  p.vx += (ax / len) * speed * 3 * dt;
  p.vy += (ay / len) * speed * 3 * dt;
  p.vx *= Math.pow(0.12, dt);
  p.vy *= Math.pow(0.12, dt);
  const sp = Math.hypot(p.vx, p.vy);
  const maxSp = speed;
  if (sp > maxSp) { p.vx = (p.vx / sp) * maxSp; p.vy = (p.vy / sp) * maxSp; }
  p.x = Math.max(40, Math.min(1240, p.x + p.vx * dt));
  p.y = Math.max(WATER_TOP + 18, Math.min(SEABED - 26, p.y + p.vy * dt));
  if (sp > 20) p.angle = Math.atan2(p.vy, p.vx);
  // Aim the harpoon gun at the mouse; fire on click or SPACE.
  if (input.mouseX !== undefined) {
    const dx = input.mouseX - p.x; const dy = input.mouseY - p.y;
    if (Math.hypot(dx, dy) > 10) p.angle = Math.atan2(dy, dx);
  }
  world.fireTimer -= dt;
  const wantFire = (input.clicked || input.mouseDown || keys.has(' ')) && world.fireTimer <= 0;
  if (wantFire) fireHarpoon(world, input, audio);
  stepHarpoons(world, dt, audio);
  stepEnemies(world, dt, audio);
  if (world.screen !== SCREEN_PLAY) return;
  stepBoss(world, dt, audio);
  if (world.screen !== SCREEN_PLAY) return;
  stepPickups(world, dt, audio);
  // Bank salvage at the buoy (surface, centre).
  if (p.carrying > 0 && Math.hypot(BUOY.x - p.x, BUOY.y + 30 - p.y) < 110) {
    const n = p.carrying;
    p.carrying = 0;
    world.banked += n;
    world.stats.bankedTotal += n;
    world.score += SALVAGE_SCORE * n;
    world.gold += SALVAGE_GOLD * n;
    burst(world, BUOY.x, BUOY.y + 30, '#f2b134', 14, 120);
    if (audio) sfx.bank(audio);
    world.log.push(`Banked ${n} salvage at the buoy! +${SALVAGE_SCORE * n} (+${SALVAGE_GOLD * n} gold)`);
  }
  // Ink clouds fade; particles fade; shake decays.
  for (const ink of world.inks) ink.life -= dt;
  world.inks = world.inks.filter((i) => i.life > 0);
  for (const pt of world.particles) { pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  world.shake = Math.max(0, world.shake - 30 * dt);
  // Dive cleared when the quota is banked (and the boss is dead, on dive 8).
  if (world.banked >= world.quota && !world.boss) diveCleared(world, audio);
}
export { BUOY };
