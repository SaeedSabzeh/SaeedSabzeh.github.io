// Shared by the homepage and the projects page: language switcher, copy-email,
// rank strip, the QGIS screenshot slider and the homepage extras (thought network,
// story thread, wololo). Every part checks that its elements exist.
(function(){
  var root=document.documentElement;
  var titleKey=root.getAttribute('data-title')||'pageTitle';
  var EN={copy:'Copy email',copied:'Copied',selected:'Selected, press Ctrl+C',wololoBlue:'Wololo! This page now plays for the blue team.',wololoRed:'Wololo! Back to red.',
    // Milan time line under the contact text ({t} becomes the Milan time). Edit the wording here.
    mtNow:'It’s {t} in Milan.'};
  EN[titleKey]=document.title;
  var cur='en',langHooks=[];
  function tx(k){return (typeof I18N!=='undefined'&&I18N[cur]&&I18N[cur][k])||EN[k]}

  // ---- language ----
  var nodes=[].slice.call(document.querySelectorAll('[data-i]'));
  nodes.forEach(function(n){n.dataset.en=n.innerHTML});
  var labels=[];
  ['alt','aria-label','aria-roledescription'].forEach(function(attr){
    document.querySelectorAll('[data-i-'+attr+']').forEach(function(node){
      labels.push({node:node,attr:attr,key:node.getAttribute('data-i-'+attr),en:node.getAttribute(attr)});
    });
  });
  var group=document.querySelector('.langs');
  var btns=[].slice.call(document.querySelectorAll('.langs button'));
  var copyBtn=document.getElementById('copy'),mailEl=document.getElementById('email');
  function movePill(){
    if(!group)return;
    var on=btns.filter(function(b){return b.dataset.l===cur})[0];
    if(!on)return;
    group.style.setProperty('--pill-x',on.offsetLeft+'px');
    group.style.setProperty('--pill-w',on.offsetWidth+'px');
  }
  function setLang(l){
    if(typeof I18N==='undefined'||(!I18N[l]&&l!=='en'))l='en';
    cur=l;
    root.lang=l;root.dir=l==='fa'?'rtl':'ltr';
    nodes.forEach(function(n){var t=l!=='en'&&I18N[l][n.dataset.i];n.innerHTML=t!=null&&t!==false?t:n.dataset.en});
    labels.forEach(function(label){label.node.setAttribute(label.attr,tx(label.key)||label.en)});
    document.title=tx(titleKey);
    btns.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.l===l?'true':'false')});
    movePill();
    if(copyBtn)copyBtn.textContent=tx('copy');
    try{localStorage.setItem('lang',l)}catch(x){}
    langHooks.forEach(function(fn){fn()});
    if(window.drawStrip)window.drawStrip();
  }
  var calm=matchMedia('(prefers-reduced-motion: reduce)');
  // Keep whatever the reader was looking at in the same place: line heights
  // and wrapping differ between languages, so the page height changes.
  function keepPlace(fn){
    var a=[].slice.call(document.querySelectorAll('main h1,main h2,main h3,main p,main figure,main li,footer')).filter(function(e){return e.getBoundingClientRect().top>=0})[0];
    var y=a&&a.getBoundingClientRect().top;
    fn();
    if(a&&scrollY>0)scrollBy(0,a.getBoundingClientRect().top-y);
  }
  function switchLang(l){
    if(l===cur)return;
    var swap=function(){keepPlace(function(){setLang(l)})};
    if(calm.matches)return swap();
    if(document.startViewTransition)return document.startViewTransition(swap);
    root.classList.add('lang-swap');
    setTimeout(function(){swap();requestAnimationFrame(function(){root.classList.remove('lang-swap')})},200);
  }
  btns.forEach(function(x){x.addEventListener('click',function(){switchLang(x.dataset.l)})});

  // ---- copy email ----
  if(copyBtn&&mailEl){
    copyBtn.addEventListener('click',function(){
      function sel(){var r=document.createRange();r.selectNodeContents(mailEl);var s=getSelection();s.removeAllRanges();s.addRange(r);copyBtn.textContent=tx('selected');}
      try{navigator.clipboard.writeText(mailEl.textContent).then(function(){copyBtn.textContent=tx('copied');setTimeout(function(){copyBtn.textContent=tx('copy')},1800)},sel)}catch(x){sel()}
    });
  }

  // ---- rank strip: 4,730 thin ticks, the user's rank highlighted ----
  // On first view the highlight sweeps from 4,730th to 1,300th and the number in the label counts along
  // (unless reduced motion is on): prog goes 0 -> 1, and drawing at prog=1 is the plain final picture.
  var c=document.getElementById('strip');
  if(c&&c.getContext){
    var N=4730,R=1300,prog=1,FAD='۰۱۲۳۴۵۶۷۸۹',RX=/[0-9۰-۹][0-9۰-۹.,٬]*[0-9۰-۹]/;
    var counting=false;
    var label=function(v){
      if(!counting)return;
      var sm=document.querySelector('.rank .big small');if(!sm||!sm.firstChild||sm.firstChild.nodeType!==3)return;
      var t=sm.firstChild.nodeValue,m=RX.exec(t);if(!m)return;
      var fa=/[۰-۹]/.test(m[0]),sep=(/[^0-9۰-۹]/.exec(m[0])||[','])[0];
      var out=String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,sep);
      if(fa)out=out.replace(/\d/g,function(d){return FAD[d]});
      sm.firstChild.nodeValue=t.replace(RX,out);
    };
    var draw=function(){
      var w=c.clientWidth,h=c.clientHeight,d=window.devicePixelRatio||1;
      c.width=w*d;c.height=h*d;var g=c.getContext('2d');g.scale(d,d);
      var cols=Math.max(60,Math.floor(w/4)),per=N/cols,bw=w/cols,rank=N+(R-N)*prog;
      for(var i=0;i<cols;i++){
        var lo=i*per,hi=(i+1)*per,mine=rank>lo&&rank<=hi;
        g.fillStyle=mine?'#FF829E':(lo<R?'rgba(255,130,158,'+(.13+.25*prog).toFixed(3)+')':'rgba(245,245,247,.13)');
        var bh=mine?h:h*(.45+.25*Math.sin(i*1.7)*Math.sin(i*.37)+.15);
        g.fillRect(i*bw+.5,(h-bh),Math.max(1,bw-1.2),bh);
      }
      if(counting)label(rank);
    };
    var sweep=function(){
      counting=true;
      var t0=0,dur=2400;
      requestAnimationFrame(function step(now){
        if(!t0)t0=now;
        var t=Math.min(1,(now-t0)/dur);
        prog=1-Math.pow(1-t,3);draw();
        if(t<1)requestAnimationFrame(step);else{counting=false;prog=1;draw()}
      });
    };
    window.drawStrip=draw;
    if(!calm.matches&&'IntersectionObserver' in window){
      prog=0;
      var sio=new IntersectionObserver(function(e){if(e[0].isIntersecting){sio.disconnect();sweep()}},{threshold:.6});
      sio.observe(c);
    }
    draw();addEventListener('resize',draw);
  }

  // ---- apply the saved language ----
  var saved='en';try{saved=localStorage.getItem('lang')||'en'}catch(x){}
  // Persian makes the page taller, so an #anchor loaded directly must be scrolled to again.
  var moved=false;
  ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){addEventListener(ev,function(){moved=true},{passive:true,once:true})});
  function toHash(){
    if(!location.hash||moved)return;
    var el;try{el=document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch(x){return}
    if(el)el.scrollIntoView();
  }
  if(saved!=='en'){setLang(saved);toHash();addEventListener('load',toHash);if(document.fonts)document.fonts.ready.then(toHash)}
  else movePill();
  if(group)requestAnimationFrame(function(){group.classList.add('ready')});
  addEventListener('resize',movePill);
  if(document.fonts)document.fonts.ready.then(movePill);

  // ---- QGIS screenshots slide on their own; hover, focus or the dots pause/jump ----
  var box=document.querySelector('.qslider'),track=document.querySelector('.qtrack');
  if(box&&track&&track.children.length){
    var slides=[].slice.call(track.children),dots=[].slice.call(document.querySelectorAll('.qdots button'));
    if(slides.length>1&&dots.length){
      var i=0,timer=null,paused=false,visible=false;
      var show=function(n){
        i=(n+slides.length)%slides.length;
        var dir=root.dir==='rtl'?1:-1;
        track.style.transform='translateX('+(dir*i*100)+'%)';
        slides.forEach(function(s,k){if(k===i)s.removeAttribute('inert');else s.setAttribute('inert','');s.setAttribute('aria-hidden',k===i?'false':'true')});
        dots.forEach(function(d,k){if(k===i)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});
      };
      var stop=function(){clearInterval(timer);timer=null};
      var start=function(){stop();if(calm.matches||paused||!visible||document.hidden)return;timer=setInterval(function(){show(i+1)},5200)};
      dots.forEach(function(d,k){d.addEventListener('click',function(){show(k);start()})});
      box.addEventListener('mouseenter',function(){paused=true;stop()});
      box.addEventListener('mouseleave',function(){paused=false;start()});
      box.addEventListener('focusin',function(){paused=true;stop()});
      box.addEventListener('focusout',function(){paused=false;start()});
      document.addEventListener('visibilitychange',start);
      if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting;start()},{threshold:.35}).observe(box);else{visible=true;start()}
      new MutationObserver(function(){show(i)}).observe(root,{attributes:true,attributeFilter:['dir']});
      show(0);
    }
  }

  // ---- homepage extras (all no-ops where the elements are missing, e.g. on the projects page) ----
  var recolour=function(){};

  // Thought network: quiet dots behind the hero; a spark travels when you pass by or tap.
  // No animation loop while idle: frames only run while a spark is alive and the hero is on screen.
  (function(){
    var hero=document.querySelector('.hero'),cv=hero&&hero.querySelector('.mind');
    if(!cv||!cv.getContext)return;
    var g=cv.getContext('2d');
    if(!g)return;
    var W=0,H=0,nodes=[],pulses=[],raf=0,last=0,visible=true,col={a:'#AE193C',s:'#555560'};
    function colours(){
      var s=getComputedStyle(root);
      col.a=s.getPropertyValue('--accent').trim()||col.a;
      col.s=s.getPropertyValue('--ink-soft').trim()||col.s;
    }
    function build(){
      var w=hero.clientWidth,h=hero.clientHeight;
      if(!w||!h)return;
      W=w;H=h;
      var d=Math.min(window.devicePixelRatio||1,2);
      cv.width=Math.round(W*d);cv.height=Math.round(H*d);g.setTransform(d,0,0,d,0,0);
      // same layout every time: a jittered grid from a fixed seed; fewer dots on small screens
      var seed=11,R=function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      var n=Math.max(16,Math.min(W<640?26:60,Math.round(W*H/16000)));
      var cols=Math.max(3,Math.round(Math.sqrt(n*W/H))),rows=Math.max(3,Math.ceil(n/cols)),cw=W/cols,ch=H/rows;
      nodes=[];pulses=[];
      for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)nodes.push({x:(x+.15+R()*.7)*cw,y:(y+.15+R()*.7)*ch,g:0,t:0,n:[]});
      var max=Math.pow(Math.max(cw,ch)*1.5,2);
      nodes.forEach(function(a,i){
        nodes.map(function(b,j){return [(a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y),j]})
          .filter(function(e){return e[1]!==i&&e[0]<max}).sort(function(p,q){return p[0]-q[0]}).slice(0,2)
          .forEach(function(e){var b=nodes[e[1]];if(a.n.indexOf(b)<0)a.n.push(b);if(b.n.indexOf(a)<0)b.n.push(a)});
      });
      colours();draw();
    }
    function draw(){
      g.clearRect(0,0,W,H);
      g.lineWidth=1;g.strokeStyle=col.s;g.globalAlpha=.13;g.beginPath();
      nodes.forEach(function(a){a.n.forEach(function(b){if(a.x<b.x||(a.x===b.x&&a.y<b.y)){g.moveTo(a.x,a.y);g.lineTo(b.x,b.y)}})});
      g.stroke();
      g.strokeStyle=col.a;g.fillStyle=col.a;g.lineWidth=1.4;
      pulses.forEach(function(p){
        var x=p.a.x+(p.b.x-p.a.x)*p.t,y=p.a.y+(p.b.y-p.a.y)*p.t;
        g.globalAlpha=.45*p.s;g.beginPath();g.moveTo(p.a.x,p.a.y);g.lineTo(x,y);g.stroke();
        g.globalAlpha=.9*p.s;g.beginPath();g.arc(x,y,2.3,0,6.283);g.fill();
      });
      nodes.forEach(function(a){
        g.globalAlpha=.3;g.fillStyle=col.s;g.beginPath();g.arc(a.x,a.y,1.7,0,6.283);g.fill();
        if(a.g>.02){g.globalAlpha=Math.min(1,a.g);g.fillStyle=col.a;g.beginPath();g.arc(a.x,a.y,1.7+a.g*2.6,0,6.283);g.fill()}
      });
      g.globalAlpha=1;
    }
    function send(a,b,hop,s){
      if(pulses.length>70)return;
      var d=Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
      pulses.push({a:a,b:b,t:0,dur:Math.max(.25,d/230),hop:hop,s:s});
    }
    function fire(a,now){
      if(calm.matches||!visible||document.hidden||now-a.t<700)return;
      a.t=now;a.g=1;
      a.n.forEach(function(b){send(a,b,0,1)});
      if(!raf){last=now;raf=requestAnimationFrame(step)}
    }
    function step(now){
      if(now-last<24){raf=requestAnimationFrame(step);return}
      var dt=Math.min(.05,(now-last)/1000);last=now;
      for(var i=pulses.length-1;i>=0;i--){
        var p=pulses[i];p.t+=dt/p.dur;
        if(p.t>=1){
          pulses.splice(i,1);p.b.g=Math.max(p.b.g,p.s);
          if(p.hop<3)p.b.n.forEach(function(q){if(q!==p.a&&Math.random()<.55)send(p.b,q,p.hop+1,p.s*.72)});
        }
      }
      var live=pulses.length>0;
      nodes.forEach(function(a){if(a.g>0){a.g*=Math.exp(-dt*2.4);if(a.g<.02)a.g=0;else live=true}});
      draw();
      raf=live&&visible&&!document.hidden?requestAnimationFrame(step):0;
    }
    function near(e){
      var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,best=null,bd=110*110;
      nodes.forEach(function(a){var d=(a.x-x)*(a.x-x)+(a.y-y)*(a.y-y);if(d<bd){bd=d;best=a}});
      if(best)fire(best,performance.now());
    }
    build();
    recolour=function(){colours();if(!raf)draw()};
    var rt=0,rebuild=function(){clearTimeout(rt);rt=setTimeout(function(){if(hero.clientWidth!==W||hero.clientHeight!==H)build()},120)};
    if('ResizeObserver' in window)new ResizeObserver(rebuild).observe(hero);else addEventListener('resize',rebuild);
    var dark=matchMedia('(prefers-color-scheme: dark)');
    if(dark.addEventListener)dark.addEventListener('change',function(){recolour()});
    if(calm.matches)return; // reduced motion: the still dots stay, no sparks
    hero.addEventListener('pointermove',near,{passive:true});
    hero.addEventListener('pointerdown',near,{passive:true});
    // when the hero comes back into view, finish any spark that was paused mid-flight instead of leaving it frozen
    var wake=function(){if(visible&&!document.hidden&&!raf&&(pulses.length||nodes.some(function(a){return a.g>0}))){last=performance.now();raf=requestAnimationFrame(step)}};
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting;wake()},{threshold:0}).observe(hero);
    document.addEventListener('visibilitychange',wake);
    // unprompted sparks at random moments (sometimes two), so it is alive on phones too
    var rnd=function(){return nodes[Math.floor(Math.random()*nodes.length)]};
    (function idle(){
      setTimeout(function(){
        if(visible&&!document.hidden&&nodes.length){
          var a=rnd();fire(a,performance.now());
          if(Math.random()<.3)setTimeout(function(){
            if(!(visible&&!document.hidden&&nodes.length))return;
            var b=rnd(),k=0;while(b===a&&nodes.length>1&&k++<8)b=rnd();
            fire(b,performance.now());
          },250+Math.random()*350);
        }
        idle();
      },900+Math.random()*1700);
    })();
  })();

  // ---- animation ideas: each block below can be removed on its own ----

  // Recognition: highlight the project you arrived at (projects page, via #id)
  (function(){
    if(!document.querySelector('.plate[id]'))return;
    function mark(){
      var id='';try{id=decodeURIComponent(location.hash.slice(1))}catch(e){}
      [].forEach.call(document.querySelectorAll('.plate.recog'),function(p){p.classList.remove('recog')});
      var el=id&&document.getElementById(id);
      if(!el||!el.classList.contains('plate'))return;
      void el.offsetWidth;
      el.classList.add('recog');
      el.addEventListener('animationend',function f(e){if(e.animationName==='rc-recog'){el.classList.remove('recog');el.removeEventListener('animationend',f)}});
    }
    addEventListener('hashchange',mark);
    if(document.readyState==='complete')mark();else addEventListener('load',mark);
  })();

  // Keep #section out of the address bar once the page has scrolled there, so a refresh stays where you are
  // instead of jumping back to that section (e.g. after tapping "Contact", every refresh used to land on Say hi).
  (function(){
    if(!history.replaceState)return;
    var clean=function(){if(location.hash)history.replaceState(history.state,'',location.pathname+location.search)};
    var t=0,later=function(){clearTimeout(t);t=setTimeout(clean,1500)}; // one timer, so a quick second click gets its full 1.5 s
    // arriving with a #section (e.g. from the projects page): let the jump, the font/language re-scroll and the recognition highlight run first
    if(location.hash)addEventListener('load',function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(later)});
    // in-page links: the browser jumps as usual, then the hash is dropped
    addEventListener('hashchange',later);
  })();

  // Page dissolve: fade through the paper colour between Home and Projects (fallback for browsers without @view-transition)
  (function(){
    if('CSSViewTransitionRule' in window||calm.matches)return;
    var norm=function(p){return p.replace(/index\.html$/,'')};
    var here=norm(location.pathname),base=here.replace(/projects\/$/,'');
    try{if(sessionStorage.getItem('pdNav')){sessionStorage.removeItem('pdNav');root.classList.add('pd-in');setTimeout(function(){root.classList.remove('pd-in')},400)}}catch(e){}
    addEventListener('pageshow',function(e){if(e.persisted)root.classList.remove('pd-out')});
    document.addEventListener('click',function(e){
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest&&e.target.closest('a[href]');
      if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
      var u;try{u=new URL(a.href,location.href)}catch(x){return}
      if(u.origin!==location.origin)return;
      var to=norm(u.pathname);
      if(to===here||(to!==base&&to!==base+'projects/'))return;
      e.preventDefault();
      try{sessionStorage.setItem('pdNav','1')}catch(x){}
      root.classList.add('pd-out');
      setTimeout(function(){location.href=u.href},250);
      // if the navigation is stopped or slow and this page is still here, show it again
      setTimeout(function(){root.classList.remove('pd-out');try{sessionStorage.removeItem('pdNav')}catch(x){}},3000);
    });
  })();

  // Hero question: wash, then underline, on "how minds work" (the span is in the hero text in all three languages)
  (function(){
    var hero=document.querySelector('section.hero');
    if(!hero||!hero.querySelector('.mind-q')||calm.matches)return;
    var done=false;
    function ready(){return !root.classList.contains('sk-on')||hero.classList.contains('sk-settled')}
    function go(){
      if(done||!ready())return;
      done=true;
      root.classList.remove('mq-wait');root.classList.add('mq-play');
      setTimeout(function(){root.classList.remove('mq-play')},2400);
    }
    if(ready())return;
    root.classList.add('mq-wait');
    new MutationObserver(go).observe(hero,{attributes:true,attributeFilter:['class']});
    new MutationObserver(go).observe(root,{attributes:true,attributeFilter:['class']});
  })();

  // A year with room: the date of "A year back home" deepens to crimson once
  (function(){
    var li=document.querySelector('#about .edu li.year-room');
    if(!li)return;
    if(calm.matches){li.classList.add('room-on');return}
    var inView=false,done=false;
    function check(){
      if(done||!inView)return;
      if(!root.classList.contains('sk-on')||li.classList.contains('sk-settled')){done=true;li.classList.add('room-on')}
    }
    new MutationObserver(check).observe(li,{attributes:true,attributeFilter:['class']});
    new MutationObserver(check).observe(root,{attributes:true,attributeFilter:['class']});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting){inView=true;check()}},{threshold:.5}).observe(li);
    else{inView=true;check()}
  })();

  // Story thread (fills as you scroll) and a one-time fade-up of timeline entries and project cards
  (function(){
    var edu=document.querySelector('#about .edu');
    if(edu){
      var items=[].slice.call(edu.children);
      root.classList.add('js-thread');
      if(calm.matches){
        edu.style.setProperty('--p',1);items.forEach(function(li){li.classList.add('seen')});
      }else{
        var tick=0,upd=function(){
          tick=0;
          var line=innerHeight*.62,r=edu.getBoundingClientRect();
          edu.style.setProperty('--p',Math.max(0,Math.min(1,(line-r.top)/r.height)).toFixed(4));
          items.forEach(function(li){li.classList.toggle('seen',li.getBoundingClientRect().top+34<line)});
        };
        var ask=function(){if(!tick)tick=requestAnimationFrame(upd)};
        addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);
        new MutationObserver(ask).observe(root,{attributes:true,attributeFilter:['lang']});
        upd();
      }
    }
    if(calm.matches||!('IntersectionObserver' in window))return;
    var els=[].slice.call(document.querySelectorAll('#about .edu li,#work .plate'));
    if(!els.length)return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting||e.boundingClientRect.top<0){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    root.classList.add('js-anim');
    els.forEach(function(el){io.observe(el)});
  })();

  // Pictures lean about 2 degrees towards the mouse; Coup phone screenshots lift on hover (CSS, .tilt-on).
  // Mouse / fine pointer only, and not under reduced motion. Runs on any page that has project pictures.
  (function(){
    var vis=[].slice.call(document.querySelectorAll('.plate .vis')).filter(function(v){return v.querySelector('img')});
    if(!vis.length||calm.matches||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    root.classList.add('tilt-on');
    vis.forEach(function(v){
      v.addEventListener('pointermove',function(e){
        if(e.pointerType!=='mouse')return;
        var r=v.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        v.classList.add('live');
        v.style.transform='perspective(1200px) rotateX('+(-y*2.4).toFixed(2)+'deg) rotateY('+(x*2.4).toFixed(2)+'deg)';
      });
      v.addEventListener('pointerleave',function(){v.classList.remove('live');v.style.transform=''});
    });
  })();

  // Milan time under the contact text: the hour in Europe/Rome (not the visitor's clock).
  // The wording lives in the mtNow string (English at the top of this file, translations in i18n.js).
  (function(){
    var el=document.getElementById('milanNow');if(!el||!window.Intl)return;
    var fmt;
    try{fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit',hour12:false,weekday:'short'})}catch(x){return}
    var FAD='۰۱۲۳۴۵۶۷۸۹';
    function tick(){
      var p={};fmt.formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
      var h=+p.hour%24;
      var time=p.hour+':'+p.minute;
      if(cur==='fa')time=time.replace(/\d/g,function(d){return FAD[d]});
      el.innerHTML='<i aria-hidden="true"></i><span class="now-t">'+tx('mtNow').replace('{t}','<b dir="ltr">'+time+'</b>')+'</span>';
      el.classList.toggle('zz',h<8||h===23);
      el.hidden=false;
    }
    tick();langHooks.push(tick);setInterval(function(){if(!document.hidden)tick()},20000);
  })();

  // Greeting above the contact heading: Hi. / سلام. / Ciao. cycling, starting with the current language.
  (function(){
    var box=document.querySelector('.hello');if(!box)return;
    var all=[].slice.call(box.children),i=0,timer=0,visible=false;
    function pos(){var k=0;all.forEach(function(s,n){if(s.lang===cur)k=n});return k}
    function show(n){
      all.forEach(function(s,k){s.classList.toggle('out',k===i&&k!==n);s.classList.toggle('on',k===n)});
      i=n;
    }
    function run(){
      clearInterval(timer);timer=0;
      if(calm.matches||!visible||document.hidden)return;
      timer=setInterval(function(){show((i+1)%all.length)},2600);
    }
    show(pos());
    langHooks.push(function(){all.forEach(function(s){s.classList.remove('out')});show(pos());run()});
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting;run()},{threshold:.5}).observe(box);
    document.addEventListener('visibilitychange',run);
  })();

  // Wololo: type it (or tap the footer link) and the accent colour changes sides; again to undo.
  // Not saved anywhere, so a reload brings the crimson back.
  (function(){
    var egg=document.querySelector('.egg');
    if(!egg)return;
    var toast=document.createElement('div');
    toast.className='wololo-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    document.body.appendChild(toast);
    var timer=0;
    function convert(ev){
      // the toast text is set inside flip, so it always matches the colour the page really ends up with
      var flip=function(){var on=root.classList.toggle('wololo');recolour();toast.textContent=tx(on?'wololoBlue':'wololoRed')};
      if(window.wololoWave)window.wololoWave(flip,ev);else flip(); // wololoWave (optional) spreads the change as a circle
      toast.classList.add('on');clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove('on')},2600);
    }
    var buf='';
    addEventListener('keydown',function(e){
      var t=e.target;
      if(e.ctrlKey||e.metaKey||e.altKey||!e.key||e.key.length!==1||(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))))return;
      buf=(buf+e.key.toLowerCase()).slice(-6);
      if(buf==='wololo'){buf='';convert()}
    });
    egg.addEventListener('click',convert);
  })();
})();
