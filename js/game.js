/* Starry Town — a walkable portfolio. No dependencies; everything is drawn in code. */
(() => {
'use strict';

const DATA = window.DATA;
const T = 16, MW = 46, MH = 34;
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ i18n */
const UI = {
  en: {
    name: "Nan Yao's walkable portfolio",
    kicker: 'NAN YAO · AI · VENTURE · PRODUCT',
    sub: 'My portfolio, built as a small town. Walk around, step into the buildings, and see what I have been working on.',
    start: '▶ Start exploring', quick: 'Quick view', cv: 'CV', lang: '中文',
    hint: 'Arrow keys or WASD to walk · E or Space to open · or click anywhere to walk there',
    hintTouch: 'Tap anywhere to walk · tap a building to visit it',
    visit: 'Visit', found: 'found',
    hello: "Hi, I'm Nan. This town holds my work, my projects and a bit of my life. Walk up to anything with a “?” and open it. My Samoyed insists on coming along.",
    next: 'click or press any key ▸',
    newStar: 'New star lit',
    allDone: 'All 16 stars lit. Thanks for walking the whole town!', sayHi: 'Say hi',
    quickTitle: 'Everything on one page', quickKicker: 'Quick view',
    sec: { exp: 'Experience', work: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    kick: { about: 'Welcome', job: 'Experience', project: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    aboutTitle: "Hi, I'm Nan Yao", eduTitle: 'Education', contactTitle: 'Get in touch',
    phone: 'Phone', github: 'GitHub', reset: 'Reset progress',
  },
  zh: {
    name: '姚楠的可以逛的作品集',
    kicker: '姚楠 · AI · 创投 · 产品',
    sub: '我把作品集做成了一个小镇。四处走走，推门进去，看看我做过什么。',
    start: '▶ 开始探索', quick: '快速浏览', cv: '简历', lang: 'EN',
    hint: '方向键或 WASD 走路 · E 或空格打开 · 也可以直接点击想去的地方',
    hintTouch: '点击任意位置走过去 · 点击建筑直接拜访',
    visit: '进入', found: '已发现',
    hello: '嗨，我是姚楠。这个小镇里放着我的工作经历、项目和一点生活。走到带“?”的地方就可以打开看看。我的萨摩耶一定要跟着。',
    next: '点击或按任意键 ▸',
    newStar: '点亮一颗新的星',
    allDone: '16 颗星全部点亮，谢谢你逛完整个小镇！', sayHi: '打个招呼',
    quickTitle: '一页看完全部内容', quickKicker: '快速浏览',
    sec: { exp: '工作经历', work: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    kick: { about: '欢迎', job: '工作经历', project: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    aboutTitle: '嗨，我是姚楠', eduTitle: '教育背景', contactTitle: '联系我',
    phone: '电话', github: 'GitHub', reset: '重置进度',
  },
};
let lang = 'en';
try {
  lang = localStorage.getItem('starry-town-lang') || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
} catch (e) {}
const t = () => UI[lang];
const d = () => DATA[lang];
const esc = v => String(v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

/* ------------------------------------------------------------------ spots */
const SPOTS = [
  { id: 'about',    kind: 'about',        name: { en: 'Welcome Sign', zh: '小镇路牌' } },
  { id: 'monolith', kind: 'job', i: 0,    name: { en: 'Monolith Capital', zh: 'Monolith 砺思资本' } },
  { id: 'manus',    kind: 'job', i: 1,    name: { en: 'Manus AI', zh: 'Manus AI' } },
  { id: 'crossing', kind: 'job', i: 2,    name: { en: 'Crossing Media', zh: '十字路口 Crossing' } },
  { id: 'linear',   kind: 'job', i: 3,    name: { en: 'Linear Capital', zh: '线性资本' } },
  { id: 'waves',    kind: 'job', i: 4,    name: { en: '36Kr · Waves', zh: '36氪 暗涌' } },
  { id: 'orbit',    kind: 'project', i: 0, name: { en: 'Orbit', zh: 'Orbit' } },
  { id: 'sync',     kind: 'project', i: 1, name: { en: 'Adaptive Sync', zh: 'Adaptive Sync' } },
  { id: 'agent',    kind: 'project', i: 2, name: { en: 'Agent Boundaries', zh: 'Agent Boundaries' } },
  { id: 'wavo',     kind: 'project', i: 3, name: { en: 'Wavo! Open Course', zh: 'Wavo! 开放课' } },
  { id: 'odyssey',  kind: 'project', i: 4, name: { en: 'Waves Odyssey', zh: 'Waves Odyssey' } },
  { id: 'focus',    kind: 'focus',        name: { en: 'Lookout', zh: '观察镜' } },
  { id: 'edu',      kind: 'edu',          name: { en: 'Campus', zh: '校园' } },
  { id: 'skills',   kind: 'skills',       name: { en: 'Toolshed', zh: '工具屋' } },
  { id: 'life',     kind: 'life',         name: { en: 'Campsite', zh: '营地' } },
  { id: 'contact',  kind: 'contact',      name: { en: 'Mailbox', zh: '信箱' } },
];
const spotById = Object.fromEntries(SPOTS.map(s => [s.id, s]));
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem('starry-town-found') || '[]').filter(id => spotById[id])); } catch (e) {}
const saveFound = () => { try { localStorage.setItem('starry-town-found', JSON.stringify([...found])); } catch (e) {} };

/* ------------------------------------------------------------------ world */
const G = 0, P = 1, Z = 2, W = 3, D = 4;
const map = new Uint8Array(MW * MH);
const solid = new Uint8Array(MW * MH);
const reserved = new Uint8Array(MW * MH);
const flowers = new Uint8Array(MW * MH);
const I = (x, y) => y * MW + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
function hash(x, y, s = 0) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function rect(x, y, w, h, v, arr = map) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inMap(i, j)) arr[I(i, j)] = v;
}

// coastline
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  if (x < 2 || x >= 44 || y < 2 || y >= 32) map[I(x, y)] = W;
  else if ((x === 2 || x === 43 || y === 2 || y === 31) && hash(x, y, 7) < 0.3) map[I(x, y)] = W;
}
[[2, 2], [3, 2], [2, 3], [43, 2], [42, 2], [43, 3], [2, 31], [3, 31], [2, 30], [43, 31], [42, 31], [43, 30]].forEach(([x, y]) => map[I(x, y)] = W);
rect(27, 29, 10, 3, W);            // bay
// streets
rect(4, 16, 38, 2, P); rect(4, 24, 38, 2, P);
rect(22, 11, 2, 17, P);
rect(10, 16, 2, 10, P); rect(33, 16, 2, 10, P);
rect(19, 14, 8, 6, Z);             // plaza
[5, 10, 16, 31, 38].forEach(x => rect(x, 13, 1, 3, P));
[6, 15, 30, 38].forEach(x => rect(x, 23, 1, 1, P));
rect(11, 26, 1, 4, P); rect(8, 29, 8, 1, P);     // park paths
rect(30, 26, 2, 2, P); rect(30, 28, 2, 3, D);    // pier

const BUILDINGS = [
  { id: 'skills',   kind: 'house',  x: 4,  y: 9,  w: 4, h: 4, door: 1, wall: '#c2935f', wallD: '#9a6f45', roof: '#6d4a3c', roofD: '#553628', roofL: '#8a6350', sign: '#8fd3c1', plank: true },
  { id: 'orbit',    kind: 'dome',   x: 9,  y: 8,  w: 4, h: 5, door: 1 },
  { id: 'linear',   kind: 'house',  x: 14, y: 8,  w: 5, h: 5, door: 2, wall: '#eceef5', wallD: '#c3c7d8', roof: '#3d4d74', roofD: '#2f3c5c', roofL: '#5a6c98', sign: '#ffffff' },
  { id: 'monolith', kind: 'tower',  x: 20, y: 3,  w: 6, h: 8, door: 2 },
  { id: 'crossing', kind: 'house',  x: 29, y: 8,  w: 5, h: 5, door: 2, wall: '#f3dcab', wallD: '#d3b77d', roof: '#d9544f', roofD: '#b23e3c', roofL: '#ee7a70', sign: '#ffd95a' },
  { id: 'waves',    kind: 'house',  x: 36, y: 8,  w: 5, h: 5, door: 2, wall: '#e1ecf7', wallD: '#b5c7dc', roof: '#2f6fb5', roofD: '#235690', roofL: '#5a97d6', sign: '#9fd6ff' },
  { id: 'sync',     kind: 'house',  x: 5,  y: 19, w: 4, h: 4, door: 1, wall: '#d5dde3', wallD: '#a9b5bf', roof: '#e2793a', roofD: '#bd5d27', roofL: '#f49c62', sign: '#ffb37a' },
  { id: 'agent',    kind: 'house',  x: 13, y: 19, w: 5, h: 4, door: 2, wall: '#ebe4d0', wallD: '#c7bea4', roof: '#4f8f62', roofD: '#3b7350', roofL: '#73b083', sign: '#a8e6a1' },
  { id: 'wavo',     kind: 'house',  x: 28, y: 19, w: 5, h: 4, door: 2, wall: '#ffeabb', wallD: '#e0c58a', roof: '#e8588a', roofD: '#c23f70', roofL: '#f587ab', sign: '#ffc2d6' },
  { id: 'edu',      kind: 'campus', x: 35, y: 18, w: 7, h: 5, door: 3, wall: '#ebe0cb', wallD: '#c9bb9f', roof: '#6a2aa0', roofD: '#531b82', roofL: '#8d4fc2', sign: '#d9b8ff' },
];
const TRIG = {
  skills: [5, 13], orbit: [10, 13], linear: [16, 13], monolith: [22, 11], crossing: [31, 13], waves: [38, 13],
  sync: [6, 23], agent: [15, 23], wavo: [30, 23], edu: [38, 23],
  about: [20, 16], focus: [25, 16], manus: [26, 14], life: [13, 29], odyssey: [31, 30], contact: [23, 27],
};
// objects: tx,ty = top-left tile of the solid footprint; fw,fh footprint size
const OBJECTS = [
  { kind: 'sign',     tx: 20, ty: 15, fw: 1, fh: 1, spot: 'about' },
  { kind: 'scope',    tx: 25, ty: 15, fw: 1, fh: 1, spot: 'focus' },
  { kind: 'statue',   tx: 22, ty: 16, fw: 2, fh: 1 },
  { kind: 'booth',    tx: 26, ty: 13, fw: 2, fh: 1, spot: 'manus' },
  { kind: 'tent',     tx: 5,  ty: 27, fw: 3, fh: 2 },
  { kind: 'fire',     tx: 9,  ty: 27, fw: 1, fh: 1 },
  { kind: 'doghouse', tx: 13, ty: 28, fw: 2, fh: 1, spot: 'life' },
  { kind: 'boulder',  tx: 16, ty: 27, fw: 2, fh: 2 },
  { kind: 'net',      tx: 14, ty: 30, fw: 3, fh: 1 },
  { kind: 'mailbox',  tx: 24, ty: 27, fw: 1, fh: 1, spot: 'contact' },
  { kind: 'ship',     tx: 32, ty: 29, fw: 5, fh: 3, spot: 'odyssey', water: true },
  { kind: 'crossSign', tx: 28, ty: 13, fw: 1, fh: 1 },
  { kind: 'light',    tx: 12, ty: 23, fw: 1, fh: 1 },
  { kind: 'crates',   tx: 8,  ty: 12, fw: 1, fh: 1 },
  { kind: 'bench',    tx: 19, ty: 19, fw: 2, fh: 1 },
  { kind: 'bench',    tx: 25, ty: 19, fw: 2, fh: 1 },
];
[[7, 15], [13, 15], [18, 15], [28, 15], [35, 15], [41, 15], [9, 23], [18, 23], [27, 23], [36, 23], [21, 12], [24, 12], [12, 26], [21, 27], [29, 27]]
  .forEach(([tx, ty]) => OBJECTS.push({ kind: 'lamp', tx, ty, fw: 1, fh: 1 }));

// solids + spot geometry
for (let i = 0; i < map.length; i++) if (map[i] === W) solid[i] = 1;
BUILDINGS.forEach(b => {
  rect(b.x, b.y, b.w, b.h, 1, solid);
  rect(b.x - 1, b.y - 2, b.w + 2, b.h + 4, 1, reserved);
  const s = spotById[b.id];
  s.hit = { x: b.x * T, y: b.y * T - 10, w: b.w * T, h: b.h * T + 10 };
  s.anchor = { x: (b.x + b.w / 2) * T, y: b.kind === 'tower' ? (b.y + b.h) * T - 34 : b.y * T - (b.kind === 'dome' ? 22 : b.kind === 'campus' ? 30 : 16) };
});
OBJECTS.forEach(o => {
  rect(o.tx, o.ty, o.fw, o.fh, 1, solid);
  rect(o.tx - 1, o.ty - 2, o.fw + 2, o.fh + 3, 1, reserved);
  if (o.spot) {
    const s = spotById[o.spot];
    const up = { booth: 22, ship: 44, doghouse: 14, sign: 12, scope: 14, mailbox: 12 }[o.kind] || 12;
    s.hit = { x: o.tx * T, y: o.ty * T - up, w: o.fw * T, h: o.fh * T + up };
    s.anchor = { x: (o.tx + o.fw / 2) * T, y: o.ty * T - up - 6 };
  }
});
SPOTS.forEach(s => { s.trig = TRIG[s.id]; });
rect(4, 26, 15, 5, 1, reserved);   // park is decorated by hand
// keep trees off and next to anything walkable
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const v = map[I(x, y)];
  if (v === P || v === Z || v === D) rect(x - 1, y - 1, 3, 3, 1, reserved);
}
const TREES = [];
for (let y = 2; y < 32; y++) for (let x = 2; x < 44; x++) {
  const i = I(x, y);
  if (map[i] !== G) continue;
  if (!reserved[i] && !solid[i]) {
    const edge = y <= 4 || x <= 3 || x >= 42 || y >= 30;
    if (hash(x, y, 1) < (edge ? 0.62 : 0.24)) { TREES.push({ tx: x, ty: y, pine: hash(x, y, 2) < 0.4 }); solid[i] = 1; continue; }
  }
  if (!solid[i] && hash(x, y, 3) < 0.07) flowers[i] = 1 + Math.floor(hash(x, y, 4) * 3);
}

