/* Starry Town — a walkable portfolio island. No dependencies; everything is drawn in code. */
(() => {
'use strict';

const DATA = window.DATA, EX = window.EXTRAS;
const T = 16, MW = 46, MH = 34;
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, f) { try { const v = localStorage.getItem('starry-town-' + k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem('starry-town-' + k, JSON.stringify(v)); } catch (e) {} },
};
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const q = Array.isArray(r) ? r : [r, r, r, r], [a, b, c2, d2] = q.length === 4 ? q : [q[0], q[0], q[0], q[0]];
    this.moveTo(x + a, y); this.arcTo(x + w, y, x + w, y + h, b); this.arcTo(x + w, y + h, x, y + h, c2);
    this.arcTo(x, y + h, x, y, d2); this.arcTo(x, y, x + w, y, a); this.closePath();
  };
}

/* ------------------------------------------------------------------ i18n */
const UI = {
  en: {
    kicker: "NAN YAO'S PORTFOLIO ISLAND",
    sub: 'My portfolio is a little island. Walk around, visit the buildings, dig things up, go fishing. Who is visiting today?',
    quick: 'Quick view', cv: 'CV', lang: '中文', bag: 'Backpack',
    hint: 'Arrow keys or WASD to walk · E or Space to act · or click where you want to go',
    hintTouch: 'Tap anywhere to walk · tap a building to visit it',
    visit: 'Visit', dig: 'Dig here', fish: 'Go fishing', wait: 'Waiting for a bite…', pull: 'Pull!',
    hello: "Hi, I'm Nan! Welcome to my island. Visit anything with a “?”, dig where the ground sparkles, and try fishing by the water. My Samoyed insists on coming along.",
    next: 'tap or press any key ▸', speaker: 'Nan',
    newStar: 'New star', allDone: 'All 16 stars found. Thanks for walking the whole island!', sayHi: 'Say hi',
    routeDone: 'Route complete. That was the short version of me.', nextStop: 'Next', routeOk: 'Route complete · say hi',
    early: 'Too early, it swam away.', missed: 'It got away. Try again!', again: 'You already have this one. Back it goes.',
    dugTitle: 'You dug something up!', fishTitle: 'You caught something!', writeMe: 'Write to me',
    quickKicker: 'Quick view',
    sec: { exp: 'Experience', work: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    kick: { about: 'Welcome', job: 'Experience', project: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    aboutTitle: "Hi, I'm Nan Yao", eduTitle: 'Education', contactTitle: 'Get in touch', phone: 'Phone', github: 'GitHub',
    bagTitle: 'Backpack', bagMeta: 'What you have found so far', route: 'Your route', treasures: 'Dug up', catches: 'Caught', unknown: 'Not found yet',
    toolsText: 'Dig where the ground sparkles. Stand next to water and press E to fish, then press again when the float dips.',
  },
  zh: {
    kicker: '姚楠的作品集小岛',
    sub: '我把作品集做成了一座小岛。四处走走，拜访建筑，挖挖宝，钓钓鱼。今天来的是哪位？',
    quick: '快速浏览', cv: '简历', lang: 'EN', bag: '背包',
    hint: '方向键或 WASD 走路 · E 或空格互动 · 也可以直接点击想去的地方',
    hintTouch: '点击任意位置走过去 · 点击建筑直接拜访',
    visit: '拜访', dig: '挖一挖', fish: '钓鱼', wait: '等鱼上钩…', pull: '拉！',
    hello: '嗨，我是姚楠！欢迎来我的小岛。带“?”的地方都可以拜访，地上闪光的地方可以挖，水边还能钓鱼。我的萨摩耶一定要跟着。',
    next: '点击或按任意键 ▸', speaker: '姚楠',
    newStar: '新的星星', allDone: '16 颗星全部找到，谢谢你逛完整座小岛！', sayHi: '打个招呼',
    routeDone: '路线走完了，这就是精简版的我。', nextStop: '下一站', routeOk: '路线完成 · 打个招呼',
    early: '太早了，鱼游走了。', missed: '跑掉了，再试一次！', again: '这个你已经有了，放回去吧。',
    dugTitle: '挖到东西了！', fishTitle: '钓到了！', writeMe: '给我写信',
    quickKicker: '快速浏览',
    sec: { exp: '工作经历', work: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    kick: { about: '欢迎', job: '工作经历', project: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    aboutTitle: '嗨，我是姚楠', eduTitle: '教育背景', contactTitle: '联系我', phone: '电话', github: 'GitHub',
    bagTitle: '背包', bagMeta: '你目前找到的东西', route: '你的路线', treasures: '挖到的', catches: '钓到的', unknown: '还没找到',
    toolsText: '地上闪光的地方可以挖。站在水边按 E 抛竿，浮标下沉时再按一次。',
  },
};
let lang = store.get('lang', (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
if (!UI[lang]) lang = 'en';
const t = () => UI[lang];
const d = () => DATA[lang];
const esc = v => String(v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

/* ------------------------------------------------------------------ spots / progress */
const SPOTS = [
  { id: 'about',    kind: 'about',        name: { en: 'Welcome Sign', zh: '小岛路牌' } },
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
const found = new Set(store.get('found', []).filter(id => spotById[id]));
const dug = new Set(store.get('dug', []).filter(i => i >= 0 && i < EX.dig.length));
const caught = new Set(store.get('caught', []).filter(i => i >= 0 && i < EX.fish.length));
let persona = store.get('persona', null);
if (!EX.routes[persona]) persona = null;
let routeToasted = store.get('routeDone', false);
const itemCount = () => dug.size + caught.size, itemTotal = EX.dig.length + EX.fish.length;

/* ------------------------------------------------------------------ world */
const G = 0, P = 1, Z = 2, W = 3, D = 4;
const map = new Uint8Array(MW * MH), solid = new Uint8Array(MW * MH), reserved = new Uint8Array(MW * MH), flowers = new Uint8Array(MW * MH);
const I = (x, y) => y * MW + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const at = (x, y) => inMap(x, y) ? map[I(x, y)] : W;
function hash(x, y, s = 0) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function rect(x, y, w, h, v, arr = map) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inMap(i, j)) arr[I(i, j)] = v;
}
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  if (x < 2 || x >= 44 || y < 2 || y >= 32) map[I(x, y)] = W;
  else if ((x === 2 || x === 43 || y === 2 || y === 31) && hash(x, y, 7) < 0.3) map[I(x, y)] = W;
}
[[2, 2], [3, 2], [2, 3], [43, 2], [42, 2], [43, 3], [2, 31], [3, 31], [2, 30], [43, 31], [42, 31], [43, 30]].forEach(([x, y]) => map[I(x, y)] = W);
rect(27, 29, 10, 3, W);
rect(4, 16, 38, 2, P); rect(4, 24, 38, 2, P);
rect(22, 11, 2, 17, P);
rect(10, 16, 2, 10, P); rect(33, 16, 2, 10, P);
rect(19, 14, 8, 6, Z);
[5, 10, 16, 31, 38].forEach(x => rect(x, 13, 1, 3, P));
[6, 15, 30, 38].forEach(x => rect(x, 23, 1, 1, P));
rect(11, 26, 1, 4, P); rect(8, 29, 8, 1, P);
rect(30, 26, 2, 3, P); rect(30, 29, 2, 2, D);

const BUILDINGS = [
  { id: 'skills',   kind: 'house',  x: 4,  y: 9,  w: 4, h: 4, door: 1, wall: '#f3d9a8', roof: '#b9825a', roofL: '#cf9a70', doorC: '#8a5a3c', sign: '#7fd1c0' },
  { id: 'orbit',    kind: 'dome',   x: 9,  y: 8,  w: 4, h: 5, door: 1 },
  { id: 'linear',   kind: 'house',  x: 14, y: 8,  w: 5, h: 5, door: 2, wall: '#fbf7ee', roof: '#6f8fd8', roofL: '#8eaaea', doorC: '#5a76c0', sign: '#ffffff' },
  { id: 'monolith', kind: 'tower',  x: 20, y: 3,  w: 6, h: 8, door: 2 },
  { id: 'crossing', kind: 'house',  x: 29, y: 8,  w: 5, h: 5, door: 2, wall: '#fff1cf', roof: '#f0766a', roofL: '#f89a8c', doorC: '#c9584e', sign: '#ffd166' },
  { id: 'waves',    kind: 'house',  x: 36, y: 8,  w: 5, h: 5, door: 2, wall: '#f1f8fc', roof: '#4fa8dc', roofL: '#78c2ec', doorC: '#3a86b8', sign: '#bfe9fa' },
  { id: 'sync',     kind: 'house',  x: 5,  y: 19, w: 4, h: 4, door: 1, wall: '#f6f1e6', roof: '#f5a25a', roofL: '#fbbd82', doorC: '#c97a3a', sign: '#ffd9b0' },
  { id: 'agent',    kind: 'house',  x: 13, y: 19, w: 5, h: 4, door: 2, wall: '#fbf3dc', roof: '#6cc08a', roofL: '#8fd6a6', doorC: '#4a9a68', sign: '#d6f5cf' },
  { id: 'wavo',     kind: 'house',  x: 28, y: 19, w: 5, h: 4, door: 2, wall: '#fff3d6', roof: '#f590b2', roofL: '#fab0c8', doorC: '#cf6088', sign: '#ffd9e6' },
  { id: 'edu',      kind: 'campus', x: 35, y: 18, w: 7, h: 5, door: 3, wall: '#fbf1dc', roof: '#9a6fd6', roofL: '#b390e6', doorC: '#7a4fb8', sign: '#e6d6ff' },
];
const TRIG = {
  skills: [5, 13], orbit: [10, 13], linear: [16, 13], monolith: [22, 11], crossing: [31, 13], waves: [38, 13],
  sync: [6, 23], agent: [15, 23], wavo: [30, 23], edu: [38, 23],
  about: [20, 16], focus: [25, 16], manus: [26, 14], life: [13, 29], odyssey: [31, 30], contact: [23, 27],
};
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
  { kind: 'ship',     tx: 32, ty: 29, fw: 5, fh: 3, spot: 'odyssey' },
  { kind: 'crossSign', tx: 28, ty: 13, fw: 1, fh: 1 },
  { kind: 'light',    tx: 12, ty: 23, fw: 1, fh: 1 },
  { kind: 'crates',   tx: 8,  ty: 12, fw: 1, fh: 1 },
  { kind: 'bench',    tx: 19, ty: 19, fw: 2, fh: 1 },
  { kind: 'bench',    tx: 25, ty: 19, fw: 2, fh: 1 },
];
[[7, 15], [13, 15], [18, 15], [28, 15], [35, 15], [41, 15], [9, 23], [18, 23], [27, 23], [36, 23], [21, 12], [24, 12], [12, 26], [21, 27], [29, 27]]
  .forEach(([tx, ty]) => OBJECTS.push({ kind: 'lamp', tx, ty, fw: 1, fh: 1 }));
const DIGS = [[13, 14], [34, 14], [18, 18], [27, 21], [8, 18], [41, 14], [20, 29], [17, 26]].map(([tx, ty], i) => ({ i, tx, ty, x: tx * T + 8, y: ty * T + 9 }));

for (let i = 0; i < map.length; i++) if (map[i] === W) solid[i] = 1;
BUILDINGS.forEach(b => {
  rect(b.x, b.y, b.w, b.h, 1, solid);
  rect(b.x - 1, b.y - 2, b.w + 2, b.h + 4, 1, reserved);
  const s = spotById[b.id];
  s.hit = { x: b.x * T, y: b.y * T - 10, w: b.w * T, h: b.h * T + 10 };
  s.anchor = { x: (b.x + b.w / 2) * T, y: b.kind === 'tower' ? (b.y + b.h) * T - 36 : b.y * T - (b.kind === 'dome' ? 24 : b.kind === 'campus' ? 32 : 16) };
});
OBJECTS.forEach(o => {
  rect(o.tx, o.ty, o.fw, o.fh, 1, solid);
  rect(o.tx - 1, o.ty - 2, o.fw + 2, o.fh + 3, 1, reserved);
  if (o.spot) {
    const s = spotById[o.spot];
    const up = { booth: 22, ship: 44, doghouse: 14, sign: 12, scope: 14, mailbox: 14 }[o.kind] || 12;
    s.hit = { x: o.tx * T, y: o.ty * T - up, w: o.fw * T, h: o.fh * T + up };
    s.anchor = { x: (o.tx + o.fw / 2) * T, y: o.ty * T - up - 6 };
  }
});
SPOTS.forEach(s => { s.trig = TRIG[s.id]; });
DIGS.forEach(g => rect(g.tx - 1, g.ty - 1, 3, 3, 1, reserved));
rect(4, 26, 15, 5, 1, reserved);
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
    if (hash(x, y, 1) < (edge ? 0.55 : 0.24)) { TREES.push({ tx: x, ty: y, type: hash(x, y, 2) < 0.3 ? 'pine' : hash(x, y, 5) < 0.45 ? 'fruit' : 'round', v: hash(x, y, 8) }); solid[i] = 1; continue; }
  }
  if (!solid[i] && !DIGS.some(g => g.tx === x && g.ty === y) && hash(x, y, 3) < 0.1) flowers[i] = 1 + Math.floor(hash(x, y, 4) * 4);
}

/* ------------------------------------------------------------------ drawing helpers */
const TAU = Math.PI * 2;
const rr = (c, x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); };
const ci = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); };
const el = (c, x, y, rx, ry, fill) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill(); };
const poly = (c, pts, fill, round) => {
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill();
  if (round) { c.lineJoin = 'round'; c.lineWidth = round; c.strokeStyle = fill; c.stroke(); }
};
const line = (c, x1, y1, x2, y2, col, w = 1) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
const shade = (c, x, y, rx, ry) => el(c, x, y, rx, ry, 'rgba(46,92,70,.22)');
function star(c, x, y, r, fill, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, q = i % 2 ? r * 0.48 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.lineJoin = 'round'; c.lineWidth = r * 0.25; c.strokeStyle = fill; c.stroke();
}
const C = {
  water: '#7ccfe0', sand: '#f8e9b8',
  grass: '#8ed68a', grassD: '#7cc97c', grassL: '#a6e39c',
  path: '#f6e3b4', pathD: '#e6cd92', plaza: '#f1dcc4', plazaD: '#e2c6a8', plazaL: '#f9ecdc',
  wood: '#d3a06e', woodD: '#b98654', brown: '#7a5a44', ink: '#6b4f3a', cream: '#fffaf0',
  glass: '#bfe9f7', glassL: '#e9f9ff', leaf: '#63bf72', leafD: '#4da862', leafL: '#8bdc8a', trunk: '#a9785a',
};

