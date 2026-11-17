/* AI Bridge animations. Finds .bx3 (JSON file relay, projects page) and .bx4 (Persian "second voice", homepage) and
   runs the ones present. The JSON relay loops while >=30% in view; the homepage panel plays one pass each time it scrolls into view; reduced motion shows a static final frame.
   On the homepage a panel waits for the card's pencil-sketch intro (.sk-settled) before it starts. */
(function(){
'use strict';
var root = document.documentElement;
var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
function reduced(){ return root.classList.contains('rm') || mq.matches; }
function K(el,k){ return el.querySelector('[data-k="'+k+'"]'); }
function on(el){ el.classList.add('on'); }
function off(el){ el.classList.remove('on'); }

/* split text into per-letter units so the layout stays fixed while revealing */
function mkU(txt){ var s=document.createElement('span'); s.className='bx-u'; s.textContent=txt; return s; }
function prep(rootEl){
  (function walk(n){
    Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType === 3){
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(tok){
          if(!tok) return;
          if(/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(tok)); return; }
          var w=document.createElement('span'); w.className='bx-w';
          Array.from(tok).forEach(function(ch){ w.appendChild(mkU(ch)); });
          frag.appendChild(w);
        });
        c.parentNode.replaceChild(frag,c);
      } else if(c.nodeType === 1 && !c.classList.contains('bx-u') && !c.classList.contains('bx-thd')){ walk(c); }
    });
  })(rootEl);
}
function showAll(el){ el.querySelectorAll('.bx-u').forEach(function(u){ u.classList.add('on'); }); }
function hideAll(el){ el.querySelectorAll('.bx-u').forEach(function(u){ u.classList.remove('on'); }); }
async function reveal(el, ms, w){
  var us = el.querySelectorAll('.bx-u:not(.on)');
  for(var i=0;i<us.length;i++){ us[i].classList.add('on'); await w(ms); }
}

var concepts = [];
/* a soft pink ring around the panel as the pass starts, so a visitor scrolling by notices it */
function pulse(c){
  var v = c.el.closest('.vis'); if(!v) return;
  v.classList.remove('bx-discover'); void v.offsetWidth; v.classList.add('bx-discover');
  v.addEventListener('animationend', function f(e){ if(e.animationName==='bx-discover'){ v.classList.remove('bx-discover'); v.removeEventListener('animationend',f); } });
}
function doReset(c){ c.el.classList.add('bx-rst'); c.el.classList.remove('bx-fading'); c.reset(); void c.el.offsetWidth; c.el.classList.remove('bx-rst'); }
function start(c){
  var g = c.gen = (c.gen||0) + 1;
  doReset(c);
  if(reduced()){ c.el.classList.add('bx-rst'); c.still(); void c.el.offsetWidth; c.el.classList.remove('bx-rst'); return; }
  if(!(c.inView && c.ready)) return;
  var w = function(ms){ return new Promise(function(res,rej){ setTimeout(function(){ c.gen===g ? res() : rej(); }, ms); }); };
  (async function(){
    try{
      while(c.gen === g){
        doReset(c);
        await w(100);
        if(c.once) pulse(c);
        await c.play(w);
        if(c.once) break; /* homepage: one pass per visit into view, then the natural sentence stays */
        c.el.classList.add('bx-fading'); await w(450); /* content fades out, frame stays */
      }
    }catch(e){ /* cancelled by a restart */ }
  })();
}

/* ---------- JSON file: Claude Code | Codex terminals and the request file, about 14 s per loop ---------- */
function jsonFile(el){
  prep(el.querySelector('.bx-terms')); prep(el.querySelector('.bx-code'));
  var g = function(k){ return K(el,k); };
  var st = g('st'), live = g('live');
  function setSt(s){ st.dataset.s = s; st.textContent = s; }
  return { el:el,
    reset:function(){ hideAll(el); setSt('queued'); off(live); },
    still:function(){ showAll(el); setSt('answered'); },
    play:async function(w){
      await reveal(g('tc1'),20,w); await w(200);
      on(live);
      for(var i=0;i<=5;i++){ await reveal(g('f'+i),8,w); await w(50); }
      await reveal(g('tc2'),14,w); await reveal(g('tc3'),14,w); await w(400);
      await reveal(g('tg1'),20,w); setSt('running'); await w(500);
      await reveal(g('tg2'),20,w); await w(900);
      await reveal(g('tg3'),16,w); await w(500);
      setSt('answered'); await reveal(g('f6'),10,w); await reveal(g('f7'),10,w); off(live);
      await reveal(g('tg4'),16,w); await w(300);
      await reveal(g('tc4'),14,w); await w(1800);
    } };
}

/* ---------- second voice: the stiff Persian sentence is marked and replaced, about 13 s per pass ----------
   Five steps (0-4). The pass plays them on a timer; a click, tap, Enter or Space on the panel steps through them by hand
   (the last step goes back to the first). Earlier lines stay on screen like a chat log, so the panel fills up as it goes. */