/* ------------------------------------------------------------------ drawing helpers */
const INK = '#231f3a', LIT = '#ffe08a', DARKWIN = '#3c4670';
const PAL = {
  grass: '#3f8566', grassD: '#367659', grassL: '#4e9a76', tuft: '#66b88a',
  path: '#dcc898', pathD: '#c2ab7a', pathL: '#ebdcb4',
  plaza: '#aba6c6', plazaD: '#8d88ad', plazaL: '#c1bcda',
  water: '#3763ad', waterD: '#2b4f93', waterL: '#86b6ec',
  wood: '#ad784c', woodD: '#7f5435',
};
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function disc(c, cx, cy, r, col, half) {
  c.fillStyle = col;
  for (let dy = -r; dy <= (half ? 0 : r); dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy));
    c.fillRect(cx - w, cy + dy, w * 2, 1);
  }
}
function sprite(rows, pal) {
  const cv = document.createElement('canvas');
  cv.width = rows[0].length; cv.height = rows.length;
  const c = cv.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) R(c, x, y, 1, 1, pal[ch]); }));
  return cv;
}
function flip(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const c = cv.getContext('2d');
  c.translate(src.width, 0); c.scale(-1, 1); c.drawImage(src, 0, 0);
  return cv;
}

/* ------------------------------------------------------------------ sprites */
const PP = { h: '#3a2a2e', s: '#f6d2b0', k: '#231f3a', c: '#e8588a', p: '#34406e', b: '#231f3a' };
const BODY = {
  down: ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hhsssshh..', '..hskssksh..', '..hssssssh..', '..hhsssshh..', '.hhhcccchhh.', '.hhcccccchh.', '..sccccccs..', '..sccccccs..', '...cccccc...', '...pppppp...'],
  up: ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhhhcchhhh.', '..shhcchhs..', '..sccccccs..', '...cccccc...', '...pppppp...'],
  right: ['....hhhh....', '...hhhhhh...', '..hhhhhhh...', '..hhhhsss...', '..hhhssks...', '..hhhssss...', '..hhhhss....', '..hhhccc....', '..hhcccc....', '...hcscc....', '....cscc....', '....cccc....', '....pppp....'],
};
const LEGS = {
  front: [['...pp..pp...', '...pp..pp...', '...bb..bb...'], ['...pp..pp...', '...pp..bb...', '...bb.......'], ['...pp..pp...', '...bb..pp...', '.......bb...']],
  side: [['....pppp....', '....pppp....', '....bbbb....'], ['...pp.pp....', '..pp...pp...', '..bb...bb...'], ['....pppp....', '....ppp.....', '....bbb.....']],
};
const PLAYER = {};
['down', 'up', 'right'].forEach(dir => {
  PLAYER[dir] = LEGS[dir === 'right' ? 'side' : 'front'].map(l => sprite(BODY[dir].concat(l), PP));
});
PLAYER.left = PLAYER.right.map(flip);

const DP = { w: '#ffffff', g: '#d5dbea', k: '#231f3a', n: '#231f3a', t: '#ff8fb1' };
const DOGB = ['............ww..', '.ww........wwww.', 'www.......wwwwww', 'ww........wwkwwn', 'ww.wwwwwwwwwwww.', '.wwwwwwwwwwwwt..', '.wwwwwwwwwwww...', '.wwwwwwwwwww....', '.gwwwwwwwwwg....'];
const DOGL = [['..ww....ww......', '..ww....ww......', '..gg....gg......'], ['..ww.....ww.....', '.ww.......ww....', '.gg.......gg....'], ['...ww..ww.......', '...ww..ww.......', '...gg..gg.......']];
const DOG = { right: DOGL.map(l => sprite(DOGB.concat(l), DP)) };
DOG.left = DOG.right.map(flip);