/* ------------------------------------------------------------------ ground cache */
const GS = 4;
const ground = document.createElement('canvas');
ground.width = MW * T * GS; ground.height = MH * T * GS;
(function paintGround() {
  const c = ground.getContext('2d');
  c.scale(GS, GS);
  c.fillStyle = C.water; c.fillRect(0, 0, MW * T, MH * T);
  const shape = (pred, inf, rad, fill) => {
    c.beginPath();
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (!pred(x, y)) continue;
      const n = pred(x, y - 1), s = pred(x, y + 1), w = pred(x - 1, y), e = pred(x + 1, y), k = inf + 0.3;
      c.roundRect(x * T - k, y * T - k, T + k * 2, T + k * 2, [!n && !w ? rad : 0, !n && !e ? rad : 0, !s && !e ? rad : 0, !s && !w ? rad : 0]);
    }
    c.fillStyle = fill; c.fill();
  };
  const land = (x, y) => at(x, y) !== W && at(x, y) !== D;
  shape(land, 7, 13, 'rgba(255,255,255,.35)');
  shape(land, 4.5, 11, '#e9fbff');
  shape(land, 3, 10, C.sand);
  shape(land, 0, 7, C.grass);
  for (let y = 2; y < 32; y++) for (let x = 2; x < 44; x++) {
    if (!land(x, y)) continue;
    const px = x * T, py = y * T;
    if (hash(x, y, 20) < 0.16 && land(x - 1, y) && land(x + 1, y) && land(x, y - 1) && land(x, y + 1)) el(c, px + 8, py + 8, 13, 9, 'rgba(124,201,124,.35)');
    if (at(x, y) !== G) continue;
    for (let k = 0; k < 2; k++) {
      if (hash(x, y, 30 + k) > 0.55) continue;
      const hx = px + 3 + hash(x, y, 40 + k) * 10, hy = py + 4 + hash(x, y, 50 + k) * 9;
      c.strokeStyle = k ? C.grassL : C.grassD; c.lineWidth = 0.8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 1.4, hy - 1.6); c.lineTo(hx, hy); c.lineTo(hx + 1.4, hy - 1.6); c.stroke();
    }
  }
  const isP = (x, y) => at(x, y) === P || at(x, y) === Z;
  shape(isP, 1, 7, C.pathD);
  shape(isP, 0, 6, C.path);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === P) for (let k = 0; k < 2; k++) {
    if (hash(x, y, 60 + k) < 0.5) el(c, x * T + 2 + hash(x, y, 62 + k) * 12, y * T + 2 + hash(x, y, 64 + k) * 12, 1.3, 0.9, k ? '#fff1cf' : C.pathD);
  }
  // plaza cobbles
  const isZ = (x, y) => at(x, y) === Z;
  shape(isZ, -0.5, 6, C.plazaD);
  c.save(); c.beginPath(); c.roundRect(19 * T + 1, 14 * T + 1, 8 * T - 2, 6 * T - 2, 5); c.clip();
  for (let j = 0; j < 12; j++) for (let i = -1; i < 17; i++) rr(c, 19 * T + i * 8 + (j % 2 ? 4 : 0) + 0.8, 14 * T + j * 8 + 0.8, 6.4, 6.4, 2, hash(i, j, 70) < 0.5 ? C.plaza : C.plazaL);
  c.restore();
  // flowers
  const FC = ['#ff9db8', '#ffd45e', '#ffffff', '#b79cf5'];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const f = flowers[I(x, y)]; if (!f) continue;
    const n = 1 + Math.floor(hash(x, y, 80) * 2.4);
    for (let k = 0; k < n; k++) {
      const fx = x * T + 3 + hash(x, y, 81 + k) * 10, fy = y * T + 4 + hash(x, y, 85 + k) * 9;
      line(c, fx, fy + 1, fx, fy + 3.2, C.leafD, 0.8);
      for (let p = 0; p < 5; p++) ci(c, fx + Math.cos(p * TAU / 5) * 1.3, fy + Math.sin(p * TAU / 5) * 1.3, 1, FC[f - 1]);
      ci(c, fx, fy, 0.8, f === 2 ? '#f59a3a' : '#ffe27a');
    }
  }
  // pier
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === D) {
    const px = x * T, py = y * T;
    if (at(x - 1, y) !== D) rr(c, px - 1.5, py + 9, 3, 9, 1.5, C.woodD);
    if (at(x + 1, y) !== D) rr(c, px + T - 1.5, py + 9, 3, 9, 1.5, C.woodD);
    c.fillStyle = C.wood; c.fillRect(px, py - 3, T, T + 3);
    for (let k = 2; k < T; k += 4) line(c, px + 0.5, py + k, px + T - 0.5, py + k, C.woodD, 0.6);
  }
  rr(c, 13 * T + 4, 30 * T + 13.5, 5 * T - 8, 1, 0.5, 'rgba(255,255,255,.75)');
})();

