/* =========================================================
 * home.js — 首页
 *   · 底图（道路）铺满屏幕；每组配件放进一个和原图一样大的“画框”，
 *     保持原比例，按 config.js 里的 ax / ay 挪位置
 *   · 悬停：这一组轻轻跳一下 + 提示音（不发光）
 *   · 点击：这一组晃一晃 + 点击音，然后进入对应模块（不放大）
 *   · 石膏像：第一次访问自动说话，之后点击才说；地上的字始终不动
 * ========================================================= */
(function () {
  const map = document.getElementById('map');
  const base = map.querySelector('img.map-base');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = SITE.CANVAS;
  map.style.setProperty('--cw', C.w);
  map.style.setProperty('--ch', C.h);
  base.src = SITE.MAP_BASE;

  // 原图像素坐标 → 画框里的位置
  const place = (el, x, y, w, h) => {
    el.style.left = `calc(var(--u) * ${x})`;
    el.style.top = `calc(var(--u) * ${y})`;
    el.style.width = `calc(var(--u) * ${w})`;
    el.style.height = `calc(var(--u) * ${h})`;
  };
  // 和原图一样大的画框，按这一组的 ax / ay 定位
  function frame(id, cls) {
    const f = document.createElement('div');
    const g = SITE.GROUPS[id] || { ax: 0.5, ay: 0.5 };
    f.className = 'frame' + (cls ? ' ' + cls : '');
    f.style.setProperty('--ax', g.ax);
    f.style.setProperty('--ay', g.ay);
    return f;
  }
  // 重新播放一个一次性的动画
  function play(el, cls) {
    if (!el || reduce) return;
    el.classList.remove('hop', 'jiggle', 'talk');
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---------- 图层 ----------
  const groups = {};      // id → 装图层的画框（会动）
  const byGroup = {};     // id → 这一组的图层配置
  SITE.LAYERS.forEach((l) => {
    if (!groups[l.group]) {
      groups[l.group] = frame(l.group, 'layer-group');
      groups[l.group].dataset.group = l.group;
      byGroup[l.group] = [];
      map.appendChild(groups[l.group]);
    }
    const im = document.createElement('img');
    im.className = 'layer' + (l.kind === 'label' ? ' label' : '');
    im.src = l.src; im.alt = ''; im.draggable = false; im.decoding = 'async';
    place(im, l.x, l.y, l.w, l.h);
    groups[l.group].appendChild(im);
    byGroup[l.group].push(l);
  });
  // 晃动的支点：这一组主图（不是文字）的底边中点，看起来像站在地上
  Object.keys(groups).forEach((id) => {
    const art = byGroup[id].find((l) => l.kind !== 'label') || byGroup[id][0];
    groups[id].style.transformOrigin = `calc(var(--u) * ${art.hit[0] + art.hit[2] / 2}) calc(var(--u) * ${art.hit[1] + art.hit[3]})`;
    groups[id].addEventListener('animationend', (e) => { if (e.target === groups[id]) groups[id].classList.remove('hop', 'jiggle', 'talk'); });
  });

  // ---------- 可点击的地点 ----------
  let leaving = false;
  Object.keys(SITE.GROUPS).forEach((id) => {
    const g = SITE.GROUPS[id];
    if (!g.href || !byGroup[id]) return;
    const f = frame(id);
    byGroup[id].forEach((l, i) => {
      const a = document.createElement('a');
      a.className = 'hotspot';
      a.href = g.href;
      a.dataset.id = id;
      place(a, ...l.hit);
      if (i === 0) a.setAttribute('aria-label', g.label);
      else { a.tabIndex = -1; a.setAttribute('aria-hidden', 'true'); }   // 同一个地点的第二块区域，键盘和读屏只算一次
      a.addEventListener('pointerenter', (e) => {
        if (e.relatedTarget && e.relatedTarget.dataset && e.relatedTarget.dataset.id === id) return;   // 在同一组里移动不重复触发
        play(groups[id], 'hop'); Sound.hover(id);
      });
      a.addEventListener('focus', () => { play(groups[id], 'hop'); Sound.hover(id); });
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // 允许新标签打开
        e.preventDefault();
        if (leaving) return;
        leaving = true;
        Sound.click(id);
        play(groups[id], 'jiggle');
        if (reduce) { location.href = g.href; return; }
        setTimeout(() => leaveTo(g.href, 300), 380);        // 晃完再淡出进入模块
      });
      f.appendChild(a);
    });
    map.appendChild(f);
  });

  // 首次进入时，各地点依次跳一下，告诉访客哪些地方能点
  if (!reduce) {
    Object.keys(SITE.GROUPS).filter((id) => SITE.GROUPS[id].href && groups[id])
      .forEach((id, i) => setTimeout(() => play(groups[id], 'hop'), 700 + i * 260));
  }

  // ---------- 石膏像：自我介绍 ----------
  const Speech = (function () {
    const bustLayer = (byGroup.bust || [])[0];
    if (!bustLayer) return null;
    const g = groups.bust;
    const ui = frame('bust');                 // 按钮和对话框跟着石膏像的位置走
    map.appendChild(ui);

    const bust = document.createElement('button');
    bust.className = 'greeter';
    bust.type = 'button';
    bust.setAttribute('aria-label', 'Hear my introduction');
    place(bust, ...bustLayer.hit);
    ui.appendChild(bust);

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.lang = 'en';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
    bubble.innerHTML = '<div class="bubble-text"><p></p></div><span class="bubble-next" aria-hidden="true">▸</span>';
    ui.appendChild(bubble);
    const text = bubble.querySelector('.bubble-text p');
    // 台词里可以写链接：[文字](网址)。打字时一个字一个字出现，链接也一样
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function parse(line) {
      const segs = []; const re = /\[([^\]]+)\]\(([^)\s]+)\)/g; let last = 0, m;
      while ((m = re.exec(line))) { if (m.index > last) segs.push({ t: line.slice(last, m.index) }); segs.push({ t: m[1], href: m[2] }); last = re.lastIndex; }
      if (last < line.length) segs.push({ t: line.slice(last) });
      return segs;
    }
    const plain = (line) => parse(line).map((g) => g.t).join('');
    function render(line, n = Infinity) {
      let left = n, html = '';
      for (const g of parse(line)) {
        if (left <= 0) break;
        const t = esc(g.t.slice(0, left)); left -= g.t.length;
        html += g.href ? `<a href="${esc(g.href)}" target="_blank" rel="noopener">${t}</a>` : t;
      }
      text.innerHTML = html;
    }
    text.addEventListener('click', (e) => { if (e.target.closest('a')) e.stopPropagation(); });   // 点链接不翻到下一句

    const lines = SITE.INTRO || [];
    const styles = SITE.BUBBLES;
    styles.forEach((st) => (new Image().src = st.img));   // 预加载
    let idx = -1, typing = null, auto = null, playing = false;

    // 长的台词用放大的对话框（BUBBLE_SCALE = [横向, 纵向] 倍数，以尾巴尖为中心放大）；
    // 短的台词（不超过 SHORT_LINE 个字母）用原来大小
    let cur = [1, 1];
    const scaleFor = (i) => plain(lines[i]).length <= (SITE.SHORT_LINE || 120) ? [1, 1] : [].concat(SITE.BUBBLE_SCALE || 1, SITE.BUBBLE_SCALE || 1).slice(0, 2);
    // 手机竖屏上对话框可能比屏幕还宽：整体（连同字号）缩小到正好放得下
    function fit(st) {
      const u = ui.offsetWidth / C.w, w = st.w * cur[0] * u;
      return Math.min(1, (innerWidth - 16) / w);
    }
    function box(st) {
      const f = fit(st), kx = cur[0] * f, ky = cur[1] * f, t = st.tail || [.5, .5];
      const ax = st.x + st.w * t[0], ay = st.y + st.h * t[1];
      return { x: ax - (ax - st.x) * kx, y: ay - (ay - st.y) * ky, w: st.w * kx, h: st.h * ky };
    }
    function show(i) {
      clearInterval(typing); clearTimeout(auto);
      if (i >= lines.length) return stop();
      idx = i;
      const k = i % styles.length, st = styles[k];
      cur = scaleFor(i);
      bubble.className = `bubble show style-${k}` + (cur[0] === 1 ? ' short' : '');   // 短句居中，长句两端对齐
      bubble.style.backgroundImage = `url(${st.img})`;
      const b = box(st);
      place(bubble, b.x, b.y, b.w, b.h);
      bubble.style.setProperty('--fit', fit(st) * (cur[0] > 1 ? (SITE.BIG_FONT || 1) : 1));   // 大对话框里字也大一点
      text.parentNode.style.inset = st.pad;
      play(g, 'talk');                         // 只有石膏像动，地上的字不动
      follow(st);
      const full = plain(lines[i]);
      if (reduce) { render(lines[i]); scheduleNext(); return; }
      let n = 0; text.textContent = '';
      typing = setInterval(() => {
        render(lines[i], ++n);
        if (n % 5 === 0) Sound.blip(n);       // 每 5 个字母响一下，不会太吵
        if (n >= full.length) { clearInterval(typing); typing = null; scheduleNext(); }
      }, SITE.TYPE_SPEED || 14);
    }
    // 竖屏手机上图可以左右滑：让画面跟着对话框走，保证整句话看得见
    function follow(st) {
      const sc = document.body;
      if (sc.scrollWidth <= sc.clientWidth + 2) return;
      const u = ui.offsetWidth / C.w;
      const bx = box(st);
      const l = ui.offsetLeft + bx.x * u, r = ui.offsetLeft + (bx.x + bx.w) * u;
      const mid = ui.offsetLeft + (bustLayer.hit[0] + bustLayer.hit[2] / 2) * u;
      sc.scrollTo({ left: (l + r) / 2 < mid ? l - 8 : r - sc.clientWidth + 8, behavior: reduce ? 'auto' : 'smooth' });
    }
    function scheduleNext() { auto = setTimeout(() => show(idx + 1), 2200 + plain(lines[idx]).length * 45); }
    function next() {
      if (typing) { clearInterval(typing); typing = null; render(lines[idx]); scheduleNext(); return; }
      show(idx + 1);
    }
    function start() { playing = true; show(0); }
    function stop() {
      playing = false; clearInterval(typing); clearTimeout(auto);
      bubble.classList.remove('show');
    }

    bust.addEventListener('pointerenter', () => { if (!playing) play(g, 'hop'); Sound.hover('about'); });
    bust.addEventListener('click', () => {
      Sound.click('about');
      if (playing) next(); else { play(g, 'jiggle'); start(); }
    });
    bubble.addEventListener('click', () => { Sound.hover('about'); next(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stop(); });

    // 竖屏手机：一开始把石膏像放在屏幕中间
    const center = () => {
      document.body.scrollLeft = Math.max(0, ui.offsetLeft + bust.offsetLeft + bust.offsetWidth / 2 - innerWidth / 2);
    };
    center(); window.addEventListener('resize', center);
    return { start, stop };
  })();

  // 第一次来：等各地点跳完之后自动开口；之后只有点击石膏像才说话
  if (Speech && !localStorage.getItem('intro-seen')) {
    localStorage.setItem('intro-seen', '1');
    setTimeout(() => Speech.start(), reduce ? 300 : 2300);
  }

  // 从子页面“返回”时恢复
  window.addEventListener('pageshow', () => {
    leaving = false;
    Object.values(groups).forEach((g) => g.classList.remove('hop', 'jiggle', 'talk'));
    Speech && Speech.stop();
  });
})();
