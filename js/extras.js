/* Things visitors can dig up or catch, visitor routes, and design notes.
   Edit freely: every entry has an English and a Chinese version. */
window.EXTRAS = {
  // Buried treasures: fun facts
  dig: [
    { icon: '🐶', en: ['A very fluffy co-pilot', 'I share everyday life with a Samoyed who makes sure no routine stays too serious for long.'],
                  zh: ['毛茸茸的搭档', '我养了一只萨摩耶，它陪我度过平常的日子，也让生活没那么严肃。'] },
    { icon: '💃', en: ['Dance shoes', 'Dancing is one of the ways I reset outside work.'],
                  zh: ['一双舞鞋', '工作之外，我喜欢跳舞。'] },
    { icon: '🧗', en: ['A climbing hold', 'I climb. The boulder at the campsite is not just decoration.'],
                  zh: ['一块岩点', '我喜欢攀岩，营地那块大石头可不只是摆设。'] },
    { icon: '🎾', en: ['A tennis ball', 'Tennis is on my regular rotation too.'],
                  zh: ['一颗网球', '网球也是我常打的运动。'] },
    { icon: '🥾', en: ['Hiking boots', 'I like getting outdoors, close to nature, and trying things I have not done before.'],
                  zh: ['一双登山靴', '我喜欢去户外走走，亲近自然，尝试没做过的事。'] },
    { icon: '🗺️', en: ['A three-city map', 'My main bases are New York, Beijing and Shenzhen.'],
                  zh: ['三城地图', '我主要在纽约、北京和深圳之间工作和生活。'] },
    { icon: '🎓', en: ['Four student cards', 'I have studied at four universities: BNBU, HKU, Edinburgh and NYU.'],
                  zh: ['四张学生证', '我在四所大学读过书：北师香港浸会大学、香港大学、爱丁堡大学和纽约大学。'] },
    { icon: '🧰', en: ['An AI toolbox', 'My daily toolbox: Codex, Claude Code, Cursor, Manus, NotebookLM, Perplexity and more.'],
                  zh: ['AI 工具箱', '我日常用的工具：Codex、Claude Code、Cursor、Manus、NotebookLM、Perplexity 等等。'] },
  ],
  // Fish: numbers from my work
  fish: [
    { icon: '🐟', en: ['400,000+ views', 'My top Xiaohongshu post at 36Kr Waves passed 400,000 views and 3,000+ engagements.'],
                  zh: ['40 万+ 浏览', '在 36氪暗涌，我做的小红书最高单篇浏览超过 40 万，互动 3,000+。'] },
    { icon: '🐠', en: ['10,000+ followers', 'I helped grow that channel from early operations to more than 10,000 followers.'],
                  zh: ['1 万+ 粉丝', '我参与把这个账号从早期运营做到 1 万+ 粉丝。'] },
    { icon: '🐡', en: ['4.0 / 4.0', 'My CGPA in the M.S. in Project Management at NYU.'],
                  zh: ['4.0 / 4.0', '我在纽约大学项目管理硕士的 CGPA。'] },
    { icon: '🦈', en: ['Ranked #1', 'I finished first in class at the HKU Media Summer School.'],
                  zh: ['专业第一', '我在香港大学新闻传媒暑期学校排名第一。'] },
    { icon: '🐙', en: ['4 partners', 'For Wavo! Open Course I coordinated Volcano Engine, ZhenFund, Zhipu AI and Devv.ai.'],
                  zh: ['4 家合作机构', '在 Wavo! 开放课，我协调了火山引擎、真格基金、智谱 AI 和 Devv.ai。'] },
    { icon: '🦐', en: ['About 40% faster', 'At Crossing, reworking templates and review flow raised content production efficiency by about 40%.'],
                  zh: ['效率提升约 40%', '在十字路口，我重新梳理了模板和审稿流程，内容生产效率提升约 40%。'] },
    { icon: '🐋', en: ['100+ people', 'I helped deliver a Demo Day for more than 100 participants at Linear Capital.'],
                  zh: ['100+ 人', '在线性资本，我参与落地了一场 100+ 人的 Demo Day。'] },
    { icon: '🍾', en: ['A message in a bottle', 'You fished this far, so here is a shortcut: write to me.'],
                  zh: ['一只漂流瓶', '都钓到这儿了，给你一条捷径：直接写信给我。'], cta: true },
  ],
  // Residents move in as visitors find more things (dig + fish). `at` = how many finds unlock them.
  // species: cat, bunny, bear or frog. `home` is a tile on the map.
  residents: [
    { id: 'mochi', species: 'cat', icon: '🐱', color: '#f6c89f', accent: '#7fd1c0', at: 2, home: [24, 18],
      name: { en: 'Mochi', zh: '麻薯' },
      lines: {
        en: ['I moved in because someone keeps digging things up. That was you, right?', 'See the tall dark tower up north? That is Monolith Capital, where Nan looks for AI startups.', 'Tip: the fish by the pier bite faster. Probably.'],
        zh: ['听说有人一直在挖东西，我就搬来了。是你吧？', '看到北边那栋深色高楼了吗？那是 Monolith 砺思资本，姚楠在那儿找 AI 创业公司。', '小提示：码头那边的鱼咬钩更快。大概吧。'],
      } },
    { id: 'pip', species: 'bunny', icon: '🐰', color: '#f7f2ea', belly: '#ffffff', accent: '#f590b2', at: 5, home: [9, 29],
      name: { en: 'Pip', zh: '跳跳' },
      lines: {
        en: ['The campsite is where Nan keeps the non-work stuff. And the dog house.', 'I tried the climbing boulder once. Once.', 'Orbit, the observatory in the north-west, is her newest project. Go have a look.'],
        zh: ['营地放的都是姚楠工作之外的东西，还有狗屋。', '那块攀岩石我爬过一次。就一次。', '西北角的天文台是 Orbit，她最新的项目，去看看吧。'],
      } },
    { id: 'bao', species: 'bear', icon: '🐻', color: '#c99a6b', belly: '#f3dfc4', accent: '#6f8fd8', at: 9, home: [36, 14],
      name: { en: 'Bao', zh: '阿宝' },
      lines: {
        en: ['I run a very serious honey fund. Nan says my pipeline needs more structure.', 'The campus is just south of here: four schools, one clock tower.', 'If you are hiring, the mailbox is at the south end of the main road.'],
        zh: ['我在经营一支非常严肃的蜂蜜基金。姚楠说我的项目管线不够有条理。', '往南走就是校园：四所学校，一座钟楼。', '如果你在招人，信箱就在主路的最南边。'],
      } },
    { id: 'rana', species: 'frog', icon: '🐸', color: '#8fd67c', belly: '#e6f7c9', accent: '#ffd166', at: 13, home: [31, 27],
      name: { en: 'Rana', zh: '呱呱' },
      lines: {
        en: ['Nice rod. Catch all eight and you have read her résumé in numbers.', 'That ship is Waves Odyssey. Research trips, not pirates.', 'Everything you found is in your backpack, top right.'],
        zh: ['鱼竿不错。把八条都钓上来，你就用数字读完她的简历了。', '那艘船是 Waves Odyssey。是出海调研，不是海盗船。', '你找到的东西都在右上角的背包里。'],
      } },
  ],
  // Island to-do list: gives every visitor something to aim for. Ids are wired up in game.js.
  tasks: [
    { id: 'sign',     icon: '👋', en: 'Read the welcome sign', zh: '看看小岛路牌' },
    { id: 'work',     icon: '🏢', en: 'Visit a place Nan has worked', zh: '拜访一处姚楠工作过的地方' },
    { id: 'project',  icon: '🔭', en: 'Check out one of her projects', zh: '看一个她做的项目' },
    { id: 'dig',      icon: '⛏', en: 'Dig up a fun fact', zh: '挖出一个 fun fact' },
    { id: 'fish',     icon: '🎣', en: 'Catch something', zh: '钓上来一样东西' },
    { id: 'pet',      icon: '🐶', en: 'Pet the Samoyed (click it)', zh: '摸摸萨摩耶（点它一下）' },
    { id: 'fruit',    icon: '🍑', en: 'Shake a fruit tree', zh: '摇一棵果树' },
    { id: 'neighbor', icon: '🏡', en: 'Meet a resident', zh: '认识一位居民' },
    { id: 'gift',     icon: '🎁', en: 'Give a resident some fruit', zh: '送居民一个水果' },
    { id: 'dance',    icon: '💃', en: 'Dance', zh: '跳一支舞' },
    { id: 'hello',    icon: '💌', en: 'Find the mailbox', zh: '找到信箱' },
    { id: 'stars',    icon: '⭐', en: 'Find all 16 stars', zh: '集齐 16 颗星' },
  ],
  // Why the site works this way
  notes: {
    en: ['How this site is designed', [
      ['Teach, then let go', 'One screen explains how to play, then everyone enters the same island. No sign-up, no choices to get wrong.'],
      ['The game never blocks the content', 'Quick view shows everything on one page for visitors in a hurry, and the CV is always one click away.'],
      ['A reason to keep going', 'A to-do list, stars, buried facts, fish and new residents turn reading a résumé into collecting. Progress is saved for the next visit.'],
      ['Every path leads to contact', 'The to-do list ends at the mailbox, the bottle you can fish up links to it, and the postcard carries the address.'],
    ]],
    zh: ['这个网站是怎么设计的', [
      ['先教会，再放手', '一屏讲清玩法，然后所有人进同一座岛。不用注册，也没有会选错的选项。'],
      ['游戏不挡内容', '赶时间的访客可以用“快速浏览”一页看完，简历始终一键可达。'],
      ['给继续逛一个理由', '任务清单、星星、埋着的小事实、鱼和新居民，把看简历变成收集。进度会保存，下次接着逛。'],
      ['每条路都通向联系', '任务清单的终点是信箱，钓上来的漂流瓶会指向它，明信片上也印着地址。'],
    ]],
  },
};
