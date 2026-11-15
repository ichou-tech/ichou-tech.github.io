/* =========================================================
 * sound.js — 用 Web Audio API 实时合成的音效（无需音频文件）
 *   Sound.hover()   悬停时轻微的“叮”
 *   Sound.click()   点击入口时的“啵”+ 泛音
 *   Sound.whoosh()  页面转场的风声
 *   Sound.press() / release() / home()  回到首页按钮：按下、松开、回家
 *   Sound.toggle()  切换静音（键盘 M）
 * 页面上没有声音按钮：访客随便点一下页面，声音就会打开。
 * ========================================================= */
(function () {
  let ctx = null;
  let muted = false;      // 默认有声音，页面上没有静音按钮（按键盘 M 可以静音/恢复）

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  // 浏览器规定：访客和页面有过一次交互（点击、触摸、按键）之后才允许出声。
  // 所以这里监听整个页面：随便点哪里一下，声音就打开了，不需要任何按钮。
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, () => ac(), { capture: true, passive: true }));
  // 有些浏览器（访客以前来过、或者设置里允许了）一进页面就能出声，先试一下
  window.addEventListener('load', () => { try { ac(); } catch (e) {} });
  // 声音还没被允许时，请求只保留 0.4 秒：这样第一次点击本身能出声，
  // 但之前攒下的声音（比如石膏像自动说话的打字声）不会在点击时一起放出来。
  function run(play) {
    const c = ac(); if (!c || muted) return;
    if (c.state === 'running') return play(c);
    const asked = performance.now();
    c.resume().then(() => { if (performance.now() - asked < 400 && !muted) play(c); }).catch(() => {});
  }

  // 一个带包络的振荡器
  function tone({ freq = 440, to = null, type = 'sine', dur = 0.15, vol = 0.2, delay = 0 }) {
    run((c) => {
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
    });
  }

  // 滤波白噪声（风声 / 纸张声）
  function noise({ dur = 0.4, from = 400, to = 3000, vol = 0.12, delay = 0 }) {
    run((c) => {
    const t = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t); src.stop(t + dur);
    });
  }

  // 每个模块可以有自己的音高，让入口听起来有区别
  const PITCH = { back: 440, reading: 523.25, projects: 659.25, blog: 783.99, about: 587.33, research: 698.46, default: 600 };

  const Sound = {
    hover(id) {
      const f = PITCH[id] || PITCH.default;
      tone({ freq: f * 2, type: 'triangle', dur: 0.08, vol: 0.05 });
    },
    click(id) {
      const f = PITCH[id] || PITCH.default;
      tone({ freq: f * 1.5, to: f, type: 'sine', dur: 0.12, vol: 0.25 });       // “啵”
      tone({ freq: f, type: 'triangle', dur: 0.35, vol: 0.12, delay: 0.05 });     // 主音
      tone({ freq: f * 1.5, type: 'sine', dur: 0.45, vol: 0.06, delay: 0.1 });    // 五度泛音
    },
    whoosh() { noise({ dur: 0.45, from: 300, to: 2500, vol: 0.1 }); },
    blip(i = 0) { tone({ freq: 520 + (i % 5) * 60, type: 'square', dur: 0.03, vol: 0.025 }); },
    // Back to HomePage 按钮：按下去“咚”、松开“咔”、回家的小琶音
    press() {
      tone({ freq: 180, to: 70, type: 'sine', dur: 0.12, vol: 0.32 });
      noise({ dur: 0.05, from: 900, to: 300, vol: 0.12 });
    },
    release() {
      tone({ freq: 1250, to: 900, type: 'triangle', dur: 0.05, vol: 0.12 });
      noise({ dur: 0.04, from: 2500, to: 4000, vol: 0.06 });
    },
    home() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.1, delay: i * 0.07 }));
    },
    back() { tone({ freq: 700, to: 420, type: 'triangle', dur: 0.15, vol: 0.15 }); },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      if (!muted) tone({ freq: 880, type: 'sine', dur: 0.12, vol: 0.15 });
      document.dispatchEvent(new CustomEvent('mutechange', { detail: muted }));
      return muted;
    },
  };
  window.Sound = Sound;
})();
