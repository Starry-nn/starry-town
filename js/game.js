/* Starry Town — a walkable portfolio island. The rules live here; view3d.js draws the picture. */
import { createView } from './view3d.js';
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
    visit: 'Visit', talk: 'Talk to', movedIn: 'just moved to the island! Go say hi.', neighbours: 'Residents', lockedRes: 'Moves in after {n} finds', no3d: 'This browser cannot show the 3D island, so here is everything on one page.', dig: 'Dig here', fish: 'Go fishing', wait: 'Waiting for a bite…', pull: 'Pull!',
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
    visit: '拜访', talk: '聊聊', movedIn: '搬到岛上来了！去打个招呼吧。', neighbours: '居民', lockedRes: '找到 {n} 样东西后搬来', no3d: '这个浏览器显示不了 3D 小岛，所以把全部内容放在这一页。', dig: '挖一挖', fish: '钓鱼', wait: '等鱼上钩…', pull: '拉！',
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
  const s = spotById[b.id], tall = b.h >= 5, dp = Math.max(2.3, b.h - 1.5);
  const top = b.kind === 'tower' ? b.y - 1.5 : b.kind === 'dome' ? b.y : b.y + b.h - dp / 2 - (tall ? 3.8 : 3.2);
  s.hit = { x: b.x * T, y: top * T, w: b.w * T, h: (b.y + b.h - top) * T };
  s.lab = { x: (b.x + (b.kind === 'house' || b.kind === 'campus' ? b.door + 0.5 : b.w / 2)) * T, y: (b.y + b.h) * T - 3, h: b.kind === 'tower' ? 2.5 : b.kind === 'dome' ? 5.5 : tall ? 5.2 : 4.5 };
});
OBJECTS.forEach(o => {
  rect(o.tx, o.ty, o.fw, o.fh, 1, solid);
  rect(o.tx - 1, o.ty - 2, o.fw + 2, o.fh + 3, 1, reserved);
  if (o.spot) {
    const s = spotById[o.spot];
    const hh = { booth: 2.7, ship: 4.6, doghouse: 2.1, sign: 1.9, scope: 2.0, mailbox: 1.9 }[o.kind] || 2;
    s.hit = { x: o.tx * T, y: (o.ty - hh * 0.8) * T, w: o.fw * T, h: (o.fh + hh * 0.8) * T };
    s.lab = { x: (o.tx + o.fw / 2) * T, y: (o.ty + o.fh / 2) * T, h: Math.min(hh, 3.3) };
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

const FLOWERS = [];
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (flowers[I(x, y)]) FLOWERS.push({ x, y, t: flowers[I(x, y)] });

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
  rr(c, 13 * T + 4, 30 * T + 13.5, 5 * T - 8, 1, 0.5, 'rgba(255,255,255,.75)');
})();

const FISHES = [[33, 30.6, 34], [40, 33, 44], [10, 33, 50], [45, 12, 0], [45, 24, 0], [1, 18, 0], [22, 33, 60], [28.5, 30.2, 8]].map(([fx, fy, span], i) => ({ x: fx * T, y: fy * T, span, p: i * 1.7, vert: span === 0 }));

/* ------------------------------------------------------------------ player / dog */
const player = { x: 21 * T + 8, y: 18 * T + 10, dir: 'down', moving: false, anim: 0 };
const dog = { x: player.x - 16, y: player.y + 2, hx: 1, hy: 0, anim: 0, moving: false, pet: 0 };
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

/* ------------------------------------------------------------------ view + residents */
const canvas = $('game');
const RES = EX.residents.map(def => ({ def, x: def.home[0] * T + 8, y: def.home[1] * T + 10, hx: 0, hy: 1, moving: false, here: false, wait: 1 + Math.random() * 2, tx: null, ty: 0, line: 0 }));
let view = null;
try { view = createView({ MW, MH, hash, reduceMotion, ground, at, D, BUILDINGS, OBJECTS, TREES, DIGS, FISHES, FLOWERS, RESIDENTS: EX.residents }, canvas); }
catch (err) { console.warn('3D view unavailable', err); }
const hour = new Date().getHours() + new Date().getMinutes() / 60;
const askedMode = new URLSearchParams(location.search).get('time');
const mode = ['day', 'dusk', 'night'].includes(askedMode) ? askedMode : hour >= 6.5 && hour < 17 ? 'day' : (hour >= 17 && hour < 19.5) || (hour >= 5 && hour < 6.5) ? 'dusk' : 'night';
document.body.dataset.mode = mode;
if (view) { view.setMode(mode); addEventListener('resize', view.resize); }

let pendingMove = null;
function syncResidents(announce) {
  for (const r of RES) if (!r.here && itemCount() >= r.def.at) { r.here = true; if (announce) pendingMove = r; }
}
function segFree(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
  for (let i = 0; i <= n; i++) if (tileSolid(Math.floor((x0 + (x1 - x0) * i / n) / T), Math.floor((y0 + (y1 - y0) * i / n - 2) / T))) return false;
  return true;
}
function updateResidents(dt) {
  for (const r of RES) {
    if (!r.here) continue;
    const fx = player.x - r.x, fy = player.y - r.y, fl = Math.hypot(fx, fy) || 1;
    if (fl < 26) { r.moving = false; r.hx = fx / fl; r.hy = fy / fl; continue; }
    if (r.tx == null) {
      r.moving = false; r.wait -= dt;
      if (r.wait <= 0) {
        const tx = (r.def.home[0] + Math.round((Math.random() - 0.5) * 4)) * T + 8, ty = (r.def.home[1] + Math.round((Math.random() - 0.5) * 3)) * T + 10;
        if (segFree(r.x, r.y, tx, ty)) { r.tx = tx; r.ty = ty; } else r.wait = 0.5;
      }
    } else {
      const dx = r.tx - r.x, dy = r.ty - r.y, dd = Math.hypot(dx, dy);
      if (dd < 1) { r.tx = null; r.wait = 1.5 + Math.random() * 3.5; }
      else { const st = Math.min(dd, 24 * dt); r.x += dx / dd * st; r.y += dy / dd * st; r.hx = dx / dd; r.hy = dy / dd; r.moving = true; }
    }
  }
}
function talkTo(r) {
  const lines = r.def.lines[lang];
  say(lines[r.line % lines.length], false, r.def.name[lang]); r.line++;
  floatText(r.x, r.y, 1.7, '♪', 'gold');
}
function petDog() {
  dog.pet = 0.9;
  floatText(dog.x, dog.y, 1.3, '♥', 'heart');
}

/* ------------------------------------------------------------------ update */
let started = false, action = null, actionKey = '', time = 0;
const SPEED = 78;
const cardEl = $('card');
const paused = () => !started || cardEl.open;
function currentAction() {
  if (digging) return null;
  if (fishing) return { type: 'fish' };
  let best = null, bd = 20;
  for (const s of SPOTS) { const dist = Math.hypot(s.trig[0] * T + 8 - player.x, s.trig[1] * T + 10 - player.y); if (dist < bd && dist < (s.id === 'odyssey' ? 11 : 20)) { bd = dist; best = s; } }
  if (best) return { type: 'spot', spot: best };
  for (const r of RES) if (r.here && Math.hypot(r.x - player.x, r.y - player.y) < 20) return { type: 'talk', res: r };
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
    dog.hx = ddx / dd; dog.hy = ddy / dd;
    dog.anim += dt;
  } else { dog.anim = 0; const fx = player.x - dog.x, fy = player.y - dog.y, fl = Math.hypot(fx, fy); if (fl > 8) { dog.hx = fx / fl; dog.hy = fy / fl; } }
  if (dog.pet > 0) dog.pet = Math.max(0, dog.pet - dt);
  updateResidents(dt);

  if (digging) {
    digging.t += dt;
    if (digging.t > 0.75) { const g = digging.g; digging = null; dug.add(g.i); store.set('dug', [...dug]); showItem('dig', g.i, true); }
  }
  if (fishing && !cardEl.open) {
    fishing.t += dt;
    if (fishing.phase === 'wait' && fishing.t > fishing.biteAt) { fishing.phase = 'bite'; fishing.t = 0; floatText(fishing.bx, fishing.by, 0.6, '!', 'alert'); }
    else if (fishing.phase === 'bite' && fishing.t > 1.2) { fishing = null; toast(esc(t().missed), 1800); }
  }

  action = paused() ? null : currentAction();
  const key = !action ? '' : action.type + (action.spot ? action.spot.id : '') + (action.dig ? action.dig.i : '') + (action.res ? action.res.def.id : '') + (fishing ? fishing.phase : '') + lang;
  if (key !== actionKey) { actionKey = key; renderPrompt(); }

}
function faceSpot(s) {
  const dx = s.hit.x + s.hit.w / 2 - player.x, dy = s.hit.y + s.hit.h - player.y;
  player.dir = Math.abs(dx) > Math.abs(dy) + 8 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
function act() {
  if (!action) return;
  if (action.type === 'spot') return openSpot(action.spot);
  if (action.type === 'talk') return talkTo(action.res);
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

/* ------------------------------------------------------------------ labels + frame */
function nextStop() {
  const r = persona && EX.routes[persona].stops;
  return r ? spotById[r.find(id => !found.has(id))] || null : null;
}
const labelBox = $('labels'), labels = new Map(), OFF = { ok: false };
function label(id, onClick) {
  let e = labels.get(id);
  if (!e) { e = document.createElement('button'); e.className = 'label'; e.innerHTML = '<i></i><span></span>'; e.onclick = onClick; labelBox.appendChild(e); labels.set(id, e); }
  return e;
}
function place(e, p, text, cls, badge) {
  if (!p.ok) { e.hidden = true; return; }
  e.hidden = false;
  const key = text + '|' + cls + '|' + badge;
  if (e._k !== key) { e._k = key; e.className = 'label ' + cls; e.firstChild.textContent = badge; e.lastChild.textContent = text; }
  e.style.transform = `translate(-50%, -100%) translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
}
function floatText(x, y, h, text, cls) {
  if (!view) return;
  const p = view.project(x, y, h);
  if (!p.ok) return;
  const e = document.createElement('span');
  e.className = 'float ' + (cls || ''); e.textContent = text; e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
  labelBox.appendChild(e); setTimeout(() => e.remove(), 1400);
}
function render(dt) {
  const nxt = started ? nextStop() : null;
  const far = nxt && !cardEl.open && Math.hypot(nxt.trig[0] * T + 8 - player.x, nxt.trig[1] * T + 10 - player.y) > 40;
  view.render({ time, dt, player, dog, digging, fishing, dug, foundRatio: found.size / SPOTS.length, residents: RES,
    target: path && path.length ? path[path.length - 1] : null,
    next: far ? { x: nxt.trig[0] * T + 8, y: nxt.trig[1] * T + 10 } : null });
  for (const s of SPOTS) {
    const has = found.has(s.id), isN = s === nxt, isA = action && action.spot === s;
    place(label(s.id, () => { if (!paused() && !digging) visitSpot(s); }), started ? view.project(s.lab.x, s.lab.y, s.lab.h) : OFF,
      s.name[lang], (has ? 'has ' : '') + (isN ? 'next ' : '') + (isA ? 'on' : ''), has ? '★' : isN ? '!' : '?');
  }
  for (const r of RES) place(label('res-' + r.def.id, () => { if (!paused() && !digging) goTalk(r); }), started && r.here ? view.project(r.x, r.y, 1.5) : OFF, r.def.name[lang], 'res', r.def.icon);
}
function goTalk(r) {
  const free = nearestFree(Math.floor(r.x / T), Math.floor((r.y - 2) / T) + 1) || [Math.floor(r.x / T), Math.floor(r.y / T)];
  walkTo(free[0], free[1], () => talkTo(r));
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
    floatText(dog.x, dog.y, 1.3, '♥', 'heart'); floatText(s.lab.x, s.lab.y, s.lab.h + 0.4, '+★', 'gold');
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
  if (isNew) { floatText(dog.x, dog.y, 1.3, '♥', 'heart'); syncResidents(true); renderHud(); }
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
     <h3>${esc(u.neighbours)} · ${RES.filter(r => r.here).length}/${RES.length}</h3><div class="bag-grid">${RES.map(r => r.here
       ? `<div class="slot"><span>${r.def.icon}</span><small>${esc(r.def.name[lang])}</small></div>`
       : `<div class="slot empty"><span>?</span><small>${esc(u.lockedRes.replace('{n}', r.def.at))}</small></div>`).join('')}</div>
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
  if (pendingMove) {
    const r = pendingMove; pendingMove = null; pendingToast = null;
    toast(`<span>🏡 <b>${esc(r.def.name[lang])}</b> ${esc(t().movedIn)}</span>`, 6000);
    return;
  }
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
  else if (action.type === 'talk') label = `💬 ${u.talk} ${action.res.def.name[lang]}`;
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
  $('sayName').textContent = sayWho || u.speaker; $('sayMore').textContent = u.next;
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
  if (!$('say').hidden && !sayWho) say(t().hello, true);
  if (cardEl.open && reopen) reopen();
}
let sayTimer = 0, sayWho = null;
function say(text, instant, who) {
  const e = $('say'), p = $('sayText');
  sayWho = who || null; $('sayName').textContent = sayWho || t().speaker;
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
  const { x: wx, y: wy } = view.pick(e.clientX, e.clientY);
  if (Math.hypot(dog.x - wx, dog.y - 5 - wy) < 11) { petDog(); return; }
  const who = RES.find(r => r.here && Math.hypot(r.x - wx, r.y - 7 - wy) < 13);
  if (who) { goTalk(who); return; }
  const hit = SPOTS.find(s => wx >= s.hit.x && wx <= s.hit.x + s.hit.w && wy >= s.hit.y && wy <= s.hit.y + s.hit.h);
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
  update(dt); render(dt);
  requestAnimationFrame(frame);
}
syncResidents(false);
if (view) requestAnimationFrame(frame);
else { $('introRoutes').hidden = true; $('introSub').textContent = t().no3d; openQuick(); }

// small hook for testing from the console
window.__town = { player, dog, SPOTS, DIGS, RES, view, walkTo, openSpot, act, start, found, dug, caught, showItem, talkTo, petDog, get fishing() { return fishing; }, get action() { return action; } };
})();
