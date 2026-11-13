/* AI Bridge animations. Finds .bx3 (JSON file relay, projects page) and .bx4 (Persian "second voice", homepage) and
   runs the ones present. Each loops while >=30% in view; reduced motion shows a static final frame.
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
        await c.play(w);
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

/* ---------- second voice: the stiff Persian sentence is marked and replaced, about 13 s per loop ---------- */
function secondVoice(el){
  var g = function(k){ return K(el,k); };
  var oldS = g('old'), newS = g('new'), dot = g('dot'), run = g('run');
  var newW = newS.querySelectorAll('.bx-wd');
  return { el:el,
    reset:function(){
      g('mc').classList.remove('lit'); g('mg').classList.remove('lit'); off(g('l1')); off(g('l2'));
      dot.className='bx-dot'; oldS.classList.remove('strike','out'); run.classList.remove('ul');
      newW.forEach(function(x){ x.classList.remove('on'); });
    },
    still:function(){
      g('mc').classList.add('lit'); g('mg').classList.add('lit'); on(g('l1')); on(g('l2'));
      oldS.classList.add('out'); newW.forEach(function(x){ x.classList.add('on'); });
    },
    play:async function(w){
      g('mc').classList.add('lit'); on(g('l1')); await w(600);
      dot.className='bx-dot go'; await w(1300); g('mg').classList.add('lit'); await w(1100);
      run.classList.add('ul'); await w(600); on(g('l2')); await w(1400);
      oldS.classList.add('strike'); await w(900);
      oldS.classList.add('out'); await w(200);
      for(var j=0;j<newW.length;j++){ newW[j].classList.add('on'); await w(450); }
      dot.className='bx-dot back'; await w(1200);
      await w(1500);
    } };
}

document.querySelectorAll('.bx3').forEach(function(p){ concepts.push(jsonFile(p)); });
document.querySelectorAll('.bx4').forEach(function(p){ concepts.push(secondVoice(p)); });

/* the homepage cards have a sketch intro: wait for .sk-settled (latched), or go at once when the intro is off */
function watchReady(c){
  var card = c.el.closest('[data-sk]');
  c.ready = false;
  function check(){
    if(c.ready) return;
    if(!card || !root.classList.contains('sk-on') || card.classList.contains('sk-settled')){ c.ready = true; start(c); }
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
