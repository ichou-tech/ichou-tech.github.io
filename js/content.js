/* =========================================================
 * content.js — 从 content/<模块>/index.json 读取列表，
 * 从 content/<模块>/<id>.md 读取正文并用 Markdown 渲染。
 *
 * 加一篇文章 = ① 在 content/blog/ 新建 my-post.md
 *              ② 在 content/blog/index.json 的 posts 里加一行
 * ========================================================= */
(function () {
  const root = document.body.dataset.root || '../';
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tags = (t) => (t && t.length ? `<div class="tags">${t.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '');

  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return r.json();
  }

  function fail(el, err) {
    if (location.protocol === 'file:') {
      // 双击打开的 HTML 读不到 content/ 里的文件（浏览器的安全限制）
      const msg = '<p>Open the site with <b>预览网站.command</b> to see this.</p><p class="empty">直接双击 HTML 打开时，浏览器不允许读取文章内容。请双击网站文件夹里的「预览网站.command」，它会在浏览器里打开完整的网站。</p>';
      el.innerHTML = el.tagName === 'UL' ? `<li><div class="sheet paper">${msg}</div></li>` : msg;
      return;
    }
    if (el.tagName !== 'UL') { el.innerHTML = `<p class="empty">Failed to load (${esc(err.message)}).</p>`; return; }
    el.innerHTML = `<li><div class="sheet paper"><p class="empty">Failed to load (${esc(err.message)}).</p><p class="empty">直接双击打开 HTML 文件读不到内容，请用本地服务器预览，见 README。</p></div></li>`;
  }

  // 一条内容 = 一张纸。 items: [{id,title,date,summary,tags,meta,href,stamp,cover}]
  // cover：纸上的小图，路径相对 content/<模块>/（例如 "peeker/sketch.webp"）
  function cards(el, items, hrefOf, start = 0, type = '') {
    if (!items || !items.length) { if (!start) el.innerHTML = '<li><div class="sheet paper"><p class="empty">Coming soon…</p></div></li>'; return; }
    const show = el.classList.contains('showcase');   // 展示式：图在上、不能点开（index.json 里 "layout": "showcase"）
    el.insertAdjacentHTML('beforeend', items.map((p, i) => {
      const href = hrefOf(p), ext = /^https?:/.test(href);
      const link = !show || !!p.href;                    // 展示式里只有写了 href 的项目才是链接
      const img = p.cover ? `<img class="cover" src="${esc(/^https?:|^\//.test(p.cover) ? p.cover : `${root}content/${type}/${p.cover}`)}" alt="" loading="lazy" draggable="false">` : '';
      // 简介以项目名开头时，把名字加粗
      const sum = p.summary ? (show && p.summary.startsWith(p.title) ? `<p><strong>${esc(p.title)}</strong>${esc(p.summary.slice(p.title.length))}</p>` : `<p>${esc(p.summary)}</p>`) : '';
      const open = link ? `<a class="sheet paper" href="${esc(href)}" ${ext ? 'target="_blank" rel="noopener"' : ''}>` : '<div class="sheet paper">';
      return `
      <li style="--i:${start + i}"${p.size ? ` class="${esc(p.size)}"` : ''}>${open}
        ${show ? img : ''}
        ${p.stamp ? `<span class="stamp">${esc(p.stamp)}</span>` : ''}
        ${p.date || p.period ? `<div class="date">${esc(p.period || p.date)}</div>` : ''}
        <h3>${esc(p.title)}</h3>
        ${p.meta ? `<div class="meta">${esc(p.meta)}</div>` : ''}
        <div class="grow">${sum}${p.steps ? `<ol class="steps">${p.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}${show ? '' : img}</div>
        ${tags(p.tags)}
        ${link ? `<div class="more">${ext ? 'Open ↗' : 'Read →'}</div>` : ''}
      ${link ? '</a>' : '</div>'}${p.period ? `<span class="when">${esc(p.period)}</span>` : ''}</li>`;
    }).join(''));
  }

  const sortByDate = (a) => [...(a || [])].sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));

  window.Content = {
    // 列表页：Content.list('blog', '#posts', 'post.html')
    async list(type, sel, page = 'post.html') {
      const el = document.querySelector(sel);
      try {
        const data = await getJSON(`${root}content/${type}/index.json`);
        if (data.timeline) el.classList.add('timeline');
        if (data.layout === 'showcase') el.classList.add('showcase');
        cards(el, sortByDate(data.posts), (p) => p.href || `${page}?id=${encodeURIComponent(p.id)}`, 0, type);
        return data;
      } catch (e) { fail(el, e); }
    },

    // 普通卡片（项目、推荐文献等）
    cards,

    // 详情页：Content.post('blog', '#article')
    async post(type, sel) {
      const el = document.querySelector(sel);
      const id = new URLSearchParams(location.search).get('id');
      if (!id || !/^[\w\-]+$/.test(id)) { el.innerHTML = '<p class="empty">Page not found.</p>'; return; }
      try {
        const [data, md] = await Promise.all([
          getJSON(`${root}content/${type}/index.json`),
          fetch(`${root}content/${type}/${id}.md`, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(id + '.md ' + r.status); return r.text(); }),
        ]);
        const meta = (data.posts || []).find((p) => p.id === id) || {};
        if (meta.title) document.title = `${meta.title} · ${document.title}`;
        el.innerHTML = `
          <div class="meta">${esc([meta.period || meta.date, meta.meta].filter(Boolean).join(' · '))}</div>
          ${marked.parse(md)}
          ${tags(meta.tags)}`;
        // 相对图片路径以 content/<type>/ 为基准
        el.querySelectorAll('img').forEach((im) => {
          const s = im.getAttribute('src');
          if (s && !/^(https?:|\/|data:)/.test(s)) im.src = `${root}content/${type}/${s}`;
        });
      } catch (e) { fail(el, e); }
    },
  };
})();
