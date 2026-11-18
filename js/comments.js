/* =========================================================
 * comments.js — 博客文章下面的评论区（giscus：评论存在 GitHub Discussions 里）
 *
 * 只需要填下面两个 id（去 https://giscus.app 填仓库名后，页面下方生成的代码里能找到）：
 *   data-repo-id      → REPO_ID
 *   data-category-id  → CATEGORY_ID
 * 没填之前，文章下面只显示 “Comments will open soon.”
 * ========================================================= */
(function () {
  const GISCUS = {
    REPO: 'ichou-tech/ichou-tech.github.io',
    REPO_ID: 'R_kgDOVvPziA',          // ← 粘贴 data-repo-id，例如 'R_kgDOxxxxxx'
    CATEGORY: 'Announcements',
    CATEGORY_ID: 'DIC_kwDOVvPziM4DLYOj',      // ← 粘贴 data-category-id，例如 'DIC_kwDOxxxxxx4Cxxxx'
    LANG: 'en',
  };

  window.Comments = {
    // Comments.mount('#article', 'blog/attention')：每篇文章固定对应一个讨论串
    mount(sel, term) {
      const host = document.querySelector(sel);
      if (!host || !term) return;
      const box = document.createElement('section');
      box.className = 'comments';
      box.innerHTML = '<h2>Comments</h2>';
      host.appendChild(box);

      if (!GISCUS.REPO_ID || !GISCUS.CATEGORY_ID) {
        box.insertAdjacentHTML('beforeend', '<p class="empty">Comments will open soon.</p>');
        return;
      }
      if (location.protocol === 'file:') {
        box.insertAdjacentHTML('beforeend', '<p class="empty">Open the site with 预览网站.command to see comments.</p>');
        return;
      }
      // 评论框的配色 / 字体用网站自己的 css/giscus.css（纸张风格）
      const theme = new URL((document.body.dataset.root || '../') + 'css/giscus.css?v=1119', location.href).href;
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.async = true;
      s.crossOrigin = 'anonymous';
      Object.entries({
        repo: GISCUS.REPO, 'repo-id': GISCUS.REPO_ID,
        category: GISCUS.CATEGORY, 'category-id': GISCUS.CATEGORY_ID,
        mapping: 'specific', term, strict: '1',
        'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'bottom',
        theme, lang: GISCUS.LANG, loading: 'lazy',
      }).forEach(([k, v]) => s.setAttribute('data-' + k, v));
      box.appendChild(s);
    },
  };
})();
