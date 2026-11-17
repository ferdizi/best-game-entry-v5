// DREDGEWARD configuration: every tunable number lives here so world.js
// stays about rules. One clear job: the numbers of the eight dives, the
// four enemy kinds, the boss and the four upgrade tracks.
export const VIEW = { width: 1280, height: 720 };
export const WATER_TOP = 84; // surface line; above it is sky + the buoy
export const SEABED = 668; // seabed line; salvage rests here
export const STEP = 1 / 60;

// Deep teal water, amber salvage gold, coral danger. One palette, everywhere.
export const PALETTE = {
  sky: '#0e2a3d',
  waterTop: '#0f4c5c',
  waterDeep: '#07222e',
  seabed: '#3a2f22',
  sand: '#8a6f4d',
  amber: '#f2b134',
  amberDark: '#b97e1a',
  coral: '#ff6b5e',
  coralDark: '#c93a2e',
  tealLight: '#7fd4c1',
  ink: '#1b2f45',
  bone: '#e8dcc3',
  ui: '#0a1a24',
};

// Eight dives down the Sunken City: quota, enemy mix, oxygen seconds.
export const DIVES = [
  { dive: 1, name: 'THE SHALLOWS', quota: 5, oxygen: 95, mines: 3, eels: 2, crabs: 1, squids: 0, blurb: 'Learn the harpoon. Mind the mines.' },
  { dive: 2, name: 'DROWNED MARKET', quota: 6, oxygen: 95, mines: 4, eels: 3, crabs: 2, squids: 0, blurb: 'Stalls of the old traders, still full.' },
  { dive: 3, name: 'THE EEL GARDENS', quota: 7, oxygen: 100, mines: 4, eels: 5, crabs: 2, squids: 1, blurb: 'Eels nest in the kelp. Keep moving.' },
  { dive: 4, name: 'CRAB WARRACKS', quota: 7, oxygen: 100, mines: 5, eels: 4, crabs: 4, squids: 1, blurb: 'Snappers guard the wrecks.' },
  { dive: 5, name: 'THE INK REEF', quota: 8, oxygen: 105, mines: 5, eels: 5, crabs: 3, squids: 3, blurb: 'Squids ink the water. Watch the bubbles.' },
  { dive: 6, name: 'SUNKEN BELL TOWER', quota: 9, oxygen: 105, mines: 6, eels: 6, crabs: 4, squids: 3, blurb: 'The bell still rings, deep down.' },
  { dive: 7, name: 'THE THRONE RUINS', quota: 10, oxygen: 110, mines: 7, eels: 7, crabs: 5, squids: 4, blurb: 'The old king kept his gold close.' },
  { dive: 8, name: 'THE ABYSSAL MAW', quota: 10, oxygen: 150, mines: 3, eels: 3, crabs: 2, squids: 2, boss: true, blurb: 'It ate the city. Take it back.' },
];

// Enemy kinds: speed, hull damage on touch, harpoon hits to kill, score.
export const ENEMIES = {
  mine: { name: 'Spike Mine', speed: 12, damage: 18, hp: 1, score: 25, radius: 16, color: '#ff6b5e' },
  eel: { name: 'Volt Eel', speed: 85, damage: 10, hp: 2, score: 40, radius: 14, color: '#7fd4c1' },
  crab: { name: 'Snapper Crab', speed: 42, damage: 14, hp: 3, score: 50, radius: 18, color: '#ff9e5e' },
  squid: { name: 'Ink Squid', speed: 70, damage: 10, hp: 2, score: 45, radius: 16, color: '#b48ce8' },
};

// The boss: THE ABYSSAL MAW, three phases at 300 / 200 / 100 HP.
export const BOSS = {
  name: 'THE ABYSSAL MAW',
  title: 'Eater of the Sunken City — 3 phases',
  maxHp: 300,
  radius: 58,
  phases: [
    { name: 'PHASE 1 — LURKING JAWS', at: 300, speed: 55, damage: 18 },
    { name: 'PHASE 2 — INKSTORM', at: 200, speed: 80, damage: 22 },
    { name: 'PHASE 3 — CRUSHING MAW', at: 100, speed: 115, damage: 26 },
  ],
};

// Between-dive upgrades: four tracks, three tiers each. Costs in gold.
export const UPGRADES = [
  { id: 'hull', name: 'REINFORCED HULL', tiers: [30, 70, 130], blurb: '+25 max hull, repair 25', per: '+25 hull' },
  { id: 'harpoon', name: 'BARBED HARPOON', tiers: [35, 80, 150], blurb: '+1 harpoon damage, +40 range', per: '+1 dmg' },
  { id: 'engine', name: 'TIDE ENGINE', tiers: [30, 70, 130], blurb: '+18% skiff speed', per: '+18% speed' },
  { id: 'magnet', name: 'SALVAGE MAGNET', tiers: [25, 60, 110], blurb: '+45 salvage pickup radius', per: '+45 radius' },
];

export const START = {
  hull: 100,
  oxygen: 100,
  gold: 0,
  score: 0,
  harpoonDamage: 1,
  harpoonRange: 260,
  speed: 210,
  magnet: 46,
};

// Salvage values: a banked relic pays gold and counts toward the quota.
export const SALVAGE_SCORE = 50;
export const SALVAGE_GOLD = 12;
export const KILL_GOLD = 6;
export const OXYGEN_PICKUP = 30;
export const REPAIR_PICKUP = 20;
