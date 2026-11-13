/* Sketch to built (homepage, loaded by index.html): adds .sk-built to each [data-sk] unit as it scrolls in, and .sk-settled
   about 1.8 s later so the build transitions stop applying. Hold B (or the footer button) for the x-ray. */
(function () {
  var root = document.documentElement;
  window.skReady = true; // tells the failsafe in <head> that this script ran
  if (!root.classList.contains('sk-on')) return;

  var units = [].slice.call(document.querySelectorAll('[data-sk]'));
  var hero = document.querySelector('.hero[data-sk]');
  var keyOn = false, btnOn = false, xray = false, held = [];

  var SETTLE_MS = 1800;

  // show a unit as built, and mark it settled once its build transitions are over
  function show(u) {
    u.classList.add('sk-built');
    clearTimeout(u._skT);
    u._skT = setTimeout(function () { u.classList.add('sk-settled'); }, SETTLE_MS);
  }
  // back to the sketch: no longer built or settled, pending timer cancelled
  function hide(u) {
    clearTimeout(u._skT);
    u.classList.remove('sk-built', 'sk-settled');
  }

  // build a unit now, or remember it for when the x-ray is released
  function build(u) {
    if (xray) { if (held.indexOf(u) < 0) held.push(u); }
    else show(u);
  }

  // x-ray: strip .sk-built from every built unit; on release put it back on exactly those
  function sync() {
    var want = keyOn || btnOn;
    if (want === xray) return;
    xray = want;
    if (xray) {
      held = units.filter(function (u) { return u.classList.contains('sk-built'); });
      held.forEach(hide);
    } else {
      held.forEach(show);
      held = [];
    }
  }

  // hero builds shortly after load starts (not waiting for fonts or images)
  if (hero) setTimeout(function () { build(hero); }, 150);

  // everything else builds when it scrolls into view (or is already above the viewport)
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { build(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  units.forEach(function (u) { if (u !== hero) io.observe(u); });

  // key B
  function typing(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  addEventListener('keydown', function (e) {
    if (e.key !== 'b' && e.key !== 'B') return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || typing(e.target)) return;
    keyOn = true; sync();
  });
  addEventListener('keyup', function (e) {
    if (e.key === 'b' || e.key === 'B') { keyOn = false; sync(); }
  });

  // footer button: pointer hold, or Space/Enter held
  var btn = document.querySelector('.sk-hold');
  function btnSet(on) { btnOn = on; sync(); }
  if (btn) {
    btn.addEventListener('pointerdown', function () { btnSet(true); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) {
      btn.addEventListener(n, function () { btnSet(false); });
    });
    btn.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) btnSet(true);
    });
    btn.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') btnSet(false);
    });
    btn.addEventListener('blur', function () { btnSet(false); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); }); // long-press on phones
  }
  // never get stuck in the x-ray
  addEventListener('blur', function () { keyOn = false; btnOn = false; sync(); });
  addEventListener('pointerup', function () { if (btnOn) btnSet(false); });
})();