/* ------------------------------------------------------------------ ground cache */
const ground = document.createElement('canvas');
ground.width = MW * T; ground.height = MH * T;
(function paintGround() {
  const c = ground.getContext('2d');
  const at = (x, y) => inMap(x, y) ? map[I(x, y)] : W;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const v = map[I(x, y)], px = x * T, py = y * T;
    if (v === W) {
      R(c, px, py, T, T, PAL.water);
      for (let k = 0; k < 2; k++) R(c, px + Math.floor(hash(x, y, k) * 12), py + Math.floor(hash(x, y, k + 9) * 15), 3, 1, PAL.waterD);
    } else if (v === G) {
      R(c, px, py, T, T, PAL.grass);
      for (let k = 0; k < 4; k++) {
        const hx = Math.floor(hash(x, y, k + 20) * 15), hy = Math.floor(hash(x, y, k + 30) * 15);
        R(c, px + hx, py + hy, 2, 1, k % 2 ? PAL.grassD : PAL.grassL);
      }
      if (hash(x, y, 40) < 0.3) { const hx = 2 + Math.floor(hash(x, y, 41) * 11), hy = 3 + Math.floor(hash(x, y, 42) * 10); R(c, px + hx, py + hy, 1, 3, PAL.tuft); R(c, px + hx + 2, py + hy + 1, 1, 2, PAL.tuft); }
      if (flowers[I(x, y)]) {
        const col = ['#ff9fc0', '#ffe27a', '#ffffff'][flowers[I(x, y)] - 1];
        const hx = 3 + Math.floor(hash(x, y, 50) * 8), hy = 3 + Math.floor(hash(x, y, 51) * 8);
        R(c, px + hx, py + hy, 2, 2, col); R(c, px + hx + 5, py + hy + 3, 2, 2, col); R(c, px + hx, py + hy + 2, 1, 2, '#2f6a52');
      }
    } else if (v === P) {
      R(c, px, py, T, T, PAL.path);
      for (let k = 0; k < 3; k++) R(c, px + Math.floor(hash(x, y, k + 60) * 14), py + Math.floor(hash(x, y, k + 70) * 15), 2, 1, k ? PAL.pathD : PAL.pathL);
      if (at(x, y - 1) === G) R(c, px, py, T, 1, PAL.pathD);
      if (at(x, y + 1) === G) R(c, px, py + T - 1, T, 1, PAL.pathD);
      if (at(x - 1, y) === G) R(c, px, py, 1, T, PAL.pathD);
      if (at(x + 1, y) === G) R(c, px + T - 1, py, 1, T, PAL.pathD);
    } else if (v === Z) {
      R(c, px, py, T, T, PAL.plaza);
      R(c, px, py + 7, T, 1, PAL.plazaD); R(c, px, py + 15, T, 1, PAL.plazaD);
      R(c, px + 7, py, 1, 7, PAL.plazaD); R(c, px + 15, py, 1, 7, PAL.plazaD);
      R(c, px + 3, py + 8, 1, 7, PAL.plazaD); R(c, px + 11, py + 8, 1, 7, PAL.plazaD);
      if (hash(x, y, 80) < 0.5) R(c, px + 1 + Math.floor(hash(x, y, 81) * 4), py + 1, 3, 1, PAL.plazaL);
    } else if (v === D) {
      R(c, px, py, T, T, PAL.wood);
      for (let k = 3; k < T; k += 4) R(c, px, py + k, T, 1, PAL.woodD);
      R(c, px, py, 1, T, PAL.woodD); R(c, px + T - 1, py, 1, T, PAL.woodD);
    }
  }
  // shoreline
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const px = x * T, py = y * T, v = at(x, y);
    if (v === W) {
      if (at(x, y - 1) !== W) { R(c, px, py, T, 4, '#5a4a3c'); R(c, px, py + 4, T, 2, '#24427f'); R(c, px + 2, py + 6, 5, 1, '#d8ecff'); R(c, px + 10, py + 7, 4, 1, '#d8ecff'); }
      if (at(x - 1, y) !== W && at(x - 1, y) !== D) R(c, px, py, 2, T, '#24427f');
      if (at(x + 1, y) !== W && at(x + 1, y) !== D) R(c, px + T - 2, py, 2, T, '#24427f');
      if (at(x, y + 1) !== W) R(c, px, py + T - 2, T, 2, '#d8ecff');
    } else if (v === G) {
      if (at(x, y + 1) === W) R(c, px, py + T - 2, T, 2, '#2f6a52');
      if (at(x - 1, y) === W) R(c, px, py, 1, T, '#2f6a52');
      if (at(x + 1, y) === W) R(c, px + T - 1, py, 1, T, '#2f6a52');
      if (at(x, y - 1) === W) R(c, px, py, T, 1, '#6fc292');
    }
  }
  // park court markings
  R(c, 13 * T + 4, 30 * T + 14, 5 * T - 8, 1, 'rgba(255,255,255,.55)');
})();

