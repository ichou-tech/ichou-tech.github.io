/* =========================================================
 * config.js — 网站唯一需要经常改的配置文件
 *
 * 首页 = 你画的图（1920 × 1080，透明底），铺在白色网页上。
 *   · 16:9 的屏幕上和你画的一模一样。
 *   · 屏幕不是 16:9 时：道路底图拉伸到正好盖住屏幕；其余每个配件保持原比例不变形，
 *     各自挪一点位置把多出来的空间分掉（由下面的 ax / ay 决定）。
 * 这里所有的 x / y / w / h 都是原图上的像素坐标。
 * ========================================================= */
window.SITE = {
  name: 'Xinyi Chen',
  CANVAS: { w: 1920, h: 1080 },
  MAP_BASE: 'assets/map/base.webp',

  // 每组配件。ax / ay 是它“钉”在屏幕的什么位置（0~1）：
  //   ax: 0 = 贴左边，1 = 贴右边；ay: 0 = 贴上边，1 = 贴下边；中间的数 = 按比例。
  // 有 href 的组可以点击进入对应模块。
  GROUPS: {
    research: { ax: 0.5,  ay: 0,    href: 'research/', label: 'Research Record' },
    projects: { ax: 0,    ay: 0.42, href: 'projects/', label: 'Projects' },
    reading:  { ax: 1,    ay: 0.3,  href: 'reading/',  label: 'Reading Notes' },
    about:    { ax: 0.2,  ay: 1,    href: 'about/',    label: 'Bio & Contact' },
    blog:     { ax: 1,    ay: 1,    href: 'blog/',     label: "Blog & Something I've Written" },
    ground:   { ax: 0.53, ay: 0.44 },   // 地上的 IChou / XinyiCHEN / Welcome 字：固定不动
    bust:     { ax: 0.53, ay: 0.44 },   // 石膏像：会动、会说话（位置要和 ground 一样）
  },

  // 每个图层：在原图里的位置（x, y, w, h），以及可点击范围 hit。一般不用改。
  LAYERS: [
    { src: 'assets/map/layer-02.webp', group: 'research', kind: 'label', x: 485, y: 19, w: 250, h: 199, hit: [482, 17, 255, 203] },
    { src: 'assets/map/layer-03.webp', group: 'projects', kind: 'label', x: 101, y: 139, w: 333, h: 213, hit: [100, 136, 336, 218] },
    { src: 'assets/map/layer-04.webp', group: 'reading', kind: 'label', x: 1445, y: 200, w: 194, h: 175, hit: [1442, 196, 200, 179] },
    { src: 'assets/map/layer-05.webp', group: 'research', x: 699, y: 7, w: 895, h: 379, hit: [699, 3, 724, 212] },
    { src: 'assets/map/layer-06.webp', group: 'projects', x: 33, y: 218, w: 584, h: 552, hit: [29, 223, 545, 530] },
    { src: 'assets/map/layer-07.webp', group: 'reading', x: 1483, y: 68, w: 436, h: 563, hit: [1479, 77, 441, 462] },
    { src: 'assets/map/layer-08.webp', group: 'about', kind: 'label', x: 469, y: 861, w: 230, h: 192, hit: [466, 858, 218, 198] },
    { src: 'assets/map/layer-09.webp', group: 'about', x: 110, y: 772, w: 417, h: 254, hit: [107, 768, 423, 261] },
    { src: 'assets/map/layer-10.webp', group: 'blog', x: 1399, y: 669, w: 521, h: 411, hit: [1396, 665, 524, 415] },
    { src: 'assets/map/layer-11.webp', group: 'blog', kind: 'label', x: 1237, y: 682, w: 384, h: 349, hit: [1234, 679, 338, 324] },
    { src: 'assets/map/layer-12.webp', group: 'ground', x: 714, y: 292, w: 619, h: 361, hit: [711, 288, 609, 364] },
    { src: 'assets/map/layer-13.webp', group: 'bust', x: 885, y: 221, w: 317, h: 331, hit: [882, 219, 315, 316] },
  ],

  // 石膏像的台词：一句一个对话框。想加链接就写成 [文字](网址)，左右两种对话框轮流出现。
  // 第一次访问时自动说一遍，之后点击石膏像才会说。
  INTRO: [
    "Hi, I'm Xinyi Chen. You can also call me IChou. Welcome to my personal website!",
    "I'm a master's student in media studies at Université Paris 8 ([EDAM](https://artsplastiques.univ-paris8.fr/master/edam)). I love interdisciplinary research that brings art and technology together, and my background spans art practice, psychology and programming.",
    "My research interest is creativity support in HCI: exploring novel and diverse ways for people to interact with technology.",
    "I want to build interactive systems and tools that fundamentally expand how we think, create, learn and communicate, especially through playful interactions with machines, interfaces and AI that spark imagination and curiosity.",
    "There's more about me in the Bio at the bottom left, so feel free to look (or click) around!",
    "By the way, I'm preparing for HCI internships and PhD applications, and I'd love to talk with anyone in related fields!",
  ],

  // 两种对话框。pad 是文字离对话框边缘的距离（上 右 下 左，百分比），用来避开尾巴和边框。
  // 长台词的对话框放大倍数 [横向, 纵向]（以尾巴尖为中心放大，字号不变，所以能多放字）。
  // 不超过 SHORT_LINE 个字母的短台词用原来大小。
  BUBBLE_SCALE: [1.3, 1.6],
  BIG_FONT: 1.15,   // 大对话框里的字号倍数
  SHORT_LINE: 120,
  TYPE_SPEED: 14,   // 打字速度：每个字母多少毫秒，越小越快
  BUBBLES: [
    { img: 'assets/map/bubble-left.webp',  x: 494, y: 215, w: 449, h: 274, tail: [1, .45], pad: '12% 18% 14% 10%' },   // 石膏像左边，尾巴朝右
    { img: 'assets/map/bubble-right.webp', x: 1078, y: 323, w: 510, h: 330, tail: [0, .6], pad: '11% 9% 14% 19%' },   // 石膏像右边，尾巴朝左
  ],
};
