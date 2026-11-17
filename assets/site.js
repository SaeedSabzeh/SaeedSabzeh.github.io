// Shared by the homepage and the projects page: language switcher, copy-email,
// rank strip, the QGIS screenshot slider and the homepage extras (thought network,
// story thread, wololo). Every part checks that its elements exist.
(function(){
  var root=document.documentElement;
  var titleKey=root.getAttribute('data-title')||'pageTitle';
  var EN={copy:'Copy email',copied:'Copied',selected:'Selected, press Ctrl+C',wololoBlue:'Wololo! This page now plays for the blue team.',wololoRed:'Wololo! Back to red.',
    // Milan time line under the contact text ({t} becomes the Milan time). Edit the wording here.
    mtNow:'It’s {t} in Milan.',
    themeToDark:'Switch to dark mode',themeToLight:'Switch to light mode',
    lbClose:'Close',lbPrev:'Previous',lbNext:'Next',lbZoomIn:'Zoom in',lbZoomOut:'Zoom out'};
  EN[titleKey]=document.title;
  var cur='en',langHooks=[];
  function tx(k){return (typeof I18N!=='undefined'&&I18N[cur]&&I18N[cur][k])||EN[k]}
  // the lightbox (a separate block below) reads labels and language changes through these
  window.siteTx=tx;window.siteOnLang=function(fn){langHooks.push(fn)};
  function quiet(t){if(t){['ready','finished','updateCallbackDone'].forEach(function(k){if(t[k]&&t[k].catch)t[k].catch(function(){})})}return t}

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
    if(document.startViewTransition)return quiet(document.startViewTransition(swap));
    root.classList.add('lang-swap');
    setTimeout(function(){swap();requestAnimationFrame(function(){root.classList.remove('lang-swap')})},200);
  }
  btns.forEach(function(x){x.addEventListener('click',function(){switchLang(x.dataset.l)})});

  // ---- light / dark switch ----
  // With nothing saved the page follows the OS; the button flips whatever is shown now and saves the choice.
  var themeBtn=document.querySelector('.toplinks .theme'),darkMq=matchMedia('(prefers-color-scheme: dark)');
  function isDark(){return root.dataset.theme?root.dataset.theme==='dark':darkMq.matches}
  function syncTheme(){
    var forced=root.dataset.theme;
    [].forEach.call(document.querySelectorAll('meta[name="theme-color"][data-c]'),function(m){
      m.setAttribute('content',forced?(forced==='dark'?'#17171B':'#FFFFFF'):m.getAttribute('data-c'));
    });
    if(themeBtn){var t=tx(isDark()?'themeToLight':'themeToDark');themeBtn.setAttribute('aria-label',t);themeBtn.title=t}
  }
  if(themeBtn)themeBtn.addEventListener('click',function(){
    var next=isDark()?'light':'dark';
    root.dataset.theme=next;
    try{localStorage.setItem('theme',next)}catch(x){}
    syncTheme();recolour();
  });
  langHooks.push(syncTheme);
  if(darkMq.addEventListener)darkMq.addEventListener('change',function(){syncTheme();recolour()});
  syncTheme();

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
    var W=0,H=0,nodes=[],pulses=[],ripples=[],mx=-1e4,my=-1e4,PULL=165,casc=[],nearest=[],raf=0,last=0,visible=true,warm=false,wave=null,col={a:'#AE193C',s:'#555560',h:'#FF5C8A'};
    function colours(){
      var s=getComputedStyle(root);
      // the lit-up (warm) network is pink, or blue once wololo has changed sides
      col.a=warm?(root.classList.contains('wololo')?'#3F7FE0':'#E0407A'):(s.getPropertyValue('--accent').trim()||col.a);
      col.s=s.getPropertyValue('--ink-soft').trim()||col.s;
      // lighter tint for the wave front (kept saturated enough to read on the light theme)
      var bl=root.classList.contains('wololo');col.h=warm?(isDark()?(bl?'#BFD8FF':'#FFC4D1'):(bl?'#6FA3FF':'#FF5C8A')):col.a;
      root.classList.toggle('mind-soft',!isDark());
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
      nodes=[];pulses=[];ripples=[];casc=[];nearest=[];wave=null;
      for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){var hx=(x+.15+R()*.7)*cw,hy=(y+.15+R()*.7)*ch;nodes.push({x:hx,y:hy,hx:hx,hy:hy,p:0,g:0,t:0,n:[]})}
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
      g.lineWidth=1;g.strokeStyle=warm?col.a:col.s;g.globalAlpha=warm?.3:.13;g.beginPath();
      nodes.forEach(function(a){a.n.forEach(function(b){if(a.x<b.x||(a.x===b.x&&a.y<b.y)){g.moveTo(a.x,a.y);g.lineTo(b.x,b.y)}})});
      g.stroke();
      // lines to nodes near the cursor brighten in the accent colour
      g.strokeStyle=col.a;g.lineWidth=1.2;
      nodes.forEach(function(a){a.n.forEach(function(b){
        var w=Math.max(a.p,b.p);
        if(w>.02&&(a.x<b.x||(a.x===b.x&&a.y<b.y))){g.globalAlpha=.12+.6*w;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
      })});
      // lines from the cursor to its nearest few nodes
      if(nearest.length){
        g.strokeStyle=col.a;g.lineWidth=1.4;
        nearest.forEach(function(e){var f=1-Math.min(1,e.d/PULL);g.globalAlpha=.35+.55*f;g.beginPath();g.moveTo(mx,my);g.lineTo(e.a.x,e.a.y);g.stroke()});
        g.fillStyle=col.a;g.globalAlpha=.9;g.beginPath();g.arc(mx,my,2.6,0,6.283);g.fill();
      }
      ripples.forEach(function(r){var e=1-Math.pow(1-r.t,2);g.strokeStyle=col.a;g.globalAlpha=.7*(1-r.t);g.lineWidth=2.2-r.t*1.2;g.beginPath();g.arc(r.x,r.y,Math.max(0,e*300),0,6.283);g.stroke()});
      g.strokeStyle=col.a;g.fillStyle=col.a;g.lineWidth=1.4;
      pulses.forEach(function(p){
        var x=p.a.x+(p.b.x-p.a.x)*p.t,y=p.a.y+(p.b.y-p.a.y)*p.t;
        g.globalAlpha=.45*p.s;g.beginPath();g.moveTo(p.a.x,p.a.y);g.lineTo(x,y);g.stroke();
        g.globalAlpha=.9*p.s;g.beginPath();g.arc(x,y,2.3,0,6.283);g.fill();
      });
      if(wave)drawWave();
      nodes.forEach(function(a){
        g.globalAlpha=warm?.55:.3;g.fillStyle=warm?col.a:col.s;g.beginPath();g.arc(a.x,a.y,warm?2.2:1.7,0,6.283);g.fill();
        if(a.p>.02){g.globalAlpha=Math.min(1,a.p*.9);g.fillStyle=col.a;g.beginPath();g.arc(a.x,a.y,1.7+a.p*3.4,0,6.283);g.fill();g.globalAlpha=.16*a.p;g.beginPath();g.arc(a.x,a.y,6+a.p*9,0,6.283);g.fill()}
        if(a.g>.02){g.globalAlpha=Math.min(1,a.g);g.fillStyle=col.a;g.beginPath();g.arc(a.x,a.y,1.7+a.g*4.2,0,6.283);g.fill();g.globalAlpha=.18*a.g;g.beginPath();g.arc(a.x,a.y,8+a.g*12,0,6.283);g.fill()}
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
      var dt=Math.min(.05,(now-last)/1000);last=now;
      for(var i=pulses.length-1;i>=0;i--){
        var p=pulses[i];p.t+=dt/p.dur;
        if(p.t>=1){
          pulses.splice(i,1);p.b.g=Math.max(p.b.g,p.s);
          if(p.hop<3)p.b.n.forEach(function(q){if(q!==p.a&&Math.random()<.55)send(p.b,q,p.hop+1,p.s*.72)});
        }
      }
      var live=pulses.length>0;
      for(var c=casc.length-1;c>=0;c--){
        var cc=casc[c];
        if(now>=cc.at){casc.splice(c,1);cc.a.g=Math.max(cc.a.g,cc.s);cc.a.n.forEach(function(b){send(cc.a,b,3,cc.s)})}
      }
      if(casc.length)live=true;
      // gentle pull towards the cursor, spring back home when it leaves
      var k=1-Math.exp(-dt*9);
      nodes.forEach(function(a){
        var dx=mx-a.hx,dy=my-a.hy,d=Math.sqrt(dx*dx+dy*dy),w=d<PULL?1-d/PULL:0,f=w*.5,
            tx=a.hx+dx*f,ty=a.hy+dy*f;
        a.p+=(w-a.p)*k;a.x+=(tx-a.x)*k;a.y+=(ty-a.y)*k;
        if(a.p<.02&&w===0)a.p=0;
        if(a.p>0||Math.abs(tx-a.x)>.05||Math.abs(ty-a.y)>.05)live=true;else{a.x=a.hx;a.y=a.hy}
      });
      if(wave){wave.t+=dt;if(wave.t>=WV_RUN+WV_FADE)wave=null;else live=true}
      nearest=[];
      if(mx>-1e3){
        nodes.forEach(function(a){var dx=a.x-mx,dy=a.y-my,d=Math.sqrt(dx*dx+dy*dy);if(d<PULL*1.1)nearest.push({a:a,d:d})});
        nearest.sort(function(p,q){return p.d-q.d});nearest.length=Math.min(3,nearest.length);
      }
      for(var j=ripples.length-1;j>=0;j--){ripples[j].t+=dt/1.1;if(ripples[j].t>=1)ripples.splice(j,1);else live=true}
      nodes.forEach(function(a){if(a.g>0){a.g*=Math.exp(-dt*2.4);if(a.g<.02)a.g=0;else live=true}});
      draw();
      raf=live&&visible&&!document.hidden?requestAnimationFrame(step):0;
    }
    function near(e){
      var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,best=null,bd=150*150;
      nodes.forEach(function(a){var d=(a.x-x)*(a.x-x)+(a.y-y)*(a.y-y);if(d<bd){bd=d;best=a}});
      mx=x;my=y;
      if(!raf&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(step)}
      if(best)fire(best,performance.now());
    }
    function away(){mx=my=-1e4;nearest=[];if(!raf&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(step)}}
    function ripple(e){
      var r=cv.getBoundingClientRect();
      var x=e.clientX-r.left,y=e.clientY-r.top,now=performance.now();
      ripples.push({x:x,y:y,t:0});if(ripples.length>6)ripples.shift();
      // short cascade: nodes light up ring by ring (about 4 hops, 110ms apart)
      nodes.forEach(function(a){
        var d=Math.sqrt((a.hx-x)*(a.hx-x)+(a.hy-y)*(a.hy-y));
        if(d<300)casc.push({a:a,at:now+Math.ceil(d/75)*110,s:Math.pow(.82,Math.ceil(d/75)-1)});
      });
      if(casc.length>80)casc.length=80;
      if(!raf){last=performance.now();raf=requestAnimationFrame(step)}
    }
    build();
    recolour=function(){colours();if(!raf)draw()};
    var rt=0,rebuild=function(){clearTimeout(rt);rt=setTimeout(function(){var dh=Math.abs(hero.clientHeight-H);if(hero.clientWidth===W&&(dh<=60||wave))return; /* small height change or a running wave: keep the network and its ripples */ if(hero.clientWidth!==W||dh)build()},120)};
    if('ResizeObserver' in window)new ResizeObserver(rebuild).observe(hero);else addEventListener('resize',rebuild);
    // first click hides the hint; the fifth sends a wave of light across the whole network, which then stays warm (pink, or blue after wololo)
    var clicks=0,hint=document.getElementById('mindHint');
    function reward(e){
      warm=true;colours();
      if(calm.matches||!nodes.length||!visible){if(!raf)draw();return}
      var r=cv.getBoundingClientRect(),x=e?e.clientX-r.left:W/2,y=e?e.clientY-r.top:H/2,far=0,ed=[];
      nodes.forEach(function(a){a.wd=Math.sqrt((a.hx-x)*(a.hx-x)+(a.hy-y)*(a.hy-y));if(a.wd>far)far=a.wd});
      var k=0;
      nodes.forEach(function(a){a.n.forEach(function(b){
        if(a.hx<b.hx||(a.hx===b.hx&&a.hy<b.hy)){var n=a.wd<=b.wd;ed.push({a:n?a:b,b:n?b:a,fast:(k++)%5===0})}
      })});
      wave={x:x,y:y,t:0,far:far+60,ed:ed};
      if(!raf){last=performance.now();raf=requestAnimationFrame(step)}
    }
    // the wave: timings in seconds (front travels for WV_RUN, everything holds, then eases out over WV_FADE)
    var WV_RUN=1.8,WV_FADE=1.1,WV_BAND=110,WV_TRAIL=170;
    function drawWave(){
      var w=wave,u=Math.min(1,w.t/WV_RUN),f=w.far*(.5-.5*Math.cos(Math.PI*u)),
          env=w.t<=WV_RUN?1:Math.max(0,1-(w.t-WV_RUN)/WV_FADE);env=env*env*(3-2*env);
      if(env<=0)return;
      g.lineCap='round';
      // rings that follow the front
      for(var i=0;i<3;i++){
        var rr=f-70*(i+1);
        if(rr>4){g.strokeStyle=col.a;g.globalAlpha=(.34-i*.09)*env*(1-.5*rr/w.far);g.lineWidth=1.8-i*.4;g.beginPath();g.arc(w.x,w.y,rr,0,6.283);g.stroke()}
      }
      // edges light up as the front reaches them, drawn from the nearer end outwards
      w.ed.forEach(function(e){
        var a=e.a,b=e.b,len=b.wd-a.wd;
        var s=len>1?Math.min(1,Math.max(0,(f-a.wd)/len)):(f>a.wd?1:0);
        if(s<=0&&!(e.fast&&f+140>a.wd))return;
        var tr=s<1?1:Math.max(0,1-(f-b.wd)/WV_TRAIL);
        if(tr>0&&s>0){
          var px=a.x+(b.x-a.x)*s,py=a.y+(b.y-a.y)*s;
          g.strokeStyle=col.a;g.globalAlpha=.14*tr*env;g.lineWidth=6;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(px,py);g.stroke();
          g.globalAlpha=(.3+.6*tr)*env;g.lineWidth=1.1+1.3*tr;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(px,py);g.stroke();
          if(s<1){g.fillStyle=col.h;g.globalAlpha=.95*env;g.beginPath();g.arc(px,py,2.4,0,6.283);g.fill()}
        }
        // a few bright pulses run ahead of the front along their edge
        if(e.fast){
          var q=len>1?Math.min(1,Math.max(0,(f+140-a.wd)/len)):0;
          if(q>0&&q<1){var qx=a.x+(b.x-a.x)*q,qy=a.y+(b.y-a.y)*q;g.fillStyle=col.a;g.globalAlpha=.3*env;g.beginPath();g.arc(qx,qy,5.5,0,6.283);g.fill();g.fillStyle=col.h;g.globalAlpha=.95*env;g.beginPath();g.arc(qx,qy,2.5,0,6.283);g.fill()}
        }
      });
      // nodes bloom as the front passes, then ease back
      nodes.forEach(function(a){
        var x=(f-a.wd)/WV_BAND;if(x<=0)return;
        var bl=x<1?x:Math.max(0,1-(x-1)/2.6);if(bl<=0)return;
        bl*=env;
        g.fillStyle=col.a;g.globalAlpha=.2*bl;g.beginPath();g.arc(a.x,a.y,8+bl*16,0,6.283);g.fill();
        g.globalAlpha=.9*bl;g.beginPath();g.arc(a.x,a.y,1.7+bl*4.2,0,6.283);g.fill();
        g.fillStyle=col.h;g.globalAlpha=.8*bl;g.beginPath();g.arc(a.x,a.y,1+bl*1.6,0,6.283);g.fill();
      });
      g.lineCap='butt';
    }
    hero.addEventListener('pointerdown',function(e){
      if(e.target.closest&&e.target.closest('a,button'))return;
      clicks++;
      if(hint)hint.classList.add('gone');
      if(clicks===5)reward(e);
    },{passive:true});
    if(calm.matches)return; // reduced motion: the still dots stay, no sparks
    hero.addEventListener('pointermove',near,{passive:true});
    hero.addEventListener('pointerdown',function(e){near(e);ripple(e)},{passive:true});
    hero.addEventListener('pointerleave',away,{passive:true});
    hero.addEventListener('pointercancel',away,{passive:true});
    hero.addEventListener('pointerup',function(e){if(e.pointerType!=='mouse')away()},{passive:true});
    // when the hero comes back into view, finish any spark that was paused mid-flight instead of leaving it frozen
    var wake=function(){if(visible&&!document.hidden&&!raf&&(wave||pulses.length||ripples.length||nodes.some(function(a){return a.g>0||a.p>0}))){last=performance.now();raf=requestAnimationFrame(step)}};
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
    // each timeline dot pops once when its entry scrolls into view
    if(edu){
      var dio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('dot-lit');dio.unobserve(e.target)}})},{rootMargin:'0px 0px -30% 0px'});
      [].slice.call(edu.children).forEach(function(li){dio.observe(li)});
    }
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

  // "Say hi." heading: a soft accent glow follows the pointer and the word tilts a little (mouse only, not under reduced motion)
  (function(){
    var h=document.getElementById('cH'),wrap=h&&h.parentNode;
    if(!h||calm.matches||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    wrap.classList.add('say-glow');
    // The tilt eases towards the pointer once per frame (no CSS transition restarting on every mouse event),
    // and the pointer is measured against the heading's untilted box, so the tilt cannot feed back into itself.
    var tx=.5,ty=.5,cx=.5,cy=.5,raf=0;
    function frame(){
      cx+=(tx-cx)*.14;cy+=(ty-cy)*.14;
      var done=Math.abs(tx-cx)<.002&&Math.abs(ty-cy)<.002;
      if(done){cx=tx;cy=ty}
      // up to about 6 degrees each way; the pink glow in the letters leans towards the pointer
      wrap.style.setProperty('--rx',((.5-cy)*12).toFixed(3)+'deg');wrap.style.setProperty('--ry',((cx-.5)*12).toFixed(3)+'deg');
      wrap.style.setProperty('--sx',((cx-.5)*28).toFixed(2)+'px');wrap.style.setProperty('--sy',((cy-.5)*20).toFixed(2)+'px');
      wrap.style.setProperty('--gx',(cx*100).toFixed(2)+'%');wrap.style.setProperty('--gy',(cy*100).toFixed(2)+'%');
      raf=done?0:requestAnimationFrame(frame);
    }
    wrap.addEventListener('pointermove',function(e){
      var w=wrap.getBoundingClientRect(),l=w.left+h.offsetLeft-wrap.offsetLeft,t=w.top+h.offsetTop-wrap.offsetTop;
      tx=Math.max(0,Math.min(1,(e.clientX-l)/h.offsetWidth));ty=Math.max(0,Math.min(1,(e.clientY-t)/h.offsetHeight));
      wrap.classList.add('say-on');if(!raf)raf=requestAnimationFrame(frame);
    });
    wrap.addEventListener('pointerleave',function(){wrap.classList.remove('say-on');tx=ty=.5;if(!raf)raf=requestAnimationFrame(frame)});
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
    var timer=0,flash=document.createElement('div');
    flash.className='wololo-flash';flash.setAttribute('aria-hidden','true');document.body.appendChild(flash);
    // keep the toast off the footer line that can trigger it: just above the footer when it is on screen, or at the top if there is no room
    function place(){
      var f=document.querySelector('footer'),fr=f&&f.getBoundingClientRect(),h=toast.offsetHeight;
      toast.style.top='';toast.style.bottom='';
      if(fr&&fr.top<innerHeight&&fr.bottom>0){
        if(fr.top>=h+34)toast.style.bottom=(innerHeight-fr.top+14)+'px';
        else{toast.style.bottom='auto';toast.style.top='max(16px,env(safe-area-inset-top,0px))'}
      }
    }
    function convert(ev){
      // everything visible (toast text, toast, flash) is switched on inside flip, in the same frame as the colour change
      var flip=function(){
        var on=root.classList.toggle('wololo');recolour();toast.textContent=tx(on?'wololoBlue':'wololoRed');
        place();
        toast.classList.add('on');clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove('on')},3400);
        flash.classList.remove('go');void flash.offsetWidth;flash.classList.add('go');
      };
      if(window.wololoWave)window.wololoWave(flip,ev);else flip(); // wololoWave (optional) spreads the change as a circle
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

// Lightbox: click an image in a project plate to see it full size (Esc, backdrop or the close button to leave;
// the Coup phone screenshots get previous/next buttons and arrow keys). Self-contained.
// Button labels are plain neutral aria-label attributes ("Close", "Previous", "Next"), not in i18n.js.
(function(){
  var imgs=document.querySelectorAll('.plate .vis img');
  if(!imgs.length)return;
  var box,pan,pic,bClose,bPrev,bNext,bZoom,count,cap,set=[],idx=0,opener=null,zoomed=false,root=document.documentElement;
  var calm=matchMedia('(prefers-reduced-motion: reduce)');
  function mk(tag,cls,at){var e=document.createElement(tag);if(cls)e.className=cls;for(var k in at)e.setAttribute(k,at[k]);return e}
  function T(k){return window.siteTx?window.siteTx(k):''}
  var ARW='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="';
  // button labels come from i18n (siteTx) and are refreshed on open and on every language switch
  function labels(){
    if(!box)return;
    bClose.setAttribute('aria-label',T('lbClose'));bPrev.setAttribute('aria-label',T('lbPrev'));bNext.setAttribute('aria-label',T('lbNext'));
    bZoom.setAttribute('aria-label',T(zoomed?'lbZoomOut':'lbZoomIn'));
  }
  // zoom: the picture goes to its natural size inside a scrollable pane (both axes), a second tap fits it again
  function canZoom(){return !!(pic.naturalWidth&&(zoomed||pic.naturalWidth>pic.clientWidth*1.08))}
  function setZoom(on,e){
    if(on&&!canZoom())return;
    var fx=.5,fy=.5;
    if(on&&e&&e.clientX!=null){var r=pic.getBoundingClientRect();if(r.width){fx=(e.clientX-r.left)/r.width;fy=(e.clientY-r.top)/r.height}}
    zoomed=on;box.classList.toggle('zoomed',on);labels();
    if(on){var mx=Math.max(0,pan.scrollWidth-pan.clientWidth),L=Math.min(mx,Math.max(0,fx*pic.offsetWidth-pan.clientWidth/2));pan.scrollLeft=getComputedStyle(pan).direction==='rtl'?L-mx:L;pan.scrollTop=Math.max(0,fy*pic.offsetHeight-pan.clientHeight/2)} /* RTL scrollLeft runs from 0 (right edge) to -max */
    else{pan.scrollLeft=0;pan.scrollTop=0}
  }
  function zoomUi(){var z=canZoom();bZoom.hidden=!z;box.classList.toggle('canz',z)}
  function build(){
    box=mk('div','lb',{role:'dialog','aria-modal':'true'});box.hidden=true;
    pan=mk('div','lb-pan');
    pic=mk('img','lb-img',{alt:''});
    bClose=mk('button','lb-btn lb-close',{type:'button'});bClose.innerHTML=ARW+'M6 6l12 12M18 6 6 18"/></svg>';
    bPrev=mk('button','lb-btn lb-prev',{type:'button'});bPrev.innerHTML=ARW+'M15 5l-7 7 7 7"/></svg>';
    bNext=mk('button','lb-btn lb-next',{type:'button'});bNext.innerHTML=ARW+'M9 5l7 7-7 7"/></svg>';
    bZoom=mk('button','lb-btn lb-zoom',{type:'button'});bZoom.hidden=true;
    bZoom.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l5 5M8 10.5h5"/><path class="lb-plus" d="M10.5 8v5"/></svg>';
    count=mk('div','lb-count',{'aria-hidden':'true'});
    cap=mk('p','lb-cap',{'aria-hidden':'true'});
    pan.appendChild(pic);
    box.appendChild(pan);box.appendChild(cap);box.appendChild(bClose);box.appendChild(bZoom);box.appendChild(bPrev);box.appendChild(bNext);box.appendChild(count);
    document.body.appendChild(box);
    labels();
    if(window.siteOnLang)window.siteOnLang(labels);
    box.addEventListener('click',function(e){if(e.target===box)close()});
    pic.addEventListener('load',zoomUi);
    pic.addEventListener('click',function(e){if(!box.hidden&&(zoomed||canZoom()))setZoom(!zoomed,e)});
    bZoom.addEventListener('click',function(){setZoom(!zoomed)});
    addEventListener('resize',function(){if(!box.hidden)zoomUi()});
    // touch swipe: left and right on the image
    var sx=0,sy=0,st=false;
    box.addEventListener('touchstart',function(e){if(e.touches.length!==1){st=false;return}st=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
    box.addEventListener('touchend',function(e){
      if(!st)return;st=false;
      var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
      if(!zoomed&&set.length>1&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){var d=dx<0?1:-1;if(root.dir==='rtl')d=-d;go(d)}
    },{passive:true});
    bClose.addEventListener('click',close);
    bPrev.addEventListener('click',function(){go(-1)});
    bNext.addEventListener('click',function(){go(1)});
  }
  function srcOf(img){var a=img.closest('a[href]');return a&&/\.(webp|png|jpe?g|gif|avif)(\?|$)/i.test(a.getAttribute('href'))?a.href:(img.currentSrc||img.src)}
  function show(n,dir){
    idx=(n+set.length)%set.length;
    var im=set[idx];
    if(zoomed)setZoom(false);
    var fade=dir&&!calm.matches&&!box.hidden&&pic.src;
    if(fade){
      // slide the old image out, the new one in from the other side
      var old=pic.cloneNode(false);old.className='lb-img lb-old';old.setAttribute('aria-hidden','true');
      pan.insertBefore(old,pic);
      old.style.animation='lb-out .28s ease both';old.style.setProperty('--dx',(-dir*40)+'px');
      setTimeout(function(){if(old.parentNode)old.parentNode.removeChild(old)},300);
      pic.style.setProperty('--dx',(dir*40)+'px');pic.classList.remove('lb-in');void pic.offsetWidth;pic.classList.add('lb-in');
    }
    bZoom.hidden=true;box.classList.remove('canz');
    pic.src=srcOf(im);pic.alt=im.alt;cap.textContent=im.alt;box.setAttribute('aria-label',im.alt);
    if(pic.complete)zoomUi();
    var multi=set.length>1;
    bPrev.hidden=bNext.hidden=!multi;count.hidden=!multi;count.textContent=(idx+1)+' / '+set.length;
  }
  function go(d){if(set.length>1)show(idx+d,d)}
  function open(img){
    if(!box)build();
    var vis=img.closest('.vis');
    set=vis&&vis.closest('.p-coup')?[].slice.call(vis.querySelectorAll('img')):[img];
    opener=document.activeElement;
    labels();
    show(set.indexOf(img));
    box.hidden=false;
    if(pic.complete)zoomUi();
    void box.offsetWidth;box.classList.add('on');
    root.classList.add('lb-open');
    bClose.focus();
  }
  function close(){
    if(!box||box.hidden)return;
    setZoom(false);box.classList.remove('on');box.hidden=true;root.classList.remove('lb-open');
    if(opener&&opener.focus)opener.focus();
  }
  // Coup phone screenshots lean up to 7 degrees towards the mouse (mouse / fine pointer only, not under reduced motion).
  // Updates are throttled with requestAnimationFrame; the lean eases back on leave, and is skipped while a flip plays.
  (function(){
    if(calm.matches||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    [].forEach.call(document.querySelectorAll('.p-coup .phones img'),function(im){
      var raf=0,ex=0,ey=0,off=0;
      function put(rx,ry){im.style.setProperty('--trx',rx+'deg');im.style.setProperty('--try',ry+'deg')}
      function apply(){
        raf=0;if(im.classList.contains('flip'))return;
        var r=im.getBoundingClientRect(),x=(ex-r.left)/r.width-.5,y=(ey-r.top)/r.height-.5;
        put((-y*14).toFixed(2),(x*14).toFixed(2));
      }
      im.addEventListener('pointermove',function(e){
        if(e.pointerType!=='mouse')return;
        clearTimeout(off);im.classList.remove('tl-x');im.classList.add('tl');
        ex=e.clientX;ey=e.clientY;if(!raf)raf=requestAnimationFrame(apply);
      });
      im.addEventListener('pointerleave',function(){
        cancelAnimationFrame(raf);raf=0;put(0,0);im.classList.add('tl-x');
        clearTimeout(off);off=setTimeout(function(){im.classList.remove('tl','tl-x')},600);
      });
    });
  })();
  // Coup phone screenshots: a double-click or a long press flips the screenshot like a card (about 0.75 s).
  // A single click still opens the lightbox; on these images it waits a quarter second to tell a double-click apart.
  var flipOK=function(img){return !calm.matches&&img.closest('.p-coup .phones')},clickT=0,pressT=0,pressed=null,px=0,py=0,ateClick=0;
  function flip(img){img.classList.remove('flip');void img.offsetWidth;img.classList.add('flip')}
  document.addEventListener('animationend',function(e){if(e.animationName==='coup-flip')e.target.classList.remove('flip')});
  document.addEventListener('pointerdown',function(e){
    var t=e.target;if(!t||t.tagName!=='IMG'||!flipOK(t)||e.button)return;
    pressed=t;px=e.clientX;py=e.clientY;clearTimeout(pressT);
    pressT=setTimeout(function(){if(pressed===t){flip(t);ateClick=Date.now();pressed=null}},500);
  },{passive:true});
  var unpress=function(){clearTimeout(pressT);pressed=null};
  document.addEventListener('pointermove',function(e){if(pressed&&Math.abs(e.clientX-px)+Math.abs(e.clientY-py)>10)unpress()},{passive:true});
  document.addEventListener('pointerup',function(){clearTimeout(pressT);pressed=null},{passive:true});
  document.addEventListener('pointercancel',unpress,{passive:true});
  document.addEventListener('contextmenu',function(e){if(Date.now()-ateClick<1500&&e.target.closest&&e.target.closest('.p-coup .phones'))e.preventDefault()});
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey)return;
    var t=e.target;if(!t||t.tagName!=='IMG'||!t.closest('.plate .vis'))return;
    e.preventDefault();
    if(flipOK(t)){
      if(Date.now()-ateClick<1500){ateClick=0;return} // the click that ends a long press
      if(e.detail>=2){clearTimeout(clickT);clickT=0;flip(t);return}
      if(e.detail===1){clearTimeout(clickT);clickT=setTimeout(function(){clickT=0;open(t)},260);return}
    }
    open(t);
  });
  document.addEventListener('keydown',function(e){
    if(!box||box.hidden)return;
    if(e.key==='Escape'){e.preventDefault();close()}
    else if(zoomed&&/^Arrow(Left|Right|Up|Down)$/.test(e.key)){
      // zoomed in, the arrows pan the picture (prev / next are still on the buttons)
      e.preventDefault();
      pan.scrollBy(e.key==='ArrowRight'?90:e.key==='ArrowLeft'?-90:0,e.key==='ArrowDown'?90:e.key==='ArrowUp'?-90:0);
    }else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      if(set.length<2)return;
      e.preventDefault();
      var d=e.key==='ArrowRight'?1:-1;if(root.dir==='rtl')d=-d;go(d);
    }else if(e.key==='Tab'){
      var f=[bClose,bZoom,bPrev,bNext].filter(function(b){return !b.hidden}),i=f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
    }
  });
  [].forEach.call(imgs,function(i){i.classList.add('zoomable')});
})();

// Images: shimmer while loading, fade in once loaded (classes ld / ld-in, styled in site.css). Lazy loading is untouched.
// Lazy images: the shimmer goes on the holder (figure or picture box) and the image fades in over it once it has
// loaded and decoded, so a fast scroll never shows an empty black box (classes ld-host / lz / loaded).
(function(){
  [].forEach.call(document.querySelectorAll('img'),function(im){
    if(im.complete&&im.naturalWidth)return;
    // (a hidden lazy image, e.g. the desktop or phone half of a pair, never loads, so it would leave the shimmer running)
    if(im.loading!=='lazy'||im.complete||!im.getClientRects().length)return;
    var host=im.closest('figure,.vis')||im.parentNode;
    host.classList.add('ld-host');im.classList.add('lz');
    var shown=false,show=function(){
      if(shown)return;shown=true;
      im.classList.add('loaded');
      setTimeout(function(){if(!host.querySelector('img.lz:not(.loaded)'))host.classList.remove('ld-host')},600);
    };
    im.addEventListener('load',function(){
      if(im.decode)im.decode().then(show,show);else show();
      setTimeout(show,400); // never wait on decode for long
    },{once:true});
    im.addEventListener('error',function(){host.classList.remove('ld-host');im.classList.remove('lz')},{once:true});
  });
})();
(function(){
  [].forEach.call(document.querySelectorAll('img'),function(im){
    if(im.complete&&im.naturalWidth)return;
    if(im.loading==='lazy')return;
    im.classList.add('ld');
    var done=function(ok){im.classList.remove('ld');if(ok){im.classList.add('ld-in');setTimeout(function(){im.classList.remove('ld-in')},450)}};
    im.addEventListener('load',function(){done(true)},{once:true});
    im.addEventListener('error',function(){done(false)},{once:true});
  });
})();

// Phones: tell the dots under the Coup strip which screen is showing.
(function(){
  // The swipe cue goes away after the first swipe; the edge fade goes away at the last screen.
  var plate=document.querySelector('.p-coup'),strip=plate&&plate.querySelector('.phones'),wrap=strip&&strip.parentNode;
  if(!strip)return;
  var t=0,figs=[].slice.call(strip.children),hasWrap=wrap&&wrap.classList.contains('coup-strip');
  function upd(){
    t=0;
    var m=strip.scrollWidth-strip.clientWidth,pos=Math.abs(strip.scrollLeft);
    if(m<=0)return;
    var rtl=getComputedStyle(strip).direction==='rtl',sr=strip.getBoundingClientRect(),pad=parseFloat(getComputedStyle(strip).scrollPaddingInlineStart)||0;
    var edge=rtl?sr.right-pad:sr.left+pad,best=0,bd=1e9;
    figs.forEach(function(f,k){var fr=f.getBoundingClientRect(),d=Math.abs((rtl?fr.right:fr.left)-edge);if(d<bd){bd=d;best=k}});
    if(pos>=m-2)best=figs.length-1;
    plate.style.setProperty('--i',best);
    if(hasWrap){wrap.classList.toggle('at-end',pos>=m-2);if(pos>8)wrap.classList.add('swiped')}
  }
  strip.addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(upd)},{passive:true});
})();