/* ------------------------------------------------------------------ building art */
function win(c, x, y, lit) {
  if (lit) R(c, x - 3, y - 3, 14, 14, 'rgba(255,224,138,.16)');
  R(c, x - 1, y - 1, 10, 10, INK);
  R(c, x, y, 8, 8, lit ? LIT : DARKWIN);
  R(c, x, y, 8, 2, lit ? '#fff3c4' : '#4c5890');
  R(c, x + 3, y, 1, 8, INK); R(c, x, y + 4, 8, 1, INK);
}
function door(c, dx, bot, col) {
  R(c, dx - 5, bot - 22, 26, 22, 'rgba(255,224,138,.10)');
  R(c, dx - 1, bot - 16, 12, 16, INK);
  R(c, dx, bot - 15, 10, 15, col || '#7a4b32');
  R(c, dx + 2, bot - 13, 6, 4, LIT);
  R(c, dx + 7, bot - 7, 1, 2, '#ffd95a');
  R(c, dx - 3, bot - 1, 16, 2, '#8d88ad');
}
function drawHouse(c, b) {
  const x = b.x * T, w = b.w * T, top = b.y * T - 8, bot = (b.y + b.h) * T, h = bot - top;
  const rh = Math.round(h * 0.4), wy = top + rh;
  R(c, x + 3, bot - 1, w, 3, 'rgba(20,20,50,.28)');
  R(c, x, wy, w, bot - wy, INK);
  R(c, x + 1, wy, w - 2, bot - wy - 1, b.wall);
  if (b.plank) for (let i = x + 5; i < x + w - 2; i += 5) R(c, i, wy, 1, bot - wy - 1, b.wallD);
  R(c, x + 1, wy, w - 2, 4, b.wallD);
  R(c, x + w - 4, wy, 3, bot - wy - 1, b.wallD);
  R(c, x + 1, bot - 4, w - 2, 3, '#6b6485');
  // roof
  R(c, x - 2, top + 1, w + 4, rh + 2, INK);
  R(c, x - 1, top + 2, w + 2, rh, b.roof);
  for (let i = 5; i < rh - 1; i += 4) R(c, x - 1, top + 2 + i, w + 2, 1, b.roofD);
  R(c, x - 1, top + 2, w + 2, 2, b.roofL);
  R(c, x - 1, top + rh - 1, w + 2, 2, b.roofD);
  // windows
  const tall = bot - wy >= 38;
  for (let i = 0; i < b.w; i++) {
    const wx = x + i * T + 4;
    if (tall) win(c, wx, wy + 8, hash(b.x + i, b.y, 5) < 0.75);
    if (i !== b.door) win(c, wx, bot - 15, hash(b.x + i, b.y, 6) < 0.6);
  }
  const dx = x + b.door * T + 3;
  door(c, dx, bot, b.doorC);
  R(c, dx - 4, bot - 23, 18, 7, INK); R(c, dx - 3, bot - 22, 16, 5, b.sign);
  return { x, w, top, bot, wy, rh, dx };
}
const EXTRA = {
  linear(c, g) { for (let i = 0; i < 10; i++) R(c, g.dx - 1 + i, g.bot - 18 - Math.floor(i / 3), 1, 1, INK); R(c, g.x + 6, g.top + 8, g.w - 12, 1, '#ffffff'); },
  crossing(c, g) { R(c, g.dx + 4, g.bot - 22, 2, 5, INK); R(c, g.dx, g.bot - 20, 10, 1, INK); R(c, g.x + 4, g.top - 4, 2, 6, INK); R(c, g.x + 6, g.top - 4, 9, 5, '#ffd95a'); },
  waves(c, g, time) {
    for (let i = 0; i < g.w - 8; i++) R(c, g.x + 4 + i, g.wy + 22 + Math.round(Math.sin(i * 0.7 + time * 2) * 1.5), 1, 2, '#2f6fb5');
    for (let i = 0; i < 12; i++) R(c, g.dx - 1 + i, g.bot - 20 + Math.round(Math.sin(i * 1.1) * 1), 1, 1, '#235690');
  },
  sync(c, g, time) {
    const cx = g.x + g.w - 14, cy = g.top - 2;
    R(c, cx + 3, cy, 2, 6, INK); disc(c, cx + 4, cy, 6, INK, true); disc(c, cx + 4, cy, 5, '#d5dde3', true);
    R(c, cx + 3, cy - 8, 2, 4, Math.sin(time * 4) > 0 ? '#ff6b6b' : '#7a3040');
    R(c, g.dx, g.bot - 21, 5, 1, INK); R(c, g.dx + 4, g.bot - 22, 1, 3, INK); R(c, g.dx + 5, g.bot - 19, 5, 1, INK); R(c, g.dx + 5, g.bot - 20, 1, 3, INK);
  },
  agent(c, g) {
    for (let i = 0; i < 7; i++) R(c, g.x + g.w + 1 + i * 3, g.bot - 9, 3, 3, i % 2 ? '#fff' : '#e8588a');
    R(c, g.x + g.w, g.bot - 12, 2, 12, INK);
    R(c, g.dx, g.bot - 21, 3, 3, '#3b7350'); R(c, g.dx + 4, g.bot - 21, 3, 3, '#c98a1e'); R(c, g.dx + 8, g.bot - 21, 3, 3, '#b23e3c');
  },
  wavo(c, g) {
    const cols = ['#ffd95a', '#8fd3c1', '#fff', '#9fd6ff'];
    for (let i = 0; i < g.w - 6; i += 6) { R(c, g.x + 3 + i, g.wy + 4, 4, 3, cols[(i / 6) % 4]); R(c, g.x + 4 + i, g.wy + 7, 2, 2, cols[(i / 6) % 4]); }
    R(c, g.dx + 2, g.bot - 21, 2, 3, INK); R(c, g.dx + 5, g.bot - 21, 2, 3, INK); R(c, g.dx + 8, g.bot - 21, 1, 3, INK);
  },
  skills(c, g) { R(c, g.dx + 1, g.bot - 21, 8, 1, INK); R(c, g.dx + 4, g.bot - 21, 2, 3, INK); },
};
function drawCampus(c, b, time) {
  const g = drawHouse(c, b);
  for (let i = 0; i <= b.w; i++) { const px = g.x + i * T - (i === b.w ? 4 : 0) + (i === 0 ? 1 : -1); R(c, px, g.wy + 4, 3, g.bot - g.wy - 8, '#fff'); R(c, px + 2, g.wy + 4, 1, g.bot - g.wy - 8, '#c9bb9f'); }
  // clock tower
  const cx = g.x + g.w / 2;
  R(c, cx - 11, g.top - 16, 22, g.rh + 18, INK);
  R(c, cx - 10, g.top - 15, 20, g.rh + 16, b.wall);
  R(c, cx - 12, g.top - 20, 24, 6, INK); R(c, cx - 11, g.top - 19, 22, 4, b.roof);
  disc(c, cx, g.top - 3, 6, INK); disc(c, cx, g.top - 3, 5, '#fff');
  R(c, cx, g.top - 7, 1, 4, INK); R(c, cx, g.top - 4, 3, 1, INK);
  // banners
  [g.x + 10, g.x + g.w - 16].forEach((bx, k) => {
    R(c, bx, g.top - 12, 1, 14, INK);
    const wv = Math.round(Math.sin(time * 3 + k) * 1);
    R(c, bx + 1, g.top - 12 + wv, 7, 6, '#6a2aa0'); R(c, bx + 3, g.top - 10 + wv, 3, 2, '#fff');
  });
}
function drawTower(c, b, time) {
  const x = b.x * T, w = b.w * T, top = b.y * T - 18, bot = (b.y + b.h) * T;
  R(c, x + 6, bot - 1, w - 4, 3, 'rgba(20,20,50,.3)');
  R(c, x + 3, bot - 22, w - 6, 22, INK); R(c, x + 4, bot - 21, w - 8, 20, '#2d2a4a');
  R(c, x + 4, bot - 21, w - 8, 2, '#47437a');
  // slab
  R(c, x + 12, top, w - 24, bot - top - 20, INK);
  R(c, x + 13, top + 1, w - 26, bot - top - 21, '#1b1930');
  R(c, x + 13, top + 1, 3, bot - top - 21, '#3a3766');
  R(c, x + w - 16, top + 1, 3, bot - top - 21, '#121022');
  R(c, x + 13, top + 1, w - 26, 2, '#4d4a86');
  for (let j = 0; j < 14; j++) for (let i = 0; i < 9; i++) {
    const hsh = hash(i, j, 11), wx = x + 19 + i * 7, wyy = top + 8 + j * 7;
    if (i === 4) continue;
    const on = hsh < 0.55, tw = on && reduceMotion ? 1 : (Math.sin(time * 0.7 + hsh * 40) > -0.9);
    R(c, wx, wyy, 4, 4, on && tw ? (hsh < 0.12 ? '#9fd6ff' : LIT) : '#2a2850');
  }
  R(c, x + w / 2 - 2, top + 6, 4, bot - top - 30, '#9fd6ff');
  R(c, x + w / 2 - 1, top + 6, 2, bot - top - 30, '#e3f4ff');
  // antenna
  R(c, x + w / 2 - 1, top - 10, 2, 10, INK);
  R(c, x + w / 2 - 2, top - 13, 4, 4, Math.sin(time * 3) > 0 ? '#ff6b6b' : '#7a3040');
  // doors
  const dx = x + w / 2 - 10;
  R(c, dx - 6, bot - 24, 32, 24, 'rgba(255,224,138,.12)');
  R(c, dx - 1, bot - 17, 22, 17, INK); R(c, dx, bot - 16, 20, 16, LIT); R(c, dx, bot - 16, 20, 3, '#fff3c4');
  R(c, dx + 9, bot - 16, 2, 16, INK);
  R(c, dx - 4, bot - 1, 28, 2, '#8d88ad');
  win(c, x + 9, bot - 15, true); win(c, x + w - 17, bot - 15, true);
}
function drawDome(c, b, time) {
  const x = b.x * T, w = b.w * T, bot = (b.y + b.h) * T, cx = x + w / 2, wy = bot - 34;
  R(c, x + 5, bot - 1, w - 4, 3, 'rgba(20,20,50,.28)');
  disc(c, cx, wy + 1, 28, INK, true); disc(c, cx, wy + 1, 27, '#7d8fe0', true);
  disc(c, cx - 6, wy - 4, 16, '#96a6ee', true);
  R(c, cx - 4, wy - 27, 8, 28, INK); R(c, cx - 3, wy - 26, 6, 26, '#1b1930');
  for (let i = 0; i < 14; i++) R(c, cx + i, wy - 20 - i, 4, 4, i > 11 ? '#9fd6ff' : '#d8d4ea');   // telescope
  R(c, x + 3, wy, w - 6, 34, INK); R(c, x + 4, wy + 1, w - 8, 32, '#dcd8ee');
  R(c, x + 4, wy + 1, w - 8, 3, '#b4afd0'); R(c, x + w - 8, wy + 1, 4, 32, '#b4afd0'); R(c, x + 4, bot - 4, w - 8, 3, '#6b6485');
  win(c, x + 9, wy + 9, true); win(c, x + w - 17, wy + 9, true); win(c, x + w - 17, bot - 15, false);
  const dx = x + b.door * T + 3;
  door(c, dx, bot, '#4a5aa8');
  // orbiting planet
  const a = reduceMotion ? 0.8 : time * 1.2, ox = cx + Math.cos(a) * 34, oy = wy - 30 + Math.sin(a) * 9;
  for (let k = 0; k < 20; k++) { const aa = k / 20 * Math.PI * 2; R(c, Math.round(cx + Math.cos(aa) * 34), Math.round(wy - 30 + Math.sin(aa) * 9), 1, 1, 'rgba(255,217,90,.45)'); }
  disc(c, Math.round(ox), Math.round(oy), 3, '#ffd95a'); R(c, Math.round(ox) - 1, Math.round(oy) - 2, 1, 1, '#fff');
}
function drawBuilding(c, b, time) {
  if (b.kind === 'tower') return drawTower(c, b, time);
  if (b.kind === 'dome') return drawDome(c, b, time);
  if (b.kind === 'campus') return drawCampus(c, b, time);
  const g = drawHouse(c, b);
  if (EXTRA[b.id]) EXTRA[b.id](c, g, time);
}

