/* Starry Town — a walkable portfolio island. The rules live here; view3d.js draws the picture. */
import { createView } from './view3d.js?v=24';
(() => {
'use strict';

const DATA = window.DATA, EX = window.EXTRAS, GA = window.GuestAvatar;
// The guest resident takes the look the visitor designed. A link from the private town (#g=...) shows one visitor's avatar and note instead;
// that data sits in the part of the address that is never sent to a server. The link arrives in the visitor's email.
const guestDef = EX.residents.find(r => r.id === 'guest');
let ownerGuest = null;
try {
  const m = /[#&]g=([\w-]+)/.exec(location.hash);
  if (m) { const j = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))))); ownerGuest = Object.assign(GA.clean(j), { message: String(j.message || '').slice(0, 600) }); }
} catch (e) {}
const guestLines = { en: guestDef.lines.en.slice(), zh: guestDef.lines.zh.slice() };
function dressGuest(d) {
  Object.assign(guestDef, { species: d.species, color: d.color, accent: d.accent, acc: d.acc, icon: GA.icon(d.species) });
  if (d.name) guestDef.name = { en: d.name, zh: d.name };
  guestDef.lines = d.line ? { en: [d.line, ...guestLines.en], zh: [d.line, ...guestLines.zh] } : { en: guestLines.en.slice(), zh: guestLines.zh.slice() };      // their own catchphrase comes first
}
const T = 16, MW = 84, MH = 54, OX = 10, OY = 10;      // the town keeps its own tile coordinates and sits OX / OY tiles into a larger island
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, f) { try { const v = localStorage.getItem('starry-town-' + k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem('starry-town-' + k, JSON.stringify(v)); } catch (e) {} },
};
if (store.get('layout', 0) !== 3) { ['pos', 'digs'].forEach(k => { try { localStorage.removeItem('starry-town-' + k); } catch (e) {} }); store.set('layout', 3); }   // the island grew: old positions no longer fit
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
    sub: 'My portfolio, built as a little island you can walk around.', by: 'Made by Nan Yao · AI, venture, product and operations',
    keys: [['WASD', 'Move'], ['E', 'Interact'], ['Click', 'Walk there']], keysTouch: [['Tap', 'Walk there'], ['Tap a place', 'Open it'], ['Pinch', 'Zoom']], moreSum: 'All controls and things to do',
    mapBtn: 'Island map', mapTitle: 'Island map', mapMeta: 'Click a place to walk there', mapYou: 'You are here', mapFound: 'visited', mapNew: 'not yet',
    enter: '▶ Enter the island', quickLong: 'Short on time? Visit my classic site ↗',
    how: [['🚶', 'Walk', 'Arrow keys or WASD, or click where you want to go. Scroll with two fingers (or the wheel) to tilt the camera, pinch or ＋ － to zoom.'], ['🏠', 'Visit', 'Walk up to a building with a “?” and press E, or just click it, to read about my work. My favourite pieces are in the Showcase across the river.'], ['⛏', 'Dig', 'Press E where the ground sparkles to dig up a fun fact.'], ['🎣', 'Fish', 'Press E next to water, press again when the float dips, then keep pressing to reel it in.'], ['🍑', 'And more', 'Shake fruit trees for fruit and hidden notes, guess my MBTI at the crystal ball, pet the dog, press Q to dance.']],
    howTouch: [['🚶', 'Walk', 'Tap where you want to go. Pinch or use ＋ － to zoom, 🎥 to change the camera angle.'], ['🏠', 'Visit', 'Tap a building with a “?” to read about my work. My favourite pieces are in the Showcase across the river.'], ['⛏', 'Dig', 'Tap a sparkle on the ground to dig up a fun fact.'], ['🎣', 'Fish', 'Stand by the water and tap the button, tap again when the float dips, then keep tapping to reel it in.'], ['🍑', 'And more', 'Shake fruit trees for fruit and hidden notes, guess my MBTI at the crystal ball, pet the dog, tap 💃 to dance.']],
    cont: '▶ Back to the island', subBack: 'Welcome back! Your progress is saved on this device: ★ {a} · 🎒 {b}.', helloBack: 'Welcome back! Everything is where you left it.',
    restart: 'Start over', resetTitle: 'Start over?', resetText: 'This clears everything saved on this device: stars, backpack, residents and the to-do list. It cannot be undone.', resetYes: 'Clear and start over', resetNo: 'Keep my progress',
    reel: 'Reel it in! Keep pressing', reelTouch: 'Reel it in! Keep tapping', homeOf: "{n}'s home", lot: 'Empty lot',
    views: ['Eye level', 'Classic', 'Bird\'s eye'], viewBtn: 'Change camera angle', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    xmasOn: 'Merry Christmas! Let it snow.', xmasName: 'Christmas tree',
    sit: 'Sit for a while', sitHint: 'Take a seat. The music changes with the time of day.', ballBtn: 'Play fetch with Bingo', fetchGot: 'Good boy, Bingo!',
    balloonHint: 'A balloon is drifting by with a present. Click it!', balloonGot: 'Pop! The present had fruit in it: 🍑 × 2',
    shake: 'Shake the tree', give: 'Give fruit to', dance: 'Dance', tasks: 'To-do', taskDone: 'Done', allTasks: 'Every task done. You know this island better than I do!', nextTask: 'Next',
    thanks: ['Fruit! For me? You are my favourite visitor.', 'Fresh from the tree. Thank you!', 'I will save this one for later. Maybe.'],
    fruitLine: 'Fruit in your pocket', fruitHint: 'Shake a fruit tree, then give the fruit to a resident.',
    settings: 'Island settings', soundOn: 'Sound effects: on', soundOff: 'Sound effects: off', musicOn: 'Music: on', musicOff: 'Music: off', mute: 'Sound on / off',
    treeTitle: 'A note fell out of the tree!', notes: 'Shaken out of trees', lockedMbti: 'Moves in when the MBTI is guessed', lockedGuest: 'This one is you: sign the guest board',
    gName: 'Your name', gSpecies: 'Who are you?', gFur: 'Colour', gShirt: 'Shirt', gAcc: 'Something to wear', gLine: 'Your catchphrase (your character will say it)', gLineEx: 'e.g. Nice to meet you!', gJoin: 'Move in', gEdit: 'Change my look', gNote: 'Leave Nan a note', gMsg: 'Your note', gContact: 'Email or any way to reach you (optional)', gSend: 'Write the email', gLater: 'Maybe later', gCopy: 'Copy the note', gCopied: 'Copied', gSaveCard: 'Get a postcard to attach', gNeedName: 'Give your character a name first.', gNeedMsg: 'Write a few words first.', gYours: 'Your character lives on the island.', guess: 'Guess', socials: 'Find me elsewhere', xhs: 'Xiaohongshu', modes: { day: 'Day', dusk: 'Dusk', night: 'Night' }, postcard: 'Postcard',
    postcardTitle: 'A postcard from the island', postcardMeta: 'Save it or send it to a friend', save: 'Save image', greet: 'Greetings from Starry Town', back: 'Back to backpack',
    quick: 'Quick view', cv: 'CV', lang: '中文', bag: 'Backpack',
    goSee: 'Take me there', visit: 'Visit', talk: 'Talk to', movedIn: 'just moved to the island! Go say hi.', neighbours: 'Residents', lockedRes: 'Moves in after {n} finds', no3d: 'This browser cannot show the 3D island, so here is everything on one page.', dig: 'Dig here', fish: 'Go fishing', wait: 'Waiting for a bite…', pull: 'Pull!',
    hello: "Hi, I'm Nan! Welcome to my island. The to-do list in the top left will show you around. Bingo insists on coming along.",
    next: 'tap or press any key ▸', speaker: 'Nan',
    newStar: 'New star', allDone: 'All {n} stars found. Thanks for walking the whole island!', sayHi: 'Say hi',
    early: 'Too early, it swam away.', missed: 'It got away. Try again!', again: 'You already have this one. Back it goes.',
    dugTitle: 'You dug something up!', fishTitle: 'You caught something!', writeMe: 'Write to me',
    quickKicker: 'Quick view',
    sec: { show: 'Featured work', exp: 'Experience', work: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    kick: { showcase: 'Featured work', about: 'Welcome', job: 'Experience', project: 'Selected work', focus: 'How I work', edu: 'Education', skills: 'Capabilities', life: 'Beyond the desk', contact: 'Contact' },
    aboutTitle: "Hi, I'm Nan Yao", eduTitle: 'Education', contactTitle: 'Get in touch', phone: 'Phone', github: 'GitHub',
    bagTitle: 'Backpack', bagMeta: 'What you have found so far', route: 'Your route', treasures: 'Dug up', catches: 'Caught', unknown: 'Not found yet',
    toolsText: 'Dig where the ground sparkles. Stand next to water and press E to fish, press again when the float dips, then keep pressing to reel it in. Fruit trees sometimes drop a note.',
  },
  zh: {
    kicker: '姚楠的作品集小岛',
    sub: '我把作品集做成了一座可以逛的小岛。', by: '姚楠制作 · AI、创投、产品与运营',
    keys: [['WASD', '移动'], ['E', '互动'], ['点击', '走过去']], keysTouch: [['点击', '走过去'], ['点地点', '打开'], ['捏合', '缩放']], moreSum: '全部操作和玩法',
    mapBtn: '小岛地图', mapTitle: '小岛地图', mapMeta: '点一个地点，人物会走过去', mapYou: '你在这里', mapFound: '去过', mapNew: '还没去',
    enter: '▶ 进入小岛', quickLong: '赶时间？去看简洁版个人主页 ↗',
    how: [['🚶', '走路', '方向键或 WASD，也可以直接点击想去的地方。双指滑动（或滚轮）调视角，捏合或 ＋ － 缩放。'], ['🏠', '拜访', '走到带“?”的建筑前按 E，或者直接点它，看我的经历和项目。最满意的作品放在河对岸的精选作品馆。'], ['⛏', '挖宝', '在地上闪光的地方按 E，挖出一个 fun fact。'], ['🎣', '钓鱼', '站在水边按 E 抛竿，浮标下沉时再按一次，然后连按把鱼拉上来。'], ['🍑', '还有', '摇果树会掉水果和小纸条，去水晶球猜我的 MBTI，摸摸狗，按 Q 跳舞。']],
    howTouch: [['🚶', '走路', '点击想去的地方。双指或 ＋ － 缩放，点 🎥 切换视角。'], ['🏠', '拜访', '点带“?”的建筑，看我的经历和项目。最满意的作品放在河对岸的精选作品馆。'], ['⛏', '挖宝', '点地上闪光的地方，挖出一个 fun fact。'], ['🎣', '钓鱼', '站在水边点下方按钮，浮标下沉时再点一次，然后连点把鱼拉上来。'], ['🍑', '还有', '摇果树会掉水果和小纸条，去水晶球猜我的 MBTI，摸摸狗，点 💃 跳舞。']],
    cont: '▶ 继续逛小岛', subBack: '欢迎回来！进度保存在这台设备上：★ {a} · 🎒 {b}。', helloBack: '欢迎回来！岛上的一切都和你离开时一样。',
    restart: '重新开始', resetTitle: '要重新开始吗？', resetText: '这会清空这台设备上保存的全部进度：星星、背包、居民和任务清单。清空后无法恢复。', resetYes: '清空并重新开始', resetNo: '保留进度',
    reel: '收线！连续按', reelTouch: '收线！连续点', homeOf: '{n}的家', lot: '空地',
    views: ['平视', '经典', '俯视'], viewBtn: '切换视角', zoomIn: '放大', zoomOut: '缩小',
    xmasOn: '圣诞快乐！下雪啦。', xmasName: '圣诞树',
    sit: '坐一会儿', sitHint: '坐下歇歇。音乐会跟着时间变化。', ballBtn: '和苹果玩接球', fetchGot: '苹果真棒！',
    balloonHint: '天上飘来一个带礼物的气球，点它试试！', balloonGot: '砰！礼物里是水果：🍑 × 2',
    shake: '摇一摇树', give: '送水果给', dance: '跳舞', tasks: '任务', taskDone: '完成', allTasks: '任务全部完成，你比我还熟悉这座岛了！', nextTask: '下一步',
    thanks: ['水果！给我的吗？你是我最喜欢的访客。', '刚摘的，谢谢你！', '这个我留着晚点吃。大概吧。'],
    fruitLine: '口袋里的水果', fruitHint: '摇一摇果树，再把水果送给居民。',
    settings: '小岛设置', soundOn: '音效：开', soundOff: '音效：关', musicOn: '音乐：开', musicOff: '音乐：关', mute: '声音开关',
    treeTitle: '树上掉下一张纸条！', notes: '树上摇下来的', lockedMbti: '猜对 MBTI 后搬来', lockedGuest: '这是你：去留言板签个名',
    gName: '你的名字', gSpecies: '你是谁？', gFur: '颜色', gShirt: '衣服', gAcc: '配饰', gLine: '口头禅（你的形象会说这句话）', gLineEx: '比如：很高兴认识你！', gJoin: '搬进小岛', gEdit: '修改形象', gNote: '给姚楠留言', gMsg: '想说的话', gContact: '邮箱或其他联系方式（选填）', gSend: '写成邮件', gLater: '以后再说', gCopy: '复制留言', gCopied: '已复制', gSaveCard: '拍张明信片附上', gNeedName: '先给你的形象起个名字。', gNeedMsg: '先写几句话吧。', gYours: '你的形象已经住在岛上了。', guess: '猜一下', socials: '在别处找到我', xhs: '小红书', modes: { day: '白天', dusk: '黄昏', night: '夜晚' }, postcard: '明信片',
    postcardTitle: '一张小岛明信片', postcardMeta: '保存下来，或者发给朋友', save: '保存图片', greet: '来自 Starry Town 的问候', back: '回到背包',
    quick: '快速浏览', cv: '简历', lang: 'EN', bag: '背包',
    goSee: '带我过去', visit: '拜访', talk: '聊聊', movedIn: '搬到岛上来了！去打个招呼吧。', neighbours: '居民', lockedRes: '找到 {n} 样东西后搬来', no3d: '这个浏览器显示不了 3D 小岛，所以把全部内容放在这一页。', dig: '挖一挖', fish: '钓鱼', wait: '等鱼上钩…', pull: '拉！',
    hello: '嗨，我是姚楠！欢迎来我的小岛。左上角的任务清单会带你逛一圈。苹果一定要跟着。',
    next: '点击或按任意键 ▸', speaker: '姚楠',
    newStar: '新的星星', allDone: '{n} 颗星全部找到，谢谢你逛完整座小岛！', sayHi: '打个招呼',
    early: '太早了，鱼游走了。', missed: '跑掉了，再试一次！', again: '这个你已经有了，放回去吧。',
    dugTitle: '挖到东西了！', fishTitle: '钓到了！', writeMe: '给我写信',
    quickKicker: '快速浏览',
    sec: { show: '精选作品', exp: '工作经历', work: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    kick: { showcase: '精选作品', about: '欢迎', job: '工作经历', project: '代表作品', focus: '工作方法', edu: '教育背景', skills: '能力与工具', life: '工作之外', contact: '联系方式' },
    aboutTitle: '嗨，我是姚楠', eduTitle: '教育背景', contactTitle: '联系我', phone: '电话', github: 'GitHub',
    bagTitle: '背包', bagMeta: '你目前找到的东西', route: '你的路线', treasures: '挖到的', catches: '钓到的', unknown: '还没找到',
    toolsText: '地上闪光的地方可以挖。站在水边按 E 抛竿，浮标下沉时再按一次，然后连按收线。果树有时会掉下小纸条。',
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
  { id: 'showcase', kind: 'showcase',     name: { en: 'Showcase', zh: '精选作品馆' } },
];
if (window.TextKeys) window.TextKeys.apply({ DATA, EXTRAS: EX, UI, SPOTS }, window.TEXT_OVERRIDES);     // text edited in /admin
const GUESS = { id: 'mbti', kind: 'mbti', name: EX.mbti.name };       // the guessing machine: a place to visit, but not one of the 16 stars
GUESS.badge = '🔮';
const BOARD = { id: 'guest', kind: 'guest', badge: '✍️', name: EX.guestbook.name };
const month = new Date().getMonth();
const XMAS = month >= 10 || month === 0 ? { id: 'xmas', kind: 'xmas', badge: '🎄', name: { en: 'Christmas tree', zh: '圣诞树' } } : null;   // November to January
const PLACES = [...SPOTS, GUESS, BOARD].concat(XMAS ? [XMAS] : []);
const spotById = Object.fromEntries(PLACES.map(s => [s.id, s]));
const found = new Set(store.get('found', []).filter(id => spotById[id] && id !== 'mbti'));
const dug = new Set(store.get('dug', []).filter(i => i >= 0 && i < EX.dig.length));
const caught = new Set(store.get('caught', []).filter(i => i >= 0 && i < EX.fish.length));
const shaken = new Set(store.get('shaken', []).filter(i => i >= 0 && i < EX.tree.length));   // notes shaken out of trees
const SETS = { dig: dug, fish: caught, tree: shaken };
const holes = new Set(store.get('holes', [...Array(dug.size).keys()]));   // which dig spots are already dug (the spots themselves are random)
let fruit = store.get('fruit', 0) | 0;
const flags = new Set(store.get('flags', []));      // one-off things done: pet, fruit, neighbor, gift, dance
const tasksSeen = new Set(store.get('tasks', []));  // tasks already announced as done
const gifts = store.get('gifts', {});
let soundOn = store.get('sound', true) !== false, musicOn = store.get('music', true) !== false;
const itemCount = () => dug.size + caught.size + shaken.size, itemTotal = EX.dig.length + EX.fish.length + EX.tree.length;

/* ------------------------------------------------------------------ world */
const G = 0, P = 1, Z = 2, W = 3, D = 4, SAND = 5;
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
// The island: an organic outline around the town, with a beach all the way round.
const TW = 64, TH = 34, R = (x, y, w, h, v, arr) => rect(x + OX, y + OY, w, h, v, arr);
const coastA = (x, y) => Math.atan2(y + 0.5 - (OY + TH / 2), x + 0.5 - (OX + TW / 2));
function coast(x, y) {            // below 0: grass. A little above 0: sand. Beyond that: sea.
  const hx = TW / 2 + 2.5, hy = TH / 2 + 2.5, r = 11;
  const qx = Math.abs(x + 0.5 - (OX + TW / 2)) - (hx - r), qy = Math.abs(y + 0.5 - (OY + TH / 2)) - (hy - r);
  const sdf = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r, a = coastA(x, y);
  return sdf - (1.3 * Math.sin(3 * a + 1) + 0.9 * Math.sin(5 * a + 2.3) + 0.6 * Math.sin(9 * a + 0.7));
}
const beachW = (x, y) => 2.7 + 1.0 * Math.sin(7 * coastA(x, y) + 2) + 0.5 * Math.sin(13 * coastA(x, y));
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const c = coast(x, y); map[I(x, y)] = c < 0 ? G : c < beachW(x, y) ? SAND : W; }
// the harbour: a cove cut into the south shore, open to the sea
R(27, 29, 10, 3, W);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (((x - OX - 32) / 6.2) ** 2 + ((y - OY - 36) / 8.5) ** 2 <= 1 && y - OY >= 31) map[I(x, y)] = W;
R(4, 16, 56, 2, P); R(4, 24, 56, 2, P);
R(22, 11, 2, 17, P);
R(10, 16, 2, 10, P); R(33, 16, 2, 10, P);
R(19, 14, 8, 6, Z);
[5, 10, 16, 31, 38].forEach(x => R(x, 13, 1, 3, P));
[6, 15, 30, 38].forEach(x => R(x, 23, 1, 1, P));
R(11, 26, 1, 4, P); R(8, 29, 8, 1, P);
R(30, 26, 2, 3, P); R(30, 29, 2, 2, D);
// east bank: the Showcase and the residents' village
R(54, 16, 2, 10, P); R(54, 13, 1, 3, P); R(55, 26, 1, 3, P); R(47, 29, 13, 1, P); R(59, 15, 1, 1, P); R(58, 23, 1, 1, P);
// footpaths down to the beach at both ends of the main road and south from the campsite lane
R(-2, 16, 6, 2, P); R(60, 24, 6, 2, P); R(11, 30, 1, 6, P);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (map[I(x, y)] === P && coast(x, y) >= 0) map[I(x, y)] = SAND;      // paths end where the sand begins
// a river splits the island from shore to shore, widening into a lake between the two roads; a pond sits south of the plaza
for (let y = 0; y < MH; y++) { const cx = OX + 45 + Math.round(Math.sin((y - OY) * 0.45)); for (let x = cx - 1; x <= cx + 1; x++) if (inMap(x, y)) map[I(x, y)] = W; }
for (let y = 17; y < 24; y++) for (let x = 44; x < 54; x++) if (((x - 48.5) / 3.9) ** 2 + ((y - 20.5) / 2.7) ** 2 <= 1) map[I(x + OX, y + OY)] = W;
R(24, 21, 3, 2, W); map[I(25 + OX, 20 + OY)] = W;
// bridges: the two roads cross the river, and a plank walk crosses the lake
for (const y of [16, 17, 24, 25]) for (let x = 42; x < 49; x++) if (map[I(x + OX, y + OY)] === W) map[I(x + OX, y + OY)] = D;
for (let y = 17; y < 24; y++) if (map[I(49 + OX, y + OY)] === W) map[I(49 + OX, y + OY)] = D;
const PIER = [30 + OX, 29 + OY, 32 + OX, 31 + OY];
const LILIES = [[46.6, 19.6], [47.3, 21.7], [50.6, 19.2], [51.4, 21.4], [50.3, 22.3], [46.2, 21.2], [24.6, 21.5], [26.3, 22.4], [25.5, 20.6]].map(([x, y]) => [x + OX, y + OY]);

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
  { id: 'showcase', kind: 'house',  x: 51, y: 8,  w: 6, h: 5, door: 3, wall: '#fffaf0', roof: '#f5b01a', roofL: '#ffd166', doorC: '#b9825a', sign: '#fff3a8' },
  { id: 'edu',      kind: 'campus', x: 35, y: 18, w: 7, h: 5, door: 3, wall: '#fbf1dc', roof: '#9a6fd6', roofL: '#b390e6', doorC: '#7a4fb8', sign: '#e6d6ff' },
];
BUILDINGS.forEach(b => { b.x += OX; b.y += OY; });
// one house per resident, east of the river; it is built when its owner moves in
const HOME_AT = { mochi: [47, 26], pip: [51, 26], bao: [57, 26], rana: [57, 20], kiki: [58, 12], guest: [47, 8] };
let guestLook = ownerGuest || store.get('guest', null);
if (guestLook) { guestLook = Object.assign(GA.clean(guestLook), { message: guestLook.message }); dressGuest(guestLook); }
if (ownerGuest) { const L = [ownerGuest.message || '…'].concat(ownerGuest.line ? [ownerGuest.line] : []); guestDef.lines = { en: L, zh: L }; }
const HOMES = EX.residents.filter(r => HOME_AT[r.id]).map(r => ({ id: r.id, kind: 'house', x: HOME_AT[r.id][0] + OX, y: HOME_AT[r.id][1] + OY, w: 3, h: 3, door: 1,
  wall: '#fffaf0', roof: r.accent, roofL: r.accent, doorC: '#a9785a', sign: r.color }));
