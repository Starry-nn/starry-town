/* Every piece of site text has a key such as "extras.dig.0.1" or "ui.hello".
   flatten() lists them all; apply() writes edited text back. Shared by the island and the editor in /admin. */
window.TextKeys = (() => {
  const skip = v => typeof v !== 'string' || !v.trim() || /^(https?:|mailto:|tel:|assets\/|\+?[\d\s-]+$)/.test(v) || /^[\w.+-]+@[\w.-]+$/.test(v);
  const SECTIONS = [['data', '个人资料与经历'], ['spots', '地点名称'], ['extras.dig', 'Fun fact：挖地'], ['extras.fish', 'Fun fact：钓鱼'], ['extras.tree', 'Fun fact：摇果树'],
    ['extras.mbti', 'MBTI 竞猜'], ['extras.showcase', '精选作品馆'], ['extras.residents', '居民'], ['extras.guestbook', '留言板'], ['extras.tasks', '任务清单'], ['extras.notes', '设计说明'], ['ui', '界面文字']];
  function flatten({ DATA, EXTRAS, UI, SPOTS }) {
    const out = [];
    const emit = (key, en, zh) => { if (!(skip(en) && skip(zh))) out.push({ key, en: String(en ?? ''), zh: String(zh ?? '') }); };
    const pair = (key, en, zh) => { if (en && typeof en === 'object') { for (const k of Object.keys(en)) pair(key + '.' + k, en[k], zh ? zh[k] : undefined); } else emit(key, en, zh); };
    const walk = (key, node) => {
      if (!node || typeof node !== 'object') return;
      if ('en' in node && 'zh' in node) return pair(key, node.en, node.zh);
      for (const k of Object.keys(node)) walk(key + '.' + (node[k] && node[k].id ? node[k].id : k), node[k]);
    };
    pair('data', DATA.en, DATA.zh);
    SPOTS.forEach(s => pair('spots.' + s.id, s.name.en, s.name.zh));
    ['dig', 'fish', 'tree', 'mbti', 'showcase', 'residents', 'guestbook', 'tasks', 'notes'].forEach(k => walk('extras.' + k, EXTRAS[k]));
    pair('ui', UI.en, UI.zh);
    out.forEach(e => { e.section = (SECTIONS.find(s => e.key === s[0] || e.key.startsWith(s[0] + '.')) || ['', '其他'])[1]; });
    return out;
  }
  const child = (node, seg) => Array.isArray(node) && !/^\d+$/.test(seg) ? node.find(q => q && q.id === seg) : node[seg];
  function setIn(root, segs, val) {
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) { node = child(node, segs[i]); if (node == null || typeof node !== 'object') return false; }
    const last = segs[segs.length - 1];
    if (typeof node[last] !== 'string') return false;
    node[last] = val; return true;
  }
  function applyOne({ DATA, EXTRAS, UI, SPOTS }, key, val) {
    const segs = key.split('.'), head = segs.shift();
    const both = (enRoot, zhRoot, rest) => { if (typeof val.en === 'string') setIn(enRoot, rest, val.en); if (typeof val.zh === 'string') setIn(zhRoot, rest, val.zh); };
    if (head === 'data') return both(DATA.en, DATA.zh, segs);
    if (head === 'ui') return both(UI.en, UI.zh, segs);
    if (head === 'spots') { const s = SPOTS.find(q => q.id === segs[0]); if (s) { if (typeof val.en === 'string') s.name.en = val.en; if (typeof val.zh === 'string') s.name.zh = val.zh; } return; }
    if (head === 'extras') {
      let node = EXTRAS;
      while (segs.length && node && typeof node === 'object' && !('en' in node && 'zh' in node)) node = child(node, segs.shift());
      if (!node || typeof node !== 'object' || !('en' in node)) return;
      if (!segs.length) { if (typeof val.en === 'string' && typeof node.en === 'string') node.en = val.en; if (typeof val.zh === 'string' && typeof node.zh === 'string') node.zh = val.zh; return; }
      both(node.en, node.zh, segs);
    }
  }
  function apply(src, overrides) { if (overrides) for (const key of Object.keys(overrides)) { try { applyOne(src, key, overrides[key] || {}); } catch (e) {} } }
  return { flatten, apply, SECTIONS };
})();