/* ------------------------------------------------------------------ object art */
function drawTree(c, tr) {
  const x = tr.tx * T, y = tr.ty * T, cx = x + 8;
  R(c, x + 2, y + 13, 13, 3, 'rgba(20,20,50,.25)');
  R(c, cx - 2, y + 6, 4, 9, '#4a3028'); R(c, cx - 2, y + 6, 1, 9, '#6b4638');
  if (tr.pine) {
    for (let k = 0; k < 3; k++) {
      const by = y + 8 - k * 7;
      for (let r = 0; r < 9; r++) { const hw = Math.max(1, Math.round((9 - k * 1.5) * (r + 1) / 9)); R(c, cx - hw, by - 8 + r, hw * 2, 1, r > 6 ? '#1c4b43' : '#28685a'); }
      R(c, cx - 2, by - 6, 2, 3, '#3f8f74');
    }
  } else {
    disc(c, cx, y - 1, 10, '#1c4b43'); disc(c, cx, y - 2, 9, '#2c7560');
    disc(c, cx - 3, y - 5, 5, '#3f9777'); R(c, cx - 5, y - 8, 3, 2, '#62b890');
    R(c, cx + 3, y + 2, 3, 2, '#1c4b43'); R(c, cx - 6, y + 3, 2, 2, '#1c4b43');
  }
}
const OBJ = {
  lamp(c, x, y) {
    R(c, x + 5, y + 13, 7, 2, 'rgba(20,20,50,.25)');
    R(c, x + 7, y - 6, 2, 21, INK); R(c, x + 5, y + 13, 6, 2, INK);
    R(c, x + 4, y - 12, 8, 7, INK); R(c, x + 5, y - 11, 6, 5, LIT); R(c, x + 3, y - 13, 10, 2, INK);
  },
  sign(c, x, y) {
    R(c, x + 7, y + 2, 2, 13, '#4a3028');
    R(c, x - 2, y - 8, 20, 12, INK); R(c, x - 1, y - 7, 18, 10, '#c2935f'); R(c, x - 1, y - 7, 18, 2, '#dbb07c');
    R(c, x + 6, y - 5, 4, 1, '#ffd95a'); R(c, x + 7, y - 6, 2, 3, '#ffd95a'); R(c, x + 2, y - 1, 12, 1, '#6d4a3c'); R(c, x + 2, y + 1, 8, 1, '#6d4a3c');
  },
  scope(c, x, y) {
    R(c, x + 3, y + 13, 11, 2, 'rgba(20,20,50,.25)');
    R(c, x + 7, y + 2, 2, 12, INK); R(c, x + 4, y + 10, 1, 5, INK); R(c, x + 11, y + 10, 1, 5, INK); R(c, x + 5, y + 8, 6, 1, INK);
    for (let i = 0; i < 10; i++) R(c, x + 2 + i, y + 1 - Math.round(i * 0.6), 4, 4, i > 7 ? '#9fd6ff' : (i < 2 ? '#ffd95a' : '#e8588a'));
  },
  statue(c, x, y, time) {
    R(c, x + 3, y + 14, 28, 3, 'rgba(20,20,50,.25)');
    R(c, x + 2, y + 4, 28, 12, INK); R(c, x + 3, y + 5, 26, 10, '#8d88ad'); R(c, x + 3, y + 5, 26, 2, '#c1bcda');
    R(c, x + 8, y - 4, 16, 9, INK); R(c, x + 9, y - 3, 14, 8, '#aba6c6');
    const cy = y - 18 + (reduceMotion ? 0 : Math.round(Math.sin(time * 2) * 1.5)), cx = x + 16;
    const k = 0.7 + 0.3 * found.size / SPOTS.length;
    c.globalAlpha = k;
    R(c, cx - 2, cy - 9, 4, 18, '#ffd95a'); R(c, cx - 9, cy - 2, 18, 4, '#ffd95a'); R(c, cx - 5, cy - 5, 10, 10, '#ffd95a');
    R(c, cx - 2, cy - 2, 4, 4, '#fff7cf');
    c.globalAlpha = 1;
  },
  booth(c, x, y) {
    R(c, x + 2, y + 14, 31, 3, 'rgba(20,20,50,.25)');
    R(c, x + 1, y - 14, 2, 30, INK); R(c, x + 29, y - 14, 2, 30, INK);
    R(c, x, y + 2, 32, 14, INK); R(c, x + 1, y + 3, 30, 12, '#f4f1ea'); R(c, x + 1, y + 3, 30, 2, '#fff');
    R(c, x + 11, y + 7, 10, 5, INK); R(c, x + 13, y + 8, 2, 3, '#fff'); R(c, x + 17, y + 8, 2, 3, '#fff');
    R(c, x - 2, y - 22, 36, 10, INK);
    for (let i = 0; i < 6; i++) R(c, x - 1 + i * 6, y - 21, i === 5 ? 4 : 6, 8, i % 2 ? '#231f3a' : '#f4f1ea');
    for (let i = 0; i < 6; i++) R(c, x - 1 + i * 6, y - 12, 5, 2, i % 2 ? '#231f3a' : '#f4f1ea');
  },
  tent(c, x, y) {
    R(c, x + 2, y + 29, 46, 3, 'rgba(20,20,50,.25)');
    for (let r = 0; r < 30; r++) { const hw = Math.round(r * 0.78) + 1; R(c, x + 24 - hw - 1, y + r + 1, hw * 2 + 2, 1, INK); }
    for (let r = 0; r < 29; r++) { const hw = Math.round(r * 0.78); R(c, x + 24 - hw, y + r + 2, hw, 1, '#ff9a5a'); R(c, x + 24, y + r + 2, hw, 1, '#e2793a'); }
    for (let r = 12; r < 29; r++) { const hw = Math.round((r - 12) * 0.4); R(c, x + 24 - hw, y + r + 2, hw * 2, 1, '#3a2a2e'); }
    R(c, x + 23, y - 3, 2, 6, INK); R(c, x + 25, y - 3, 5, 3, '#e8588a');
  },
  fire(c, x, y, time) {
    R(c, x + 2, y + 12, 12, 3, 'rgba(20,20,50,.25)');
    R(c, x + 2, y + 11, 12, 3, '#4a3028'); R(c, x + 4, y + 9, 8, 3, '#6b4638');
    const f = reduceMotion ? 0 : Math.floor(time * 8) % 3;
    R(c, x + 5, y + 3 - f, 6, 8 + f, '#ff7b3a'); R(c, x + 6, y + 5 - f, 4, 6 + f, '#ffd95a'); R(c, x + 7, y + 8, 2, 3, '#fff7cf');
    R(c, x + 4 + f * 3, y - 1 - f, 1, 1, '#ffd95a');
  },
  doghouse(c, x, y) {
    R(c, x + 3, y + 14, 28, 3, 'rgba(20,20,50,.25)');
    R(c, x + 3, y, 26, 16, INK); R(c, x + 4, y + 1, 24, 14, '#e9dcc0');
    for (let r = 0; r < 11; r++) { const hw = 3 + Math.round(r * 1.3); R(c, x + 16 - hw - 1, y - 11 + r, hw * 2 + 2, 1, INK); }
    for (let r = 0; r < 10; r++) { const hw = 3 + Math.round(r * 1.3); R(c, x + 16 - hw, y - 10 + r, hw * 2, 1, r < 2 ? '#f587ab' : '#e8588a'); }
    R(c, x + 10, y + 5, 12, 11, INK); R(c, x + 11, y + 4, 10, 2, INK);
    R(c, x + 12, y - 3, 8, 4, '#fff'); R(c, x + 14, y - 2, 4, 2, '#e8588a');
    R(c, x + 24, y + 12, 6, 3, '#8fd3c1'); R(c, x + 25, y + 11, 4, 1, '#fff');
  },
  boulder(c, x, y) {
    R(c, x + 3, y + 29, 28, 3, 'rgba(20,20,50,.25)');
    disc(c, x + 16, y + 16, 15, INK); R(c, x + 2, y + 16, 28, 15, INK);
    disc(c, x + 16, y + 16, 14, '#8a8598'); R(c, x + 3, y + 16, 26, 14, '#8a8598');
    disc(c, x + 12, y + 12, 8, '#a5a0b4'); R(c, x + 22, y + 14, 6, 15, '#6f6a80');
    [['#e8588a', 8, 22], ['#ffd95a', 14, 15], ['#8fd3c1', 20, 20], ['#9fd6ff', 12, 7], ['#ff9a5a', 22, 9], ['#fff', 17, 26]].forEach(([col, hx, hy]) => { R(c, x + hx, y + hy, 3, 2, INK); R(c, x + hx, y + hy, 2, 1, col); R(c, x + hx + 1, y + hy, 2, 2, col); });
  },
  net(c, x, y) {
    R(c, x + 1, y + 2, 2, 13, INK); R(c, x + 45, y + 2, 2, 13, INK);
    R(c, x + 3, y + 3, 42, 1, '#fff');
    for (let i = 0; i < 42; i += 3) R(c, x + 3 + i, y + 4, 1, 7, 'rgba(255,255,255,.6)');
    for (let j = 6; j < 11; j += 2) R(c, x + 3, y + j, 42, 1, 'rgba(255,255,255,.45)');
    disc(c, x + 34, y + 14, 2, '#d8f25a');
  },
  mailbox(c, x, y) {
    R(c, x + 3, y + 13, 11, 2, 'rgba(20,20,50,.25)');
    R(c, x + 7, y + 4, 2, 11, INK);
    R(c, x + 1, y - 8, 14, 13, INK); R(c, x + 2, y - 7, 12, 11, '#e8588a'); R(c, x + 2, y - 7, 12, 3, '#f587ab');
    R(c, x + 4, y - 2, 8, 2, INK); R(c, x + 14, y - 9, 2, 7, INK); R(c, x + 15, y - 9, 4, 3, '#ffd95a');
  },
  ship(c, x, y, time) {
    const bob = reduceMotion ? 0 : Math.round(Math.sin(time * 1.6) * 1), by = y + 34 + bob;
    for (let r = 0; r < 12; r++) { const inset = Math.round(r * 1.3); R(c, x + inset - 1, by + r - 1, 78 - inset * 2 + 2, 2, INK); }
    for (let r = 0; r < 11; r++) { const inset = Math.round(r * 1.3); R(c, x + inset, by + r, 78 - inset * 2, 1, r < 2 ? '#c2935f' : r < 4 ? '#f4f1ea' : '#8a5a3c'); }
    R(c, x + 37, by - 44, 3, 44, INK);
    R(c, x + 8, by - 40, 29, 32, INK); R(c, x + 9, by - 39, 27, 30, '#fbf3dc');
    R(c, x + 40, by - 34, 22, 26, INK); R(c, x + 41, by - 33, 20, 24, '#f1e5c3');
    for (let i = 0; i < 20; i++) R(c, x + 12 + i, by - 24 + Math.round(Math.sin(i * 0.8) * 2), 1, 2, '#2f6fb5');
    for (let i = 0; i < 14; i++) R(c, x + 44 + i, by - 20 + Math.round(Math.sin(i * 0.8) * 2), 1, 2, '#2f6fb5');
    R(c, x + 40, by - 50 , 9, 5, '#e8588a');
    if (!reduceMotion) for (let i = 0; i < 4; i++) R(c, x + 6 + i * 20 + Math.round(Math.sin(time * 2 + i) * 2), y + 46, 8, 1, '#d8ecff');
  },
  crossSign(c, x, y) {
    R(c, x + 7, y - 8, 2, 23, INK);
    R(c, x - 2, y - 8, 14, 6, INK); R(c, x - 1, y - 7, 12, 4, '#ffd95a');
    R(c, x + 5, y - 1, 14, 6, INK); R(c, x + 6, y, 12, 4, '#f587ab');
  },
  light(c, x, y, time) {
    R(c, x + 7, y, 2, 15, INK); R(c, x + 3, y - 15, 10, 17, INK);
    const on = reduceMotion ? 1 : Math.floor(time / 1.6) % 3;
    R(c, x + 6, y - 13, 4, 4, on === 2 ? '#ff6b6b' : '#5c2b3a');
    R(c, x + 6, y - 8, 4, 4, on === 1 ? '#ffd95a' : '#5c4b2a');
    R(c, x + 6, y - 3, 4, 4, on === 0 ? '#7ee08a' : '#2a4c3a');
  },
  crates(c, x, y) {
    R(c, x + 1, y + 3, 14, 13, INK); R(c, x + 2, y + 4, 12, 11, '#c2935f'); R(c, x + 2, y + 9, 12, 1, '#6d4a3c'); R(c, x + 7, y + 4, 1, 11, '#6d4a3c');
    R(c, x + 4, y - 5, 9, 9, INK); R(c, x + 5, y - 4, 7, 7, '#dbb07c'); R(c, x + 12, y - 9, 2, 12, '#6b6485'); R(c, x + 10, y - 10, 6, 3, '#aba6c6');
  },
  bench(c, x, y) {
    R(c, x + 2, y + 12, 28, 2, 'rgba(20,20,50,.25)');
    R(c, x + 1, y + 2, 30, 5, INK); R(c, x + 2, y + 3, 28, 3, '#ad784c'); R(c, x + 1, y + 7, 30, 4, INK); R(c, x + 2, y + 8, 28, 2, '#c2935f');
    R(c, x + 3, y + 11, 2, 3, INK); R(c, x + 27, y + 11, 2, 3, INK);
  },
};