EX.residents.forEach(r => { const h = HOMES.find(q => q.id === r.id); if (h) r.home = [h.x + 1, h.y + 3]; });
const TRIG = {
  skills: [5, 13], orbit: [10, 13], linear: [16, 13], monolith: [22, 11], crossing: [31, 13], waves: [38, 13],
  sync: [6, 23], agent: [15, 23], wavo: [30, 23], edu: [38, 23],
  about: [20, 16], focus: [25, 16], mbti: [24, 15], guest: [21, 15], showcase: [54, 13], xmas: [26, 18], manus: [26, 14], life: [13, 29], odyssey: [31, 30], contact: [23, 27],
};
Object.values(TRIG).forEach(v => { v[0] += OX; v[1] += OY; });
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
  { kind: 'oracle',   tx: 24, ty: 14, fw: 1, fh: 1, spot: 'mbti' },
  ...(XMAS ? [{ kind: 'xmas', tx: 26, ty: 17, fw: 1, fh: 1, spot: 'xmas' }] : []),
  { kind: 'board', tx: 21, ty: 14, fw: 1, fh: 1, spot: 'guest' },
  { kind: 'fountain', tx: 49, ty: 13, fw: 2, fh: 2 },
  { kind: 'windmill', tx: 59, ty: 5, fw: 2, fh: 2 },
  { kind: 'crossSign', tx: 28, ty: 13, fw: 1, fh: 1 },
  { kind: 'light',    tx: 12, ty: 23, fw: 1, fh: 1 },
  { kind: 'crates',   tx: 8,  ty: 12, fw: 1, fh: 1 },
  { kind: 'bench',    tx: 19, ty: 19, fw: 2, fh: 1 },
  { kind: 'bench',    tx: 25, ty: 19, fw: 2, fh: 1 },
];
[[7, 15], [13, 15], [18, 15], [28, 15], [35, 15], [41, 15], [9, 23], [18, 23], [27, 23], [36, 23], [21, 12], [24, 12], [12, 26], [21, 27], [29, 27], [50, 15], [57, 15], [53, 23], [60, 23], [41, 23], [53, 28]]
  .forEach(([tx, ty]) => OBJECTS.push({ kind: 'lamp', tx, ty, fw: 1, fh: 1 }));
OBJECTS.forEach(o => { o.tx += OX; o.ty += OY; });
const DIGS = [];   // filled in further down, once paths can be checked

