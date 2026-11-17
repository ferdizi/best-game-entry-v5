// DREDGEWARD screenshot scenes behind ?shot=start|play|boss|end.
// Each stages a real world (no fake pixels): the play scene starts dive 4
// and steps it forward with a harpoon fired; boss stages dive 8 with the
// Maw at phase 2; end stages a finished win. Same seed, same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, beginGame, startDive, stepWorld } from './world.js';
import { STEP } from './config.js';

function runSteps(world, seconds, input) {
  for (let i = 0; i < seconds / STEP; i += 1) stepWorld(world, STEP, input || {});
}
export function stageShot(name, world) {
  beginGame(world);
  if (name !== 'play' && name !== 'boss' && name !== 'end') {
    world.screen = SCREEN_TITLE;
    world.best = 1240;
    return { screen: SCREEN_TITLE, best: world.best };
  }
  if (name === 'end') {
    startDive(world, 7);
    world.boss = null; world.bossHp = 0;
    world.banked = 10;
    world.score = 3120; world.gold = 214;
    world.stats = { kills: 23, bankedTotal: 41, divesCleared: 8, shots: 96 };
    world.won = true;
    world.screen = SCREEN_OVER;
    world.best = 3120;
    return { screen: SCREEN_OVER, best: world.score };
  }
  if (name === 'boss') {
    // A fought-through dive 8: upgrades bought, quota nearly met, Maw hurt.
    world.gold = 120;
    world.upgrades = { hull: 2, harpoon: 2, engine: 1, magnet: 1 };
    world.harpoonDamage = 3; world.harpoonRange = 340;
    world.maxHull = 150; world.hull = 118;
    startDive(world, 7);
    world.gold = 120; world.score = 2410;
    world.banked = 7; world.stats.kills = 18; world.stats.bankedTotal = 34;
    world.boss.hp = 120; world.bossHp = 120; world.bossPhase = 1;
    world.boss.x = 880; world.boss.y = 420;
    runSteps(world, 1.6, { keys: new Set(['d']), mouseX: 880, mouseY: 420, clicked: true });
    world.score = 2410; world.banked = 7; world.hull = 118;
    world.boss.hp = 120; world.bossHp = 120; world.bossPhase = 1;
    world.log = ['PHASE 2 — INKSTORM — the Maw changes!', 'The Abyssal Maw bit the skiff — hull -22.'];
    return { screen: SCREEN_PLAY, best: world.score };
  }
  // Play: dive 4, mid-fight, harpoon out, salvage carried, enemies near.
  world.gold = 85;
  world.upgrades = { hull: 1, harpoon: 1, engine: 1, magnet: 0 };
  world.harpoonDamage = 2; world.harpoonRange = 300;
  world.maxHull = 125; world.hull = 96;
  startDive(world, 3);
  world.gold = 85; world.score = 1240;
  world.banked = 4; world.stats.kills = 9; world.stats.bankedTotal = 15;
  world.player.carrying = 1;
  runSteps(world, 2.4, { keys: new Set(['d', 'w']), mouseX: 900, mouseY: 300, clicked: true });
  world.score = 1240; world.banked = 4; world.hull = 96;
  world.player.carrying = 1;
  world.log = ['Salvage hauled aboard (1/2). Take it to the buoy!', 'DIVE 4 — CRAB WARRACKS'];
  return { screen: SCREEN_PLAY, best: world.score };
}