/* ------------------------------------------------------------------ entities / lights */
const STATIC = [];
BUILDINGS.forEach(b => STATIC.push({ sy: (b.y + b.h) * T, x0: b.x * T - 8, x1: (b.x + b.w) * T + 28, y0: b.y * T - 60, draw: (c, time) => drawBuilding(c, b, time) }));
TREES.forEach(tr => STATIC.push({ sy: (tr.ty + 1) * T, x0: tr.tx * T - 6, x1: tr.tx * T + 22, y0: tr.ty * T - 24, draw: c => drawTree(c, tr) }));
OBJECTS.forEach(o => STATIC.push({ sy: (o.ty + o.fh) * T, x0: o.tx * T - 8, x1: (o.tx + o.fw) * T + 8, y0: o.ty * T - 56, draw: (c, time) => OBJ[o.kind](c, o.tx * T, o.ty * T, time) }));
const LIGHTS = [];
OBJECTS.forEach(o => {
  if (o.kind === 'lamp') LIGHTS.push({ x: o.tx * T + 8, y: o.ty * T - 8, r: 34, a: 0.42 });
  if (o.kind === 'fire') LIGHTS.push({ x: o.tx * T + 8, y: o.ty * T + 6, r: 40, a: 0.5, flick: true });
  if (o.kind === 'statue') LIGHTS.push({ x: o.tx * T + 16, y: o.ty * T - 18, r: 30, a: 0.4, star: true });
});
BUILDINGS.forEach(b => LIGHTS.push({ x: (b.x + (b.kind === 'tower' ? b.w / 2 : b.door + 0.5)) * T, y: (b.y + b.h) * T - 6, r: 26, a: 0.3 }));
const FLIES = Array.from({ length: 18 }, (_, i) => ({ x: (4 + hash(i, 1, 90) * 38) * T, y: (5 + hash(i, 2, 91) * 25) * T, p: hash(i, 3, 92) * 9 }));

/* ------------------------------------------------------------------ player / dog */
const player = { x: 21 * T + 8, y: 18 * T + 10, dir: 'down', moving: false, anim: 0 };
const dog = { x: player.x - 16, y: player.y + 2, dir: 'right', anim: 0, moving: false };
const trail = [];
for (let i = 0; i < 16; i++) trail.push({ x: player.x - 16 + i, y: player.y + 2 });
const floaters = [];
let path = null, autoOpen = null;
const keys = new Set();
const tileSolid = (tx, ty) => !inMap(tx, ty) || solid[I(tx, ty)] === 1;
function blocked(x, y) {
  const x0 = Math.floor((x - 4) / T), x1 = Math.floor((x + 3) / T), y0 = Math.floor((y - 5) / T), y1 = Math.floor(y / T);
  return tileSolid(x0, y0) || tileSolid(x1, y0) || tileSolid(x0, y1) || tileSolid(x1, y1);
}
function findPath(sx, sy, gx, gy) {
  if (tileSolid(gx, gy)) return null;
  const prev = new Int32Array(MW * MH).fill(-1), q = [I(sx, sy)];
  prev[I(sx, sy)] = I(sx, sy);
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    if (cur === I(gx, gy)) break;
    const cx = cur % MW, cy = (cur / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (tileSolid(nx, ny) || prev[I(nx, ny)] !== -1) continue;
      prev[I(nx, ny)] = cur; q.push(I(nx, ny));
    }
  }
  if (prev[I(gx, gy)] === -1) return null;
  const out = [];
  for (let cur = I(gx, gy); cur !== I(sx, sy); cur = prev[cur]) out.push({ x: (cur % MW) * T + 8, y: ((cur / MW) | 0) * T + 10 });
  return out.reverse();
}
function walkTo(tx, ty, spot) {
  const sx = Math.floor(player.x / T), sy = Math.floor((player.y - 2) / T);
  const p = findPath(sx, sy, tx, ty);
  if (!p) return false;
  path = p; autoOpen = spot || null;
  if (!p.length && spot) { openSpot(spot); autoOpen = null; }
  return true;
}
function nearestFree(tx, ty) {
  for (let r = 0; r <= 4; r++) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || tileSolid(tx + dx, ty + dy)) continue;
      const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = [tx + dx, ty + dy]; }
    }
    if (best) return best;
  }
  return null;
}