for (let i = 0; i < map.length; i++) if (map[i] === W) solid[i] = 1;
BUILDINGS.forEach(b => {
  rect(b.x, b.y, b.w, b.h, 1, solid);
  rect(b.x - 1, b.y - 2, b.w + 2, b.h + 4, 1, reserved);
  const s = spotById[b.id], tall = b.h >= 5, dp = b.kind === 'campus' ? 2.5 : Math.min(3, Math.max(2.3, b.h - 1.5));
  const front = b.y + b.h - 0.15, cx = b.x + b.w / 2;
  s.front = { x: cx * T, y: (b.y + b.h) * T };
  s.boxes = b.kind === 'tower' ? [{ x0: cx - 2.6, x1: cx + 2.6, z0: front - 2.6, z1: front + 0.1, h: 1.7 }, { x0: cx - 1.7, x1: cx + 1.7, z0: front - 2.5, z1: front - 0.45, h: 10.4 }]
    : b.kind === 'dome' ? [{ x0: cx - 1.9, x1: cx + 1.9, z0: front - 3.7, z1: front + 0.1, h: 4.0 }]
    : [{ x0: b.x, x1: b.x + b.w, z0: front - dp, z1: front + 0.1, h: tall ? 3.0 : 2.7 }, { x0: cx - b.w * 0.3, x1: cx + b.w * 0.3, z0: front - dp * 0.65, z1: front - dp * 0.35, h: tall ? 4.4 : 3.9 }]
      .concat(b.kind === 'campus' ? [{ x0: cx - 0.75, x1: cx + 0.75, z0: front - dp / 2 - 0.75, z1: front - dp / 2 + 0.75, h: 5.6 }] : []);
  s.lab = { x: (b.x + (b.kind === 'house' || b.kind === 'campus' ? b.door + 0.5 : b.w / 2)) * T, y: (b.y + b.h) * T - 3, h: b.kind === 'tower' ? 2.5 : b.kind === 'dome' ? 5.5 : tall ? 4.8 : 4.2 };
});
HOMES.forEach(h => { rect(h.x, h.y, h.w, h.h, 1, solid); rect(h.x - 1, h.y - 2, h.w + 2, h.h + 4, 1, reserved); });
OBJECTS.forEach(o => {
  rect(o.tx, o.ty, o.fw, o.fh, 1, solid);
  rect(o.tx - 1, o.ty - 2, o.fw + 2, o.fh + 3, 1, reserved);
  if (o.spot) {
    const s = spotById[o.spot];
    const hh = { booth: 2.7, ship: 4.6, doghouse: 2.1, sign: 1.9, scope: 2.0, mailbox: 1.9, oracle: 2.0, xmas: 3.9, board: 2.1 }[o.kind] || 2;
    s.front = { x: (o.tx + o.fw / 2) * T, y: (o.ty + o.fh) * T };
    s.boxes = [o.kind === 'ship' ? { x0: o.tx + 0.3, x1: o.tx + 4.7, z0: o.ty + 0.7, z1: o.ty + 2.3, h: 4.5 } : { x0: o.tx - 0.1, x1: o.tx + o.fw + 0.1, z0: o.ty, z1: o.ty + o.fh, h: hh - 0.3 }];
    s.lab = { x: (o.tx + o.fw / 2) * T, y: (o.ty + o.fh / 2) * T, h: Math.min(hh, 3.3) };
  }
});
PLACES.forEach(s => { s.trig = TRIG[s.id]; });
DIGS.forEach(g => rect(g.tx - 1, g.ty - 1, 3, 3, 1, reserved));
R(4, 26, 15, 5, 1, reserved);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const v = map[I(x, y)];
  if (v === P || v === Z || v === D) rect(x - 1, y - 1, 3, 3, 1, reserved);
}
const TREES = [], PALMS = [], ROCKS = [], SHELLS = [];
for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
  const i = I(x, y);
  if (map[i] === SAND && !reserved[i] && !solid[i]) {               // the beach: a few palms and rocks, shells and starfish in the sand
    if (hash(x, y, 11) < 0.035 && coast(x, y) < 1.6) { PALMS.push({ tx: x, ty: y, v: hash(x, y, 12) }); solid[i] = 1; }
    else if (hash(x, y, 13) < 0.03) { ROCKS.push({ x: x + 0.5, y: y + 0.5, s: 0.55 + hash(x, y, 14) * 0.5, v: hash(x, y, 15) }); solid[i] = 1; }
    else if (hash(x, y, 16) < 0.07) SHELLS.push({ x: x + 0.2 + hash(x, y, 17) * 0.6, y: y + 0.2 + hash(x, y, 18) * 0.6, k: Math.floor(hash(x, y, 19) * 3) });
    continue;
  }
  if (map[i] === W && coast(x, y) < beachW(x, y) + 3.2 && coast(x, y) > beachW(x, y) + 0.8 && hash(x, y, 21) < 0.03) ROCKS.push({ x: x + 0.5, y: y + 0.5, s: 0.6 + hash(x, y, 14) * 0.8, v: hash(x, y, 15), sea: true });
  if (map[i] !== G) continue;
  if (!reserved[i] && !solid[i]) {
    const edge = coast(x, y) > -3.4;
    if (hash(x, y, 1) < (edge ? 0.3 : 0.17)) { TREES.push({ tx: x, ty: y, type: hash(x, y, 2) < 0.3 ? 'pine' : hash(x, y, 5) < 0.45 ? 'fruit' : 'round', v: hash(x, y, 8) }); solid[i] = 1; continue; }
  }
  if (!solid[i] && !DIGS.some(g => g.tx === x && g.ty === y) && hash(x, y, 3) < 0.1) flowers[i] = 1 + Math.floor(hash(x, y, 4) * 4);
}

// a few fruit trees in easy reach, so shaking one is never a hunt
[[20, 22], [19, 27], [36, 27], [3, 18], [51, 15], [57, 23], [50, 27]].forEach(([tx0, ty0]) => {
  const x = tx0 + OX, y = ty0 + OY, i = I(x, y);
  if (map[i] !== G || solid[i]) return;
  TREES.push({ tx: x, ty: y, type: 'fruit', v: hash(x, y, 8) }); solid[i] = 1; flowers[i] = 0;
});

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
const GS = 3;
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
  const grassy = (x, y) => land(x, y) && at(x, y) !== SAND;
  shape(land, 0, 9, C.sand);              // the beach, with round corners; the bank, wet sand and foam below it are modelled in 3D
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === SAND) for (let k = 0; k < 3; k++) { if (hash(x, y, 80 + k) < 0.5) el(c, x * T + hash(x, y, 83 + k) * 16, y * T + hash(x, y, 86 + k) * 16, 1.1, 0.8, k ? '#fff6d8' : '#ecd9a0'); }
  shape(grassy, 1.6, 9, '#e3cf98'); shape(grassy, 0.8, 9, '#74c276'); shape(grassy, 0, 8, C.grass);
  c.save(); c.beginPath(); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (grassy(x, y)) c.rect(x * T, y * T, T, T); c.clip();          // broad, soft patches of lighter and deeper green, on the grass only
  for (let k = 0; k < 150; k++) {
    const px = hash(k, 1, 90) * MW * T, py = hash(k, 2, 91) * MH * T, rx = 18 + hash(k, 3, 92) * 34, ry = 12 + hash(k, 4, 93) * 22, light = hash(k, 5, 94) < 0.5;
    const g = c.createRadialGradient(px, py, 0, px, py, rx); g.addColorStop(0, light ? 'rgba(178,232,160,.5)' : 'rgba(104,186,116,.34)'); g.addColorStop(1, light ? 'rgba(178,232,160,0)' : 'rgba(104,186,116,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(px, py, rx, ry, hash(k, 6, 95) * 3, 0, TAU); c.fill();
  }
  c.restore();
  HOMES.forEach(h => rr(c, h.x * T + 3, h.y * T + 12, h.w * T - 6, h.h * T - 14, 7, C.pathD));
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    if (!grassy(x, y)) continue;
    const px = x * T, py = y * T;
    if (hash(x, y, 20) < 0.16 && grassy(x - 1, y) && grassy(x + 1, y) && grassy(x, y - 1) && grassy(x, y + 1)) el(c, px + 8, py + 8, 13, 9, 'rgba(124,201,124,.35)');
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
  c.save(); c.beginPath(); c.roundRect((19 + OX) * T + 1, (14 + OY) * T + 1, 8 * T - 2, 6 * T - 2, 5); c.clip();
  for (let j = 0; j < 12; j++) for (let i = -1; i < 17; i++) rr(c, (19 + OX) * T + i * 8 + (j % 2 ? 4 : 0) + 0.8, (14 + OY) * T + j * 8 + 0.8, 6.4, 6.4, 2, hash(i, j, 70) < 0.5 ? C.plaza : C.plazaL);
  c.restore();
  rr(c, (13 + OX) * T + 4, (30 + OY) * T + 13.5, 5 * T - 8, 1, 0.5, 'rgba(255,255,255,.75)');
})();

const FISHES = [[33, 33.5, 30], [40, 43, 44], [10, 43, 50], [45, 12, 0], [45, 24, 0], [-8, 18, 0], [22, 43.5, 60], [28.5, 30.2, 8], [47.5, 20, 22], [51, 21.3, 14], [45, 8, 0], [44, 28, 0], [72, 14, 0]].map(([fx, fy, span], i) => ({ x: (fx + OX) * T, y: (fy + OY) * T, span, p: i * 1.7, vert: span === 0 }));

/* ------------------------------------------------------------------ player / dog */
const HOME = [21 + OX, 18 + OY];
const player = { x: HOME[0] * T + 8, y: HOME[1] * T + 10, dir: 'down', moving: false, anim: 0 };
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
  const [sx, sy] = sitting ? [Math.floor(player.x / T), sitting.ty + 1] : playerTile();
  const p = findPath(sx, sy, tx, ty);
  if (!p) return false;
  standUp(); fishing = null; dancing = null; path = p; autoAct = then || null;
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

/* dig spots: eight random patches of grass that can be walked to, different for every visitor and kept until they start over */
(function placeDigs() {
  const reach = new Uint8Array(MW * MH), q = [I(HOME[0], HOME[1])]; reach[q[0]] = 1;
  for (let qi = 0; qi < q.length; qi++) {
    const cx = q[qi] % MW, cy = (q[qi] / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (!tileSolid(nx, ny) && !reach[I(nx, ny)]) { reach[I(nx, ny)] = 1; q.push(I(nx, ny)); } }
  }
  const hidden = (x, y) => inMap(x, y) && solid[I(x, y)] && at(x, y) !== W;      // something tall that would cover the sparkle
  const ok = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x > 3 && x < MW - 4 && y > 3 && y < MH - 4 && map[I(x, y)] === G && !solid[I(x, y)] && reach[I(x, y)]
    && ![[0, 1], [-1, 1], [1, 1], [0, 2]].some(([dx, dy]) => hidden(x + dx, y + dy))
    && !PLACES.some(s => Math.abs(s.trig[0] - x) + Math.abs(s.trig[1] - y) < 3) && !HOMES.some(h => Math.abs(h.x + 1 - x) + Math.abs(h.y + 3 - y) < 3) && Math.abs(x - HOME[0]) + Math.abs(y - HOME[1]) > 2;
  let saved = store.get('digs', null);
  if (!Array.isArray(saved) || saved.length !== EX.dig.length || !saved.every(p => Array.isArray(p) && ok(p[0], p[1]))) {
    const cand = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (ok(x, y)) cand.push([x, y]);
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    saved = [];
    const near = cand.find(c => Math.abs(c[0] - HOME[0]) + Math.abs(c[1] - HOME[1]) < 9); if (near) saved.push(near);   // one close to the start, so the first dig is easy to find
    for (let gap = 9; gap >= 1 && saved.length < EX.dig.length; gap -= 4) for (const c of cand) {
      if (saved.length >= EX.dig.length) break;
      if (saved.every(p => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) >= gap)) saved.push(c);
    }
    store.set('digs', saved); holes.clear(); store.set('holes', []);
  }
  saved.forEach(([tx, ty], i) => DIGS.push({ i, tx, ty, x: tx * T + 8, y: ty * T + 9 }));
  for (let i = FLOWERS.length - 1; i >= 0; i--) if (DIGS.some(g => g.tx === FLOWERS[i].x && g.ty === FLOWERS[i].y)) FLOWERS.splice(i, 1);
  const pos = store.get('pos', null);                 // come back where the visitor left off
  if (Array.isArray(pos) && Number.isInteger(pos[0]) && Number.isInteger(pos[1]) && inMap(pos[0], pos[1]) && reach[I(pos[0], pos[1])]) {
    player.x = pos[0] * T + 8; player.y = pos[1] * T + 10; dog.x = player.x - 10; dog.y = player.y + 2;
    trail.forEach(q2 => { q2.x = player.x; q2.y = player.y; });
  }
})();
let leaving = false;
const savePos = () => { if (started && !leaving) store.set('pos', playerTile()); };
setInterval(savePos, 2000); addEventListener('pagehide', savePos);
const hasProgress = () => found.size + itemCount() + flags.size > 0;

/* ------------------------------------------------------------------ view + residents */
const canvas = $('game');
const RES = EX.residents.map(def => ({ def, x: def.home[0] * T + 8, y: def.home[1] * T + 10, hx: 0, hy: 1, moving: false, here: false, wait: 1 + Math.random() * 2, tx: null, ty: 0, line: 0 }));
let view = null;
try { view = createView({ MW, MH, hash, reduceMotion, ground, at, D, W, SAND, PIER, PALMS, ROCKS, SHELLS, BUILDINGS, HOMES, LILIES, OBJECTS, TREES, DIGS, FISHES, FLOWERS, RESIDENTS: EX.residents }, canvas); }
catch (err) { console.warn('3D view unavailable', err); }
const hour = new Date().getHours() + new Date().getMinutes() / 60;
const askedMode = new URLSearchParams(location.search).get('time');
let mode = ['day', 'dusk', 'night'].includes(askedMode) ? askedMode : hour >= 6.5 && hour < 17 ? 'day' : (hour >= 17 && hour < 19.5) || (hour >= 5 && hour < 6.5) ? 'dusk' : 'night';
document.body.dataset.mode = mode;
if (view) { view.setMode(mode); addEventListener('resize', view.resize); }