function secondVoice(el){
  var g = function(k){ return K(el,k); };
  var oldS = g('old'), newS = g('new'), dot = g('dot'), run = g('run'), l1 = g('l1'), l2 = g('l2'), mg = g('mg');
  var wire = dot.parentNode; /* turns solid pink once the question has reached ChatGPT, so step 2 keeps a mark of its own */
  var newW = newS.querySelectorAll('.bx-wd'), dots = el.querySelectorAll('.bx-dots i'), N = 5, tm = 0;
  var c = { el:el, step:-1 };
  function mark(k){ c.step = k; dots.forEach(function(d,i){ d.classList.toggle('on', i<=k); d.classList.toggle('cur', i===k); }); }
  function words(stagger){ newW.forEach(function(x,j){ x.style.transitionDelay = stagger ? (j*.13)+'s' : ''; x.classList.add('on'); }); }
  /* what each step adds; anim = true when the step is the one being played now */
  var A = [
    function(){ g('mc').classList.add('lit'); on(l1); },
    function(anim){ dot.className='bx-dot go'; if(anim) tm = setTimeout(function(){ mg.classList.add('lit'); wire.classList.add('sent'); }, 1000); else { mg.classList.add('lit'); wire.classList.add('sent'); } },
    function(){ run.classList.add('ul'); on(l2); l1.classList.add('dim'); },
    function(){ oldS.classList.add('strike'); },
    function(anim){ oldS.classList.add('out'); words(anim); dot.className='bx-dot back'; }
  ];
  c.reset = function(){
    clearTimeout(tm);
    g('mc').classList.remove('lit'); mg.classList.remove('lit'); wire.classList.remove('sent'); off(l1); off(l2); l1.classList.remove('dim');
    dot.className='bx-dot'; oldS.classList.remove('strike','out'); run.classList.remove('ul');
    newW.forEach(function(x){ x.classList.remove('on'); x.style.transitionDelay=''; });
    mark(-1);
  };
  c.still = function(){ for(var i=0;i<N;i++) A[i](false); dot.className='bx-dot'; mark(N-1); };
  c.play = async function(w){
    A[0](); mark(0); await w(600);
    mark(1); dot.className='bx-dot go'; await w(1300); mg.classList.add('lit'); wire.classList.add('sent'); await w(1100);
    mark(2); run.classList.add('ul'); await w(600); on(l2); l1.classList.add('dim'); await w(1400);
    mark(3); oldS.classList.add('strike'); await w(900);
    mark(4); oldS.classList.add('out'); await w(200);
    for(var j=0;j<newW.length;j++){ newW[j].classList.add('on'); await w(450); }
    dot.className='bx-dot back'; await w(1200);
    await w(1500);
  };
  /* by hand: stop the timed pass, show everything before step k at once, then play step k */
  c.advance = function(){
    c.gen = (c.gen||0) + 1;
    var k = c.step >= N-1 ? 0 : c.step + 1;
    el.classList.add('bx-rst'); el.classList.remove('bx-fading'); c.reset();
    for(var i=0;i<k;i++) A[i](false);
    dot.className='bx-dot';
    void el.offsetWidth; el.classList.remove('bx-rst');
    A[k](true); mark(k);
  };
  return c;
}

document.querySelectorAll('.bx3').forEach(function(p){ concepts.push(jsonFile(p)); });
document.querySelectorAll('.bx4').forEach(function(p){
  var c = secondVoice(p); c.once = true; concepts.push(c);
  var vis = p.closest('.vis'); if(!vis) return;
  vis.addEventListener('click', function(){ c.advance(); });
  vis.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){ e.preventDefault(); c.advance(); } });
});

/* the homepage cards have a sketch intro: wait for .sk-settled (latched), or go at once when the intro is off */
function watchReady(c){
  var card = c.el.closest('[data-sk]');
  c.ready = false;
  var tm = 0;
  function check(){
    if(c.ready) return;
    if(!card || !root.classList.contains('sk-on') || card.classList.contains('sk-settled')){ clearTimeout(tm); c.ready = true; start(c); return; }
    /* start shortly after the card is drawn in, not after the whole sketch intro has settled */
    if(card.classList.contains('sk-built') && !tm) tm = setTimeout(function(){ if(!c.ready){ c.ready = true; start(c); } }, 700);
  }
  if(!card){ c.ready = true; return; }
  var mo = new MutationObserver(check);
  mo.observe(card,{attributes:true,attributeFilter:['class']});
  mo.observe(root,{attributes:true,attributeFilter:['class']});
  check();
}

concepts.forEach(function(c){
  watchReady(c);
  if(!('IntersectionObserver' in window)){ c.inView = true; start(c); return; }
  start(c);
  new IntersectionObserver(function(es){
    var e = es[es.length-1], v = e.isIntersecting && e.intersectionRatio >= .3;
    if(v !== c.inView){ c.inView = v; start(c); }
  }, {threshold:.3}).observe(c.el);
});
if(mq.addEventListener) mq.addEventListener('change', function(){ concepts.forEach(start); });
})();