/* ------------------------------------------------------------------ buildings */
function windowAt(c, x, y) {
  rr(c, x - 1.2, y - 1.2, 10.4, 10.4, 3, '#fff');
  rr(c, x, y, 8, 8, 2, C.glass);
  rr(c, x + 0.8, y + 0.8, 3, 2.2, 1, C.glassL);
  c.fillStyle = '#fff'; c.fillRect(x + 3.5, y, 1, 8); c.fillRect(x, y + 3.5, 8, 1);
}
function doorAt(c, dx, bot, col) {
  rr(c, dx - 2.5, bot - 1.5, 15, 3, 1.5, '#e8d5b5');
  rr(c, dx - 1, bot - 16, 12, 16, [6, 6, 0, 0], '#fff');
  rr(c, dx, bot - 15, 10, 15, [5, 5, 0, 0], col);
  ci(c, dx + 5, bot - 10.5, 2, C.glass);
  ci(c, dx + 7.6, bot - 6, 0.8, '#ffe27a');
}
const EMBLEM = {
  linear(c, x, y) { line(c, x - 2.5, y + 2, x + 2.5, y - 2, '#5a76c0', 1.4); },
  crossing(c, x, y) { line(c, x - 2.6, y, x + 2.6, y, C.ink, 1.3); line(c, x, y - 2.6, x, y + 2.6, C.ink, 1.3); },
  waves(c, x, y) { c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x - 1.5, y - 2.4, x, y); c.quadraticCurveTo(x + 1.5, y + 2.4, x + 3, y); c.strokeStyle = '#3a86b8'; c.lineWidth = 1.3; c.lineCap = 'round'; c.stroke(); },
  sync(c, x, y) { c.beginPath(); c.arc(x, y, 2.4, 0.4, Math.PI + 0.9); c.strokeStyle = '#c97a3a'; c.lineWidth = 1.2; c.lineCap = 'round'; c.stroke(); ci(c, x + 2.2, y + 1, 0.9, '#c97a3a'); },
  agent(c, x, y) { ci(c, x - 2.4, y, 1.1, '#5fbf7f'); ci(c, x, y, 1.1, '#ffc94d'); ci(c, x + 2.4, y, 1.1, '#f0766a'); },
  wavo(c, x, y) { line(c, x, y - 2.4, x, y + 0.6, '#cf6088', 1.5); ci(c, x, y + 2.5, 0.8, '#cf6088'); },
  skills(c, x, y) { line(c, x - 2, y + 2, x + 1.2, y - 1.2, C.brown, 1.2); rr(c, x - 0.4, y - 3.2, 3.6, 2.4, 0.8, '#8fa0b0'); },
  edu(c, x, y) { poly(c, [[x - 3, y - 0.6], [x, y - 2.2], [x + 3, y - 0.6], [x, y + 1]], '#7a4fb8'); line(c, x + 2.4, y, x + 2.4, y + 2, '#7a4fb8', 0.8); },
};
function drawHouse(c, b, time) {
  const x = b.x * T, w = b.w * T, top = b.y * T - 8, bot = (b.y + b.h) * T, h = bot - top;
  const rh = Math.round(h * 0.45), wy = top + rh;
  shade(c, x + w / 2, bot, w / 2 + 3, 4);
  rr(c, x + 2, wy - 6, w - 4, bot - wy + 6, [0, 0, 4, 4], b.wall);
  rr(c, x + 2, bot - 3.5, w - 4, 3.5, [0, 0, 4, 4], 'rgba(120,90,60,.18)');
  c.fillStyle = 'rgba(120,90,60,.12)'; c.fillRect(x + 2, wy, w - 4, 3);
  if (b.w >= 5) { rr(c, x + w - 20, top - 7, 8, 14, 2, '#e9c9a0'); rr(c, x + w - 21, top - 8, 10, 3.5, 1.5, '#c99a72'); }
  poly(c, [[x - 1, wy], [x + 5, top + 3], [x + w - 5, top + 3], [x + w + 1, wy]], b.roof, 5);
  for (let k = 1; k <= 2; k++) {
    const yy = top + 3 + (wy - top - 3) * k / 3, ins = 5 - 6 * k / 3;
    c.beginPath();
    for (let px = x + ins; px < x + w - ins - 3; px += 8) { c.moveTo(px, yy); c.quadraticCurveTo(px + 4, yy + 3, px + 8, yy); }
    c.strokeStyle = b.roofL; c.lineWidth = 1; c.lineCap = 'round'; c.stroke();
  }
  rr(c, x + 7, top + 2, w - 14, 2, 1, b.roofL);
  const tall = bot - wy >= 38;
  for (let i = 0; i < b.w; i++) {
    const wx = x + i * T + 4;
    if (tall) windowAt(c, wx, wy + 8);
    if (i !== b.door) {
      windowAt(c, wx, bot - 16);
      rr(c, wx - 1.5, bot - 6.2, 11, 2.6, 1.3, '#b98654');
      for (let k = 0; k < 3; k++) ci(c, wx + 1 + k * 3, bot - 7, 1.4, k % 2 ? '#ff9db8' : C.leaf);
    }
  }
  const dx = x + b.door * T + 3;
  doorAt(c, dx, bot, b.doorC);
  ci(c, dx + 5, bot - 23, 6.4, '#fff'); ci(c, dx + 5, bot - 23, 5.2, b.sign);
  if (EMBLEM[b.id]) EMBLEM[b.id](c, dx + 5, bot - 23);
  if (b.id === 'wavo') { const cols = ['#ffd166', '#7fd1c0', '#fff', '#b79cf5']; for (let i = 0; i < 9; i++) poly(c, [[x + 4 + i * 8.4, wy + 0.5], [x + 9 + i * 8.4, wy + 0.5], [x + 6.5 + i * 8.4, wy + 5]], cols[i % 4], 0.6); }
  if (b.id === 'agent') { rr(c, x + w + 1, bot - 13, 2.4, 13, 1.2, '#fff'); for (let i = 0; i < 6; i++) rr(c, x + w + 3 + i * 3.6, bot - 10.5, 3.6, 3, i === 5 ? [0, 1.5, 1.5, 0] : 0, i % 2 ? '#fff' : '#f590b2'); }
  if (b.id === 'sync') { const cx = x + 12, cy = top - 1; line(c, cx, cy + 3, cx, cy - 4, '#fff', 1.6); c.beginPath(); c.arc(cx, cy - 6, 5, 0.25, Math.PI - 0.25); c.closePath(); c.fillStyle = '#fff'; c.fill(); ci(c, cx, cy - 9, 1.4, reduceMotion || Math.sin(time * 4) > 0 ? '#f0766a' : '#f5c0b8'); }
  if (b.id === 'waves') { c.beginPath(); for (let px = x + 5; px < x + w - 8; px += 8) { c.moveTo(px, wy + 24); c.quadraticCurveTo(px + 2, wy + 21.5, px + 4, wy + 24); c.quadraticCurveTo(px + 6, wy + 26.5, px + 8, wy + 24); } c.strokeStyle = '#78c2ec'; c.lineWidth = 1.4; c.stroke(); }
  if (b.id === 'linear') line(c, x + 8, top + 8, x + w - 8, top + 8, '#fff', 0.9);
  return { x, w, top, bot, wy, rh, dx };
}
function drawCampus(c, b, time) {
  const cx = b.x * T + b.w * T / 2, top = b.y * T - 8;
  [b.x * T + 12, (b.x + b.w) * T - 13].forEach((bx, k) => {
    line(c, bx, top + 4, bx, top - 13, '#fff', 1.4);
    const wv = reduceMotion ? 0 : Math.sin(time * 3 + k) * 1.2;
    poly(c, [[bx + 0.6, top - 13], [bx + 9, top - 11.5 + wv], [bx + 0.6, top - 7]], '#9a6fd6', 1);
  });
  const g = drawHouse(c, b, time);
  for (let i = 0; i <= b.w; i++) rr(c, g.x + i * T - (i === b.w ? 4.5 : i === 0 ? -2 : 1.5), g.wy + 2, 3, g.bot - g.wy - 5, 1.5, '#fff');
  rr(c, cx - 10, top - 16, 20, g.rh + 22, 3, b.wall);
  poly(c, [[cx - 12, top - 15], [cx, top - 25], [cx + 12, top - 15]], b.roof, 3);
  ci(c, cx, top - 4, 6, '#fff'); ci(c, cx, top - 4, 4.8, '#fffaf0');
  line(c, cx, top - 4, cx, top - 7.4, C.ink, 0.9); line(c, cx, top - 4, cx + 2.4, top - 3.2, C.ink, 0.9);
  doorAt(c, g.dx, g.bot, b.doorC);
}
function drawTower(c, b, time) {
  const x = b.x * T, w = b.w * T, top = b.y * T - 18, bot = (b.y + b.h) * T, cx = x + w / 2;
  shade(c, cx, bot, w / 2, 4.5);
  line(c, cx, top + 2, cx, top - 10, '#b9b6d8', 1.4);
  ci(c, cx, top - 11, 2, reduceMotion || Math.sin(time * 3) > 0 ? '#ff8a80' : '#f5c0c0');
  rr(c, x + 12, top, w - 24, bot - top - 8, 7, '#4a4870');
  rr(c, x + 12, top, 5, bot - top - 8, [7, 0, 0, 7], '#5d5b8a');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 8; i++) {
    if (i === 3 || i === 4) continue;
    const hsh = hash(i, j, 11);
    rr(c, x + 19 + i * 7.4, top + 9 + j * 7.4, 4.4, 4.4, 1.2, hsh < 0.6 ? (hsh < 0.12 ? '#bfe9f7' : '#ffe9a6') : '#63618f');
  }
  rr(c, cx - 4, top + 7, 8, bot - top - 34, 4, '#bfe9f7'); rr(c, cx - 2.6, top + 9, 2, bot - top - 38, 1, '#e9f9ff');
  rr(c, x + 4, bot - 23, w - 8, 23, [6, 6, 3, 3], '#5d5b8a');
  rr(c, x + 4, bot - 23, w - 8, 3, [6, 6, 0, 0], '#7573a6');
  windowAt(c, x + 10, bot - 16); windowAt(c, x + w - 18, bot - 16);
  rr(c, cx - 13.5, bot - 1.5, 27, 3, 1.5, '#e8d5b5');
  rr(c, cx - 11, bot - 17, 22, 17, [6, 6, 0, 0], '#fff');
  rr(c, cx - 10, bot - 16, 9.4, 16, [5, 0, 0, 0], '#ffe9a6'); rr(c, cx + 0.6, bot - 16, 9.4, 16, [0, 5, 0, 0], '#ffe9a6');
}
function drawDome(c, b, time) {
  const x = b.x * T, w = b.w * T, bot = (b.y + b.h) * T, cx = x + w / 2, wy = bot - 34;
  shade(c, cx, bot, w / 2 + 2, 4);
  c.beginPath(); c.arc(cx, wy + 2, 27, Math.PI, 0); c.closePath(); c.fillStyle = '#8fa4f0'; c.fill();
  c.beginPath(); c.arc(cx - 5, wy + 2, 19, Math.PI * 1.05, Math.PI * 1.6); c.strokeStyle = '#b3c2f8'; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
  rr(c, cx - 3.5, wy - 25, 7, 27, 3.5, '#4a4870');
  c.save(); c.translate(cx + 2, wy - 14); c.rotate(-0.75); rr(c, 0, -3, 20, 6, 3, '#fff'); rr(c, 16, -3.6, 5, 7.2, 2, '#bfe9f7'); c.restore();
  rr(c, x + 3, wy, w - 6, 34, [0, 0, 4, 4], '#fbf7ee');
  rr(c, x + 1, wy - 2, w - 2, 5, 2.5, '#dfe5fb');
  windowAt(c, x + 9, wy + 9); windowAt(c, x + w - 17, wy + 9); windowAt(c, x + w - 17, bot - 16);
  doorAt(c, x + b.door * T + 3, bot, '#6f8fd8');
  const a = reduceMotion ? 0.8 : time * 1.1, ox = cx + Math.cos(a) * 34, oy = wy - 30 + Math.sin(a) * 9;
  c.beginPath(); c.ellipse(cx, wy - 30, 34, 9, 0, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.8; c.setLineDash([2, 3]); c.stroke(); c.setLineDash([]);
  ci(c, ox, oy, 3.4, '#ffd166'); ci(c, ox - 1, oy - 1, 1, '#fff3c9');
}
function drawBuilding(c, b, time) {
  if (b.kind === 'tower') return drawTower(c, b, time);
  if (b.kind === 'dome') return drawDome(c, b, time);
  if (b.kind === 'campus') return drawCampus(c, b, time);
  drawHouse(c, b, time);
}

/* ------------------------------------------------------------------ trees / objects */
function drawTree(c, tr, time) {
  const x = tr.tx * T + 8, y = tr.ty * T + 15;
  const sway = reduceMotion ? 0 : Math.sin(time * 1.2 + tr.v * 9) * 0.5;
  shade(c, x, y, 8, 2.6);
  rr(c, x - 2, y - 9, 4, 9.5, 1.5, C.trunk);
  if (tr.type === 'pine') {
    for (let k = 0; k < 3; k++) { const by = y - 7 - k * 6.5, hw = 9.5 - k * 2; poly(c, [[x - hw + sway * k * 0.3, by], [x + sway * k * 0.6, by - 10], [x + hw + sway * k * 0.3, by]], k % 2 ? '#56b38a' : '#49a67e', 2.4); }
  } else {
    ci(c, x - 5 + sway, y - 13, 6.5, C.leafD); ci(c, x + 5 + sway, y - 13, 6.5, C.leafD);
    ci(c, x + sway, y - 17, 8.5, C.leaf); ci(c, x - 4 + sway, y - 14, 6, C.leaf); ci(c, x + 4.5 + sway, y - 14.5, 6, C.leaf);
    ci(c, x - 2.5 + sway, y - 20, 3.6, C.leafL);
    if (tr.type === 'fruit') { const fc = tr.v < 0.5 ? '#ff9a8a' : '#ffb347'; [[-5, -13], [4, -17], [1, -11]].forEach(([fx, fy]) => { ci(c, x + fx + sway, y + fy, 2, fc); ci(c, x + fx - 0.6 + sway, y + fy - 0.6, 0.6, '#fff3e0'); }); }
  }
}
const OBJ = {
  lamp(c, x, y) {
    shade(c, x + 8, y + 14.5, 4, 1.4);
    rr(c, x + 7, y - 4, 2, 19, 1, '#8c7a6a'); rr(c, x + 5.5, y + 12.5, 5, 2.4, 1.2, '#8c7a6a');
    ci(c, x + 8, y - 8, 5.6, 'rgba(255,241,190,.45)'); ci(c, x + 8, y - 8, 4, '#fff6cf'); rr(c, x + 4.5, y - 13.5, 7, 2.2, 1.1, '#8c7a6a');
  },
  sign(c, x, y) {
    shade(c, x + 8, y + 14.5, 6, 1.6);
    rr(c, x + 7, y, 2.2, 15, 1, C.trunk);
    rr(c, x - 3, y - 9, 22, 13, 3, '#c9925e'); rr(c, x - 1.6, y - 7.6, 19.2, 10.2, 2, '#e9c48e');
    star(c, x + 3.5, y - 2.5, 2.4, '#ffc94d'); line(c, x + 8, y - 4, x + 14.5, y - 4, C.brown, 1); line(c, x + 8, y - 1, x + 12.5, y - 1, C.brown, 1);
  },
  scope(c, x, y) {
    shade(c, x + 8, y + 14.5, 6, 1.6);
    line(c, x + 8, y + 2, x + 4, y + 14, C.brown, 1.4); line(c, x + 8, y + 2, x + 12, y + 14, C.brown, 1.4); line(c, x + 8, y + 2, x + 8, y + 14, C.brown, 1.4);
    c.save(); c.translate(x + 8, y); c.rotate(-0.55); rr(c, -7, -3, 15, 6, 3, '#f590b2'); rr(c, 6, -4, 5, 8, 2, '#bfe9f7'); rr(c, -9, -2, 3.4, 4, 1.4, '#ffd166'); c.restore();
  },
  statue(c, x, y, time) {
    shade(c, x + 16, y + 15, 15, 3);
    rr(c, x + 3, y + 5, 26, 10.5, 3, '#d9c3a8'); rr(c, x + 3, y + 5, 26, 3, [3, 3, 0, 0], '#ecdcc6'); rr(c, x + 9, y - 3, 14, 9, 2.5, '#e6d2ba');
    const cy = y - 15 + (reduceMotion ? 0 : Math.sin(time * 2) * 1.2), k = found.size / SPOTS.length;
    ci(c, x + 16, cy, 11 + k * 4, `rgba(255,214,102,${0.18 + k * 0.25})`);
    star(c, x + 16, cy, 8.5, '#ffcf4d'); star(c, x + 15, cy - 1, 3.4, '#fff1b8');
  },
  booth(c, x, y) {
    shade(c, x + 16, y + 15, 17, 3);
    rr(c, x + 1, y - 13, 2, 28, 1, '#fff'); rr(c, x + 29, y - 13, 2, 28, 1, '#fff');
    rr(c, x, y + 3, 32, 12.5, 3, '#fffaf0'); rr(c, x, y + 3, 32, 3, [3, 3, 0, 0], '#e9dcc4');
    rr(c, x + 10.5, y + 7.5, 11, 5.5, 1.5, '#4a4458'); rr(c, x + 13, y + 9, 1.6, 2.6, 0.6, '#fff'); rr(c, x + 17.4, y + 9, 1.6, 2.6, 0.6, '#fff');
    for (let i = 0; i < 6; i++) rr(c, x - 2 + i * 6, y - 22, 6, 12, i === 0 ? [3, 0, 3, 3] : i === 5 ? [0, 3, 3, 3] : [0, 0, 3, 3], i % 2 ? '#4a4458' : '#fffaf0');
  },
  tent(c, x, y) {
    shade(c, x + 24, y + 31, 24, 3.5);
    poly(c, [[x + 24, y + 1], [x + 1, y + 30], [x + 47, y + 30]], '#f5a25a', 3);
    poly(c, [[x + 24, y + 1], [x + 24, y + 30], [x + 47, y + 30]], '#e98a44', 3);
    poly(c, [[x + 24, y + 13], [x + 17, y + 30], [x + 31, y + 30]], '#7a5a44', 1.5);
    line(c, x + 24, y + 2, x + 24, y - 5, '#fff', 1.2); poly(c, [[x + 24.6, y - 5], [x + 31, y - 3.4], [x + 24.6, y - 1.6]], '#f590b2', 0.8);
  },
  fire(c, x, y, time) {
    shade(c, x + 8, y + 13.5, 7, 2);
    c.save(); c.translate(x + 8, y + 12); c.rotate(0.35); rr(c, -6, -1.4, 12, 2.8, 1.4, C.trunk); c.rotate(-0.7); rr(c, -6, -1.4, 12, 2.8, 1.4, '#8f6248'); c.restore();
    const f = reduceMotion ? 0 : Math.sin(time * 10) * 0.8;
    c.beginPath(); c.moveTo(x + 3.5, y + 10); c.quadraticCurveTo(x + 2, y + 3, x + 8 + f, y - 2 - f); c.quadraticCurveTo(x + 14, y + 3, x + 12.5, y + 10); c.closePath(); c.fillStyle = '#ff9a4a'; c.fill();
    c.beginPath(); c.moveTo(x + 5.5, y + 10); c.quadraticCurveTo(x + 5, y + 6, x + 8 - f * 0.5, y + 2.5); c.quadraticCurveTo(x + 11, y + 6, x + 10.5, y + 10); c.closePath(); c.fillStyle = '#ffe27a'; c.fill();
  },
  doghouse(c, x, y) {
    shade(c, x + 16, y + 15, 15, 3);
    rr(c, x + 4, y - 1, 24, 16, [0, 0, 3, 3], '#fff3d6');
    poly(c, [[x + 1.5, y + 1], [x + 16, y - 11], [x + 30.5, y + 1]], '#f590b2', 3);
    rr(c, x + 10.5, y + 4, 11, 11, [5.5, 5.5, 0, 0], '#7a5a44');
    rr(c, x + 11.5, y - 4.5, 9, 4.6, 2, '#fff'); el(c, x + 14, y - 2.2, 1.2, 1, '#f590b2'); el(c, x + 18, y - 2.2, 1.2, 1, '#f590b2'); rr(c, x + 14, y - 2.8, 4, 1.2, 0.6, '#f590b2');
    el(c, x + 27, y + 13.5, 3.4, 1.8, '#7fd1c0'); el(c, x + 27, y + 12.8, 2.4, 1, '#fff');
  },
  boulder(c, x, y) {
    shade(c, x + 16, y + 30.5, 15, 3);
    c.beginPath(); c.moveTo(x + 3, y + 30); c.quadraticCurveTo(x - 1, y + 12, x + 9, y + 5); c.quadraticCurveTo(x + 18, y - 2, x + 25, y + 6); c.quadraticCurveTo(x + 33, y + 15, x + 29, y + 30); c.closePath(); c.fillStyle = '#b9b3c4'; c.fill();
    c.beginPath(); c.moveTo(x + 8, y + 10); c.quadraticCurveTo(x + 14, y + 3, x + 20, y + 7); c.strokeStyle = '#d6d1e0'; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke();
    [['#f590b2', 9, 22], ['#ffd166', 15, 15], ['#7fd1c0', 21, 21], ['#6f8fd8', 12, 9], ['#f5a25a', 22, 11], ['#fff', 17, 26]].forEach(([col, hx, hy]) => el(c, x + hx, y + hy, 1.9, 1.5, col));
  },
  net(c, x, y) {
    rr(c, x + 1, y + 2, 2, 13, 1, '#fff'); rr(c, x + 45, y + 2, 2, 13, 1, '#fff');
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.5; c.beginPath();
    for (let i = 0; i <= 42; i += 3) { c.moveTo(x + 3 + i, y + 3.5); c.lineTo(x + 3 + i, y + 11); }
    for (let j = 5.5; j < 11; j += 2) { c.moveTo(x + 3, y + j); c.lineTo(x + 45, y + j); }
    c.stroke(); rr(c, x + 2.5, y + 2.6, 43, 1.6, 0.8, '#fff'); ci(c, x + 34, y + 13.5, 1.8, '#d8f25a');
  },
  mailbox(c, x, y) {
    shade(c, x + 8, y + 14.5, 5, 1.5);
    rr(c, x + 7, y + 2, 2.2, 13, 1, '#fff');
    rr(c, x + 1, y - 9, 14, 12, [6, 6, 2, 2], '#f0766a'); rr(c, x + 2.5, y - 7.5, 11, 3, [4, 4, 0, 0], '#f89a8c');
    rr(c, x + 4, y - 2.4, 8, 1.6, 0.8, '#fff'); rr(c, x + 14.4, y - 9, 1.4, 7, 0.7, '#fff'); rr(c, x + 15, y - 9.6, 4.4, 3.4, 1, '#ffd166');
  },
  ship(c, x, y, time) {
    const bob = reduceMotion ? 0 : Math.sin(time * 1.6) * 0.9, by = y + 34 + bob;
    el(c, x + 39, by + 11, 36, 3, 'rgba(60,130,160,.25)');
    c.beginPath(); c.moveTo(x, by); c.lineTo(x + 78, by); c.quadraticCurveTo(x + 72, by + 12, x + 60, by + 12); c.lineTo(x + 18, by + 12); c.quadraticCurveTo(x + 6, by + 12, x, by); c.closePath(); c.fillStyle = '#c98a5e'; c.fill();
    rr(c, x + 1, by - 1, 76, 3.4, 1.7, '#fffaf0'); line(c, x + 8, by + 6, x + 70, by + 6, '#b0744a', 0.8);
    rr(c, x + 37, by - 44, 2.6, 44, 1.3, '#fff');
    c.beginPath(); c.moveTo(x + 35, by - 41); c.quadraticCurveTo(x + 4, by - 26, x + 9, by - 6); c.lineTo(x + 35, by - 6); c.closePath(); c.fillStyle = '#fffaf0'; c.fill();
    c.beginPath(); c.moveTo(x + 42, by - 35); c.quadraticCurveTo(x + 66, by - 24, x + 62, by - 6); c.lineTo(x + 42, by - 6); c.closePath(); c.fillStyle = '#fdeccf'; c.fill();
    c.beginPath(); for (let i = 0; i < 2; i++) { const px = x + 15 + i * 8; c.moveTo(px, by - 18); c.quadraticCurveTo(px + 2, by - 21, px + 4, by - 18); c.quadraticCurveTo(px + 6, by - 15, px + 8, by - 18); }
    c.strokeStyle = '#4fa8dc'; c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke();
    poly(c, [[x + 39.6, by - 50], [x + 48, by - 47.5], [x + 39.6, by - 45]], '#f590b2', 1);
  },
  crossSign(c, x, y) {
    shade(c, x + 8, y + 14.5, 4, 1.4);
    rr(c, x + 7, y - 8, 2.2, 23, 1, C.trunk);
    rr(c, x - 3, y - 9, 14, 6, [3, 1, 1, 3], '#ffd166'); rr(c, x + 6, y - 1.5, 14, 6, [1, 3, 3, 1], '#f590b2');
  },
  light(c, x, y, time) {
    shade(c, x + 8, y + 14.5, 4, 1.4);
    rr(c, x + 7, y, 2.2, 15, 1, '#8c7a6a'); rr(c, x + 3.5, y - 16, 9, 18, 4, '#5d5b8a');
    const on = reduceMotion ? 0 : Math.floor(time / 1.6) % 3;
    ci(c, x + 8, y - 12, 2.2, on === 2 ? '#ff8a80' : '#7d6a80'); ci(c, x + 8, y - 7, 2.2, on === 1 ? '#ffd166' : '#7d7570'); ci(c, x + 8, y - 2, 2.2, on === 0 ? '#8be39a' : '#62807a');
  },
  crates(c, x, y) {
    shade(c, x + 8, y + 15, 8, 2);
    rr(c, x + 1, y + 3, 14, 12.5, 2, '#d9a873'); line(c, x + 2, y + 9, x + 14, y + 9, '#b98654', 0.8); line(c, x + 8, y + 4, x + 8, y + 15, '#b98654', 0.8);
    rr(c, x + 4, y - 5, 9, 9, 2, '#e9c48e'); line(c, x + 13, y - 9, x + 13, y + 2, '#8c7a6a', 1.4); rr(c, x + 10.5, y - 11, 5.5, 3, 1.2, '#b9c2cc');
  },
  bench(c, x, y) {
    shade(c, x + 16, y + 13.5, 15, 2);
    rr(c, x + 3.5, y + 9, 2, 4.5, 1, C.brown); rr(c, x + 26.5, y + 9, 2, 4.5, 1, C.brown);
    rr(c, x + 1, y + 1.5, 30, 4.2, 2, '#d9a873'); rr(c, x + 1, y + 6.5, 30, 3.6, 1.8, '#e9c48e');
  },
};

const STATIC = [];
BUILDINGS.forEach(b => STATIC.push({ sy: (b.y + b.h) * T, x0: b.x * T - 40, x1: (b.x + b.w) * T + 40, y0: b.y * T - 60, draw: (c, time) => drawBuilding(c, b, time) }));
TREES.forEach(tr => STATIC.push({ sy: (tr.ty + 1) * T, x0: tr.tx * T - 8, x1: tr.tx * T + 24, y0: tr.ty * T - 28, draw: (c, time) => drawTree(c, tr, time) }));
OBJECTS.forEach(o => STATIC.push({ sy: (o.ty + o.fh) * T, x0: o.tx * T - 10, x1: (o.tx + o.fw) * T + 10, y0: o.ty * T - 60, draw: (c, time) => OBJ[o.kind](c, o.tx * T, o.ty * T, time) }));
const FLIES = Array.from({ length: 9 }, (_, i) => ({ x: (5 + hash(i, 1, 90) * 36) * T, y: (6 + hash(i, 2, 91) * 22) * T, p: hash(i, 3, 92) * 9, col: ['#fff', '#ffd166', '#f590b2', '#b79cf5'][i % 4] }));
const FISHES = [[33, 30.6, 34], [40, 33, 44], [10, 33, 50], [45, 12, 0], [45, 24, 0], [1, 18, 0], [22, 33, 60], [28.5, 30.2, 8]].map(([fx, fy, span], i) => ({ x: fx * T, y: fy * T, span, p: i * 1.7, vert: span === 0 }));
const puffs = [], floaters = [];

/* ------------------------------------------------------------------ player / dog */
const player = { x: 21 * T + 8, y: 18 * T + 10, dir: 'down', moving: false, anim: 0 };
const dog = { x: player.x - 16, y: player.y + 2, f: 1, anim: 0, moving: false };
const trail = [];
for (let i = 0; i < 16; i++) trail.push({ x: player.x - 16 + i, y: player.y + 2 });
let path = null, autoAct = null, digging = null, fishing = null;
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
const playerTile = () => [Math.floor(player.x / T), Math.floor((player.y - 2) / T)];
function walkTo(tx, ty, then) {
  const [sx, sy] = playerTile();
  const p = findPath(sx, sy, tx, ty);
  if (!p) return false;
  fishing = null; path = p; autoAct = then || null;
  if (!p.length && then) { autoAct = null; then(); }
  return true;
}
const visitSpot = s => walkTo(s.trig[0], s.trig[1], () => { faceSpot(s); openSpot(s); });
function nearestFree(tx, ty) {
  for (let r = 0; r <= 5; r++) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || tileSolid(tx + dx, ty + dy)) continue;
      const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = [tx + dx, ty + dy]; }
    }
    if (best) return best;
  }
  return null;
}
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
function waterDir() {
  const [tx, ty] = playerTile();
  for (const k of [player.dir, 'down', 'left', 'right', 'up']) { const [dx, dy] = DIRS[k]; if (at(tx + dx, ty + dy) === W) return k; }
  return null;
}

