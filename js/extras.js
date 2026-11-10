/* Things visitors can dig up, catch or shake out of trees, residents, the to-do list and design notes.
   Edit freely: every entry has an English and a Chinese version. */
window.EXTRAS = {
  // Buried treasures: fun facts. An item may carry `link: { url, en, zh }`.
  dig: [
    { icon: '🐶', en: ['Meet Bingo', 'My Samoyed is called Bingo. He eats well, sleeps well, and takes the apartment apart just as well.'],
                  zh: ['它叫苹果', '我有一只萨摩耶叫苹果，他能吃能睡，还能拆家。'] },
    { icon: '🧗', en: ['A climbing hold', 'I have started bouldering and climbing. My arms are noodles, but every attempt gets a little further.'],
                  zh: ['一块岩点', '开始慢慢接触抱石、攀岩。虽然很肌无力，但是每一次尝试都能感受到进步。'] },
    { icon: '🎾', en: ['A tennis ball', 'I am learning tennis. Turns out there is more to it than swinging the racket...'],
                  zh: ['一颗网球', '在学习网球，发现不是只挥拍那么容易...'] },
    { icon: '🗺️', en: ['A three-city map', 'You can spot me at random in New York, Beijing or Shenzhen.'],
                  zh: ['三城地图', '我会在纽约、北京、深圳随机出没。'] },
    { icon: '☕', en: ['A coffee cup', 'A small dream of mine: opening a café in Dali.'],
                  zh: ['一只咖啡杯', '有一个小梦想，是去大理开咖啡厅。'] },
    { icon: '💎', en: ['One ear stud', 'I got my very first ear piercing at 23.'],
                  zh: ['一枚耳钉', '我在 23 岁才拥有了第一个耳洞。'] },
    { icon: '💤', en: ['A pillow', 'I talk in my sleep, very clearly. Sometimes I recite maths formulas and English dialogues out loud.'],
                  zh: ['一只枕头', '我说梦话说得很清楚，有时候能非常大声地背出数学公式和英语对话。'] },
    { icon: '🍲', en: ['A well-used pot', 'My signature dishes: salmon and mushroom risotto, and clear-braised beef short ribs.'],
                  zh: ['一口炖锅', '我的拿手好菜是三文鱼菌菇烩饭和清炖牛肋骨。'] },
  ],
  // Fish: a mix of fun facts and numbers from my work
  fish: [
    { icon: '🐟', en: ['Sunbathing fish', 'My favourite everyday little thing: sitting in the sun!'],
                  zh: ['晒太阳的鱼', '最喜欢的日常小事是：晒太阳！'] },
    { icon: '🐠', en: ['Weekend fish', 'In New York I love going hiking with friends, and wandering around Costco!'],
                  zh: ['周末鱼', '在纽约喜欢和朋友们一起出去 hiking、逛 Costco！'] },
    { icon: '🐡', en: ['Chatty puffer', 'I talk a lot. Come and chat with me!'],
                  zh: ['话痨河豚', '我的话很多，欢迎来找我聊天！'] },
    { icon: '🐚', en: ['A seashell', 'When I travel I pick nature over cities. It is where I recharge.'],
                  zh: ['一枚贝壳', '在旅行中，比起城市，我更喜欢大自然，汲取能量中。'] },
    { icon: '🦈', en: ['400,000+ views', 'My top Xiaohongshu post at 36Kr Waves passed 400,000 views and 3,000+ engagements.'],
                  zh: ['40 万+ 浏览', '在 36氪暗涌，我做的小红书最高单篇浏览超过 40 万，互动 3,000+。'] },
    { icon: '🐙', en: ['4 partners', 'For Wavo! Open Course I coordinated Volcano Engine, ZhenFund, Zhipu AI and Devv.ai.'],
                  zh: ['4 家合作机构', '在 Wavo! 开放课，我协调了火山引擎、真格基金、智谱 AI 和 Devv.ai。'] },
    { icon: '🐋', en: ['100+ people', 'I helped deliver a Demo Day for more than 100 participants at Linear Capital.'],
                  zh: ['100+ 人', '在线性资本，我参与落地了一场 100+ 人的 Demo Day。'] },
    { icon: '🍾', en: ['A message in a bottle', 'You fished this far, so here is a shortcut: write to me.'],
                  zh: ['一只漂流瓶', '都钓到这儿了，给你一条捷径：直接写信给我。'], cta: true },
  ],
  // Notes hidden in fruit trees: shaking a tree sometimes drops one along with the fruit
  tree: [
    { icon: '💃', en: ['Dance shoes', 'I have been dancing for more than ten years, and sometimes choreograph my own pieces. Curious? Have a look at my Xiaohongshu 👀'],
                  zh: ['一双舞鞋', '我跳舞已经十几年了，有时候还会自己编舞。如果你感兴趣，可以看看我的小红书 👀'],
                  link: { url: 'https://www.xiaohongshu.com/user/profile/59e4a1d04eacab3c568d9726', en: 'My Xiaohongshu', zh: '我的小红书' } },
    { icon: '🎬', en: ['A film ticket', 'My favourite film is Pride & Prejudice.'],
                  zh: ['一张电影票', '最爱的电影是《傲慢与偏见》。'] },
    { icon: '🎭', en: ['A Playbill', 'Lately I have fallen for Broadway shows.'],
                  zh: ['一本场刊', '最近爱上了看 Broadway。'] },
    { icon: '🧰', en: ['An AI toolbox', 'The AI tools I use every day: Claude Code, Codex, Manus and Muse.'],
                  zh: ['AI 工具箱', '日常用的 AI 工具：Claude Code、Codex、Manus、Muse。'] },
  ],
  // The guessing machine on the plaza. `answers` are the accepted four-letter types.
  mbti: {
    answers: ['ENFJ'],   // add more types here if it changes
    name: { en: 'Guess my MBTI', zh: '猜猜我的 MBTI' },
    ask: { en: 'My MBTI keeps changing, but you can have a guess!', zh: '虽然我的 MBTI 经常变，但你可以猜一猜！' },
    right: { en: 'Correct! A new resident heard the news and is moving to the island.', zh: '答对了！有位新居民听到消息，正在搬上岛。' },
    wrong: { en: 'Not quite. {n} of 4 letters are right. Try again!', zh: '还差一点，4 个字母里对了 {n} 个，再猜猜！' },
    solved: { en: 'You already got it: {a}. (For now. It may change again.)', zh: '你已经猜对了：{a}。（暂时是这个，说不定又变了。）' },
  },
  // The Showcase building: the work I am proudest of. Add an entry here to put another piece on the wall.
  showcase: {
    title: { en: 'Showcase', zh: '精选作品' },
    meta: { en: 'The pieces I would show you first', zh: '我最想先给你看的几件作品' },
    items: [
      { icon: '🪐', name: 'Orbit',
        en: ['Creator partnership workspace · the real product', 'Orbit started as a pitch demo and is now a working product: accounts and private team workspaces, campaign brief import, YouTube creator discovery, Gemini video evidence behind every match score, swipe decisions with undo, side-by-side comparison, Gmail outreach, creator briefs and PDF export.'],
        zh: ['达人合作工作台 · 正式产品', 'Orbit 从一个路演 Demo 做成了真正能用的产品：账号与团队私有空间、Campaign brief 导入、YouTube 达人发现、每个匹配分背后都有 Gemini 视频证据、可撤销的滑动决策、并排对比、Gmail 触达、达人 brief 和 PDF 导出。'],
        tags: ['Product', 'Gemini', 'Full-stack'],
        links: [{ url: 'https://starry-nn.github.io/orbit-creator-match-demo/', en: 'Open the pitch demo', zh: '打开路演 Demo' }] },
      { icon: '🎁', name: 'GiftSense',
        en: ['A gift-finding agent · built in 24 hours', 'Describe the person you are shopping for, add a photo of their outfit or room if you have one, and the agent works out who they are, searches stores and comes back with five gifts plus a wild card, each with a reason about the person. Built for AISUM Hackathon 2026 by Team S&L.'],
        zh: ['帮你挑礼物的 Agent · 24 小时做出来', '描述你要送礼的人，有穿搭或房间照片也可以加上，Agent 会先理解这个人，再去商店搜索，给出五个礼物和一个惊喜选项，每个都附上和这个人有关的理由。AISUM Hackathon 2026 作品，Team S&L。'],
        tags: ['AI Agent', 'Hackathon', 'Multimodal'],
        links: [{ url: 'https://app-934313837966.us-central1.run.app', en: 'Open the live app', zh: '打开线上应用' }] },
      { icon: '🐙', name: 'GitHub',
        en: ['My GitHub home page', 'How I present my projects and repositories on GitHub.'],
        zh: ['GitHub 主页设计', '我在 GitHub 上展示项目和仓库的方式。'],
        tags: ['Design', 'GitHub'],
        links: [{ url: 'https://github.com/Starry-nn', en: 'Open my GitHub', zh: '打开我的 GitHub' }] },
    ],
  },
  // Residents move in as visitors find more things. `at` = how many finds unlock them; `unlock: 'mbti'` = arrives after the MBTI guess.
  // species: cat, fox, bunny, bear or frog. Each gets a house in the village east of the river (set in game.js).
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
        en: ['The campsite is where Nan keeps the non-work stuff. And Bingo\'s dog house.', 'I tried the climbing boulder once. Once.', 'Orbit, the observatory in the north-west, is her newest project. Go have a look.'],
        zh: ['营地放的都是姚楠工作之外的东西，还有苹果的狗屋。', '那块攀岩石我爬过一次。就一次。', '西北角的天文台是 Orbit，她最新的项目，去看看吧。'],
      } },
    { id: 'bao', species: 'bear', icon: '🐻', color: '#c99a6b', belly: '#f3dfc4', accent: '#6f8fd8', at: 9, home: [36, 14],
      name: { en: 'Bao', zh: '阿宝' },
      lines: {
        en: ['I run a very serious honey fund. Nan says my pipeline needs more structure.', 'The campus is back over the bridge: four schools, one clock tower.', 'If you are hiring, the mailbox is at the south end of the main road, west of the river.'],
        zh: ['我在经营一支非常严肃的蜂蜜基金。姚楠说我的项目管线不够有条理。', '过了桥往回走就是校园：四所学校，一座钟楼。', '如果你在招人，信箱在河西边主路的最南端。'],
      } },
    { id: 'rana', species: 'frog', icon: '🐸', color: '#8fd67c', belly: '#e6f7c9', accent: '#ffd166', at: 13, home: [31, 27],
      name: { en: 'Rana', zh: '呱呱' },
      lines: {
        en: ['Nice rod. There are eight things down there, and one of them is a bottle.', 'That ship is Waves Odyssey. Research trips, not pirates.', 'Everything you found is in your backpack, top right.'],
        zh: ['鱼竿不错。水里一共有八样东西，其中一样是个瓶子。', '那艘船是 Waves Odyssey。是出海调研，不是海盗船。', '你找到的东西都在右上角的背包里。'],
      } },
    { id: 'kiki', species: 'fox', icon: '🦊', color: '#f29a52', belly: '#fff3e2', accent: '#b79cf0', unlock: 'mbti', home: [27, 17],
      name: { en: 'Kiki', zh: '奇奇' },
      lines: {
        en: ['You guessed it! I came as soon as the crystal ball lit up.', 'Between us: ask her again next month and the answer may be different.', 'Some fruit trees hide little notes. Give them a good shake.'],
        zh: ['你猜对啦！水晶球一亮我就赶来了。', '悄悄说：下个月再问她，答案可能又不一样了。', '有些果树里藏着小纸条，用力摇一摇。'],
      } },
  ],
  // Island to-do list: gives every visitor something to aim for. Ids are wired up in game.js.
  tasks: [
    { id: 'sign',     icon: '👋', en: 'Read the welcome sign', zh: '看看小岛路牌' },
    { id: 'work',     icon: '🏢', en: 'Visit a place Nan has worked', zh: '拜访一处姚楠工作过的地方' },
    { id: 'project',  icon: '🔭', en: 'Check out one of her projects', zh: '看一个她做的项目' },
    { id: 'showcase', icon: '🏛️', en: 'Cross the bridge to the Showcase', zh: '过桥去精选作品馆看看' },
    { id: 'dig',      icon: '⛏', en: 'Dig up a fun fact', zh: '挖出一个 fun fact' },
    { id: 'fish',     icon: '🎣', en: 'Catch something', zh: '钓上来一样东西' },
    { id: 'pet',      icon: '🐶', en: 'Pet Bingo the Samoyed (click him)', zh: '摸摸萨摩耶苹果（点它一下）' },
    { id: 'fruit',    icon: '🍑', en: 'Shake a fruit tree', zh: '摇一棵果树' },
    { id: 'neighbor', icon: '🏡', en: 'Meet a resident', zh: '认识一位居民' },
    { id: 'gift',     icon: '🎁', en: 'Give a resident some fruit', zh: '送居民一个水果' },
    { id: 'dance',    icon: '💃', en: 'Dance', zh: '跳一支舞' },
    { id: 'mbti',     icon: '🔮', en: 'Guess Nan\'s MBTI at the crystal ball', zh: '去水晶球那儿猜姚楠的 MBTI' },
    { id: 'hello',    icon: '💌', en: 'Find the mailbox', zh: '找到信箱' },
    { id: 'stars',    icon: '⭐', en: 'Find all 17 stars', zh: '集齐 17 颗星' },
  ],
  // Why the site works this way
  notes: {
    en: ['How this site is designed', [
      ['Teach, then let go', 'One screen explains how to play, then everyone enters the same island. No sign-up, no choices to get wrong.'],
      ['The game never blocks the content', 'Visitors in a hurry can jump to the classic one-page site from the welcome screen or open Quick view on the island, and the CV is always one click away.'],
      ['A reason to keep going', 'A to-do list, stars, buried facts, fish, notes in trees, a guessing game and new residents turn reading a résumé into collecting. Progress is saved for the next visit.'],
      ['Every path leads to contact', 'The to-do list ends at the mailbox, the bottle you can fish up links to it, and the postcard carries the address.'],
    ]],
    zh: ['这个网站是怎么设计的', [
      ['先教会，再放手', '一屏讲清玩法，然后所有人进同一座岛。不用注册，也没有会选错的选项。'],
      ['游戏不挡内容', '赶时间的访客可以从欢迎页跳到简洁版个人主页，或在岛上用“快速浏览”一页看完，简历始终一键可达。'],
      ['给继续逛一个理由', '任务清单、星星、埋着的小事实、鱼、树上的纸条、竞猜和新居民，把看简历变成收集。进度会保存，下次接着逛。'],
      ['每条路都通向联系', '任务清单的终点是信箱，钓上来的漂流瓶会指向它，明信片上也印着地址。'],
    ]],
  },
};