/* ------------------------------------------------------------------ canvas / camera */
const canvas = $('game'), ctx = canvas.getContext('2d');
let zoom = 3, dpr = 1, vw = 0, vh = 0;
const cam = { x: 0, y: 0 };
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = window.innerWidth, ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  const zc = Math.max(2, Math.min(5, Math.floor(Math.min(cw / (T * 19), ch / (T * 11.5)))));
  zoom = zc * dpr; vw = canvas.width / zoom; vh = canvas.height / zoom;
}
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ update */
let started = false, activeSpot = null, lastActive = null, time = 0;
const SPEED = 78;
const cardEl = $('card');
const paused = () => !started || cardEl.open;
function update(dt) {
  time += dt;
  let mx = 0, my = 0;
  if (!paused()) {
    if (keys.has('left')) mx -= 1; if (keys.has('right')) mx += 1;
    if (keys.has('up')) my -= 1; if (keys.has('down')) my += 1;
  }
  const px = player.x, py = player.y;
  if (mx || my) {
    path = null; autoOpen = null;
    const len = Math.hypot(mx, my), sx = mx / len * SPEED * dt, sy = my / len * SPEED * dt;
    if (!blocked(player.x + sx, player.y)) player.x += sx;
    if (!blocked(player.x, player.y + sy)) player.y += sy;
    player.dir = Math.abs(mx) >= Math.abs(my) && mx ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
  } else if (path && !paused()) {
    let step = SPEED * dt;
    while (path && path.length && step > 0) {
      const n = path[0], dx = n.x - player.x, dy = n.y - player.y, dist = Math.hypot(dx, dy);
      if (dist <= step) { player.x = n.x; player.y = n.y; step -= dist; path.shift(); }
      else {
        player.x += dx / dist * step; player.y += dy / dist * step; step = 0;
        player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      }
    }
    if (path && !path.length) { path = null; if (autoOpen) { const s = autoOpen; autoOpen = null; faceSpot(s); openSpot(s); } }
  }
  const moved = Math.hypot(player.x - px, player.y - py);
  player.moving = moved > 0.01;
  player.anim = player.moving ? player.anim + dt : 0;
  if (moved > 0.01) {
    const last = trail[trail.length - 1];
    if (Math.hypot(player.x - last.x, player.y - last.y) >= 1) { trail.push({ x: player.x, y: player.y }); if (trail.length > 18) trail.shift(); }
    hideSay();
  }
  const target = trail[0], ddx = target.x - dog.x, ddy = target.y - dog.y, dd = Math.hypot(ddx, ddy);
  dog.moving = dd > 0.6;
  if (dog.moving) {
    const s = Math.min(dd, SPEED * 1.15 * dt);
    dog.x += ddx / dd * s; dog.y += ddy / dd * s;
    if (Math.abs(ddx) > 0.2) dog.dir = ddx < 0 ? 'left' : 'right';
    dog.anim += dt;
  } else { dog.anim = 0; if (Math.abs(player.x - dog.x) > 4) dog.dir = player.x < dog.x ? 'left' : 'right'; }

  // nearby spot
  activeSpot = null; let bd = 20;
  for (const s of SPOTS) {
    const dist = Math.hypot(s.trig[0] * T + 8 - player.x, s.trig[1] * T + 10 - player.y);
    if (dist < bd) { bd = dist; activeSpot = s; }
  }
  if (activeSpot !== lastActive) { lastActive = activeSpot; renderPrompt(); }

  for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 1.4) floaters.splice(i, 1); }
  cam.x = MW * T <= vw ? (MW * T - vw) / 2 : Math.max(0, Math.min(MW * T - vw, player.x - vw / 2));
  cam.y = MH * T <= vh ? (MH * T - vh) / 2 : Math.max(0, Math.min(MH * T - vh, player.y - 10 - vh / 2));
  cam.x = Math.round(cam.x * zoom) / zoom; cam.y = Math.round(cam.y * zoom) / zoom;
}
function faceSpot(s) {
  const cx = s.hit.x + s.hit.w / 2, cy = s.hit.y + s.hit.h;
  const dx = cx - player.x, dy = cy - player.y;
  player.dir = Math.abs(dx) > Math.abs(dy) + 8 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

/* ------------------------------------------------------------------ render */
const FONT = '"Pixelify Sans","PingFang SC","Hiragino Sans GB","Microsoft YaHei",ui-monospace,monospace';
function render() {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  c.setTransform(zoom, 0, 0, zoom, -cam.x * zoom, -cam.y * zoom);
  c.drawImage(ground, 0, 0);

  // water sparkle
  const tx0 = Math.max(0, Math.floor(cam.x / T)), tx1 = Math.min(MW - 1, Math.floor((cam.x + vw) / T));
  const ty0 = Math.max(0, Math.floor(cam.y / T)), ty1 = Math.min(MH - 1, Math.floor((cam.y + vh) / T));
  if (!reduceMotion) for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    if (map[I(x, y)] !== W) continue;
    const ph = (time * 0.6 + hash(x, y, 13) * 6) % 3;
    if (ph < 1.2) R(c, x * T + 2 + Math.floor(hash(x, y, 14) * 8) + Math.round(ph * 2), y * T + 9 + Math.floor(hash(x, y, 15) * 5), 4, 1, PAL.waterL);
  }

  // y-sorted entities
  const list = [];
  for (const e of STATIC) if (e.x1 > cam.x && e.x0 < cam.x + vw && e.sy > cam.y - 8 && e.y0 < cam.y + vh) list.push(e);
  list.push({ sy: player.y, draw: drawPlayer }, { sy: dog.y - 0.5, draw: drawDog });
  list.sort((a, b) => a.sy - b.sy);
  for (const e of list) e.draw(c, time);

  // dusk tint + lights
  R(c, cam.x, cam.y, vw + 1, vh + 1, 'rgba(38,28,92,.20)');
  c.globalCompositeOperation = 'lighter';
  for (const l of LIGHTS) {
    if (l.x + l.r < cam.x || l.x - l.r > cam.x + vw || l.y + l.r < cam.y || l.y - l.r > cam.y + vh) continue;
    let a = l.a; if (l.flick && !reduceMotion) a *= 0.8 + Math.sin(time * 9) * 0.12; if (l.star) a *= 0.3 + 0.7 * found.size / SPOTS.length;
    const gr = c.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r);
    gr.addColorStop(0, `rgba(255,205,120,${a})`); gr.addColorStop(1, 'rgba(255,205,120,0)');
    c.fillStyle = gr; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  c.globalCompositeOperation = 'source-over';
  if (!reduceMotion) for (const f of FLIES) {
    const fx = f.x + Math.sin(time * 0.5 + f.p) * 14, fy = f.y + Math.cos(time * 0.37 + f.p * 2) * 10;
    c.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(time * 2 + f.p * 3));
    R(c, Math.round(fx), Math.round(fy), 1, 1, '#fff3a0');
  }
  c.globalAlpha = 1;

  // labels
  c.textBaseline = 'middle'; c.textAlign = 'left';
  for (const s of SPOTS) {
    const a = s.anchor;
    if (a.x < cam.x - 60 || a.x > cam.x + vw + 60 || a.y < cam.y - 30 || a.y > cam.y + vh + 20) continue;
    const isA = s === activeSpot, has = found.has(s.id), text = s.name[lang];
    c.font = `600 7px ${FONT}`;
    const tw = c.measureText(text).width, w = Math.ceil(tw) + 17, lx = Math.round(a.x - w / 2);
    const ly = Math.round(a.y - 6 + (!has && !reduceMotion ? Math.sin(time * 3 + a.x) * 1.5 : 0));
    R(c, lx - 1, ly - 1, w + 2, 13, isA ? '#ffd95a' : '#fbf3dc');
    R(c, lx, ly, w, 11, INK);
    R(c, lx + 1, ly + 1, 9, 9, has ? '#ffd95a' : '#e8588a');
    c.fillStyle = INK; c.font = `700 7px ${FONT}`; c.textAlign = 'center';
    c.fillText(has ? '★' : '?', lx + 5.5, ly + 6);
    c.textAlign = 'left'; c.fillStyle = isA ? '#ffd95a' : '#fbf3dc'; c.font = `600 7px ${FONT}`;
    c.fillText(text, lx + 13, ly + 6);
  }
  for (const f of floaters) {
    c.globalAlpha = Math.max(0, 1 - f.t / 1.4); c.font = `700 8px ${FONT}`; c.textAlign = 'center';
    c.fillStyle = INK; c.fillText(f.text, f.x + 0.5, f.y - f.t * 14 + 0.5);
    c.fillStyle = f.col; c.fillText(f.text, f.x, f.y - f.t * 14);
  }
  c.globalAlpha = 1;
  // walk target marker
  if (path && path.length) { const g = path[path.length - 1], k = Math.floor(time * 6) % 2; R(c, g.x - 3 - k, g.y - 1, 2, 2, '#fff'); R(c, g.x + 1 + k, g.y - 1, 2, 2, '#fff'); R(c, g.x - 1, g.y - 3 - k, 2, 2, '#fff'); R(c, g.x - 1, g.y + 1 + k, 2, 2, '#fff'); }
}
function drawPlayer(c) {
  const fr = player.moving ? 1 + Math.floor(player.anim * 7) % 2 : 0;
  const x = Math.round(player.x * zoom) / zoom, y = Math.round(player.y * zoom) / zoom;
  R(c, x - 4, y, 8, 2, 'rgba(20,20,50,.3)');
  c.drawImage(PLAYER[player.dir][fr], x - 6, y - 15);
}
function drawDog(c, time) {
  const fr = dog.moving ? 1 + Math.floor(dog.anim * 9) % 2 : 0;
  const x = Math.round(dog.x * zoom) / zoom, y = Math.round(dog.y * zoom) / zoom;
  R(c, x - 6, y, 12, 2, 'rgba(20,20,50,.3)');
  c.drawImage(DOG[dog.dir][fr], x - 8, y - 11);
  if (!dog.moving && !reduceMotion && Math.floor(time * 5) % 2) R(c, dog.dir === 'right' ? x - 9 : x + 8, y - 11, 1, 2, '#fff');
}