// camera: three angles from eye level to bird's eye, and a zoom, both eased in the view and remembered
const PITCH = [0.42, 0.94, 1.38], cam = Object.assign({ p: 0.94, z: 1 }, store.get('cam', {}));
if (cam.v != null && cam.p === 0.94) cam.p = PITCH[cam.v] || 0.94;
delete cam.v;
cam.p = Math.min(1.38, Math.max(0.42, +cam.p || 0.94)); cam.z = Math.min(1.5, Math.max(0.5, +cam.z || 1));
const applyCam = now => { if (view) view.setCam(cam.p, cam.z, now); store.set('cam', cam); };
applyCam(true);
function nextView() {            // the button steps through three preset angles; scrolling tilts freely in between
  const i = PITCH.findIndex(q => q > cam.p + 0.04), k = i < 0 ? 0 : i;
  cam.p = PITCH[k]; applyCam(); sfx('pick'); if (started && !cardEl.open) toast(`<span>🎥 <b>${esc(t().views[k])}</b></span>`, 1400);
}
function tiltBy(d) { cam.p = Math.min(1.38, Math.max(0.42, cam.p + d)); applyCam(); }
function zoomBy(k) { cam.z = Math.min(1.5, Math.max(0.5, cam.z * k)); applyCam(); }
let pendingMove = null;
function syncResidents(announce) {
  for (const r of RES) if (!r.here && (r.def.unlock === 'mbti' ? flags.has('mbti') : r.def.unlock === 'guest' ? (!!ownerGuest || flags.has('guest')) : itemCount() >= r.def.at)) { r.here = true; if (announce) pendingMove = r; }
}
function segFree(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
  for (let i = 0; i <= n; i++) if (tileSolid(Math.floor((x0 + (x1 - x0) * i / n) / T), Math.floor((y0 + (y1 - y0) * i / n - 2) / T))) return false;
  return true;
}
function updateResidents(dt) {
  for (const r of RES) {
    if (!r.here) continue;
    if (r.dance > 0) { r.dance -= dt; r.moving = false; continue; }
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
function flag(id) { if (!flags.has(id)) { flags.add(id); store.set('flags', [...flags]); } }
let talking = null;
function talkTo(r) {
  flag('neighbor'); path = null; autoAct = null;
  talking = r; player.face = Math.atan2(r.x - player.x, r.y - player.y);     // face each other; the camera moves in while they talk
  if (fruit > 0) {
    fruit--; store.set('fruit', fruit);
    gifts[r.def.id] = (gifts[r.def.id] || 0) + 1; store.set('gifts', gifts); flag('gift');
    const L = t().thanks;
    say(L[(gifts[r.def.id] - 1) % L.length], false, r.def.name[lang], VOICE[r.def.species]);
    floatText(r.x, r.y, 1.7, '♥', 'heart'); sfx('pet'); renderHud();
    return;
  }
  const lines = r.def.lines[lang];
  say(lines[r.line % lines.length], false, r.def.name[lang], VOICE[r.def.species]); r.line++;
  floatText(r.x, r.y, 1.7, '♪', 'gold');
}
function petDog() {
  dog.pet = 0.9; flag('pet');
  floatText(dog.x, dog.y, 1.3, '♥', 'heart'); sfx('pet');
}

/* ------------------------------------------------------------------ sound (tiny synth, no files) */
let actx = null, musicGain = null, noiseBuf = null;
function audio() {
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = actx.createGain(); musicGain.gain.value = 0.6; musicGain.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    if (actx.state === 'suspended' && !document.hidden) actx.resume();
  } catch (e) { actx = null; }
  return actx;
}
function tone(f, dur, o = {}) {
  const a = audio(); if (!a) return;
  try {
    const t0 = a.currentTime + (o.at || 0), osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.07, t0 + (o.attack || 0.015)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(o.dest || a.destination); osc.start(t0); osc.stop(t0 + dur + 0.03);
  } catch (e) {}
}
function noise(dur, o = {}) {       // filtered hiss: rustles, splashes, footsteps
  const a = audio(); if (!a) return;
  try {
    const t0 = a.currentTime + (o.at || 0), src = a.createBufferSource(), flt = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noiseBuf; src.loop = true; flt.type = o.type || 'bandpass'; flt.frequency.setValueAtTime(o.f || 1000, t0); flt.Q.value = o.q || 1;
    if (o.to) flt.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.06, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt).connect(g).connect(a.destination); src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.03);
  } catch (e) {}
}
const SFX = {
  open: () => { tone(520, 0.07, { to: 880, vol: 0.05 }); },
  close: () => { tone(700, 0.07, { to: 420, vol: 0.04 }); },
  star: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { at: i * 0.07, type: 'triangle' })),
  item: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i === 3 ? 0.4 : 0.13, { at: i * 0.09, type: 'triangle' })),
  dig: () => [0, 0.25, 0.5].forEach(a => { noise(0.13, { at: a, f: 900, to: 300, q: 0.8, vol: 0.09 }); tone(140, 0.1, { at: a, to: 70, vol: 0.06 }); }),
  cast: () => { tone(900, 0.22, { to: 300, vol: 0.04 }); noise(0.25, { at: 0.24, f: 1800, to: 500, vol: 0.07 }); tone(320, 0.12, { at: 0.24, to: 620, vol: 0.05 }); },
  bite: () => { tone(988, 0.06); tone(988, 0.06, { at: 0.11 }); noise(0.1, { f: 2200, vol: 0.04 }); },
  catch: () => { noise(0.35, { f: 2400, to: 600, vol: 0.09 }); tone(260, 0.16, { to: 720, vol: 0.05 }); },
  miss: () => tone(300, 0.22, { to: 150 }),
  pet: () => { tone(700, 0.08, { to: 900 }); tone(900, 0.1, { at: 0.1, to: 1100 }); },
  shake: () => [0, 1, 2, 3, 4, 5].forEach(i => noise(0.07, { at: i * 0.07, f: 3200 + Math.random() * 1500, q: 1.5, vol: 0.06 })),
  fruit: () => { tone(520, 0.1, { to: 200, vol: 0.05 }); tone(150, 0.07, { at: 0.11, to: 90, vol: 0.08 }); noise(0.05, { at: 0.11, f: 400, vol: 0.05 }); },
  task: () => [784, 988, 1175].forEach((f, i) => tone(f, 0.12, { at: i * 0.09 })),
  move: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.2, { at: i * 0.11, type: 'triangle' })),
  dance: () => [523, 587, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, { at: i * 0.16, type: 'triangle' })),
  pick: () => tone(660, 0.05, { vol: 0.04, type: 'triangle' }),
  wrong: () => { tone(330, 0.12, { type: 'triangle' }); tone(262, 0.2, { at: 0.13, type: 'triangle' }); },
  right: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i === 4 ? 0.5 : 0.12, { at: i * 0.08, type: 'triangle' })),
  reel: () => { noise(0.05, { f: 2600, q: 3, vol: 0.05 }); tone(820 + Math.random() * 120, 0.04, { vol: 0.03, type: 'square' }); },
  jingle: () => [76, 76, 76, 0, 76, 76, 76, 0, 76, 79, 72, 74, 76].forEach((n, i) => { if (n) tone(NOTE(n), 0.2, { at: i * 0.17, type: 'triangle', vol: 0.06 }); }),
  pop: () => { noise(0.09, { f: 1800, q: 0.6, vol: 0.14 }); [784, 1047, 1319].forEach((f, i) => tone(f, 0.14, { at: 0.08 + i * 0.07, type: 'triangle' })); },
  throw: () => tone(380, 0.22, { to: 900, vol: 0.05 }),
  whoosh: () => noise(0.5, { f: 700, to: 1600, q: 0.8, vol: 0.03 }),
  step: () => noise(0.045, { f: 420 + Math.random() * 260, q: 0.7, vol: 0.022 }),
};
// Background music: three short original loops, written as notes and played by the same synth. One per time of day.
const NOTE = n => 440 * 2 ** ((n - 69) / 12), _ = null;
const TRACKS = {
  day: { bpm: 108, wave: 'triangle', mel: 0.34, mv: 0.05, bv: 0.06, cv: 0.016, comp: [2, 6], bars: [
    { c: [60, 64, 67], b: 48, m: [72, _, 76, 79, _, 76, 74, _] }, { c: [57, 60, 64], b: 45, m: [72, _, 76, 81, _, 79, 76, _] },
    { c: [57, 60, 65], b: 41, m: [77, _, 81, 84, _, 81, 79, 77] }, { c: [59, 62, 67], b: 43, m: [74, _, 79, 83, _, 79, 74, _] },
    { c: [60, 64, 67], b: 48, m: [76, 79, _, 84, _, 79, 76, _] }, { c: [57, 60, 64], b: 45, m: [81, _, 79, 76, _, 72, 74, 76] },
    { c: [57, 60, 65], b: 41, m: [77, _, 76, 74, _, 72, 69, _] }, { c: [59, 62, 67], b: 43, m: [71, 74, _, 79, _, _, _, _] }] },
  dusk: { bpm: 84, wave: 'sine', mel: 0.8, mv: 0.055, bv: 0.06, cv: 0.02, comp: [2, 5], bars: [
    { c: [60, 64, 69], b: 41, m: [69, _, _, 72, _, _, 76, _] }, { c: [60, 65, 69], b: 50, m: [77, _, _, 76, _, 72, _, _] },
    { c: [58, 62, 65], b: 46, m: [74, _, _, 70, _, _, 69, _] }, { c: [60, 64, 67], b: 48, m: [67, _, 72, _, _, 76, _, _] },
    { c: [60, 64, 69], b: 41, m: [81, _, _, 79, _, 76, _, _] }, { c: [60, 65, 69], b: 50, m: [77, _, 74, _, _, 69, _, _] },
    { c: [58, 62, 65], b: 46, m: [70, _, _, 74, _, 77, _, 74] }, { c: [60, 64, 67], b: 48, m: [72, _, _, _, _, _, _, _] }] },
  night: { bpm: 64, wave: 'sine', mel: 1.7, mv: 0.045, bv: 0.05, cv: 0.016, comp: [0], pad: true, bars: [
    { c: [57, 60, 64], b: 45, m: [_, _, 76, _, _, _, 81, _] }, { c: [57, 60, 65], b: 41, m: [_, _, 84, _, _, 79, _, _] },
    { c: [55, 60, 64], b: 48, m: [_, 76, _, _, 79, _, _, _] }, { c: [55, 59, 62], b: 43, m: [_, _, 74, _, _, _, _, _] },
    { c: [57, 60, 64], b: 45, m: [88, _, _, _, 84, _, _, 81] }, { c: [57, 60, 65], b: 41, m: [_, _, 77, _, _, _, 81, _] },
    { c: [55, 60, 64], b: 48, m: [_, 79, _, _, 76, _, _, _] }, { c: [55, 59, 64], b: 52, m: [_, _, 71, _, _, _, _, _] }] },
};
const music = { next: 0, step: 0 };
function musicTick() {
  if (!musicOn || !started || !actx || document.hidden || actx.state !== 'running') return;
  const tr = TRACKS[mode], spb = 30 / tr.bpm, now = actx.currentTime;
  if (music.next < now) music.next = now + 0.06;
  while (music.next < now + 0.7) {
    const at = music.next - now, bar = tr.bars[(music.step / 8) | 0], k = music.step % 8, o = { at, dest: musicGain };
    if (bar.m[k]) tone(NOTE(bar.m[k]), tr.mel, { ...o, type: tr.wave, vol: tr.mv });
    if (k === 0 || (k === 4 && !tr.pad)) tone(NOTE(bar.b), spb * (tr.pad ? 7 : 3.2), { ...o, type: 'triangle', vol: tr.bv, attack: tr.pad ? 0.4 : 0.02 });
    if (tr.comp.includes(k)) bar.c.forEach((n, i) => tone(NOTE(n), tr.pad ? spb * 7.5 : 0.3, { ...o, at: at + (tr.pad ? 0 : i * 0.012), type: tr.pad ? 'sine' : 'triangle', vol: tr.cv, attack: tr.pad ? 0.6 : 0.015 }));
    music.step = (music.step + 1) % (tr.bars.length * 8); music.next += spb;
  }
}
setInterval(musicTick, 120);
function setMusic(on) {
  musicOn = on; store.set('music', on);
  if (musicGain && actx) musicGain.gain.setTargetAtTime(on ? 0.6 : 0, actx.currentTime, 0.08);
  if (on) { music.next = 0; audio(); }
}
document.addEventListener('visibilitychange', () => { if (!actx) return; try { if (document.hidden) actx.suspend(); else if (started) actx.resume(); } catch (e) {} });
const sfx = name => { if (soundOn && started && SFX[name]) SFX[name](); };

/* ------------------------------------------------------------------ to-do list, fruit trees, dancing */
const FRUIT_TREES = TREES.filter(tr => tr.type === 'fruit');
FRUIT_TREES.forEach(tr => { tr.ready = 0; });
let shaking = null, dancing = null;
const busy = () => !!(digging || shaking || (fishing && fishing.phase === 'land'));
const TASK_DONE = {
  sign: () => found.has('about'),
  work: () => SPOTS.some(s => s.kind === 'job' && found.has(s.id)),
  project: () => SPOTS.some(s => s.kind === 'project' && found.has(s.id)),
  dig: () => dug.size > 0, fish: () => caught.size > 0,
  pet: () => flags.has('pet'), fruit: () => flags.has('fruit'), neighbor: () => flags.has('neighbor'), gift: () => flags.has('gift'), dance: () => flags.has('dance'),
  showcase: () => found.has('showcase'), mbti: () => flags.has('mbti'), hello: () => found.has('contact'), stars: () => found.size === SPOTS.length,
};
const taskDone = id => !!(TASK_DONE[id] && TASK_DONE[id]());
const currentTask = () => EX.tasks.find(k => !taskDone(k.id)) || null;
const closest = (list, fx, fy) => list.reduce((b, o) => { const dd = Math.hypot(fx(o) - player.x, fy(o) - player.y); return !b || dd < b.d ? { o, d: dd } : b; }, null);
function treeSide(tr) {           // a free tile next to a tree, the one nearest the player
  const c = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => [tr.tx + dx, tr.ty + dy]).filter(([x, y]) => !tileSolid(x, y) && findPath(...playerTile(), x, y));
  return closest(c, q => q[0] * T + 8, q => q[1] * T + 10);
}
function goShake(tr) {
  const side = treeSide(tr);
  if (side) walkTo(side.o[0], side.o[1], () => { action = currentAction(); if (action && action.type === 'shake') act(); });
}
function taskTarget(k) {            // where the guide arrow points, and what clicking the to-do chip does
  const spot = id => { const s = spotById[id]; return { x: s.trig[0] * T + 8, y: s.trig[1] * T + 10, spot: s, go: () => visitSpot(s) }; };
  const res = () => { const c = closest(RES.filter(r => r.here), r => r.x, r => r.y); return c && { x: c.o.x, y: c.o.y, go: () => goTalk(c.o) }; };
  const tree = () => { const c = closest(FRUIT_TREES.filter(tr => time >= tr.ready && treeSide(tr)), tr => tr.tx * T + 8, tr => tr.ty * T + 10); return c && { x: c.o.tx * T + 8, y: c.o.ty * T + 10, go: () => goShake(c.o) }; };
  switch (k.id) {
    case 'sign': return spot('about');
    case 'work': return spot('monolith');
    case 'project': return spot('orbit');
    case 'hello': return spot('contact');
    case 'mbti': return spot('mbti');
    case 'showcase': return spot('showcase');
    case 'pet': return { x: dog.x, y: dog.y, go: petDog };
    case 'dance': return { x: player.x, y: player.y, go: startDance };
    case 'stars': { const c = closest(SPOTS.filter(s => !found.has(s.id)), s => s.trig[0] * T + 8, s => s.trig[1] * T + 10); return c && spot(c.o.id); }
    case 'dig': { const c = closest(DIGS.filter(g => !holes.has(g.i)), g => g.x, g => g.y); return c && { x: c.o.x, y: c.o.y, go: () => walkTo(c.o.tx, c.o.ty, () => { action = currentAction(); if (action && action.type === 'dig') act(); }) }; }
    case 'fish': return { x: (30 + OX) * T + 8, y: (30 + OY) * T + 10, go: () => walkTo(30 + OX, 30 + OY, () => { player.dir = 'down'; }) };
    case 'fruit': return tree();
    case 'neighbor': return res();
    case 'gift': return fruit > 0 ? res() : tree();
    default: return null;
  }
}
function checkTasks() {
  if (!started || cardEl.open || !$('toast').hidden) return;
  const k = EX.tasks.find(q => taskDone(q.id) && !tasksSeen.has(q.id));
  if (!k) return;
  tasksSeen.add(k.id); store.set('tasks', [...tasksSeen]);
  const all = EX.tasks.every(q => taskDone(q.id));
  toast(all ? `<span>🎉 <b>${esc(t().allTasks)}</b></span><button class="btn" id="toastCard">📸 ${esc(t().postcard)}</button>` : `<span>✓ <b>${esc(t().taskDone)}</b> · ${k.icon} ${esc(k[lang])}</span>`, all ? 12000 : 2600);
  if (all) $('toastCard').onclick = () => { $('toast').hidden = true; openPostcard(); };
  sfx('task'); renderQuest(); cheerAt = time;
}
let snowUntil = -1, cheerAt = null;
let sitting = null, ballS = null, balloon = null, balloonAt = 22;
function standUp() { if (sitting) { player.y = (sitting.ty + 1) * T + 10; sitting = null; } }
function throwBall() {                      // fetch: the ball flies a few tiles ahead, the dog brings it back
  if (paused() || busy() || ballS || fishing) return;
  standUp(); dancing = null; hideSay();
  const [dx, dy] = DIRS[player.dir]; let [tx, ty] = playerTile(), n = 0;
  while (n < 5 && !tileSolid(tx + dx, ty + dy)) { tx += dx; ty += dy; n++; }
  ballS = { x: player.x, y: player.y, x0: player.x, y0: player.y, x1: tx * T + 8, y1: ty * T + 10, h: 0.9, t: 0, phase: 'fly' };
  sfx('throw');
}
function popBalloon() {
  cheerAt = time; floatText(balloon.x, balloon.y, balloon.h + 0.8, '🎉', 'gold'); balloon = null; balloonAt = time + 55;
  fruit += 2; store.set('fruit', fruit); flag('balloon'); sfx('pop'); renderHud(); toast(`<span>🎈 <b>${esc(t().balloonGot)}</b></span>`, 3200);
}
function startDance() {
  if (paused() || busy() || dancing) return;
  standUp(); path = null; autoAct = null; fishing = null; hideSay();
  dancing = { t: 0, beat: 0 }; flag('dance'); dog.pet = 2.4;
  for (const r of RES) if (r.here && Math.hypot(r.x - player.x, r.y - player.y) < 80) { r.dance = 2.4; r.tx = null; }
  sfx('dance');
}

