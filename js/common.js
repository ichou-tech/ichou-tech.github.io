/* =========================================================
 * common.js — 每个页面都会加载：
 *   · 内页：自动加上你画的页眉（模块标题 + 名字 + 红线）和右下角的
 *     Back to HomePage 按钮（按下去 → 松开 → 声音 → 回到地图）
 *   · 站内链接点击时：纸晃一下 + 音效 + 淡出，再跳转
 *   · 纸张悬停：轻轻跳一下 + 提示音
 *   · 键盘 M：静音 / 恢复
 * 在 <body data-root="../" data-module="blog"> 里写好到网站根目录的相对路径和模块名。
 * ========================================================= */
(function () {
  const root = document.body.dataset.root || './';
  const mod = document.body.dataset.module;
  const isHome = document.body.classList.contains('home');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 内页用到的手绘元素。tw = 标题图的宽度（原稿像素）
  const PAGE = {
    titles: {
      research: { tw: 250, label: 'Research Record' },
      projects: { tw: 324, label: 'Projects' },
      reading:  { tw: 259, label: 'Reading Notes' },
      about:    { tw: 289, label: 'Bio & Contact' },
      blog:     { tw: 421, label: "Blog & Something I've Written" },
    },
    // 按钮“按下”状态的图 assets/page/back-down.webp（和 back.webp 一样大、对齐）
    BACK_DOWN: true,
  };

  // 直接双击 HTML 打开（file://）时，浏览器不会自动打开文件夹里的 index.html，
  // 所以把指向文件夹的链接补成 .../index.html。放到网上（GitHub Pages）时不需要。
  const isFile = location.protocol === 'file:';
  const fixHref = (href) => {
    if (!isFile) return href;
    const u = new URL(href, location.href);
    if (u.protocol === 'file:' && u.pathname.endsWith('/')) u.pathname += 'index.html';
    return u.href;
  };
  const fixLinks = () => document.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h && !/^(https?:|mailto:|#)/.test(h)) a.href = fixHref(h);
  });
  if (isFile) { fixLinks(); new MutationObserver(fixLinks).observe(document.body, { childList: true, subtree: true }); }

  // ---------- 站内跳转转场 ----------
  window.leaveTo = function (href, delay = 380) {
    href = fixHref(href);
    if (reduce) { location.href = href; return; }
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = href; }, delay);
  };
  function play(el, cls) {
    if (!el || reduce) return;
    el.classList.remove('wobble', 'jiggle');
    void el.offsetWidth;
    el.classList.add(cls);
  }
  document.addEventListener('animationend', (e) => {
    if (e.target.classList && /paper-hop|jiggle/.test(e.animationName)) e.target.classList.remove('wobble', 'jiggle');
  });

  // ---------- 内页：页眉 + 回家按钮 ----------
  if (!isHome && mod) {
    const t = PAGE.titles[mod] || PAGE.titles.blog;
    const head = document.createElement('header');
    head.className = 'ip-head';
    head.innerHTML = `
      <a class="ip-title" href="${root}${mod}/" style="--tw:${t.tw}" aria-label="${t.label}">
        <img src="${root}assets/page/title-${mod}.webp" alt="" draggable="false">
      </a>
      <div class="ip-rule">
        <img class="ip-name" src="${root}assets/page/name.webp" alt="IChou · Xinyi Chen" draggable="false">
        <span class="ip-line" aria-hidden="true"></span>
      </div>`;
    const main = document.querySelector('main') || document.body.firstElementChild;
    main.prepend(head);
    document.body.classList.add('inner');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-home' + (PAGE.BACK_DOWN ? ' has-down' : '');
    btn.setAttribute('aria-label', 'Back to HomePage');
    btn.innerHTML = `<img class="up" src="${root}assets/page/back.webp" alt="" draggable="false">` +
      (PAGE.BACK_DOWN ? `<img class="down" src="${root}assets/page/back-down.webp" alt="" draggable="false">` : '');
    document.body.appendChild(btn);

    let down = false, going = false;
    const press = () => { if (going || down) return; down = true; btn.classList.add('pressed'); Sound.press(); };
    const release = (go) => {
      if (!down) return;
      down = false;
      if (!go) { btn.classList.remove('pressed'); return; }
      going = true;
      Sound.release();
      // 让“按下去”的样子停留一小会儿再弹起，然后回到地图
      setTimeout(() => btn.classList.remove('pressed'), 140);
      setTimeout(() => { Sound.home(); leaveTo(root, 380); }, 220);
    };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      press();
    });
    btn.addEventListener('pointerup', (e) => {
      const r = btn.getBoundingClientRect();
      release(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
    });
    btn.addEventListener('pointercancel', () => release(false));
    btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(); } });
    btn.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') release(true); });
    btn.addEventListener('pointerenter', () => Sound.hover('back'));

    // 浏览器“返回”时从缓存恢复页面
    window.addEventListener('pageshow', () => { going = false; down = false; btn.classList.remove('pressed'); });
  }

  // 列表页：鼠标滚轮上下滚，纸张左右移动
  document.querySelectorAll('.papers').forEach((row) => {
    // 右边还有纸没露出来时，边缘淡出，提示可以往右滑
    const edge = () => row.classList.toggle('more-right', row.scrollLeft + row.clientWidth < row.scrollWidth - 4 && getComputedStyle(row).overflowX === 'auto');
    row.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    new MutationObserver(edge).observe(row, { childList: true });
    setTimeout(edge, 50);
    row.addEventListener('wheel', (e) => {
      if (row.scrollWidth <= row.clientWidth + 1 || getComputedStyle(row).overflowX !== 'auto' || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    }, { passive: false });
  });

  // 文字纸（不是可点的卡片）：屏幕矮、字放不下时，整张纸的字一起缩小（最小 72%），还不行就让这张纸里面可以滚动
  const fitSheets = () => document.querySelectorAll('.papers section.sheet').forEach((s) => {
    const g = s.querySelector('.grow');
    if (!g) return;
    let f = 1;
    s.style.setProperty('--fit', f); g.classList.remove('scroll');
    if (getComputedStyle(g).overflow === 'visible') return;           // 手机竖排时不用缩
    while (g.scrollHeight > g.clientHeight + 1 && f > 0.72) { f = +(f - 0.04).toFixed(2); s.style.setProperty('--fit', f); }
    if (g.scrollHeight > g.clientHeight + 1) g.classList.add('scroll');
  });
  let fitT;
  const fitSoon = () => { clearTimeout(fitT); fitT = setTimeout(fitSheets, 60); };
  window.addEventListener('resize', fitSoon);
  window.addEventListener('load', fitSoon);
  if (document.fonts) document.fonts.ready.then(fitSoon);
  fitSoon();

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA/.test(e.target.tagName)) Sound.toggle();
  });

  // ---------- 站内链接：纸晃一下 + 声音 + 淡出 ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.classList.contains('hotspot')) return;       // 首页热点自己处理
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.hash && url.pathname === location.pathname)) return;
    e.preventDefault();
    Sound.click(mod);
    if (a.classList.contains('sheet')) { play(a, 'jiggle'); setTimeout(() => leaveTo(url.href, 300), 300); }
    else leaveTo(url.href, 300);
  });

  window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  // ---------- 纸张悬停：跳一下 + 提示音 ----------
  document.addEventListener('pointerover', (e) => {
    const c = e.target.closest('a.sheet');
    if (c && !c.contains(e.relatedTarget)) { play(c, 'wobble'); Sound.hover(mod); }
  });
})();
