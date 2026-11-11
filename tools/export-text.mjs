// Collects every piece of text on the site (English and Chinese) into one file for editing.
// Usage: node tools/export-text.mjs  ->  网站文字.md
import fs from 'node:fs';
import vm from 'node:vm';
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const win = {}; vm.runInNewContext(read('js/data.js') + read('js/extras.js'), { window: win });
const game = read('js/game.js');
const grab = (start, end) => { const a = game.indexOf(start), b = game.indexOf(end, a); return vm.runInNewContext('(' + game.slice(a + start.length, b) + ')'); };
const UI = grab('const UI = ', ';\nlet lang');
const SPOTS = grab('const SPOTS = ', ';\nif (window.TextKeys)');

const skip = v => typeof v !== 'string' || !v.trim() || /^(https?:|mailto:|tel:|assets\/|\+?[\d\s-]+$)/.test(v) || /^[\w.+-]+@[\w.-]+$/.test(v);
const out = [];
const emit = (key, en, zh) => { if (skip(en) && skip(zh)) return; out.push(`[${key}]\nEN: ${String(en).replace(/\n/g, '\\n')}\nZH: ${String(zh).replace(/\n/g, '\\n')}\n`); };
function pair(key, en, zh) {                     // walk two parallel values
  if (en && typeof en === 'object') { for (const k of Object.keys(en)) pair(key + '.' + k, en[k], zh ? zh[k] : undefined); return; }
  emit(key, en, zh ?? '');
}
function walk(key, node) {                       // find { en, zh } pairs anywhere inside
  if (!node || typeof node !== 'object') return;
  if ('en' in node && 'zh' in node) { pair(key, node.en, node.zh); return; }
  for (const k of Object.keys(node)) walk(key + '.' + (node[k] && node[k].id ? node[k].id : k), node[k]);
}
const section = (title, note) => out.push(`\n==================== ${title} ====================\n# ${note}\n`);

section('1. 个人资料与经历 (data)', '关于我、工作经历、项目、教育、技能、生活、联系方式。jobs / projects 里的数字是第几条，从 0 开始。');
pair('data', win.DATA.en, win.DATA.zh);
section('2. 地点名称 (spots)', '地图上每个地点头顶标签的名字。');
SPOTS.forEach(s => pair('spots.' + s.id, s.name.en, s.name.zh));
section('3. Fun fact：挖地 (dig)', '每条两行：.0 是标题，.1 是正文。');
walk('extras.dig', win.EXTRAS.dig);
section('4. Fun fact：钓鱼 (fish)', '每条两行：.0 是标题，.1 是正文。');
walk('extras.fish', win.EXTRAS.fish);
section('5. Fun fact：摇果树 (tree)', '每条两行：.0 是标题，.1 是正文；link 是按钮文字。');
walk('extras.tree', win.EXTRAS.tree);
section('6. MBTI 竞猜 (mbti)', '{n} 和 {a} 是会被替换的占位符，请保留。');
walk('extras.mbti', win.EXTRAS.mbti);
section('7. 精选作品馆 (showcase)', '每件作品：.0 是一句话定位，.1 是介绍；links 是按钮文字。');
walk('extras.showcase', win.EXTRAS.showcase);
section('8. 居民 (residents)', 'name 是名字，lines 是他们会轮流说的话。');
walk('extras.residents', win.EXTRAS.residents);
section('9. 任务清单 (tasks)', '左上角任务条和背包里的任务。');
walk('extras.tasks', win.EXTRAS.tasks);
section('10. 设计说明 (notes)', '背包底部“这个网站是怎么设计的”。');
walk('extras.notes', win.EXTRAS.notes);
section('11. 界面文字 (ui)', '按钮、提示、欢迎语、玩法介绍等。{n} {a} {b} 是占位符，请保留；带 emoji 的可以改 emoji。');
pair('ui', UI.en, UI.zh);

const head = `Starry Town 网站文字（中英对照）
导出时间：${new Date().toISOString().slice(0, 10)}

怎么改：
- 每一条是三行：[编号]、EN: 英文、ZH: 中文。只改 EN: 和 ZH: 后面的文字，[编号] 那一行不要动。
- 一条文字写在一行里，不要在中间回车。
- 不想改的条目可以原样留着，也可以整条删掉（删掉的我会保持不变）。
- 想新增内容（比如多一条 fun fact、多一件作品）不用管编号，直接在文件最后用自己的话写出来就行。
- 改完把整个文件发回给我，我按编号替换进网站。
`;
fs.writeFileSync(new URL('../网站文字.md', import.meta.url), head + out.join('\n'));
console.log(out.filter(x => x.startsWith('[')).length + ' entries');