/* ------------------------------------------------------------------ update */
let started = false, action = null, actionKey = '', time = 0, stepAt = 0;
const SPEED = 78;
const cardEl = $('card');
const paused = () => !started || cardEl.open;
function currentAction() {
  if (busy()) return null;
  if (fishing) return { type: 'fish' };
  let best = null, bd = 20;
  for (const s of PLACES) { const dist = Math.hypot(s.trig[0] * T + 8 - player.x, s.trig[1] * T + 10 - player.y); if (dist < bd && dist < (s.id === 'odyssey' ? 11 : 20)) { bd = dist; best = s; } }
  if (best) return { type: 'spot', spot: best };
  for (const r of RES) if (r.here && Math.hypot(r.x - player.x, r.y - player.y) < 20) return { type: 'talk', res: r };
  for (const g of DIGS) if (!holes.has(g.i) && Math.hypot(g.x - player.x, g.y - player.y) < 13) return { type: 'dig', dig: g };
  const [ptx, pty] = playerTile();
  if (sitting) return null;
  const bench = OBJECTS.find(o => o.kind === 'bench' && pty === o.ty + 1 && (ptx === o.tx || ptx === o.tx + 1));
  if (bench) return { type: 'sit', bench };
  const tr = FRUIT_TREES.find(q => Math.abs(q.tx - ptx) + Math.abs(q.ty - pty) === 1 && time >= q.ready);
  if (tr) return { type: 'shake', tree: tr };
  if (waterDir()) return { type: 'fish' };
  return null;
}
function update(dt) {
  time += dt;
  let mx = 0, my = 0;
  if (!paused() && !busy()) {
    if (keys.has('left')) mx -= 1; if (keys.has('right')) mx += 1;
    if (keys.has('up')) my -= 1; if (keys.has('down')) my += 1;
  }
  const px = player.x, py = player.y;
  if (mx || my) {
    standUp(); path = null; autoAct = null; fishing = null; dancing = null;
    const len = Math.hypot(mx, my), sx = mx / len * SPEED * dt, sy = my / len * SPEED * dt;
    if (!blocked(player.x + sx, player.y)) player.x += sx;
    if (!blocked(player.x, player.y + sy)) player.y += sy;
    player.dir = Math.abs(mx) >= Math.abs(my) && mx ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
  } else if (path && !paused() && !busy()) {
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
  if (player.moving && (stepAt += dt) > 0.27) { stepAt = 0; sfx('step'); }
  if (player.moving) {
    const last = trail[trail.length - 1];
    if (Math.hypot(player.x - last.x, player.y - last.y) >= 1) { trail.push({ x: player.x, y: player.y }); if (trail.length > 18) trail.shift(); }
    if (time - sayAt > 0.2) hideSay();   // a line spoken on arrival must not be wiped by that same last step
  }
  const fetching = ballS && ballS.phase !== 'fly';
  let aside = null;
  if (talking) { const ux = player.x - talking.x, uy = player.y - talking.y, ul = Math.hypot(ux, uy) || 1; aside = { x: player.x + ux / ul * 22, y: player.y + uy / ul * 22 + 4 };
    if (tileSolid(Math.floor(aside.x / T), Math.floor(aside.y / T))) aside = { x: player.x - uy / ul * 20, y: player.y + ux / ul * 20 };        // no room behind (water, a wall): wait beside instead
    if (tileSolid(Math.floor(aside.x / T), Math.floor(aside.y / T))) aside = { x: player.x + uy / ul * 20, y: player.y - ux / ul * 20 };
    if (tileSolid(Math.floor(aside.x / T), Math.floor(aside.y / T))) aside = { x: dog.x, y: dog.y }; }
  const target = fetching ? (ballS.phase === 'wait' ? ballS : player) : aside || trail[0], ddx = target.x - dog.x, ddy = target.y - dog.y, dd = Math.hypot(ddx, ddy);
  dog.moving = dd > 0.6;
  if (dog.moving) {
    const s = Math.min(dd, SPEED * (fetching ? 1.7 : 1.15) * dt);
    dog.x += ddx / dd * s; dog.y += ddy / dd * s;
    dog.hx = ddx / dd; dog.hy = ddy / dd;
    dog.anim += dt;
  } else { dog.anim = 0; const fx = player.x - dog.x, fy = player.y - dog.y, fl = Math.hypot(fx, fy); if (fl > 8) { dog.hx = fx / fl; dog.hy = fy / fl; } }
  for (const r of RES) {            // never stand inside a resident
    if (!r.here) continue;
    const ox = dog.x - r.x, oy = dog.y - r.y, ol = Math.hypot(ox, oy);
    if (ol < 17) { const push = (17 - ol) * Math.min(1, dt * 10), nx = ol > 0.01 ? ox / ol : 1, ny = ol > 0.01 ? oy / ol : 0; dog.x += nx * push; dog.y += ny * push; }
  }
  if (dog.pet > 0) dog.pet = Math.max(0, dog.pet - dt);
  updateResidents(dt);
  if (ballS) {
    ballS.t += dt;
    if (ballS.phase === 'fly') {
      const u = Math.min(1, ballS.t / 0.6); ballS.x = ballS.x0 + (ballS.x1 - ballS.x0) * u; ballS.y = ballS.y0 + (ballS.y1 - ballS.y0) * u; ballS.h = 0.9 * (1 - u) + Math.sin(u * Math.PI) * 1.3;
      if (u >= 1) { ballS.phase = 'wait'; ballS.h = 0; sfx('step'); }
    } else if (ballS.phase === 'wait') { if (Math.hypot(dog.x - ballS.x, dog.y - ballS.y) < 5) ballS.phase = 'carry'; }
    else {
      ballS.x = dog.x + dog.hx * 6; ballS.y = dog.y + dog.hy * 6; ballS.h = 0.5;
      if (Math.hypot(dog.x - player.x, dog.y - player.y) < 20) { ballS = null; dog.pet = 0.9; flag('fetch'); floatText(dog.x, dog.y, 1.3, '♥', 'heart'); sfx('pet'); if (!flags.has('fetched')) { flag('fetched'); toast(`<span>🎾 <b>${esc(t().fetchGot)}</b></span>`, 2200); } }
    }
    if (ballS && ballS.t > 14) ballS = null;
  }
  if (started && !cardEl.open) {
    if (!balloon && time > balloonAt) {
      balloon = { x: player.x - 250, y: player.y - 30 + Math.random() * 70, h: 3.6 }; sfx('whoosh');
      if (!flags.has('balloonSeen')) { flag('balloonSeen'); toast(`<span>🎈 ${esc(t().balloonHint)}</span>`, 5000); }
    }
    if (balloon) { balloon.x += 24 * dt; if (balloon.x > player.x + 330) { balloon = null; balloonAt = time + 40; } }
  }

  if (digging) {
    digging.t += dt;
    if (digging.t > 0.75) { const g = digging.g; digging = null; cheerAt = time; holes.add(g.i); store.set('holes', [...holes]);
      const left = EX.dig.map((_, i) => i).filter(i => !dug.has(i)), i = left.length ? left[Math.floor(Math.random() * left.length)] : 0;
      dug.add(i); store.set('dug', [...dug]); showItem('dig', i, true); }
  }
  if (shaking) {
    shaking.t += dt;
    if (shaking.t > 0.45 && !shaking.got) {
      shaking.got = true; cheerAt = time; fruit++; store.set('fruit', fruit); flag('fruit'); shaking.tree.ready = time + 40;
      floatText(shaking.tree.tx * T + 8, shaking.tree.ty * T + 10, 1.4, shaking.tree.v < 0.5 ? '+🍑' : '+🍊', 'gold'); sfx('fruit'); renderHud();
      const left = EX.tree.map((_, i) => i).filter(i => !shaken.has(i));          // the first shake always drops a note, later ones often do
      if (left.length && (!shaken.size || Math.random() < 0.6)) shaking.note = left[Math.floor(Math.random() * left.length)];
    }
    if (shaking.t > 0.85) { const n = shaking.note; shaking = null; if (n != null) { shaken.add(n); store.set('shaken', [...shaken]); showItem('tree', n, true); } }
  }
  if (dancing) {
    dancing.t += dt;
    if (dancing.t > dancing.beat) { dancing.beat += 0.45; floatText(player.x + (Math.random() - 0.5) * 20, player.y, 1.9, '♪', 'gold'); }
    if (dancing.t > 2.4) dancing = null;
  }
  checkTasks();
  if (fishing && !cardEl.open) {
    fishing.t += dt;
    if (fishing.phase === 'wait' && fishing.t > fishing.biteAt) { fishing.phase = 'bite'; fishing.t = 0; floatText(fishing.bx, fishing.by, 0.6, '!', 'alert'); sfx('bite'); }
    else if (fishing.phase === 'bite' && fishing.t > 1.2) { fishing = null; toast(esc(t().missed), 1800); sfx('miss'); }
    else if (fishing.phase === 'reel') { fishing.p -= dt * 0.2; if (fishing.p <= 0) { fishing = null; toast(esc(t().missed), 1800); sfx('miss'); } }
    else if (fishing.phase === 'land' && fishing.t > 0.85) {      // it is out of the water and in the visitor's hands
      const f = fishing; fishing = null;
      if (f.isNew) { caught.add(f.item); store.set('caught', [...caught]); }
      showItem('fish', f.item, f.isNew);
    }
  }

  action = paused() ? null : currentAction();
  const key = !action ? '' : action.type + (action.spot ? action.spot.id : '') + (action.dig ? action.dig.i : '') + (action.res ? action.res.def.id + (fruit > 0 ? 'f' : '') : '') + (action.tree ? action.tree.tx + '_' + action.tree.ty : '') + (action.bench ? 'b' + action.bench.tx : '') + (fishing ? fishing.phase : '') + lang;
  if (key !== actionKey) { actionKey = key; renderPrompt(); }

}
function faceSpot(s) {
  const dx = s.front.x - player.x, dy = s.front.y - player.y;
  player.dir = Math.abs(dx) > Math.abs(dy) + 8 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
function act() {
  if (!action) return;
  if (action.type === 'spot') return openSpot(action.spot);
  if (action.type === 'talk') return talkTo(action.res);
  if (action.type === 'sit') {
    path = null; dancing = null; sitting = action.bench; player.y = action.bench.ty * T + 15; player.dir = 'down'; sfx('pick');
    if (!flags.has('sit')) { flag('sit'); toast(`<span>🪑 ${esc(t().sitHint)}</span>`, 3600); }
    return;
  }
  if (action.type === 'dig') { path = null; dancing = null; digging = { g: action.dig, t: 0 }; player.dir = 'down'; sfx('dig'); return; }
  if (action.type === 'shake') {
    const tr = action.tree, [ptx, pty] = playerTile();
    path = null; dancing = null; shaking = { tree: tr, t: 0 };
    player.dir = tr.tx < ptx ? 'left' : tr.tx > ptx ? 'right' : tr.ty < pty ? 'up' : 'down'; sfx('shake'); return;
  }
  if (action.type === 'fish') {
    if (!fishing) {
      const k = waterDir(); if (!k) return;
      player.dir = k; path = null; dancing = null; sfx('cast');
      const [dx, dy] = DIRS[k], [tx, ty] = playerTile(), far = at(tx + dx * 2, ty + dy * 2) === W ? 1.9 : 1.15;
      fishing = { phase: 'wait', t: 0, biteAt: 1.3 + Math.random() * 2.6, bx: tx * T + 8 + dx * T * far, by: ty * T + 9 + dy * T * far };
    } else if (fishing.phase === 'wait') { fishing = null; toast(esc(t().early), 1800); sfx('miss'); }
    else if (fishing.phase === 'bite') { fishing.phase = 'reel'; fishing.t = 0; fishing.p = 0.3; sfx('reel'); }
    else if (fishing.phase === 'reel') {                          // every press winds the line in a little; stop and it slips back
      fishing.p += 0.16; sfx('reel');
      if (fishing.p >= 1) {
        const left = EX.fish.map((_, i) => i).filter(i => !caught.has(i));
        fishing.isNew = left.length > 0; fishing.item = left.length ? left[Math.floor(Math.random() * left.length)] : Math.floor(Math.random() * EX.fish.length);
        fishing.phase = 'land'; fishing.t = 0; sfx('catch');
      }
    }
  }
}

/* ------------------------------------------------------------------ labels + frame */
let guideAt = -1, guideCache = null;
function guide() {                  // target of the current to-do item, refreshed a few times a second
  if (time - guideAt > 0.3 || time < guideAt) { guideAt = time; const k = currentTask(); guideCache = k ? taskTarget(k) : null; }
  return guideCache;
}
const labelBox = $('labels'), labels = new Map(), OFF = { ok: false };
function label(id, onClick) {
  let e = labels.get(id);
  if (!e) { e = document.createElement('button'); e.className = 'label'; e.innerHTML = '<i></i><span></span>'; e.onclick = () => { e.blur(); onClick(); }; labelBox.appendChild(e); labels.set(id, e); }
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
  const gd = started ? guide() : null, nxt = gd && gd.spot || null;
  const far = gd && !cardEl.open && !dancing && Math.hypot(gd.x - player.x, gd.y - player.y) > 40;
  const talkNow = talking && !$('say').hidden ? { x: (player.x + talking.x) / 2, y: (player.y + talking.y) / 2 + 12 } : sitting ? { x: player.x, y: player.y - 6 } : null, quiet = !!(talking && talkNow);
  view.render({ time, dt, cheer: cheerAt, snow: time < snowUntil, talk: talkNow, sit: !!sitting, ball: ballS, balloon, player, dog, digging, fishing, dug: holes, shaking, dancing, foundRatio: found.size / SPOTS.length, residents: RES,
    target: path && path.length ? path[path.length - 1] : null,
    next: far ? { x: gd.x, y: gd.y } : null });
  for (const s of PLACES) {
    const game = !!s.badge, has = s === GUESS ? flags.has('mbti') : game ? false : found.has(s.id), isN = s === nxt, isA = action && action.spot === s;
    const away = Math.hypot(s.lab.x - player.x, s.lab.y - player.y), farAway = !isN && !isA && away > 120;       // nearby places show their name, further ones shrink to a dot, distant ones are left out
    place(label(s.id, () => { if (!paused() && !busy()) visitSpot(s); }), started && !quiet && (isN || away < 340) ? view.project(s.lab.x, s.lab.y, s.lab.h) : OFF,
      s.name[lang], (has ? 'has ' : '') + (isN ? 'next ' : '') + (isA ? 'on ' : '') + (farAway ? 'far' : ''), game ? (has ? '✓' : s.badge) : has ? '★' : isN ? '!' : '?');
  }
  if (fishing && fishing.phase === 'reel') $('prompt').style.setProperty('--p', Math.round(Math.min(1, fishing.p) * 100) + '%');
  place(label('dog', () => { if (!paused() && !busy()) petDog(); }), started && !quiet ? view.project(dog.x, dog.y, 1.2) : OFF, lang === 'zh' ? '苹果' : 'Bingo', 'res pet', '🐶');
  for (const h of HOMES) {
    const r = RES.find(q => q.def.id === h.id);
    place(label('home-' + h.id, () => { if (paused() || busy()) return; if (r.here) goTalk(r); else walkTo(h.x + 1, h.y + 3); }), started && !quiet && Math.hypot((h.x + 1.5) * T - player.x, (h.y + 2) * T - player.y) < 150 ? view.project((h.x + 1.5) * T, (h.y + 2) * T, 3.9) : OFF,
      r.here ? t().homeOf.replace('{n}', r.def.name[lang]) : t().lot, 'res' + (Math.hypot((h.x + 1.5) * T - player.x, (h.y + 2) * T - player.y) > 170 ? ' far' : ''), r.here ? '🏠' : '🪧');
  }
  for (const r of RES) place(label('res-' + r.def.id, () => { if (!paused() && !busy()) goTalk(r); }), started && r.here && !(quiet && r !== talking) && Math.hypot(r.x - player.x, r.y - player.y) < 260 ? view.project(r.x, r.y, 1.5) : OFF, r.def.name[lang] + ((gifts[r.def.id] || 0) >= 3 ? ' ♥' : ''), 'res', r.def.icon);
}
function goTalk(r) {
  const rx = Math.floor(r.x / T), ry = Math.floor((r.y - 2) / T), [sx, sy] = playerTile();      // stand beside them, so both faces show in the close-up
  const side = [[rx - 1, ry], [rx + 1, ry], [rx, ry + 1]].find(([x, y]) => !tileSolid(x, y) && findPath(sx, sy, x, y));
  const free = side || nearestFree(rx, ry + 1) || [rx, ry];
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
    case 'showcase': {
      const S_ = EX.showcase;
      return { title: S_.title[lang], meta: S_.meta[lang], body: S_.items.map(it => `<div class="show"><div class="show-ico" aria-hidden="true">${it.icon}</div><div>
        <h3>${esc(it.name)}</h3><p class="card-meta">${esc(it[lang][0])}</p><p>${esc(it[lang][1])}</p>${tagRow(it.tags)}
        ${it.links.length ? `<div class="links">${it.links.map((l, i) => ext(l.url, l[lang], i === 0)).join('')}</div>` : ''}</div></div>`).join('') };
    }
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
        <h3>${esc(u.socials)}</h3>
        <div class="rows">
          <a class="row" href="https://x.com/Starry_n_n" target="_blank" rel="noopener noreferrer"><small>X</small><b>@Starry_n_n ↗</b></a>
          <a class="row" href="https://www.instagram.com/starry_n_n/" target="_blank" rel="noopener noreferrer"><small>Instagram</small><b>@starry_n_n ↗</b></a>
          <a class="row" href="https://www.xiaohongshu.com/user/profile/59e4a1d04eacab3c568d9726" target="_blank" rel="noopener noreferrer"><small>${esc(u.xhs)}</small><b>${esc(lang === 'zh' ? '我的小红书主页' : 'My Xiaohongshu page')} ↗</b></a>
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
/* ---- guest board: design an avatar, move in, leave a private note ---- */
let draft = null;
const guestIdx = RES.findIndex(r => r.def.id === 'guest');
function openGuest(step, msg) {
  const u = t(), G = EX.guestbook, joined = flags.has('guest') && guestLook;
  if (ownerGuest) return showCard('✍️', G.name[lang], '', `<div class="g-face">${GA.svg(ownerGuest, 110)}</div><p class="lead center"><b>${esc(ownerGuest.name)}</b></p><p class="center">${esc(ownerGuest.message || '')}</p>`, 'mini', () => openGuest());
  if (!step) step = joined ? 'home' : 'design';
  const note = msg ? `<p class="mbti-msg" style="color:#c9584e">${esc(msg)}</p>` : '';
  if (step === 'design') {
    draft = draft || Object.assign({ name: '', species: 'cat', color: GA.FUR[0], accent: GA.SHIRT[0], acc: 'none', line: '' }, guestLook || {});
    const sw = (list, key) => `<div class="g-sw">${list.map(c => `<button data-g="${key}:${c}" aria-pressed="${draft[key] === c}" aria-label="${c}" style="background:${c}"></button>`).join('')}</div>`;
    return showCard('✍️', G.name[lang], '', `<p class="center">${esc(G.intro[lang])}</p><div class="g-face g-stage" id="gFace">${GA.svg(draft, 132)}</div>
      <label class="g-l">${esc(u.gName)}<input id="gName" maxlength="24" autocomplete="off" value="${esc(draft.name)}"></label>
      <div class="g-l">${esc(u.gSpecies)}<div class="g-sp">${GA.SPECIES.map(([id, ic]) => `<button data-g="species:${id}" aria-pressed="${draft.species === id}">${ic}</button>`).join('')}</div></div>
      <div class="g-l">${esc(u.gFur)}${sw(GA.FUR, 'color')}</div><div class="g-l">${esc(u.gShirt)}${sw(GA.SHIRT, 'accent')}</div>
      <div class="g-l">${esc(u.gAcc)}<div class="g-sp">${GA.ACC.map(([id, ic]) => `<button data-g="acc:${id}" aria-pressed="${draft.acc === id}">${ic}</button>`).join('')}</div></div>
      <label class="g-l">${esc(u.gLine)}<input id="gLine" maxlength="60" autocomplete="off" value="${esc(draft.line || '')}" placeholder="${esc(u.gLineEx)}"></label>${note}
      <div class="links center"><button class="btn btn-main" data-act="g-join">${esc(u.gJoin)} 🏡</button></div>`, 'mini', () => openGuest('design'));
  }
  if (step === 'note') {
    return showCard('✍️', G.name[lang], '', `<div class="g-face">${GA.svg(guestLook, 84)}</div><p class="lead center">${esc(G.askNote[lang].replace('{n}', guestLook.name))}</p>
      <label class="g-l">${esc(u.gMsg)}<textarea id="gMsg" maxlength="500" rows="4"></textarea></label><label class="g-l">${esc(u.gContact)}<input id="gContact" maxlength="120" autocomplete="email"></label>
      <p class="caption">${esc(G.privacy[lang])}</p>${note}
      <div class="links center"><button class="btn btn-main" data-act="g-send">${esc(u.gSend)} ✉</button><button class="btn" data-act="close">${esc(u.gLater)}</button></div>`, 'mini', () => openGuest('note'));
  }
  if (step === 'sent') return showCard('✍️', G.name[lang], '', `<div class="item-big" aria-hidden="true">💌</div><p class="lead center">${esc(G.sent[lang])}</p>
    <p class="caption center">${esc(G.fallback[lang].replace('{mail}', d().mail))}</p><textarea class="g-copy" id="gCopy" readonly rows="5">${esc(lastMail)}</textarea>
    <div class="links center"><button class="btn" data-act="g-copy">${esc(u.gCopy)}</button><button class="btn" data-act="postcard">📸 ${esc(u.gSaveCard)}</button></div>`, 'mini', () => openGuest('sent'));
  showCard('✍️', G.name[lang], '', `<div class="g-face">${GA.svg(guestLook, 110)}</div><p class="lead center"><b>${esc(guestLook.name)}</b></p><p class="center">${esc(u.gYours)}</p>
    <div class="links center"><button class="btn btn-main" data-act="g-note">${esc(u.gNote)} ✉</button><button class="btn" data-act="g-edit">${esc(u.gEdit)}</button></div>`, 'mini', () => openGuest('home'));
}
function joinGuest() {
  draft.name = ($('gName').value || '').replace(/[<>]/g, '').trim().slice(0, 24); draft.line = $('gLine').value || '';
  if (!draft.name) return openGuest('design', t().gNeedName);
  guestLook = GA.clean(draft); draft = null; store.set('guest', guestLook); dressGuest(guestLook);
  if (view && guestIdx >= 0) view.setCritter(guestIdx, guestDef);
  const first = !flags.has('guest'); flag('guest'); syncResidents(first); sfx('right'); renderHud();
  openGuest('note');
}
let lastMail = '';
function sendNote() {            // opens the visitor's own mail app with the note ready to send; nothing is stored anywhere else
  const u = t(), G = EX.guestbook, message = ($('gMsg').value || '').trim().slice(0, 500), contact = ($('gContact').value || '').trim().slice(0, 120);
  if (!message) return openGuest('note', u.gNeedMsg);
  const code = btoa(unescape(encodeURIComponent(JSON.stringify({ name: guestLook.name, species: guestLook.species, color: guestLook.color, accent: guestLook.accent, acc: guestLook.acc, line: guestLook.line, message })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const link = 'https://starry-nn.github.io/starry-town/#g=' + code;
  lastMail = [message, '', '— ' + guestLook.name + ' (' + GA.icon(guestLook.species) + ')', contact ? G.mailContact[lang] + contact : '', '', G.mailLink[lang], link].filter((x, i) => x !== '' || i === 1 || i === 4).join('\n');
  const subject = G.mailSubject[lang].replace('{n}', guestLook.name);
  sfx('item'); openGuest('sent');
  const url = 'mailto:' + d().mail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lastMail);
  if (window.__town.openMail) window.__town.openMail(url); else location.href = url;
}
let guess = ['', '', '', ''];
function openMbti(msg, cls) {
  const M = EX.mbti, u = t(), done = flags.has('mbti');
  const pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
  showCard('🔮 MBTI', M.name[lang], '', done
    ? `<div class="item-big" aria-hidden="true">🔮</div><p class="lead center">${esc(M.solved[lang].replace('{a}', M.answers[0]))}</p>`
    : `<p class="lead center">${esc(M.ask[lang])}</p>
       <div class="mbti">${pairs.map((pr, i) => `<div>${pr.map(c => `<button data-mbti="${i}${c}" aria-pressed="${guess[i] === c}">${c}</button>`).join('')}</div>`).join('')}</div>
       <p class="mbti-msg" aria-live="polite" style="color:${cls === 'bad' ? '#c9584e' : 'inherit'}">${esc(msg || '')}</p>
       <div class="links center"><button class="btn btn-main" data-act="guess"${guess.every(Boolean) ? '' : ' disabled'}>${esc(u.guess)} ${esc(guess.map(c => c || '·').join(''))}</button></div>`, 'mini', () => openMbti());
}
function tryGuess() {
  const M = EX.mbti, g = guess.join('');
  if (g.length < 4) return;
  if (M.answers.includes(g)) {
    flag('mbti'); sfx('right'); syncResidents(true); renderHud();
    showCard('🔮 MBTI', g, '', `<div class="item-big" aria-hidden="true">🎉</div><p class="lead center">${esc(M.right[lang])}</p>`, 'mini', () => openMbti());
  } else {
    const n = Math.max(...M.answers.map(a => [...a].filter((c, i) => c === g[i]).length));
    sfx('wrong'); openMbti(M.wrong[lang].replace('{n}', n), 'bad');
  }
}
function openSpot(s) {
  if (s === GUESS) { sfx('open'); return openMbti(); }
  if (s === BOARD) { sfx('open'); return openGuest(); }
  if (s === XMAS) { snowUntil = time + 25; flag('xmas'); sfx('jingle'); toast(`<span>🎄 <b>${esc(t().xmasOn)}</b></span>`, 3200); return; }
  const k = content(s);
  showCard(t().kick[s.kind], k.title, k.meta, k.body, '', () => openSpot(s));
  if (!found.has(s.id)) {
    found.add(s.id); store.set('found', [...found]);
    floatText(dog.x, dog.y, 1.3, '♥', 'heart'); floatText(s.lab.x, s.lab.y, s.lab.h + 0.4, '+★', 'gold');
    pendingToast = found.size === SPOTS.length ? 'all' : 'star';
    sfx('star'); renderHud();
  } else sfx('open');
}
function showItem(kind, i, isNew, fromBag) {
  const it = EX[kind][i], u = t(), [name, text] = it[lang];
  showCard(fromBag ? u.bagTitle : kind === 'dig' ? u.dugTitle : kind === 'tree' ? u.treeTitle : u.fishTitle, name, isNew || fromBag ? '' : u.again,
    `<div class="item-big" aria-hidden="true">${it.icon}</div><p class="lead center">${esc(text)}</p>` +
    (it.link ? `<div class="links center">${ext(it.link.url, it.link[lang], true)}</div>` : '') +
    (it.cta ? `<div class="links center"><a class="btn btn-main" href="mailto:${esc(d().mail)}">${esc(u.writeMe)} ✉</a></div>` : '') +
    `<p class="caption center">🎒 ${itemCount()}/${itemTotal}</p>`, 'mini', () => showItem(kind, i, isNew, fromBag));
  if (isNew && !fromBag) { floatText(dog.x, dog.y, 1.3, '♥', 'heart'); syncResidents(true); sfx('item'); renderHud(); }
}
function openBag() {
  const u = t();
  const grid = (kind, set) => `<div class="bag-grid">${EX[kind].map((it, i) => set.has(i)
    ? `<button class="slot" data-kind="${kind}" data-i="${i}"><span>${it.icon}</span><small>${esc(it[lang][0])}</small></button>`
    : `<div class="slot empty"><span>?</span><small>${esc(u.unknown)}</small></div>`).join('')}</div>`;
  const nDone = EX.tasks.filter(k => taskDone(k.id)).length;
  const N = EX.notes[lang];
  showCard(`🎒 ${itemCount()}/${itemTotal} · ★ ${found.size}/${SPOTS.length}`, u.bagTitle, u.bagMeta,
    `<h3>${esc(u.tasks)} · ${nDone}/${EX.tasks.length}</h3><ul class="tasks">${EX.tasks.map(k => `<li class="${taskDone(k.id) ? 'done' : ''}"><i>${taskDone(k.id) ? '✓' : ''}</i><span>${k.icon}</span>${esc(k[lang])}</li>`).join('')}</ul>
     <h3>${esc(u.neighbours)} · ${RES.filter(r => r.here).length}/${RES.length}</h3><div class="bag-grid">${RES.map(r => r.here
       ? `<div class="slot"><span>${r.def.icon}</span><small>${esc(r.def.name[lang])}</small></div>`
       : `<div class="slot empty"><span>?</span><small>${esc(r.def.unlock === 'mbti' ? u.lockedMbti : r.def.unlock === 'guest' ? u.lockedGuest : u.lockedRes.replace('{n}', r.def.at))}</small></div>`).join('')}</div>
     <h3>${esc(u.treasures)} · ${dug.size}/${EX.dig.length}</h3>${grid('dig', dug)}
     <h3>${esc(u.catches)} · ${caught.size}/${EX.fish.length}</h3>${grid('fish', caught)}
     <h3>${esc(u.notes)} · ${shaken.size}/${EX.tree.length}</h3>${grid('tree', shaken)}
     <p class="caption">${esc(u.toolsText)}</p>
     <h3>${esc(u.fruitLine)} · 🍑 × ${fruit}</h3><p class="caption">${esc(u.fruitHint)}</p>
     <h3>${esc(u.settings)}</h3><div class="links"><button class="btn" data-act="sound">${soundOn ? '🔊 ' + esc(u.soundOn) : '🔇 ' + esc(u.soundOff)}</button><button class="btn" data-act="music">${musicOn ? '🎵 ' + esc(u.musicOn) : '🎵 ' + esc(u.musicOff)}</button><button class="btn" data-act="mode">${{ day: '☀️', dusk: '🌇', night: '🌙' }[mode]} ${esc(u.modes[mode])}</button><button class="btn" data-act="postcard">📸 ${esc(u.postcard)}</button><button class="btn" data-act="reset">↺ ${esc(u.restart)}</button></div>
     <details class="notes"><summary>${esc(N[0])}</summary><div class="rows">${N[1].map((n, i) => `<div class="row"><small>0${i + 1}</small><b>${esc(n[0])}</b><span>${esc(n[1])}</span></div>`).join('')}</div></details>`, '', openBag);
}
$('cardBody').addEventListener('click', e => {
  const slot = e.target.closest('.slot[data-kind]'), btn = e.target.closest('[data-act]'), pick = e.target.closest('[data-mbti]');
  const go = e.target.closest('[data-go]');
  if (go) { const s = spotById[go.dataset.go]; cardEl.close(); if (s && !busy()) visitSpot(s); return; }
  const gp = e.target.closest('[data-g]');
  if (gp && draft) { const [k, v] = gp.dataset.g.split(/:(.+)/); draft.name = $('gName').value; draft.line = $('gLine').value; draft[k] = v; sfx('pick'); openGuest('design'); return; }
  if (pick) { const v = pick.dataset.mbti; guess[+v[0]] = v[1]; sfx('pick'); openMbti(); return; }
  if (btn) {
    const a = btn.dataset.act;
    if (a === 'guess') tryGuess();
    if (a === 'g-join') joinGuest();
    if (a === 'g-send') sendNote();
    if (a === 'g-note') openGuest('note');
    if (a === 'g-copy') { const ta = $('gCopy'); ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } btn.textContent = '✓ ' + t().gCopied; }
    if (a === 'g-edit') { draft = null; openGuest('design'); }
    if (a === 'reset') askReset();
    if (a === 'reset-yes') resetAll();
    if (a === 'close') cardEl.close();
    if (a === 'music') { setMusic(!musicOn); renderHud(); openBag(); }
    if (a === 'sound') { soundOn = !soundOn; store.set('sound', soundOn); sfx('open'); renderHud(); openBag(); }
    if (a === 'mode') { setMode({ day: 'dusk', dusk: 'night', night: 'day' }[mode]); openBag(); }
    if (a === 'postcard') openPostcard();
    if (a === 'bag') openBag();
  }
  if (slot) showItem(slot.dataset.kind, +slot.dataset.i, false, true);
});
function makePostcard() {
  render(0);                                   // draw a fresh frame, then copy it before the browser clears it
  const Wd = 1200, Hd = 800, band = 150, cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd;
  const c = cv.getContext('2d'), sky = c.createLinearGradient(0, 0, 0, Hd - band);
  const cols = { day: ['#a9dcf5', '#dff4fb'], dusk: ['#f7a98c', '#ffeccf'], night: ['#1d2456', '#5a6bb5'] }[mode];
  sky.addColorStop(0, cols[0]); sky.addColorStop(1, cols[1]); c.fillStyle = sky; c.fillRect(0, 0, Wd, Hd - band);
  const ar = Wd / (Hd - band); let sw = canvas.width, sh = sw / ar;
  if (sh > canvas.height) { sh = canvas.height; sw = sh * ar; }
  c.drawImage(canvas, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh, 0, 0, Wd, Hd - band);
  c.fillStyle = '#fffaf0'; c.fillRect(0, Hd - band, Wd, band);
  c.fillStyle = '#f5b01a'; c.fillRect(0, Hd - band, Wd, 6);
  const F = '"Nunito","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
  c.fillStyle = '#6b4f3a'; c.textBaseline = 'middle'; c.font = `900 46px ${F}`; c.fillText(t().greet + ' ★', 44, Hd - band + 54);
  c.font = `800 26px ${F}`; c.fillStyle = '#9a8068';
  c.fillText(`★ ${found.size}/${SPOTS.length}   ·   🎒 ${itemCount()}/${itemTotal}   ·   🏡 ${RES.filter(r => r.here).length}/${RES.length}   ·   ${d().name}`, 44, Hd - band + 108);
  c.textAlign = 'right'; c.fillStyle = '#46a368'; c.fillText('starry-nn.github.io/starry-town', Wd - 44, Hd - band + 108);
  return cv;
}
function openMap() {               // the whole island at a glance; click a place to walk there
  const u = t(), Wm = 960, Hm = Math.round(Wm * MH / MW), cv = document.createElement('canvas'); cv.width = Wm; cv.height = Hm;
  const c = cv.getContext('2d'); c.fillStyle = '#8fd8ee'; c.fillRect(0, 0, Wm, Hm); c.drawImage(ground, 0, 0, Wm, Hm);
  const k = Wm / (MW * T);
  BUILDINGS.concat(HOMES.filter(h => RES.find(r => r.def.id === h.id).here)).forEach(b => { c.fillStyle = b.roof || '#5d5b8a'; c.beginPath(); c.roundRect(b.x * T * k + 1, b.y * T * k + 1, b.w * T * k - 2, b.h * T * k - 2, 5); c.fill(); });
  const pins = PLACES.filter(s => !s.badge || s === BOARD || s === GUESS).map(s => { const has = s.badge ? false : found.has(s.id);
    return `<button class="pin${has ? ' has' : ''}${s.badge ? ' fun' : ''}" data-go="${s.id}" style="left:${(s.lab.x / (MW * T) * 100).toFixed(2)}%;top:${(s.lab.y / (MH * T) * 100).toFixed(2)}%"><i>${s.badge || (has ? '★' : '?')}</i><span>${esc(s.name[lang])}</span></button>`; }).join('');
  showCard('🗺️', u.mapTitle, u.mapMeta, `<div class="map"><img src="${cv.toDataURL('image/jpeg', 0.85)}" alt="">${pins}
    <span class="pin you" style="left:${(player.x / (MW * T) * 100).toFixed(2)}%;top:${(player.y / (MH * T) * 100).toFixed(2)}%"><i>●</i><span>${esc(u.mapYou)}</span></span></div>
    <p class="caption center">★ ${esc(u.mapFound)} ${found.size}/${SPOTS.length} · ? ${esc(u.mapNew)}</p>`, 'wide', openMap);
}
function askReset() {
  const u = t();
  showCard('↺', u.resetTitle, '', `<p class="lead center">${esc(u.resetText)}</p><div class="links center"><button class="btn btn-danger" data-act="reset-yes">${esc(u.resetYes)}</button><button class="btn" data-act="${started ? 'bag' : 'close'}">${esc(u.resetNo)}</button></div>`, 'mini', askReset);
}
function resetAll() {
  leaving = true;
  ['found', 'dug', 'holes', 'digs', 'caught', 'shaken', 'fruit', 'flags', 'tasks', 'gifts', 'pos', 'guest'].forEach(k => { try { localStorage.removeItem('starry-town-' + k); } catch (e) {} });
  location.reload();
}
function openPostcard() {
  const u = t(), url = makePostcard().toDataURL('image/jpeg', 0.9);
  showCard('📸', u.postcardTitle, u.postcardMeta,
    `<img class="postcard" src="${url}" alt="${esc(u.postcardTitle)}"><div class="links center"><a class="btn btn-main" download="starry-town-postcard.jpg" href="${url}">${esc(u.save)} ↓</a><button class="btn" data-act="bag">${esc(u.back)}</button></div>`, 'wide', openPostcard);
}
function openQuick() {
  const u = t();
  const group = (title, ids) => `<section class="qv-sec"><h3>${esc(title)}</h3>${ids.map(id => {
    const k = content(spotById[id]);
    return `<div class="qv-item">${ids.length === 1 ? '' : `<h4>${esc(k.title)}</h4>`}<p class="card-meta">${esc(k.meta)}</p>${k.body}</div>`;
  }).join('')}</section>`;
  showCard(u.quickKicker, d().name, d().place,
    group(u.aboutTitle, ['about']) + group(u.sec.show, ['showcase']) + group(u.sec.exp, ['monolith', 'manus', 'crossing', 'linear', 'waves']) +
    group(u.sec.work, ['orbit', 'sync', 'agent', 'wavo', 'odyssey']) + group(u.sec.focus, ['focus']) +
    group(u.sec.edu, ['edu']) + group(u.sec.skills, ['skills']) + group(u.sec.life, ['life']) + group(u.sec.contact, ['contact']), 'wide', openQuick);
}
function toast(html, ms) {
  const e = $('toast'); e.onclick = null; e.style.cursor = ''; e.innerHTML = html; e.hidden = false;
  clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => { e.hidden = true; }, ms);
}
cardEl.addEventListener('close', () => {
  reopen = null; keys.clear(); sfx('close');
  if (pendingMove) {
    const r = pendingMove; pendingMove = null; pendingToast = null;
    toast(`<span>🏡 <b>${esc(r.def.name[lang])}</b> ${esc(t().movedIn)}</span><button class="btn" id="toastGo">${esc(t().goSee)} →</button>`, 9000); sfx('move');
    const go = () => { $('toast').hidden = true; $('toast').onclick = null; if (!paused() && !busy()) goTalk(r); };
    $('toast').onclick = go; $('toast').style.cursor = 'pointer';
    return;
  }
  if (pendingToast === 'all') {
    toast(`<span>✨ <b>${esc(t().allDone.replace('{n}', SPOTS.length))}</b></span><button class="btn" id="toastHi">${esc(t().sayHi)}</button>`, 12000);
    $('toastHi').onclick = () => { $('toast').hidden = true; openSpot(spotById.contact); };
  } else if (pendingToast === 'star') toast(`<span>★ <b>${esc(t().newStar)}</b> · ${found.size}/${SPOTS.length}</span>`, 2200);
  pendingToast = null;
});
cardEl.addEventListener('click', e => { if (e.target === cardEl) cardEl.close(); });
$('cardClose').onclick = () => cardEl.close();

/* ------------------------------------------------------------------ HUD / intro */
const touch = matchMedia('(pointer: coarse)').matches;
const svg = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  sound: svg('<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.5a8 8 0 0 1 0 11"/>'),
  mute: svg('<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
};
function renderPrompt() {
  const e = $('prompt'), u = t();
  if (!action || !started || !$('say').hidden) { e.hidden = true; return; }
  let label = '', cls = '';
  if (action.type === 'spot') label = `${u.visit} · ${action.spot.name[lang]}`;
  else if (action.type === 'talk') label = fruit > 0 ? `🎁 ${u.give} ${action.res.def.name[lang]}` : `💬 ${u.talk} ${action.res.def.name[lang]}`;
  else if (action.type === 'shake') label = `🌳 ${u.shake}`;
  else if (action.type === 'sit') label = `🪑 ${u.sit}`;
  else if (action.type === 'dig') label = `⛏ ${u.dig}`;
  else if (!fishing) label = `🎣 ${u.fish}`;
  else if (fishing.phase === 'wait') { label = `🎣 ${u.wait}`; cls = 'calm'; }
  else if (fishing.phase === 'reel') { label = `🎣 ${touch ? u.reelTouch : u.reel}`; cls = 'reel'; }
  else { label = `❗ ${u.pull}`; cls = 'hot'; }
  e.className = 'prompt ' + cls;
  e.innerHTML = `${touch || cls === 'calm' ? '' : '<kbd>E</kbd>'}${esc(label)}`;
  e.hidden = false;
}
function renderQuest() {
  const e = $('quest'), u = t();
  if (!started) { e.hidden = true; return; }
  const k = currentTask(), n = EX.tasks.filter(q => taskDone(q.id)).length;
  e.innerHTML = k ? `📋 ${n}/${EX.tasks.length} · ${esc(u.nextTask)}: <b>${k.icon} ${esc(k[lang])}</b>` : `🎉 ${n}/${EX.tasks.length} · ${esc(u.tasks)}`;
  e.hidden = false;
}
function renderHud() {
  const u = t();
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $('hudName').textContent = d().name;
  $('hudCount').textContent = `★ ${found.size}/${SPOTS.length}`;
  $('btnBag').innerHTML = `🎒 <span>${itemCount()}/${itemTotal}</span>`; $('btnBag').setAttribute('aria-label', u.bag);
  $('btnQuick').textContent = u.quick; $('btnQuick2').textContent = u.quickLong; $('btnStart').textContent = hasProgress() ? u.cont : u.enter;
  $('btnReset').hidden = started || !hasProgress(); $('btnReset').textContent = '↺ ' + u.restart;
  $('btnMute').hidden = !started; $('btnMute').innerHTML = soundOn || musicOn ? ICON.sound : ICON.mute; $('camCtl').hidden = !started; $('btnMute').setAttribute('aria-label', u.mute); $('btnMute').title = u.mute;
  [['btnView', u.viewBtn + (touch ? '' : ' (V)')], ['btnZoomIn', u.zoomIn], ['btnZoomOut', u.zoomOut]].forEach(([id, tip]) => { $(id).hidden = !started; $(id).title = tip; $(id).setAttribute('aria-label', tip); });
  [['btnBall', u.ballBtn + (touch ? '' : ' (F)')], ['btnCard', u.postcard], ['btnMap', u.mapBtn + (touch ? '' : ' (M)')]].forEach(([id, tip]) => { $(id).hidden = !started; $(id).title = tip; $(id).setAttribute('aria-label', tip); });
  $('btnDance').hidden = !started; $('btnDance').setAttribute('aria-label', u.dance); $('btnDance').title = u.dance + (touch ? '' : ' (Q)');
  $('btnCv').textContent = u.cv; $('btnCv').href = lang === 'zh' ? 'assets/Nan_Yao_Resume_CN.pdf' : 'assets/Nan_Yao_Resume_EN.pdf';
  $('btnLang').textContent = u.lang; $('btnLang2').textContent = u.lang;
  $('introKicker').textContent = u.kicker; $('introSub').textContent = hasProgress() ? u.subBack.replace('{a}', `${found.size}/${SPOTS.length}`).replace('{b}', `${itemCount()}/${itemTotal}`) : u.sub;
  $('introBy').textContent = u.by; $('introMoreSum').textContent = u.moreSum;
  $('introKeys').innerHTML = (touch ? u.keysTouch : u.keys).map(k => `<li><kbd>${esc(k[0])}</kbd>${esc(k[1])}</li>`).join('');
  $('introHow').innerHTML = (touch ? u.howTouch : u.how).map(h => `<li><span>${h[0]}</span><div><b>${esc(h[1])}</b>${esc(h[2])}</div></li>`).join('');
  $('sayName').textContent = sayWho || u.speaker; $('sayMore').textContent = u.next;
  renderPrompt(); renderQuest();
}
function setMode(m) {
  mode = m; document.body.dataset.mode = m; music.step = 0; music.next = 0;
  if (view) view.setMode(m);
}
function setLang() {
  lang = lang === 'en' ? 'zh' : 'en'; store.set('lang', lang);
  renderHud();
  if (!$('say').hidden && !sayWho) say(t().hello, true);
  if (cardEl.open && reopen) reopen();
}
let sayTimer = 0, sayWho = null, sayAt = -1;
const VOICE = { cat: 620, fox: 700, bunny: 820, bear: 300, frog: 240 };
function say(text, instant, who, pitch) {
  const e = $('say'), p = $('sayText');
  sayWho = who || null; $('sayName').textContent = sayWho || t().speaker; sayAt = time;
  e.hidden = false; clearInterval(sayTimer); $('prompt').hidden = true;
  if (instant || reduceMotion) { p.textContent = text; return; }
  let i = 0, n = 0; p.textContent = ''; const base = pitch || 470;
  sayTimer = setInterval(() => {
    i += 2; p.textContent = text.slice(0, i);
    if (n++ % 3 === 0 && soundOn && started && /\S/.test(text.slice(i - 2, i))) tone(base * (0.85 + Math.random() * 0.45), 0.055, { type: 'triangle', vol: 0.035 });   // babble while the text types out
    if (i >= text.length) clearInterval(sayTimer);
  }, 22);
}
function hideSay() { talking = null; player.face = null; if (!$('say').hidden) { $('say').hidden = true; clearInterval(sayTimer); renderPrompt(); } }
function start() {
  if (started || !view) return;
  const back = hasProgress();
  started = true; $('intro').hidden = true; audio();
  EX.tasks.forEach(k => { if (taskDone(k.id)) tasksSeen.add(k.id); });   // returning visitors: no replay of old announcements
  renderHud(); say(back ? t().helloBack : t().hello);
}
$('btnView').onclick = () => { $('btnView').blur(); nextView(); };
$('btnZoomIn').onclick = () => { $('btnZoomIn').blur(); zoomBy(1 / 1.2); }; $('btnZoomOut').onclick = () => { $('btnZoomOut').blur(); zoomBy(1.2); };
$('btnMap').onclick = () => { $('btnMap').blur(); if (started && !cardEl.open) openMap(); };
$('btnBall').onclick = () => { $('btnBall').blur(); throwBall(); };
$('btnCard').onclick = () => { $('btnCard').blur(); if (started && !cardEl.open) openPostcard(); };
$('btnStart').onclick = start; $('btnReset').onclick = askReset;
$('btnDance').onclick = () => { $('btnDance').blur(); startDance(); };
$('btnMute').onclick = () => { $('btnMute').blur(); const on = !(soundOn || musicOn); soundOn = on; store.set('sound', on); setMusic(on); renderHud(); };
$('btnQuick').onclick = openQuick;
$('btnBag').onclick = openBag;
$('btnLang').onclick = setLang; $('btnLang2').onclick = setLang;
$('say').onclick = hideSay;
$('prompt').onclick = () => { $('prompt').blur(); act(); };
$('quest').onclick = () => { $('quest').blur(); if (paused() || busy()) return; guideAt = -1; const g = guide(); if (g) g.go(); else openBag(); };

/* ------------------------------------------------------------------ input */
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || cardEl.open || !started) return;
  const onButton = e.target instanceof HTMLElement && e.target.closest('button, a, summary');
  if (KEYMAP[e.key]) { keys.add(KEYMAP[e.key]); e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return; }
  if (e.key === 'v' || e.key === 'V') { e.preventDefault(); if (!e.repeat) nextView(); return; }
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomBy(1 / 1.12); return; }
  if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(1.12); return; }
  if (e.key === 'm' || e.key === 'M') { e.preventDefault(); if (!e.repeat) openMap(); return; }
  if (e.key === 'f' || e.key === 'F') { e.preventDefault(); if (!e.repeat) throwBall(); return; }
  if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); if (!e.repeat) startDance(); return; }
  if (e.key === 'e' || e.key === 'E' || ((e.key === ' ' || e.key === 'Enter') && !onButton)) {
    e.preventDefault();
    if (!$('say').hidden) { hideSay(); return; }
    if (!e.repeat) act();
  }
});
addEventListener('keyup', e => { if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]); });
addEventListener('blur', () => keys.clear());
// Clicks are tested against what is actually on screen: each place has a few 3D boxes around its model.
function hull(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of pts) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i]; while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function inHull(h, x, y) {
  let sign = 0;
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length], cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(cr) < 1e-9) continue;
    if (sign && Math.sign(cr) !== sign) return false;
    sign = Math.sign(cr);
  }
  return true;
}
function spotAt(mx, my) {
  let best = null;
  for (const s of PLACES) for (const b of s.boxes) {
    const pts = [];
    for (const X of [b.x0, b.x1]) for (const Z of [b.z0, b.z1]) for (const Y of [0, b.h]) { const q = view.project(X * T, Z * T, Y, true); pts.push([q.x, q.y]); }
    if (inHull(hull(pts), mx, my) && (!best || s.front.y > best.front.y)) best = s;
  }
  return best;
}
function onBody(x, y, h, mx, my) {
  const a = view.project(x, y, 0, true), b = view.project(x, y, h, true), r = Math.max(14, (a.y - b.y) * 0.55);
  return Math.hypot(mx - a.x, my - (a.y + b.y) / 2) < r;
}
canvas.addEventListener('pointerdown', e => {
  if (paused() || busy()) return;
  hideSay();
  const mx = e.clientX, my = e.clientY;
  if (balloon) { const q = view.project(balloon.x, balloon.y, balloon.h + 0.9, true); if (Math.hypot(mx - q.x, my - q.y) < 40) { popBalloon(); return; } }
  if (onBody(dog.x, dog.y, 0.95, mx, my)) { petDog(); return; }
  const who = RES.find(r => r.here && onBody(r.x, r.y, 1.25, mx, my));
  if (who) { goTalk(who); return; }
  const hit = spotAt(mx, my);
  if (hit) { visitSpot(hit); return; }
  const { x: wx, y: wy } = view.pick(mx, my);
  const g = DIGS.find(g => !holes.has(g.i) && Math.hypot(g.x - wx, g.y - wy) < 11);
  if (g) { walkTo(g.tx, g.ty, () => { action = currentAction(); if (action && action.type === 'dig') act(); }); return; }
  if (fishing) { act(); return; }
  // fruit trees: of the ones under the pointer that can be reached, take the one closest to it
  const tree = FRUIT_TREES.filter(tr => time >= tr.ready && onBody(tr.tx * T + 8, tr.ty * T + 12, 2.5, mx, my) && treeSide(tr))
    .map(tr => { const q = view.project(tr.tx * T + 8, tr.ty * T + 12, 1.4, true); return { tr, d: Math.hypot(q.x - mx, q.y - my) }; })
    .sort((a, b) => a.d - b.d)[0];
  if (tree) { goShake(tree.tr); return; }
  const free = nearestFree(Math.floor(wx / T), Math.floor(wy / T));
  if (free) walkTo(free[0], free[1]);
});