/* ------------------------------------------------------------------ content cards */
const li = arr => arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const tagRow = (arr, hot) => `<div class="tags">${arr.map(x => `<span class="tag${hot ? ' hot' : ''}">${esc(x)}</span>`).join('')}</div>`;
const ext = (href, label, main) => `<a class="btn${main ? ' btn-main' : ''}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
function content(s) {
  const D_ = d(), u = t();
  switch (s.kind) {
    case 'about':
      return { title: u.aboutTitle, meta: D_.place, body:
        `<div class="about-grid"><img src="assets/profile.jpg" alt="${esc(D_.name)}" width="150" height="200" loading="lazy"><div>
        <p class="lead">${esc(D_.deck)}</p><p>${esc(D_.about)}</p>${tagRow([D_.status], true)}</div></div>
        <div class="rows">${D_.profileAxes.map(a => `<div class="row"><b>${esc(a[0])}</b><span>${esc(a[1])}</span></div>`).join('')}</div>` };
    case 'job': {
      const j = D_.jobs[s.i];
      return { title: j[2], meta: [j[3], j[0], j[1]].filter(Boolean).join(' · '), body: tagRow(j[4].split(' · ')) + `<p class="lead">${esc(j[5])}</p>` + li(j[6]) };
    }
    case 'project': {
      const p = D_.projects[s.i];
      const isDemo = /asana-adaptive-sync|orbit-creator-match-demo/.test(p[4]);
      return { title: p[0], meta: [p[1], p[5]].filter(Boolean).join(' · '), body: `<p class="lead">${esc(p[2])}</p>` + li(p[3]) + (p[4] ? `<div class="links">${ext(p[4], isDemo ? D_.demoLink : D_.projectLink, true)}</div>` : '') };
    }
    case 'focus':
      return { title: D_.focusTitle, meta: D_.focusDesc, body: `<div class="rows">${D_.focus.map((f, i) => `<div class="row"><small>0${i + 1}</small><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>` };
    case 'edu':
      return { title: u.eduTitle, meta: '', body: `<div class="rows">${D_.edu.map(e => `<div class="row"><small>${esc(e[0])}</small><b>${esc(e[1])}</b><span>${esc(e[2])}</span></div>`).join('')}</div>` };
    case 'skills':
      return { title: D_.skills, meta: D_.skillsDesc, body: D_.skillGroups.map(g => `<h3>${esc(g[0])}</h3>${tagRow(g[1])}`).join('') };
    case 'life':
      return { title: D_.lifeTitle, meta: D_.lifeDesc, body: `<p class="lead">${esc(D_.lifeLead)}</p><p>${esc(D_.lifeCopy)}</p>${tagRow(D_.interests, true)}
        <div class="photos"><img src="assets/samoyed-young.jpg" alt="Samoyed puppy with a toy" loading="lazy"><img src="assets/samoyed-sun.jpg" alt="Samoyed resting in the sun" loading="lazy"></div>
        <p class="caption">${esc(D_.dogCaption)}</p>` };
    case 'contact':
      return { title: u.contactTitle, meta: D_.baseValue, body: `${tagRow([D_.status], true)}
        <div class="rows">
          <a class="row" href="mailto:${esc(D_.mail)}"><small>${esc(D_.email)}</small><b>${esc(D_.mail)}</b></a>
          <a class="row" href="${esc(D_.linkedin)}" target="_blank" rel="noopener noreferrer"><small>LinkedIn</small><b>linkedin.com/in/yaonanstarry ↗</b></a>
          <a class="row" href="https://github.com/Starry-nn" target="_blank" rel="noopener noreferrer"><small>${u.github}</small><b>github.com/Starry-nn ↗</b></a>
          <a class="row" href="tel:${esc(D_.phone.replace(/\s/g, ''))}"><small>${u.phone}</small><b>${esc(D_.phone)}</b></a>
        </div>
        <div class="links">${ext('assets/Nan_Yao_Resume_EN.pdf', D_.cvEn)}${ext('assets/Nan_Yao_Resume_CN.pdf', D_.cvZh)}</div>` };
  }
}
let openId = null;
function showCard(kicker, title, meta, body, wide) {
  $('cardKicker').textContent = kicker; $('cardTitle').textContent = title; $('cardMeta').textContent = meta;
  $('cardBody').innerHTML = body; $('cardBody').scrollTop = 0;
  cardEl.classList.toggle('wide', !!wide);
  hideSay();
  if (!cardEl.open) cardEl.showModal();
  keys.clear();
}
function openSpot(s) {
  const k = content(s);
  openId = s.id;
  showCard(t().kick[s.kind], k.title, k.meta, k.body, false);
  if (!found.has(s.id)) {
    found.add(s.id); saveFound(); renderHud();
    floaters.push({ x: dog.x, y: dog.y - 14, text: '♥', col: '#ff8fb1', t: 0 });
    floaters.push({ x: s.anchor.x, y: s.anchor.y - 8, text: '+★', col: '#ffd95a', t: 0 });
    pendingToast = found.size === SPOTS.length ? 'all' : 'star';
  }
}
function openQuick() {
  const u = t();
  const group = (title, ids) => `<section class="qv-sec"><h3>${esc(title)}</h3>${ids.map(id => {
    const s = spotById[id], k = content(s);
    const single = ids.length === 1;
    return `<div class="qv-item">${single ? '' : `<h4>${esc(k.title)}</h4>`}<p class="card-meta">${esc(k.meta)}</p>${k.body}</div>`;
  }).join('')}</section>`;
  openId = 'quick';
  showCard(u.quickKicker, d().name, d().place,
    group(u.aboutTitle, ['about']) + group(u.sec.exp, ['monolith', 'manus', 'crossing', 'linear', 'waves']) +
    group(u.sec.work, ['orbit', 'sync', 'agent', 'wavo', 'odyssey']) + group(u.sec.focus, ['focus']) +
    group(u.sec.edu, ['edu']) + group(u.sec.skills, ['skills']) + group(u.sec.life, ['life']) + group(u.sec.contact, ['contact']), true);
}
let pendingToast = null, toastTimer = 0;
function toast(html, ms) {
  const el = $('toast'); el.innerHTML = html; el.hidden = false;
  clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
cardEl.addEventListener('close', () => {
  openId = null; keys.clear();
  if (pendingToast === 'all') {
    toast(`<span>✨ <b>${esc(t().allDone)}</b></span><button class="btn" id="toastHi">${esc(t().sayHi)}</button>`, 12000);
    $('toastHi').onclick = () => { $('toast').hidden = true; openSpot(spotById.contact); };
  } else if (pendingToast === 'star') toast(`<span>★ <b>${esc(t().newStar)}</b> · ${found.size}/${SPOTS.length}</span>`, 2200);
  pendingToast = null;
});
cardEl.addEventListener('click', e => { if (e.target === cardEl) cardEl.close(); });
$('cardClose').onclick = () => cardEl.close();

/* ------------------------------------------------------------------ HUD / intro */
const touch = matchMedia('(pointer: coarse)').matches;
function renderPrompt() {
  const el = $('prompt');
  if (!activeSpot || !started) { el.hidden = true; return; }
  el.innerHTML = `${touch ? '' : '<kbd>E</kbd>'}${esc(t().visit)} · ${esc(activeSpot.name[lang])}`;
  el.hidden = false;
}
function renderHud() {
  const u = t();
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $('hudName').textContent = '· ' + d().name;
  $('hudCount').textContent = `★ ${found.size}/${SPOTS.length}`;
  $('hudCount').title = `${found.size}/${SPOTS.length} ${u.found}`;
  $('btnQuick').textContent = u.quick; $('btnQuick2').textContent = u.quick;
  $('btnCv').textContent = u.cv; $('btnCv').href = lang === 'zh' ? 'assets/Nan_Yao_Resume_CN.pdf' : 'assets/Nan_Yao_Resume_EN.pdf';
  $('btnLang').textContent = u.lang; $('btnLang2').textContent = u.lang;
  $('introKicker').textContent = u.kicker; $('introSub').textContent = u.sub;
  $('btnStart').textContent = u.start; $('introHint').textContent = touch ? u.hintTouch : u.hint;
  $('sayMore').textContent = u.next;
  renderPrompt();
}
function setLang() {
  lang = lang === 'en' ? 'zh' : 'en';
  try { localStorage.setItem('starry-town-lang', lang); } catch (e) {}
  renderHud();
  if (!$('say').hidden) say(t().hello, true);
  if (cardEl.open) { if (openId === 'quick') openQuick(); else if (openId) { const k = content(spotById[openId]); showCard(t().kick[spotById[openId].kind], k.title, k.meta, k.body, false); } }
}
let sayTimer = 0;
function say(text, instant) {
  const el = $('say'), p = $('sayText');
  el.hidden = false; clearInterval(sayTimer);
  if (instant || reduceMotion) { p.textContent = text; return; }
  let i = 0; p.textContent = '';
  sayTimer = setInterval(() => { i += 2; p.textContent = text.slice(0, i); if (i >= text.length) clearInterval(sayTimer); }, 22);
}
function hideSay() { if (!$('say').hidden) { $('say').hidden = true; clearInterval(sayTimer); renderPrompt(); } }
function start() {
  if (started) return;
  started = true; $('intro').hidden = true;
  say(t().hello);
  canvas.focus();
}
$('btnStart').onclick = start;
$('btnQuick').onclick = openQuick; $('btnQuick2').onclick = openQuick;
$('btnLang').onclick = setLang; $('btnLang2').onclick = setLang;
$('say').onclick = hideSay;
$('prompt').onclick = () => { if (activeSpot) openSpot(activeSpot); };

/* ------------------------------------------------------------------ input */
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (cardEl.open) return;
  const onButton = e.target instanceof HTMLElement && e.target.closest('button, a');
  if (!started) { if (e.key === 'Enter' && !onButton) { e.preventDefault(); start(); } return; }
  if (KEYMAP[e.key]) { keys.add(KEYMAP[e.key]); e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return; }
  if ((e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') && !onButton) {
    e.preventDefault();
    if (!$('say').hidden) hideSay();
    if (activeSpot) openSpot(activeSpot);
  }
});
addEventListener('keyup', e => { if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]); });
addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', e => {
  if (paused()) return;
  hideSay();
  const r = canvas.getBoundingClientRect();
  const wx = cam.x + (e.clientX - r.left) * dpr / zoom, wy = cam.y + (e.clientY - r.top) * dpr / zoom;
  const hit = SPOTS.find(s => wx >= s.hit.x && wx <= s.hit.x + s.hit.w && wy >= s.hit.y && wy <= s.hit.y + s.hit.h) ||
    SPOTS.find(s => Math.abs(wx - s.anchor.x) < 40 && Math.abs(wy - s.anchor.y) < 9);
  if (hit) { walkTo(hit.trig[0], hit.trig[1], hit); return; }
  const free = nearestFree(Math.floor(wx / T), Math.floor(wy / T));
  if (free) walkTo(free[0], free[1]);
});

/* ------------------------------------------------------------------ boot */
SPOTS.forEach(s => { if (!findPath(21, 18, s.trig[0], s.trig[1])) console.warn('Unreachable spot:', s.id); });
renderHud();
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  update(dt); render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (document.fonts && document.fonts.load) document.fonts.load(`600 7px "Pixelify Sans"`).catch(() => {});

// small hook for testing from the console
window.__town = { player, SPOTS, walkTo, openSpot, found, tileSolid, get cam() { return cam; }, get zoom() { return zoom; } };
})();