/* ------------------------------------------------------------------ canvas / camera */
const canvas = $('game'), ctx = canvas.getContext('2d');
let zoom = 3, dpr = 1, vw = 0, vh = 0;
const cam = { x: 0, y: 0 };
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cw = window.innerWidth, ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  const zc = Math.max(2.3, Math.min(5.5, Math.min(cw / (T * 18), ch / (T * 11))));
  zoom = zc * dpr; vw = canvas.width / zoom; vh = canvas.height / zoom;
}
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ update */
let started = false, action = null, actionKey = '', time = 0;
const SPEED = 78;
const cardEl = $('card');
const paused = () => !started || cardEl.open;
function currentAction() {
  if (digging) return null;
  if (fishing) return { type: 'fish' };
  let best = null, bd = 20;
  for (const s of SPOTS) { const dist = Math.hypot(s.trig[0] * T + 8 - player.x, s.trig[1] * T + 10 - player.y); if (dist < bd) { bd = dist; best = s; } }
  if (best) return { type: 'spot', spot: best };
  for (const g of DIGS) if (!dug.has(g.i) && Math.hypot(g.x - player.x, g.y - player.y) < 13) return { type: 'dig', dig: g };
  if (waterDir()) return { type: 'fish' };
  return null;
}
function update(dt) {
  time += dt;
  let mx = 0, my = 0;
  if (!paused() && !digging) {
    if (keys.has('left')) mx -= 1; if (keys.has('right')) mx += 1;
    if (keys.has('up')) my -= 1; if (keys.has('down')) my += 1;
  }
  const px = player.x, py = player.y;
  if (mx || my) {
    path = null; autoAct = null; fishing = null;
    const len = Math.hypot(mx, my), sx = mx / len * SPEED * dt, sy = my / len * SPEED * dt;
    if (!blocked(player.x + sx, player.y)) player.x += sx;
    if (!blocked(player.x, player.y + sy)) player.y += sy;
    player.dir = Math.abs(mx) >= Math.abs(my) && mx ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
  } else if (path && !paused() && !digging) {
    let step = SPEED * dt;
    while (path && path.length && step > 0) {
      const n = path[0], dx = n.x - player.x, dy = n.y - player.y, dist = Math.hypot(dx, dy);
      if (dist <= step) { player.x = n.x; player.y = n.y; step -= dist; path.shift(); }
      else {
        player.x += dx / dist * step; player.y += dy / dist * step; step = 0;
        player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      }
    }
    if (path && !path.length) { path = null; if (autoAct) { const f = autoAct; autoAct = null; f(); } }
  }
  const moved = Math.hypot(player.x - px, player.y - py);
  player.moving = moved > 0.01;
  player.anim = player.moving ? player.anim + dt : 0;
  if (player.moving) {
    const last = trail[trail.length - 1];
    if (Math.hypot(player.x - last.x, player.y - last.y) >= 1) { trail.push({ x: player.x, y: player.y }); if (trail.length > 18) trail.shift(); }
    hideSay();
  }
  const target = trail[0], ddx = target.x - dog.x, ddy = target.y - dog.y, dd = Math.hypot(ddx, ddy);
  dog.moving = dd > 0.6;
  if (dog.moving) {
    const s = Math.min(dd, SPEED * 1.15 * dt);
    dog.x += ddx / dd * s; dog.y += ddy / dd * s;
    if (Math.abs(ddx) > 0.2) dog.f = ddx < 0 ? -1 : 1;
    dog.anim += dt;
  } else { dog.anim = 0; if (Math.abs(player.x - dog.x) > 4) dog.f = player.x < dog.x ? -1 : 1; }

  if (digging) {
    digging.t += dt;
    if (digging.t > 0.25 && !digging.puffed) { digging.puffed = true; for (let k = 0; k < 7; k++) puffs.push({ x: digging.g.x, y: digging.g.y, vx: (hash(k, 1, 99) - 0.5) * 34, vy: -18 - hash(k, 2, 99) * 22, t: 0 }); }
    if (digging.t > 0.75) { const g = digging.g; digging = null; dug.add(g.i); store.set('dug', [...dug]); showItem('dig', g.i, true); }
  }
  if (fishing && !cardEl.open) {
    fishing.t += dt;
    if (fishing.phase === 'wait' && fishing.t > fishing.biteAt) { fishing.phase = 'bite'; fishing.t = 0; floaters.push({ x: fishing.bx, y: fishing.by - 6, text: '!', col: '#f0766a', t: 0 }); }
    else if (fishing.phase === 'bite' && fishing.t > 1.2) { fishing = null; toast(esc(t().missed), 1800); }
  }
  for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; if (p.t > 0.6) puffs.splice(i, 1); }
  for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 1.4) floaters.splice(i, 1); }

  action = paused() ? null : currentAction();
  const key = !action ? '' : action.type + (action.spot ? action.spot.id : '') + (action.dig ? action.dig.i : '') + (fishing ? fishing.phase : '') + lang;
  if (key !== actionKey) { actionKey = key; renderPrompt(); }

  cam.x = MW * T <= vw ? (MW * T - vw) / 2 : Math.max(0, Math.min(MW * T - vw, player.x - vw / 2));
  cam.y = MH * T <= vh ? (MH * T - vh) / 2 : Math.max(0, Math.min(MH * T - vh, player.y - 8 - vh / 2));
}
function faceSpot(s) {
  const dx = s.hit.x + s.hit.w / 2 - player.x, dy = s.hit.y + s.hit.h - player.y;
  player.dir = Math.abs(dx) > Math.abs(dy) + 8 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
function act() {
  if (!action) return;
  if (action.type === 'spot') return openSpot(action.spot);
  if (action.type === 'dig') { path = null; digging = { g: action.dig, t: 0 }; player.dir = 'down'; return; }
  if (action.type === 'fish') {
    if (!fishing) {
      const k = waterDir(); if (!k) return;
      player.dir = k; path = null;
      const [dx, dy] = DIRS[k], [tx, ty] = playerTile(), far = at(tx + dx * 2, ty + dy * 2) === W ? 1.9 : 1.15;
      fishing = { phase: 'wait', t: 0, biteAt: 1.3 + Math.random() * 2.6, bx: tx * T + 8 + dx * T * far, by: ty * T + 9 + dy * T * far };
    } else if (fishing.phase === 'wait') { fishing = null; toast(esc(t().early), 1800); }
    else {
      fishing = null;
      const left = EX.fish.map((_, i) => i).filter(i => !caught.has(i));
      if (left.length) { const i = left[Math.floor(Math.random() * left.length)]; caught.add(i); store.set('caught', [...caught]); showItem('fish', i, true); }
      else showItem('fish', Math.floor(Math.random() * EX.fish.length), false);
    }
  }
}

/* ------------------------------------------------------------------ render */
const FONT = '"Nunito","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
function nextStop() {
  const r = persona && EX.routes[persona].stops;
  return r ? spotById[r.find(id => !found.has(id))] || null : null;
}
function render() {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = C.water; c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(zoom, 0, 0, zoom, -cam.x * zoom, -cam.y * zoom);
  c.imageSmoothingEnabled = true;
  c.drawImage(ground, 0, 0, MW * T, MH * T);

  const tx0 = Math.max(0, Math.floor(cam.x / T)), tx1 = Math.min(MW - 1, Math.floor((cam.x + vw) / T));
  const ty0 = Math.max(0, Math.floor(cam.y / T)), ty1 = Math.min(MH - 1, Math.floor((cam.y + vh) / T));
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.9; c.lineCap = 'round';
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    if (map[I(x, y)] !== W || hash(x, y, 13) > 0.3) continue;
    const ph = reduceMotion ? 0.5 : (time * 0.35 + hash(x, y, 14) * 5) % 2;
    if (ph > 1) continue;
    const wx = x * T + 3 + ph * 5, wy = y * T + 5 + hash(x, y, 15) * 7;
    c.globalAlpha = Math.sin(ph * Math.PI);
    c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 2, wy - 1.6, wx + 4, wy); c.quadraticCurveTo(wx + 6, wy + 1.6, wx + 8, wy); c.stroke();
  }
  c.globalAlpha = 1;
  for (const f of FISHES) {
    const k = reduceMotion ? 0 : Math.sin(time * 0.45 + f.p), dir = reduceMotion ? 1 : Math.cos(time * 0.45 + f.p) >= 0 ? 1 : -1;
    const fx = f.x + (f.vert ? 0 : k * f.span), fy = f.y + (f.vert ? k * 40 : Math.sin(time + f.p) * 1.5);
    c.save(); c.translate(fx, fy); if (f.vert) c.rotate(Math.PI / 2); c.scale(dir, 1);
    el(c, 0, 0, 5, 2.2, 'rgba(40,100,140,.38)'); poly(c, [[-4, 0], [-8, -2.4], [-8, 2.4]], 'rgba(40,100,140,.38)');
    c.restore();
  }

  for (const g of DIGS) {
    if (g.x < cam.x - 20 || g.x > cam.x + vw + 20 || g.y < cam.y - 20 || g.y > cam.y + vh + 20) continue;
    if (dug.has(g.i)) { el(c, g.x, g.y + 1, 5, 2.6, '#c9a57a'); el(c, g.x, g.y + 1.4, 3.4, 1.6, '#a98560'); continue; }
    el(c, g.x, g.y + 1.5, 6, 3, '#c9a57a'); el(c, g.x - 1, g.y + 0.6, 3.6, 1.8, '#dbbd94');
    const tw = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(time * 4 + g.i);
    c.globalAlpha = tw; star(c, g.x + 3, g.y - 5 - tw, 2.6, '#fff6c9', time * 0.6); star(c, g.x - 4, g.y - 2, 1.5, '#ffe27a', -time * 0.5); c.globalAlpha = 1;
  }

  const list = [];
  for (const e of STATIC) if (e.x1 > cam.x && e.x0 < cam.x + vw && e.sy > cam.y - 8 && e.y0 < cam.y + vh) list.push(e);
  list.push({ sy: player.y, draw: drawPlayer }, { sy: dog.y - 0.5, draw: drawDog });
  list.sort((a, b) => a.sy - b.sy);
  for (const e of list) e.draw(c, time);

  for (const p of puffs) { c.globalAlpha = 1 - p.t / 0.6; ci(c, p.x, p.y, 1.8, '#b98f66'); }
  c.globalAlpha = 1;
  if (fishing) {
    const dip = fishing.phase === 'bite' ? 1.6 + Math.sin(time * 30) * 0.8 : Math.sin(time * 3) * 0.5;
    const hx = player.x + (player.dir === 'left' ? -9 : player.dir === 'right' ? 9 : 3), hy = player.y - 19;
    c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + fishing.bx) / 2, Math.min(hy, fishing.by) - 3, fishing.bx, fishing.by + dip - 2); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.5; c.stroke();
    c.beginPath(); c.ellipse(fishing.bx, fishing.by + 1, 4 + (reduceMotion ? 0 : (time * 3 % 3)), 1.6, 0, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.6; c.stroke();
    ci(c, fishing.bx, fishing.by + dip, 2, '#f0766a'); c.beginPath(); c.arc(fishing.bx, fishing.by + dip, 2, Math.PI, 0); c.fillStyle = '#fff'; c.fill();
  }
  if (!reduceMotion) for (const f of FLIES) {
    const fx = f.x + Math.sin(time * 0.5 + f.p) * 22, fy = f.y + Math.cos(time * 0.37 + f.p * 2) * 14 + Math.sin(time * 6 + f.p) * 1.2;
    const fl = Math.abs(Math.sin(time * 11 + f.p));
    el(c, fx - 1.2, fy, 1.5 * fl + 0.3, 1.5, f.col); el(c, fx + 1.2, fy, 1.5 * fl + 0.3, 1.5, f.col);
  }

  const nxt = nextStop();
  c.textBaseline = 'middle';
  for (const s of SPOTS) {
    const a = s.anchor;
    if (a.x < cam.x - 60 || a.x > cam.x + vw + 60 || a.y < cam.y - 30 || a.y > cam.y + vh + 20) continue;
    const isA = action && action.spot === s, has = found.has(s.id), text = s.name[lang], isN = s === nxt;
    c.font = `800 6.4px ${FONT}`;
    const w = Math.ceil(c.measureText(text).width) + 19, lx = a.x - w / 2;
    const ly = a.y - 6 + ((!has || isN) && !reduceMotion ? Math.sin(time * 3 + a.x) * 1.4 : 0);
    rr(c, lx - 0.4, ly + 1.2, w + 0.8, 12, 6, 'rgba(107,79,58,.22)');
    rr(c, lx, ly, w, 12, 6, isA ? '#fff1b8' : C.cream);
    ci(c, lx + 6, ly + 6, 4.4, has ? '#ffcf4d' : isN ? '#5fbf7f' : '#f590b2');
    if (has) star(c, lx + 6, ly + 6.2, 2.5, '#fff');
    else { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `900 6.2px ${FONT}`; c.fillText(isN ? '!' : '?', lx + 6, ly + 6.5); }
    c.textAlign = 'left'; c.fillStyle = C.ink; c.font = `800 6.4px ${FONT}`;
    c.fillText(text, lx + 13, ly + 6.5);
  }
  if (nxt && started && !cardEl.open) {
    const tx = nxt.trig[0] * T + 8, ty = nxt.trig[1] * T + 10, dist = Math.hypot(tx - player.x, ty - player.y);
    if (dist > 40) {
      const a = Math.atan2(ty - player.y, tx - player.x), r = 15 + (reduceMotion ? 0 : Math.sin(time * 5) * 1.5), ax = player.x + Math.cos(a) * r, ay = player.y - 9 + Math.sin(a) * r;
      c.save(); c.translate(ax, ay); c.rotate(a); poly(c, [[4, 0], [-2.5, -3.2], [-2.5, 3.2]], '#fff', 2.4); poly(c, [[4, 0], [-2.5, -3.2], [-2.5, 3.2]], '#5fbf7f', 0.8); c.restore();
    }
  }
  c.textAlign = 'center';
  for (const f of floaters) {
    c.globalAlpha = Math.max(0, 1 - f.t / 1.4); c.font = `900 9px ${FONT}`;
    c.lineWidth = 2; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.strokeText(f.text, f.x, f.y - f.t * 14);
    c.fillStyle = f.col; c.fillText(f.text, f.x, f.y - f.t * 14);
  }
  c.globalAlpha = 1;
  if (path && path.length) { const g = path[path.length - 1], k = reduceMotion ? 0 : Math.sin(time * 8) * 0.8; c.beginPath(); c.ellipse(g.x, g.y, 4.5 + k, 2.2 + k * 0.5, 0, 0, TAU); c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke(); }
}
function drawPlayer(c, time) {
  const x = player.x, y = player.y, dir = player.dir, side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const sw = player.moving ? Math.sin(player.anim * 15) : 0, bob = player.moving ? Math.abs(sw) * 0.8 : (reduceMotion ? 0 : Math.sin(time * 2.2) * 0.25);
  const dg = digging ? Math.sin(Math.min(1, digging.t / 0.75) * Math.PI * 3) : 0;
  const HAIR = '#5a3f36', SKIN = '#ffe0c4', TOP = '#f590b2', TOPD = '#e87aa0';
  shade(c, x, y + 0.6, 5.2, 1.9);
  const hy = y - 13.6 - bob;
  if (dir !== 'up') rr(c, x - 5.6 - side * 1.6, hy - 4.4, 11.2, 13.5, 5.4, HAIR);
  el(c, x - 2.1 + side * sw * 1.6, y - 0.9 - Math.max(0, sw) * 1.4, 1.9, 1.4, '#7a5a44');
  el(c, x + 2.1 - side * sw * 1.6, y - 0.9 - Math.max(0, -sw) * 1.4, 1.9, 1.4, '#7a5a44');
  c.beginPath(); c.moveTo(x - 3, y - 8.6 - bob); c.lineTo(x + 3, y - 8.6 - bob); c.lineTo(x + 4.4, y - 2 - bob * 0.5); c.quadraticCurveTo(x, y - 0.8, x - 4.4, y - 2 - bob * 0.5); c.closePath(); c.fillStyle = TOP; c.fill();
  rr(c, x - 4.2, y - 3.4 - bob * 0.5, 8.4, 1.4, 0.7, TOPD);
  if (!side) { ci(c, x - 4.4, y - 5.6 - bob + sw * 0.8, 1.3, SKIN); ci(c, x + 4.4, y - 5.6 - bob - sw * 0.8 + dg * 1.5, 1.3, SKIN); }
  else ci(c, x + side * (0.5 + sw * 1.6), y - 5.4 - bob + dg, 1.3, SKIN);
  ci(c, x, hy, 5.4, SKIN);
  if (dir === 'up') { ci(c, x, hy - 0.2, 5.7, HAIR); rr(c, x - 5.6, hy - 1, 11.2, 9.5, [0, 0, 5, 5], HAIR); }
  else {
    c.beginPath(); c.arc(x, hy - 0.4, 5.6, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(x + side + 0.5, hy - 2.6, x - 5.5, hy - 0.1); c.closePath(); c.fillStyle = HAIR; c.fill();
    if (side) { rr(c, x - side * 5.9 - (side > 0 ? 0 : 3.4), hy - 3, 3.4, 9, 1.7, HAIR); el(c, x + side * 2.6, hy + 0.8, 0.75, 1.1, '#4a3530'); ci(c, x + side * 3.4, hy + 2.6, 1, 'rgba(245,144,178,.55)'); }
    else { el(c, x - 2.1, hy + 0.8, 0.75, 1.1, '#4a3530'); el(c, x + 2.1, hy + 0.8, 0.75, 1.1, '#4a3530'); ci(c, x - 3.4, hy + 2.5, 1, 'rgba(245,144,178,.55)'); ci(c, x + 3.4, hy + 2.5, 1, 'rgba(245,144,178,.55)'); c.beginPath(); c.arc(x, hy + 2.3, 0.9, 0.15, Math.PI - 0.15); c.strokeStyle = '#c9584e'; c.lineWidth = 0.45; c.lineCap = 'round'; c.stroke(); }
  }
  if (digging) { c.save(); c.translate(x + 5, y - 6 + dg * 2.4); c.rotate(0.5 + dg * 0.35); rr(c, -0.6, -6, 1.3, 9, 0.6, C.trunk); rr(c, -2.2, 2, 4.4, 4.4, [0.6, 0.6, 2.2, 2.2], '#b9c2cc'); c.restore(); }
  if (fishing) { const hx = x + (dir === 'left' ? -9 : dir === 'right' ? 9 : 3); line(c, x + (side || 1) * 3.5, y - 6, hx, y - 19, C.brown, 0.9); }
}
function drawDog(c, time) {
  const sw = dog.moving ? Math.sin(dog.anim * 18) : 0, x = dog.x, y = dog.y;
  shade(c, x, y + 0.6, 7, 2.1);
  c.save(); c.translate(x, y); c.scale(dog.f, 1);
  c.shadowColor = 'rgba(96,110,150,.55)'; c.shadowBlur = zoom * 0.5;
  const wag = reduceMotion ? 0 : Math.sin(time * (dog.moving ? 14 : 8)) * 0.9;
  ci(c, -6.4 + wag * 0.4, -8.6, 2.9, '#fff'); ci(c, -7.6 + wag, -10.6, 2.2, '#fff');
  rr(c, -4.6, -3.2 - Math.max(0, sw) * 1.2, 2.3, 3.6, 1.1, '#f2f3f8'); rr(c, 2.6, -3.2 - Math.max(0, -sw) * 1.2, 2.3, 3.6, 1.1, '#f2f3f8');
  rr(c, -2.2, -3.2 - Math.max(0, -sw) * 1.2, 2.3, 3.6, 1.1, '#fff'); rr(c, 4.6, -3.2 - Math.max(0, sw) * 1.2, 2.3, 3.6, 1.1, '#fff');
  el(c, 0, -6.2, 6.6, 4.3, '#fff'); ci(c, 4.4, -6.8, 3.9, '#fff');
  poly(c, [[3.6, -13.4], [4.8, -17], [6.6, -13.8]], '#fff', 1.2); poly(c, [[7, -13.8], [8.8, -16.6], [9.6, -13]], '#fff', 1.2);
  ci(c, 6.4, -10.8, 4.3, '#fff'); el(c, 9.2, -9.5, 2.3, 1.8, '#fff');
  c.shadowBlur = 0; c.shadowColor = 'transparent';
  poly(c, [[4.5, -14], [5, -15.6], [5.8, -14.1]], '#ffc9d6'); ci(c, 10.8, -10, 0.85, '#4a4458'); ci(c, 7.5, -11.4, 0.75, '#4a4458');
  c.beginPath(); c.arc(9.4, -9.2, 1.1, 0.2, Math.PI * 0.9); c.strokeStyle = '#4a4458'; c.lineWidth = 0.4; c.lineCap = 'round'; c.stroke();
  if (!dog.moving) el(c, 9.5, -7.7, 0.75, 1.05, '#ff9db8');
  c.restore();
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
let reopen = null, pendingToast = null, toastTimer = 0;
function showCard(kicker, title, meta, body, cls, again) {
  $('cardKicker').textContent = kicker; $('cardTitle').textContent = title; $('cardMeta').textContent = meta;
  $('cardBody').innerHTML = body; $('cardBody').scrollTop = 0;
  cardEl.className = 'card ' + (cls || '');
  reopen = again;
  hideSay();
  if (!cardEl.open) cardEl.showModal();
  keys.clear();
}
function openSpot(s) {
  const k = content(s);
  showCard(t().kick[s.kind], k.title, k.meta, k.body, '', () => openSpot(s));
  if (!found.has(s.id)) {
    found.add(s.id); store.set('found', [...found]);
    floaters.push({ x: dog.x, y: dog.y - 16, text: '♥', col: '#f590b2', t: 0 }, { x: s.anchor.x, y: s.anchor.y - 8, text: '+★', col: '#f5a623', t: 0 });
    const r = persona && EX.routes[persona].stops;
    if (found.size === SPOTS.length) pendingToast = 'all';
    else if (r && !routeToasted && r.every(id => found.has(id))) { pendingToast = 'route'; routeToasted = true; store.set('routeDone', true); }
    else pendingToast = 'star';
    renderHud();
  }
}
function showItem(kind, i, isNew) {
  const it = EX[kind][i], u = t(), [name, text] = it[lang];
  showCard(kind === 'dig' ? u.dugTitle : u.fishTitle, name, isNew ? '' : u.again,
    `<div class="item-big" aria-hidden="true">${it.icon}</div><p class="lead center">${esc(text)}</p>` +
    (it.cta ? `<div class="links center"><a class="btn btn-main" href="mailto:${esc(d().mail)}">${esc(u.writeMe)} ✉</a></div>` : '') +
    `<p class="caption center">🎒 ${itemCount()}/${itemTotal}</p>`, 'mini', () => showItem(kind, i, isNew));
  if (isNew) { floaters.push({ x: dog.x, y: dog.y - 16, text: '♥', col: '#f590b2', t: 0 }); renderHud(); }
}
function openBag() {
  const u = t();
  const grid = (kind, set) => `<div class="bag-grid">${EX[kind].map((it, i) => set.has(i)
    ? `<button class="slot" data-kind="${kind}" data-i="${i}"><span>${it.icon}</span><small>${esc(it[lang][0])}</small></button>`
    : `<div class="slot empty"><span>?</span><small>${esc(u.unknown)}</small></div>`).join('')}</div>`;
  const routes = Object.entries(EX.routes).map(([id, r]) => {
    const done = r.stops ? r.stops.filter(s => found.has(s)).length : 0;
    return `<button class="route${persona === id ? ' on' : ''}" data-route="${id}"><span>${r.icon}</span><b>${esc(r[lang][0])}</b><small>${esc(r[lang][1])}${r.stops ? ` · ${done}/${r.stops.length}` : ''}</small></button>`;
  }).join('');
  const N = EX.notes[lang];
  showCard(`🎒 ${itemCount()}/${itemTotal} · ★ ${found.size}/${SPOTS.length}`, u.bagTitle, u.bagMeta,
    `<h3>${esc(u.route)}</h3><div class="routes">${routes}</div>
     <h3>${esc(u.treasures)} · ${dug.size}/${EX.dig.length}</h3>${grid('dig', dug)}
     <h3>${esc(u.catches)} · ${caught.size}/${EX.fish.length}</h3>${grid('fish', caught)}
     <p class="caption">${esc(u.toolsText)}</p>
     <details class="notes"><summary>${esc(N[0])}</summary><div class="rows">${N[1].map((n, i) => `<div class="row"><small>0${i + 1}</small><b>${esc(n[0])}</b><span>${esc(n[1])}</span></div>`).join('')}</div></details>`, '', openBag);
}
$('cardBody').addEventListener('click', e => {
  const slot = e.target.closest('.slot[data-kind]'), route = e.target.closest('.route');
  if (slot) showItem(slot.dataset.kind, +slot.dataset.i, true);
  if (route) { setPersona(route.dataset.route); openBag(); }
});
function openQuick() {
  const u = t();
  const group = (title, ids) => `<section class="qv-sec"><h3>${esc(title)}</h3>${ids.map(id => {
    const k = content(spotById[id]);
    return `<div class="qv-item">${ids.length === 1 ? '' : `<h4>${esc(k.title)}</h4>`}<p class="card-meta">${esc(k.meta)}</p>${k.body}</div>`;
  }).join('')}</section>`;
  showCard(u.quickKicker, d().name, d().place,
    group(u.aboutTitle, ['about']) + group(u.sec.exp, ['monolith', 'manus', 'crossing', 'linear', 'waves']) +
    group(u.sec.work, ['orbit', 'sync', 'agent', 'wavo', 'odyssey']) + group(u.sec.focus, ['focus']) +
    group(u.sec.edu, ['edu']) + group(u.sec.skills, ['skills']) + group(u.sec.life, ['life']) + group(u.sec.contact, ['contact']), 'wide', openQuick);
}
function toast(html, ms) {
  const e = $('toast'); e.innerHTML = html; e.hidden = false;
  clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => { e.hidden = true; }, ms);
}
cardEl.addEventListener('close', () => {
  reopen = null; keys.clear();
  if (pendingToast === 'all' || pendingToast === 'route') {
    toast(`<span>✨ <b>${esc(pendingToast === 'all' ? t().allDone : t().routeDone)}</b></span><button class="btn" id="toastHi">${esc(t().sayHi)}</button>`, 12000);
    $('toastHi').onclick = () => { $('toast').hidden = true; openSpot(spotById.contact); };
  } else if (pendingToast === 'star') toast(`<span>★ <b>${esc(t().newStar)}</b> · ${found.size}/${SPOTS.length}</span>`, 2200);
  pendingToast = null;
});
cardEl.addEventListener('click', e => { if (e.target === cardEl) cardEl.close(); });
$('cardClose').onclick = () => cardEl.close();

/* ------------------------------------------------------------------ HUD / intro */
const touch = matchMedia('(pointer: coarse)').matches;
function renderPrompt() {
  const e = $('prompt'), u = t();
  if (!action || !started) { e.hidden = true; return; }
  let label = '', cls = '';
  if (action.type === 'spot') label = `${u.visit} · ${action.spot.name[lang]}`;
  else if (action.type === 'dig') label = `⛏ ${u.dig}`;
  else if (!fishing) label = `🎣 ${u.fish}`;
  else if (fishing.phase === 'wait') { label = `🎣 ${u.wait}`; cls = 'calm'; }
  else { label = `❗ ${u.pull}`; cls = 'hot'; }
  e.className = 'prompt ' + cls;
  e.innerHTML = `${touch || cls === 'calm' ? '' : '<kbd>E</kbd>'}${esc(label)}`;
  e.hidden = false;
}
function renderQuest() {
  const e = $('quest'), u = t();
  if (!started || !persona) { e.hidden = true; return; }
  const r = EX.routes[persona];
  if (!r.stops) e.innerHTML = `${r.icon} ⛏ ${dug.size}/${EX.dig.length} · 🎣 ${caught.size}/${EX.fish.length}`;
  else {
    const n = nextStop(), done = r.stops.filter(s => found.has(s)).length;
    e.innerHTML = n ? `${r.icon} ${done}/${r.stops.length} · ${esc(u.nextStop)}: <b>${esc(n.name[lang])}</b> ➜` : `✓ ${esc(u.routeOk)}`;
  }
  e.hidden = false;
}
function renderHud() {
  const u = t();
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $('hudName').textContent = d().name;
  $('hudCount').textContent = `★ ${found.size}/${SPOTS.length}`;
  $('btnBag').innerHTML = `🎒 <span>${itemCount()}/${itemTotal}</span>`; $('btnBag').setAttribute('aria-label', u.bag);
  $('btnQuick').textContent = u.quick; $('btnQuick2').textContent = u.quick;
  $('btnCv').textContent = u.cv; $('btnCv').href = lang === 'zh' ? 'assets/Nan_Yao_Resume_CN.pdf' : 'assets/Nan_Yao_Resume_EN.pdf';
  $('btnLang').textContent = u.lang; $('btnLang2').textContent = u.lang;
  $('introKicker').textContent = u.kicker; $('introSub').textContent = u.sub;
  $('introHint').textContent = touch ? u.hintTouch : u.hint;
  $('introRoutes').innerHTML = Object.entries(EX.routes).map(([id, r]) => `<button class="route" data-route="${id}"><span>${r.icon}</span><b>${esc(r[lang][0])}</b><small>${esc(r[lang][1])}</small></button>`).join('');
  $('sayName').textContent = u.speaker; $('sayMore').textContent = u.next;
  renderPrompt(); renderQuest();
}
function setPersona(id) {
  persona = id; store.set('persona', id);
  const r = EX.routes[id].stops;
  routeToasted = !!r && r.every(s => found.has(s)); store.set('routeDone', routeToasted);
  renderQuest();
}
function setLang() {
  lang = lang === 'en' ? 'zh' : 'en'; store.set('lang', lang);
  renderHud();
  if (!$('say').hidden) say(t().hello, true);
  if (cardEl.open && reopen) reopen();
}
let sayTimer = 0;
function say(text, instant) {
  const e = $('say'), p = $('sayText');
  e.hidden = false; clearInterval(sayTimer);
  if (instant || reduceMotion) { p.textContent = text; return; }
  let i = 0; p.textContent = '';
  sayTimer = setInterval(() => { i += 2; p.textContent = text.slice(0, i); if (i >= text.length) clearInterval(sayTimer); }, 22);
}
function hideSay() { if (!$('say').hidden) { $('say').hidden = true; clearInterval(sayTimer); renderPrompt(); } }
function start(id) {
  if (started) return;
  setPersona(id || persona || 'explorer');
  started = true; $('intro').hidden = true;
  renderQuest(); say(t().hello);
}
$('introRoutes').addEventListener('click', e => { const b = e.target.closest('.route'); if (b) start(b.dataset.route); });
$('btnQuick').onclick = openQuick; $('btnQuick2').onclick = openQuick;
$('btnBag').onclick = openBag;
$('btnLang').onclick = setLang; $('btnLang2').onclick = setLang;
$('say').onclick = hideSay;
$('prompt').onclick = act;
$('quest').onclick = () => { const n = nextStop(); if (n) visitSpot(n); else if (EX.routes[persona].stops) openSpot(spotById.contact); else openBag(); };

/* ------------------------------------------------------------------ input */
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || cardEl.open || !started) return;
  const onButton = e.target instanceof HTMLElement && e.target.closest('button, a, summary');
  if (KEYMAP[e.key]) { keys.add(KEYMAP[e.key]); e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return; }
  if ((e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') && !onButton) {
    e.preventDefault();
    if (!$('say').hidden) { hideSay(); return; }
    if (!e.repeat) act();
  }
});
addEventListener('keyup', e => { if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]); });
addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', e => {
  if (paused() || digging) return;
  hideSay();
  const r = canvas.getBoundingClientRect();
  const wx = cam.x + (e.clientX - r.left) * dpr / zoom, wy = cam.y + (e.clientY - r.top) * dpr / zoom;
  const hit = SPOTS.find(s => wx >= s.hit.x && wx <= s.hit.x + s.hit.w && wy >= s.hit.y && wy <= s.hit.y + s.hit.h) ||
    SPOTS.find(s => Math.abs(wx - s.anchor.x) < 40 && Math.abs(wy - s.anchor.y) < 9);
  if (hit) { visitSpot(hit); return; }
  const g = DIGS.find(g => !dug.has(g.i) && Math.hypot(g.x - wx, g.y - wy) < 11);
  if (g) { walkTo(g.tx, g.ty, () => { action = currentAction(); if (action && action.type === 'dig') act(); }); return; }
  if (fishing) { act(); return; }
  const free = nearestFree(Math.floor(wx / T), Math.floor(wy / T));
  if (free) walkTo(free[0], free[1]);
});

/* ------------------------------------------------------------------ boot */
SPOTS.forEach(s => { if (!findPath(21, 18, s.trig[0], s.trig[1])) console.warn('Unreachable spot:', s.id); });
DIGS.forEach(g => { if (!findPath(21, 18, g.tx, g.ty)) console.warn('Unreachable dig spot:', g.i); });
renderHud();
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  update(dt); render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (document.fonts && document.fonts.load) document.fonts.load(`800 7px "Nunito"`).catch(() => {});

// small hook for testing from the console
window.__town = { player, SPOTS, DIGS, walkTo, openSpot, act, start, found, get fishing() { return fishing; }, get action() { return action; } };
})();