canvas.addEventListener('wheel', e => {       // two-finger scroll (or the wheel) tilts the camera; pinch (which browsers report as ctrl + wheel) zooms
  if (paused()) return; e.preventDefault();
  const d = Math.max(-60, Math.min(60, e.deltaY));
  if (e.ctrlKey || e.metaKey) zoomBy(Math.exp(d * 0.012)); else tiltBy(d * 0.0032);
}, { passive: false });
let pinch = 0;
canvas.addEventListener('touchmove', e => {       // two fingers: pinch to zoom
  if (e.touches.length !== 2 || paused()) return;
  e.preventDefault();
  const dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  if (pinch) { zoomBy(pinch / dd); path = null; autoAct = null; }
  pinch = dd;
}, { passive: false });
canvas.addEventListener('touchend', () => { pinch = 0; });

/* ------------------------------------------------------------------ boot */
PLACES.forEach(s => { if (!findPath(HOME[0], HOME[1], s.trig[0], s.trig[1])) console.warn('Unreachable spot:', s.id); });
EX.residents.forEach(r => { if (!findPath(HOME[0], HOME[1], r.home[0], r.home[1])) console.warn('Unreachable resident home:', r.id); });
DIGS.forEach(g => { if (!findPath(HOME[0], HOME[1], g.tx, g.ty)) console.warn('Unreachable dig spot:', g.i); });
renderHud();
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  update(dt); render(dt);
  requestAnimationFrame(frame);
}
syncResidents(false);
if (view) requestAnimationFrame(frame);
else { $('btnStart').hidden = true; $('introHow').hidden = true; $('introSub').textContent = t().no3d; openQuick(); }

