/* The frameless hero (home page only; loaded after site.js): picture loading and swaps, depth drift, the measurements hero.css needs
   (header height, photo box, hero bottom, CTA rows), the click-count bubble and the single footer Vice button. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)');
  var heroH = 800;                    /* hero height, kept by measure() for the scroll offset of the depth drift */

  /* ---------- the hero pictures ---------- */
  var fig = document.querySelector('.hp');
  var warmVice = function () {}, preparing = false;
  if (fig) {
    var imgs = { day: fig.querySelector('.hp-day'), night: fig.querySelector('.hp-night'), vice: fig.querySelector('.hp-vice') };

    var isDark = function () {
      var t = root.dataset.theme;
      return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    };
    var themePhoto = function () { return isDark() ? 'night' : 'day'; };
    var mode = function () { return root.hasAttribute('data-vice') ? 'vice' : themePhoto(); };

    var load = function (img) {
      if (img.getAttribute('src') || !img.dataset.src) return;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
    };
    var shown = mode();
    /* data-hp on .hp carries what the picture needs (wash, dimmer, masks, which picture is opaque), so the whole treatment changes
       in one step, when the picture does */
    var markShown = function (m) {
      shown = m;
      fig.setAttribute('data-hp', m);
      Object.keys(imgs).forEach(function (k) {
        if (k === m) imgs[k].removeAttribute('aria-hidden'); else imgs[k].setAttribute('aria-hidden', 'true');
      });
    };
    markShown(shown);

    /* A swap waits for the incoming picture to decode (at most 1.5s) while the outgoing one stays as it is, then flips data-hp and the
       CSS crossfade runs. Each swap has its own record; a newer swap (or a toggle back to what is shown) cancels the older one, and a
       late decode() of a cancelled swap does nothing. */
    var pending = null;
    var swap = function () {
      var m = mode();
      if (pending) { pending.done = true; clearTimeout(pending.timer); pending = null; }
      if (m === shown) return;
      var inc = imgs[m];
      load(inc);
      if (inc.complete && inc.naturalWidth) { markShown(m); return; }
      var s = pending = { done: false, timer: 0 };
      var finish = function () {
        if (s.done) return;
        s.done = true; clearTimeout(s.timer);
        if (pending === s) pending = null;
        markShown(m);
      };
      s.timer = setTimeout(finish, 1500);
      (inc.decode ? inc.decode() : Promise.reject()).then(finish, finish);
    };
    new MutationObserver(swap).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-vice'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', swap);

    /* the other theme's photo is fetched when someone heads for the theme button (most visitors never switch); the Vice drawing
       loads when Vice turns on, or earlier (see warmVice). A switch still waits for the picture to decode, so nothing pops. */
    var themeBtn = document.querySelector('.top .theme');
    var prefetch = function () { load(imgs[themePhoto() === 'day' ? 'night' : 'day']); };
    if (themeBtn) ['pointerenter', 'focus', 'touchstart'].forEach(function (ev) { themeBtn.addEventListener(ev, prefetch, { passive: true, once: true }); });

    /* site.js asks for the picture of the mode it is about to show before it starts the Vice City page cross-fade (a view
       transition), so the new view is captured complete and the switch is one smooth fade; it waits 1.2s at most */
    window.heroPrepare = function (vice) {
      var img = imgs[vice ? 'vice' : themePhoto()];
      load(img);
      preparing = true;                                    /* the bubble stays quiet until the switch has happened */
      return new Promise(function (res) {
        var t = setTimeout(end, 1200);
        function end() { clearTimeout(t); preparing = false; res(); }
        /* a downloaded picture is not always decoded: decode() settles at once when it is, and makes sure it is otherwise */
        (img.decode ? img.decode() : Promise.reject()).then(end, end);
      });
    };

    /* the footer button and the typed "vic" warm the drawing, so it is decoded when Vice turns on */
    var warmed = false;
    warmVice = function () {
      if (warmed) return;
      warmed = true;
      load(imgs.vice);
      if (imgs.vice.decode) imgs.vice.decode().catch(function () {});
      (new Image()).src = 'img/vice-bg.webp';
    };
  }

  /* ---------- depth: the pictures drift a few pixels with the pointer and the scroll (transform only, one rAF at a time) ---------- */
  if (fig && !calm.matches) {
    var hover = matchMedia('(hover:hover) and (pointer:fine)');
    var mx = 0, my = 0, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, lastT = 0, W = innerWidth, H = innerHeight;
    var retarget = function () {
      var sc = Math.min(1, Math.max(0, scrollY / Math.max(1, heroH)));
      tx = mx; ty = my + sc * 5;
    };
    var step = function (t) {
      raf = 0;
      var dt = Math.min(64, t - (lastT || t)); lastT = t;
      var k = 1 - Math.exp(-dt / 380);                      /* the same easing feel as the Vice sky (about .08 per 30fps frame) */
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      var still = Math.abs(tx - cx) < .04 && Math.abs(ty - cy) < .04;
      if (still) { cx = tx; cy = ty; lastT = 0; } else raf = requestAnimationFrame(step);
      fig.style.setProperty('--dx', cx.toFixed(2) + 'px');
      fig.style.setProperty('--dy', cy.toFixed(2) + 'px');
    };
    var ask = function () { if (!raf) raf = requestAnimationFrame(step); };
    /* mouse devices only: on phones the scroll drift would repaint the masked photo on every frame */
    addEventListener('scroll', function () { if (hover.matches && scrollY < heroH + 200) { retarget(); ask(); } }, { passive: true });
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !hover.matches || scrollY > heroH + 200) return;   /* the hero is off screen */
      mx = (e.clientX / W - .5) * -16; my = (e.clientY / H - .5) * -7;   /* opposite to the pointer, like the sky */
      retarget(); ask();
    }, { passive: true });
    root.addEventListener('pointerleave', function () { mx = 0; my = 0; retarget(); ask(); }, { passive: true });
    addEventListener('resize', function () { W = innerWidth; H = innerHeight; }, { passive: true });
    retarget();
  }

  /* ---------- measurements the CSS needs: header height, photo box, CTA row and hint row ---------- */
  var hero = document.querySelector('.hero'), cta = hero && hero.querySelector('.hero-cta'), hint = document.getElementById('mindHint');
  var topWrap = document.querySelector('.top .wrap'), phone = matchMedia('(max-width: 820px) and (orientation: portrait), (max-width: 820px) and (min-height: 541px)');   /* the layout with the photo across the top (hero.css) */
  if (hero) {
    var measure = function () {
      var h = hero.getBoundingClientRect(), s = root.style;
      s.setProperty('--hdr', Math.round(h.top + scrollY) + 'px');
      heroH = h.height;
      if (cta) { var c = cta.getBoundingClientRect(); hero.style.setProperty('--ct', (c.top - h.top) + 'px'); hero.style.setProperty('--cb', (c.bottom - h.top) + 'px'); }
      if (hint) { var t = hint.getBoundingClientRect(); hero.style.setProperty('--ht', (t.top - h.top) + 'px'); hero.style.setProperty('--hb', (t.bottom - h.top) + 'px'); }
      /* header: the rule fades out over the photo, the scrim sits behind the links only over the photo */
      if (fig && topWrap) {
        var p = fig.getBoundingClientRect(), w = topWrap.getBoundingClientRect();
        if (phone.matches) { s.setProperty('--rf0', '0px'); s.setProperty('--rf1', '0px'); s.setProperty('--hp-l', '-400px'); }
        else {
          s.setProperty('--rf0', Math.round(p.left + p.width * .05 - w.left) + 'px');
          s.setProperty('--rf1', Math.round(p.left + p.width * .3 - w.left) + 'px');
          s.setProperty('--hp-l', Math.round(p.left) + 'px');
        }
      }
    };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(measure);
      [hero, cta, hint, hero.querySelector('.name'), document.querySelector('.top')].forEach(function (el) { if (el) ro.observe(el); });
    }
    addEventListener('resize', measure);
    /* after a rotation some phones report the new size before the layout has settled: measure again once it has */
    addEventListener('orientationchange', function () { setTimeout(measure, 250); setTimeout(measure, 700); });
    new MutationObserver(measure).observe(root, { attributes: true, attributeFilter: ['lang', 'dir'] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* ---------- Vice City click-count bubble ----------
     site.js counts the clicks on the hero network (five within 4 seconds turn Vice City on; a finger counts when it lifts without
     moving, so a scroll flick is not a click) and announces each one with a 'mind-hit' event; the bubble says how many are left. */
  var MSG = {
    en: { click: 'Keep clicking here…', tap: 'Keep tapping here…', three: '3 more…', two: '2 more…', one: 'One more!', faster: 'Faster…' },
    fa: { click: 'بازم کلیک کن…', tap: 'بازم بزن روش…', three: '۳ تای دیگه…', two: '۲ تای دیگه…', one: 'فقط یکی دیگه!', faster: 'تندتر…' },
    it: { click: 'Continua a cliccare qui…', tap: 'Continua a toccare qui…', three: 'Ancora 3…', two: 'Ancora 2…', one: 'Ancora uno!', faster: 'Più veloce…' }
  };
  var bubble = null, hideTimer = 0;

  function say(text, x, y, touch) {
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'vb';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.setAttribute('dir', 'auto');
      document.body.appendChild(bubble);
    }
    clearTimeout(hideTimer);
    bubble.classList.remove('on');
    bubble.style.transition = 'none';
    bubble.textContent = text;
    var w = bubble.offsetWidth, h = bubble.offsetHeight, gap = touch ? 44 : 18, pad = 8;   /* a finger covers what is under it */
    var left = Math.min(Math.max(pad, x - w / 2), innerWidth - w - pad);
    var top = Math.max(pad, y - gap - h);
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
    bubble.style.setProperty('--tx', Math.min(Math.max(16, x - left), w - 16) + 'px');
    void bubble.offsetWidth;
    bubble.style.transition = '';
    bubble.classList.add('on');
    hideTimer = setTimeout(function () { bubble.classList.remove('on'); }, 1900);   /* 300ms in, 1.6s hold, then the 500ms fade */
  }

  if (hero) hero.addEventListener('mind-hit', function (e) {
    var d = e.detail || {};
    if (preparing || !d.count || d.count >= 5 || root.hasAttribute('data-vice')) return;   /* the fifth click switches Vice City and shows its own toast */
    var m = MSG[(root.lang || 'en').slice(0, 2)] || MSG.en;
    var text = d.prev > 0 && d.count <= d.prev
      ? m.faster                                                              /* the 4s window slid: the count did not rise */
      : [null, d.touch ? m.tap : m.click, m.three, m.two, m.one][d.count];
    if (text) say(text, d.x, d.y, d.touch);
  });

  /* ---------- the footer's single Vice button ----------
     The old GTA hint and "Leave Vice City" are one button: outside Vice it reads viceHint, inside Vice viceLeave, and it never hides, so
     keyboard focus stays on it. site.js binds it through its .vice-leave class (it gets the click event, so a tap shows the "tap" toast);
     the class is dropped right after so site.js does not park the focus on the home link when leaving. The Persian and Italian texts
     (viceHint, viceLeave) are in i18n.js; site.js re-applies them by data-i and data-en on every language change. */
  var btn = document.querySelector('.vice-btn');
  if (btn) {
    var EN = { viceHint: btn.dataset.en || btn.innerHTML, viceLeave: btn.getAttribute('data-en-leave') || 'Leave Vice City' };
    var label = function () {
      var key = root.hasAttribute('data-vice') ? 'viceLeave' : 'viceHint', l = (root.lang || 'en').slice(0, 2);
      var t = window.I18N && l !== 'en' && I18N[l] && I18N[l][key];
      btn.dataset.i = key;
      btn.dataset.en = EN[key];
      var html = t != null && t !== false ? t : EN[key];
      if (btn.innerHTML !== html) btn.innerHTML = html;
    };
    label();
    new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['data-vice', 'lang'] });
    btn.classList.remove('vice-leave');
    btn.addEventListener('pointerenter', warmVice);
    btn.addEventListener('focus', warmVice);
    btn.addEventListener('touchstart', warmVice, { passive: true });
    /* typing "vice" is the other way in: warm the picture at "vic" */
    var buf = '';
    addEventListener('keydown', function (e) {
      var t = e.target;
      if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
      buf = (buf + e.key.toLowerCase()).slice(-3);
      if (buf === 'vic') warmVice();
    });
  }
})();