// small hook for testing from the console
window.__town = { OX, OY, HOME, PALMS, ROCKS, openMap, openGuest, get guestLook() { return guestLook; }, ownerGuest, guestDef, tiltBy, XMAS, get snow() { return time < snowUntil; }, throwBall, popBalloon, get balloon() { return balloon; }, set balloonAt(v) { balloonAt = v; }, get ball() { return ballS; }, get sitting() { return sitting; }, get talking() { return talking; }, get time() { return time; }, cam, nextView, zoomBy, holes, HOMES, hasProgress, askReset, at, map, MW, MH, findPath, shaken, PLACES, tryGuess, openMbti, TRACKS, music, get actx() { return actx; }, get guess() { return guess; }, set guess(v) { guess = v; }, startDance, openPostcard, makePostcard, flags, tasksSeen, FRUIT_TREES, get fruit() { return fruit; }, get mode() { return mode; }, get shaking() { return shaking; }, get dancing() { return dancing; }, step(n) { for (let i = 0; i < n; i++) { update(0.05); if (i % 6 === 0 || i === n - 1) render(0.3); } }, spotAt, keys, player, dog, SPOTS, DIGS, RES, view, walkTo, openSpot, act, start, found, dug, caught, showItem, talkTo, petDog, get fishing() { return fishing; }, get action() { return action; } };
})();
