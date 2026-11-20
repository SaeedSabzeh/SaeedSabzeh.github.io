// Shared by the homepage and the projects page: language switcher, copy-email,
// rank strip, the QGIS screenshot slider and the homepage extras (thought network,
// story thread, wololo). Every part checks that its elements exist.
// Project pictures that are not zoomable, tilted or shimmered: the watch face picker is a control, not a screenshot.
var SITE_NOZOOM='.p-watch';
(function(){
  var root=document.documentElement;
  var titleKey=root.getAttribute('data-title')||'pageTitle';
  var EN={copy:'Copy email',copied:'Copied',selected:'Selected, press Ctrl+C',wololoBlue:'Wololo! This page now plays for the blue team.',wololoRed:'Wololo! Back to red.',
    // Milan time line under the contact text ({t} becomes the Milan time). Edit the wording here.
    mtNow:'It’s {t} in Milan.',mtZz:'I’m probably asleep.',mtDay:'I’m probably in class or coding.',mtEve:'I’m probably coding something.',
    mindHintTap:'psst, tap the network a few times',abTapClick:'click to step · replay',pidxLbl:'Projects on this page',
    viceOn:'Welcome to Vice City. To leave, click the network 5 more times or use the link at the bottom.',viceOnTap:'Welcome to Vice City. To leave, tap the network 5 more times or use the link at the bottom.',viceOff:'Back to Milan.',viceLeave:'Leave Vice City',
    wfRow:'Watch faces',wfPlay:'Play the slideshow',wfPause:'Pause the slideshow',wfMore:'More faces',wfBack:'Earlier faces',wfNext:'Next watch face',wfOf:'of',wfFace:'watch face',
    themeToDark:'Switch to dark mode',themeToLight:'Switch to light mode',
    lbClose:'Close',lbPrev:'Previous',lbNext:'Next',lbZoomIn:'Zoom in',lbZoomOut:'Zoom out'};
  EN[titleKey]=document.title;
  var cur='en',langHooks=[];
  function tx(k){return (typeof I18N!=='undefined'&&I18N[cur]&&I18N[cur][k])||EN[k]}
  // the lightbox (a separate block below) reads labels and language changes through these
  window.siteTx=tx;window.siteOnLang=function(fn){langHooks.push(fn)};
  function quiet(t){if(t){['ready','finished','updateCallbackDone'].forEach(function(k){if(t[k]&&t[k].catch)t[k].catch(function(){})})}return t}

  // one toast for wololo and Vice: just above the footer when that is on screen (so it never covers the footer line that can trigger it), at the top if there is no room
  var toastEl=null,toastTimer=0;
  function toast(text,vice,ms){
    if(!toastEl){toastEl=document.createElement('div');toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');document.body.appendChild(toastEl)}
    toastEl.className='wololo-toast'+(vice?' vice-toast':'');
    toastEl.textContent=text;
    var f=document.querySelector('footer'),fr=f&&f.getBoundingClientRect(),h=toastEl.offsetHeight;
    toastEl.style.top='';toastEl.style.bottom='';
    if(vice&&scrollY<innerHeight*.6){toastEl.style.bottom='auto';toastEl.style.top='max(76px,calc(env(safe-area-inset-top,0px) + 64px))'}
    else if(fr&&fr.top<innerHeight&&fr.bottom>0){
      if(fr.top>=h+34)toastEl.style.bottom=(innerHeight-fr.top+14)+'px';
      else{toastEl.style.bottom='auto';toastEl.style.top='max(16px,env(safe-area-inset-top,0px))'}
    }
    void toastEl.offsetWidth;toastEl.classList.add('on');
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.classList.remove('on')},ms||3000);
  }

  // ---- language ----
  var hintEl=document.getElementById('mindHint');
  if(hintEl&&matchMedia('(pointer:coarse)').matches){hintEl.dataset.i='mindHintTap';hintEl.textContent=EN.mindHintTap}
  if(matchMedia('(hover:hover) and (pointer:fine)').matches)[].forEach.call(document.querySelectorAll('.bx-tap[data-i="abTap"]'),function(t){t.dataset.i='abTapClick';t.textContent=EN.abTapClick});
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
    if(a&&scrollY>0)scrollBy({top:a.getBoundingClientRect().top-y,behavior:'instant'}); // never animated, even with smooth scrolling on
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
  function isVice(){return root.hasAttribute('data-vice')}
  function isDark(){if(isVice())return false;return root.dataset.theme?root.dataset.theme==='dark':darkMq.matches}
  function syncTheme(){
    var forced=root.dataset.theme;
    [].forEach.call(document.querySelectorAll('meta[name="theme-color"][data-c]'),function(m){
      m.setAttribute('content',isVice()?'#b98dba':forced?(forced==='dark'?'#17171B':'#FFFFFF'):m.getAttribute('data-c'));
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
        var vc=root.hasAttribute('data-vice'); // Vice: peach on palm purple
        g.fillStyle=mine?(vc?'#feb484':'#FF829E'):(lo<R?(vc?'rgba(254,180,132,':'rgba(255,130,158,')+(.13+.25*prog).toFixed(3)+')':'rgba(245,245,247,.13)');
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
    if(el)el.scrollIntoView({behavior:'instant'});
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
    var hitK=0,hits=[];
    function mixHex(a,b,u){var p=function(h){h=h.replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]},x=p(a),y=p(b);return 'rgb('+x.map(function(v,i){return Math.round(v+(y[i]-v)*u)}).join(',')+')'}
    function colours(){
      var s=getComputedStyle(root);
      // the lit-up (warm) network is pink, or blue once wololo has changed sides
      var vice=isVice();
      col.a=warm?(vice?'#45032f':root.classList.contains('wololo')?'#3F7FE0':'#E0407A'):(s.getPropertyValue('--accent').trim()||col.a);
      col.s=s.getPropertyValue('--ink-soft').trim()||col.s;
      // lighter tint for the wave front (kept saturated enough to read on the light theme)
      var bl=root.classList.contains('wololo');col.h=warm?(vice?'#22144f':isDark()?(bl?'#BFD8FF':'#FFC4D1'):(bl?'#6FA3FF':'#FF5C8A')):col.a;
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
      // clicks 2 to 5 inside the Vice window tint and grow the ripple a little more each time
      ripples.forEach(function(r){var e=1-Math.pow(1-r.t,2),u=Math.max(0,(r.k||1)-1)/4;g.strokeStyle=u?mixHex(col.a,'#8E3BD6',u):col.a;g.globalAlpha=.7*(1-r.t);g.lineWidth=(2.2-r.t*1.2)*(1+u*.8);g.beginPath();g.arc(r.x,r.y,Math.max(0,e*300*(1+u*.25)),0,6.283);g.stroke()});
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
      ripples.push({x:x,y:y,t:0,k:hitK});if(ripples.length>6)ripples.shift();
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
      if(e.target.closest&&e.target.closest('a,button')){hitK=0;return}
      if(!e.isPrimary||e.button!==0)return; // only a main-button click or the first finger counts (no right-clicks, no multi-touch)
      clicks++;
      if(hint)hint.classList.add('gone');
      // the same counter serves the Vice egg: five clicks within 4 seconds
      var n=Date.now();hits.push(n);hits=hits.filter(function(t){return n-t<=4000});hitK=hits.length;
      if(hits.length===3&&!isVice()){var pre=location.pathname.indexOf('/projects')>-1?'../':'';(new Image()).src=pre+'img/vice-bg.webp';(new Image()).src=pre+'img/portrait-vice.webp'} // warm the pictures before the switch
      if(clicks===5)reward(e);
      if(hits.length>=5){hits=[];toggleVice(e);if(clicks!==5)reward(e)}
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
    var els=[].slice.call(document.querySelectorAll('#about .edu li,#work .plate,#projects .plate,#projects .wip,#github .repo'));
    if(!els.length)return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting||e.boundingClientRect.top<0){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    root.classList.add('js-anim');
    els.forEach(function(el){io.observe(el)});
  })();

  // Pictures lean about 2 degrees towards the mouse; Coup phone screenshots lift on hover (CSS, .tilt-on).
  // Mouse / fine pointer only, and not under reduced motion. Runs on any page that has project pictures.
  (function(){
    var vis=[].slice.call(document.querySelectorAll('.plate .vis')).filter(function(v){return v.querySelector('img')&&!v.closest(SITE_NOZOOM)});
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
      var wk=!/Sat|Sun/.test(p.weekday),st=h<8?'mtZz':(wk&&h<18?'mtDay':'mtEve'),say=cur==='it'?'':' '+tx(st);
      el.innerHTML='<i aria-hidden="true"></i><span class="now-t">'+tx('mtNow').replace('{t}','<b dir="ltr">'+time+'</b>')+say+'</span>';
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
    var flash=document.createElement('div');
    flash.className='wololo-flash';flash.setAttribute('aria-hidden','true');document.body.appendChild(flash);
    function convert(ev){
      // everything visible (toast text, toast, flash) is switched on inside flip, in the same frame as the colour change
      var flip=function(){
        var on=root.classList.toggle('wololo');recolour();toast(tx(on?'wololoBlue':'wololoRed'),false,3400);
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
      else if(buf.slice(-4)==='vice'&&window.siteToggleVice){buf='';window.siteToggleVice()}
    });
    egg.addEventListener('click',convert);
  })();

  // Hidden "Vice" theme: five quick clicks on the hero network (see the pointerdown handler above), or the footer button to leave.
  // html[data-vice], saved as localStorage "vice"; the head scripts restore it before first paint. Lives outside the network code so it works on /projects/ too.
  var viceTimer=0,heroEl=document.querySelector('.hero');
  function applyVice(on){
    if(on)root.setAttribute('data-vice','1');else root.removeAttribute('data-vice');
    syncTheme();recolour();sky(on);
    if(typeof draw==='function')draw(); // the rank strip has Vice colours
  }
  function toggleVice(e){
    var on=!isVice();
    // leaving from the footer button: it hides, so park focus on the home link instead of dropping it to <body>
    if(!on&&e&&e.currentTarget&&e.currentTarget.classList&&e.currentTarget.classList.contains('vice-leave')){
      var home=document.querySelector('a.mono');if(home)home.focus({preventScroll:true});
    }
    var run=function(){
      applyVice(on);
      try{if(on)localStorage.setItem('vice','1');else localStorage.removeItem('vice')}catch(x){}
      var tap=e&&e.pointerType&&e.pointerType!=='mouse';
      toast(tx(on?(tap?'viceOnTap':'viceOn'):'viceOff'),true,on?7000:2400);
    };
    if(!calm.matches){
      if(heroEl){heroEl.classList.add('vice-flash');clearTimeout(viceTimer);viceTimer=setTimeout(function(){heroEl.classList.remove('vice-flash')},1000)}
      if(document.startViewTransition){
        root.classList.add('vice-vt');
        var done=function(){root.classList.remove('vice-vt')};
        var t=quiet(document.startViewTransition(run));
        if(t&&t.finished)t.finished.then(done,done);else done();
        return;
      }
    }
    run();
  }
  [].forEach.call(document.querySelectorAll('.vice-leave'),function(b){b.addEventListener('click',toggleVice)});
  window.siteToggleVice=function(){toggleVice(null)};
  // a page restored from the back/forward cache may be out of date
  addEventListener('pageshow',function(e){if(!e.persisted)return;var on=false;try{on=localStorage.getItem('vice')==='1'}catch(x){}if(on!==isVice())applyVice(on)});
  // other tabs follow
  addEventListener('storage',function(e){
    if(e.key!=='vice'&&e.key!==null)return;
    var on=false;try{on=localStorage.getItem('vice')==='1'}catch(x){}
    if(on!==isVice())applyVice(on);
  });

  // The living sky (Vice only, never under reduced motion): the picture drifts a little with the pointer and the scroll
  // (on touch screens it drifts slowly by itself), the light warms further down the page, birds glide past now and then
  // (a click on empty sky sends a few up), and soft glints move over the water.
  // The picture and the warm light live on their own fixed layer (.vice-pic) that is moved with a transform, so nothing else
  // on the page restyles; the canvas runs at ~30 fps and the loop sleeps while the tab is hidden.
  var pic=null,warmEl=null,cv=null,cx=null,raf=0,birds=[],glints=[],W=0,H=0,DPR=1,last=0,lastDraw=0,nextBird=0,
      px=0,py=0,mx=0,my=0,mouse=false,live=false,lastW=0,rsz=0,IMG_W=1672,IMG_H=941,M=48,moving=true,lastTf='',lastWarm='',maxScroll=1,lastMeasure=0;
  function size(){
    DPR=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;lastW=W;maxScroll=Math.max(1,document.documentElement.scrollHeight-H);
    cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cx.setTransform(DPR,0,0,DPR,0,0);
    glints=[];
    var lw=W+2*M,lh=H+2*M,sc=Math.max(lw/IMG_W,lh/IMG_H),iw=IMG_W*sc,ih=IMG_H*sc,left=(lw-iw)*(W<=600?.14:.5)-M,top=lh-ih-M;
    for(var i=0,n=Math.round(W/34),k=0;i<n&&k<n*8;k++){
      var v=.735+Math.random()*.165,u=.02+(v-.735)/.165*.43+Math.random()*(1-.02-(v-.735)/.165*.43); // right of the shoreline
      var gx=left+u*iw,gy=top+v*ih;if(gx<-20||gx>W||gy<0||gy>H)continue;
      glints.push({x:gx,y:gy,l:14+Math.random()*40,p:Math.random()*6.28,s:.6+Math.random()*1.2,a:Math.random()*6.28});i++;
    }
  }
  // phones fire resize when the address bar slides; only a width change rebuilds the canvas
  function onResize(){clearTimeout(rsz);rsz=setTimeout(function(){if(innerWidth!==lastW||Math.abs(innerHeight-H)>120)size()},150)}
  function bird(x,y,vx,vy,sz){birds.push({x:x,y:y,vx:vx,vy:vy,s:sz*Math.max(.6,Math.min(1,W/900)),f:Math.random()*6.28,fs:7+Math.random()*3})}
  function ambient(){
    var left=Math.random()<.5,y=H*(.08+Math.random()*.3),n=Math.random()<.4?2:1,sp=(38+Math.random()*30)*(left?1:-1);
    for(var i=0;i<n;i++)bird(left?-30-i*30:W+30+i*30,y+i*16,sp,(Math.random()-.5)*6,11+Math.random()*7);
  }
  function frame(t){
    raf=0;if(!live||document.hidden)return;
    raf=requestAnimationFrame(frame);
    // ~30 fps while the picture moves or birds fly; ~15 fps when only the glints shimmer
    if(t-lastDraw<(birds.length||(mouse&&moving)?32:64))return;
    var dt=Math.min((t-(last||t))/1000,.08);last=t;lastDraw=t;
    // the picture: towards the pointer (mouse) or a slow figure-eight drift (touch), plus scroll parallax; clamped inside the M px margin
    if(t-lastMeasure>2000){lastMeasure=t;maxScroll=Math.max(1,document.documentElement.scrollHeight-H)} // the page grows as pictures load
    var sc=Math.min(1,scrollY/maxScroll);
    var gx=mouse?mx:Math.sin(t/7000)*12,gy=(mouse?my:Math.sin(t/9000)*8)+20-sc*56;
    var nx=Math.max(4-M,Math.min(M-4,px+(gx-px)*.08)),ny=Math.max(4-M,Math.min(M-4,py+(gy-py)*.08));
    moving=Math.abs(nx-px)+Math.abs(ny-py)>.05;px=nx;py=ny;
    var tf='translate3d('+px.toFixed(1)+'px,'+py.toFixed(1)+'px,0)',wo=Math.min(1,sc*1.15).toFixed(2);
    if(tf!==lastTf){pic.style.transform=tf;lastTf=tf} // no style writes when nothing changed
    if(wo!==lastWarm){warmEl.style.opacity=wo;lastWarm=wo}
    cx.clearRect(0,0,W,H);
    // glints on the water, moving with the picture
    for(var i=0;i<glints.length;i++){var g=glints[i],gx=g.x+Math.sin(t/2600+g.a)*6;
      var a=Math.max(0,Math.sin(t/1000*g.s+g.p))*.55;if(!a)continue;
      cx.strokeStyle='rgba(255,240,228,'+a.toFixed(2)+')';cx.lineWidth=1.6;cx.beginPath();cx.moveTo(gx+px,g.y+py);cx.lineTo(gx+px+g.l,g.y+py);cx.stroke()}
    // birds: two curved wings that flap, a little bob
    if(t>nextBird){ambient();nextBird=t+7000+Math.random()*7000}
    cx.fillStyle='rgba(110,86,160,.78)';
    for(var j=birds.length-1;j>=0;j--){var b=birds[j];b.x+=b.vx*dt;b.y+=b.vy*dt+Math.sin(t/600+b.f)*.3;b.f+=b.fs*dt;
      if(b.x<-80||b.x>W+80||b.y<-80){birds.splice(j,1);continue}
      var k=Math.sin(b.f)*b.s*.55,s=b.s,d=b.vx<0?-1:1;
      cx.beginPath();cx.moveTo(b.x-s,b.y-k);cx.quadraticCurveTo(b.x-s*.45,b.y-k*.2-s*.18,b.x,b.y+s*.12);
      cx.quadraticCurveTo(b.x+s*.45,b.y-k*.2-s*.18,b.x+s,b.y-k);cx.quadraticCurveTo(b.x+s*.4,b.y-k*.1+s*.02,b.x+d*s*.08,b.y+s*.3);
      cx.quadraticCurveTo(b.x-s*.4,b.y-k*.1+s*.02,b.x-s,b.y-k);cx.fill()}
  }
  function wake(){if(live&&!raf&&!document.hidden){last=0;raf=requestAnimationFrame(frame)}}
  function onMove(e){if(e.pointerType==='mouse'){mouse=true;mx=(e.clientX/W-.5)*-44;my=(e.clientY/H-.5)*-28}}
  function onSkyClick(e){ // on sky, gutters and headings; not on controls, pictures, body text or the hero network
    if(e.target.closest('a,button,input,textarea,label,p,li,figure,img,.vis,.hero,footer,[role=button]'))return;
    if(String(getSelection()).length)return;
    for(var i=0;i<3;i++)bird(e.clientX+(i-1)*10,e.clientY+i*6,(Math.random()<.5?-1:1)*(70+Math.random()*50),-(60+Math.random()*50),14+Math.random()*6);
    wake();
  }
  function sky(on){
    if(on&&!calm.matches){
      if(live)return;live=true;
      if(!pic){
        pic=document.createElement('div');pic.className='vice-pic';pic.setAttribute('aria-hidden','true');
        warmEl=document.createElement('div');warmEl.className='vice-warm';warmEl.setAttribute('aria-hidden','true');
        cv=document.createElement('canvas');cv.className='vice-sky';cv.setAttribute('aria-hidden','true');cx=cv.getContext('2d');
      }
      document.body.prepend(pic,warmEl,cv);root.classList.add('vice-live');size();nextBird=performance.now()+1500;
      addEventListener('resize',onResize);addEventListener('pointermove',onMove,{passive:true});document.addEventListener('click',onSkyClick);document.addEventListener('visibilitychange',wake);
      wake();
    }else if(live){
      live=false;cancelAnimationFrame(raf);raf=0;birds=[];root.classList.remove('vice-live');
      [pic,warmEl,cv].forEach(function(n){if(n&&n.parentNode)n.remove()});
      removeEventListener('resize',onResize);removeEventListener('pointermove',onMove);document.removeEventListener('click',onSkyClick);document.removeEventListener('visibilitychange',wake);
    }
  }
  if(calm.addEventListener)calm.addEventListener('change',function(){sky(false);if(isVice())sky(true)});
  if(isVice()){syncTheme();recolour();sky(true)}
})();

// Lightbox: click an image in a project plate to see it full size (Esc, backdrop or the close button to leave;
// the Coup phone screenshots get previous/next buttons and arrow keys). Self-contained.
// Button labels are plain neutral aria-label attributes ("Close", "Previous", "Next"), not in i18n.js.
(function(){
  var imgs=document.querySelectorAll('.plate:not('+SITE_NOZOOM+') .vis img');
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
    var t=e.target;
    if(t&&t.tagName==='A'&&t.closest('.plate .vis')){var li=t.querySelector('img.zoomable');if(li)t=li}
    if(!t||t.tagName!=='IMG'||!t.closest('.plate .vis')||t.closest(SITE_NOZOOM))return;
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
  [].forEach.call(imgs,function(i){
    i.classList.add('zoomable');
    if(i.closest('a'))return; // already a link
    i.tabIndex=0; // Enter or Space opens the full-size picture
    i.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});
  });
})();

// Images: shimmer while loading, fade in once loaded (classes ld / ld-in, styled in site.css). Lazy loading is untouched.
// Lazy images: the shimmer goes on the holder (figure or picture box) and the image fades in over it once it has
// loaded and decoded, so a fast scroll never shows an empty black box (classes ld-host / lz / loaded).
(function(){
  [].forEach.call(document.querySelectorAll('img'),function(im){
    if(im.complete&&im.naturalWidth)return;
    // (a hidden lazy image, e.g. the desktop or phone half of a pair, never loads, so it would leave the shimmer running)
    if(im.loading!=='lazy'||im.complete||!im.getClientRects().length||im.closest(SITE_NOZOOM))return;
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
    if(im.loading==='lazy'||im.closest(SITE_NOZOOM))return;
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

// The hero portrait is a card with one picture: the Duomo photo, or in Vice City the drawn sunglasses picture.
// Switching Vice on or off turns the card edge-on with the old picture still in place (.keep-old), swaps the picture
// while it is invisible (waiting up to 1.5 s for the drawn one to download), then turns it back.
// Reduced motion: no turning, the picture simply changes once the new one is ready.
(function(){
  var f=document.querySelector('.arch .flip');
  if(!f)return;
  var root=document.documentElement,card=f.querySelector('.card'),calm=matchMedia('(prefers-reduced-motion: reduce)');
  var art=f.querySelector('.p-vice'),turning=false,ticket=0;
  function vice(){return root.hasAttribute('data-vice')}
  // call cb once the drawn picture is downloaded (only needed when switching to Vice), at most 1.5 s later
  function ready(v,cb){
    if(!v||!art||(art.complete&&art.naturalWidth))return cb();
    var done=false,go=function(){if(!done){done=true;cb()}};
    var pre=new Image();pre.onload=pre.onerror=go;pre.src=art.src;setTimeout(go,1500);
  }
  function stop(){turning=false;f.classList.remove('keep-old');if(card)card.classList.remove('turn-out','turn-in')}
  var was=vice();
  if('MutationObserver' in window)new MutationObserver(function(){
    var v=vice();if(v===was)return;was=v;
    var my=++ticket;
    if(turning){stop();return} // switched back mid-turn: just show the current picture
    f.classList.add('keep-old');
    if(calm.matches||!card){ready(v,function(){if(my===ticket)f.classList.remove('keep-old')});return}
    turning=true;
    card.classList.add('turn-out');
    var half=false;
    function edge(){ // the card is edge-on: swap the picture and turn back
      if(half||my!==ticket)return;half=true;card.removeEventListener('animationend',out);
      ready(v,function(){
        if(my!==ticket)return;
        f.classList.remove('keep-old'); // the swap, while the card is invisible
        card.classList.remove('turn-out');card.classList.add('turn-in');
        setTimeout(function(){if(my===ticket&&turning){card.classList.remove('turn-in');turning=false}},900); // in case animationend never comes
      });
    }
    function out(e){if(e.animationName==='card-out')edge()}
    card.addEventListener('animationend',out);
    setTimeout(edge,450); // in case animationend never comes (e.g. a background tab)
  }).observe(root,{attributes:true,attributeFilter:['data-vice']});
  if(card)card.addEventListener('animationend',function(e){if(e.animationName==='card-in'){card.classList.remove('turn-in');turning=false}});
})();

// Numbers in the fact rows count up once when they scroll into view ("21", "11,000×", "99.08%"); ranges and words stay as they are.
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  var FA='۰۱۲۳۴۵۶۷۸۹';
  function latin(t){return t.replace(/[۰-۹]/g,function(d){return FA.indexOf(d)})}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;io.unobserve(e.target);
    var b=e.target,final=b.textContent,fa=/[۰-۹]/.test(final),m=/^([0-9][0-9,٬]*(?:[.٫][0-9]+)?)(\D*)$/.exec(latin(final).trim());
    if(!m)return;
    var raw=m[1],sep=(/[,٬]/.exec(raw)||[''])[0],dec=(raw.split(/[.٫]/)[1]||'').length,to=parseFloat(raw.replace(/[,٬]/g,'').replace('٫','.'));
    if(!(to>0))return;
    var t0=0,last=null;
    function fmt(v){var x=v.toFixed(dec),p=x.split('.');if(sep)p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,sep);x=p.join(dec?(fa?'٫':'.'):'');if(fa)x=x.replace(/\d/g,function(d){return FA[d]});return x+m[2]}
    function step(t){
      if(last!==null&&b.textContent!==last)return; // the language changed mid-way: leave the new text alone
      if(!t0)t0=t;var k=Math.min(1,(t-t0)/800),v=to*(1-Math.pow(1-k,3));
      last=k<1?fmt(v):final;b.textContent=last;
      if(k<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })},{rootMargin:'0px 0px -6% 0px'}); // starts as the number enters the screen, so the final value never flashes first
  [].forEach.call(document.querySelectorAll('.facts b,.qfacts b'),function(b){io.observe(b)});
})();

// Projects page: a quiet index under the heading, built from the plate titles (so it follows the language).
(function(){
  var head=document.querySelector('#projects .sec-head'),plates=[].slice.call(document.querySelectorAll('#projects .plate[id]'));
  if(!head||!plates.length)return;
  var nav=document.createElement('nav');nav.className='pidx';
  head.insertAdjacentElement('afterend',nav);
  var FA='۰۱۲۳۴۵۶۷۸۹';
  function build(){
    var fa=document.documentElement.lang==='fa';
    nav.setAttribute('aria-label',(window.siteTx&&window.siteTx('pidxLbl'))||'Projects on this page');
    nav.innerHTML='';
    plates.forEach(function(p,k){
      var h=p.querySelector('h3');if(!h)return;
      var name=h.textContent.split(/[,،:]| – /)[0].trim(),n=(k<9?'0':'')+(k+1);
      if(fa)n=n.replace(/\d/g,function(d){return FA[d]});
      var a=document.createElement('a');a.href='#'+p.id;a.innerHTML='<b>'+n+'</b>';a.appendChild(document.createTextNode(name));
      nav.appendChild(a);
    });
  }
  build();if(window.siteOnLang)window.siteOnLang(build);
})();

// Neon Faces: the watch face picker. Autoplays while in view (not under reduced motion, paused while a mouse is over it);
// a tap on the big watch, a swipe, a thumbnail, the row arrows or the arrow keys take over (autoplay pauses), and the play button hands it back.
(function(){
  var plate=document.querySelector('.p-watch');
  if(!plate)return;
  var row=plate.querySelector('.wf-row'),nameEl=plate.querySelector('.wf-name'),sr=plate.querySelector('.wf-say'),now=plate.querySelector('.wf-now'),layers=[].slice.call(plate.querySelectorAll('.wf-img')),
      watch=plate.querySelector('.wf-watch'),pp=plate.querySelector('.wf-pp'),vis=plate.querySelector('.vis');
  var calm=matchMedia('(prefers-reduced-motion: reduce)');
  var F=[['sunset86','Sunset 86'],['nightdrive','Night Drive'],['neonbay','Neon Bay HUD'],['oceandrive','Ocean Drive'],['streethud','Street Level HUD'],['pastelbay','Pastel Bay'],
    ['coastplate','Coast Plate'],['flamingodeco','Flamingo Deco'],['freshmint','Fresh Mint'],['glades','Glades'],['headline','Breaking Headline'],['heatwave','Heatwave'],['inksunset','Ink & Sunset'],
    ['keysbridge','Keys Bridge'],['pixelarcade','Pixel Arcade'],['poolday','Pool Day'],['popflash','Pop Flash'],['rideordie','Ride or Die'],['sunsetgems','Sunset Gems'],['tapecam','Tape Cam'],['tropicpop','Tropic Pop']];
  var SIZES=layers[0].getAttribute('sizes')||'260px';
  var saveData=!!(navigator.connection&&navigator.connection.saveData),holdUntil=0,holdT=0;
  var cur=0,front=0,tok=0,tm=0,busy=false,inView=false,hover=false,kb=false,userPaused=false,seen=false,btns=[];
  var D=(layers[0].getAttribute('src')||'img/watch/x').replace(/[^\/]*$/,''); // 'img/watch/' or '../img/watch/'
  function set(img,i){var n=F[i][0];img.sizes=SIZES;img.srcset=D+n+'.webp 440w, '+D+'660/'+n+'.webp 660w, '+D+'2x/'+n+'.webp 880w';img.src=D+n+'.webp'}
  function pad(n){return (n<10?'0':'')+n}
  function T(k,d){return (window.siteTx&&window.siteTx(k))||d}
  function fa(){return document.documentElement.lang==='fa'}
  function num(n){return fa()?String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]}):String(n)}
  function wrap(i){return (i+F.length)%F.length}
  function pos(i){return F[i][1]+(fa()?'، ':', ')+num(i+1)+' '+T('wfOf','of')+' '+num(F.length)}
  function alt(i){return fa()?T('wfFace','watch face')+' '+F[i][1]:F[i][1]+' '+T('wfFace','watch face')}
  // everything that says which face is showing, written only once its picture is on screen
  function paint(i,say){
    nameEl.textContent=F[i][1].toUpperCase()+' · '+pad(i+1)+' / '+F.length;
    btns.forEach(function(b,k){b.setAttribute('aria-pressed',k===i?'true':'false');b.tabIndex=k===i?0:-1});
    layers[front].alt=alt(i);if(now)now.textContent=pos(i);
    // a quiet live region, written only when a person changes the face (and not when the focused thumbnail already says it)
    if(say&&sr&&document.activeElement!==btns[i])sr.textContent=pos(i);
    var b=btns[i],vl=row.scrollLeft+24,vr=row.scrollLeft+row.clientWidth-24; // scroll the row itself, only when needed
    if(b.offsetLeft<vl||b.offsetLeft+b.offsetWidth>vr)row.scrollTo({left:b.offsetLeft-(row.clientWidth-b.offsetWidth)/2,behavior:calm.matches?'auto':'smooth'});
  }
  function labels(){btns.forEach(function(b,k){b.setAttribute('aria-label',pos(k))});paint(cur,false);if(watch)watch.setAttribute('aria-label',T('wfNext','Next watch face'));paintPP()}
  F.forEach(function(f,i){
    var b=document.createElement('button'),im=new Image();
    b.type='button';b.setAttribute('aria-pressed',i?'false':'true');b.tabIndex=i?-1:0;
    // small 112px pictures; their src is set when the plate first comes near the screen (all 21 are ~115 KB together)
    im.alt='';im.width=112;im.height=112;im.decoding='async';im.dataset.src=D+'thumb/'+f[0]+'.webp';
    b.appendChild(im);b.addEventListener('click',function(){take();show(i,true)});
    row.appendChild(b);btns.push(b);
  });
  function show(i,say,tries,dir){
    i=wrap(i);
    if(i===cur){++tok;busy=false;return} // also cancels a swap that is still loading
    var t=++tok,old=layers[front],nw=layers[1-front],done=false;dir=dir||(i===wrap(cur-1)?-1:1);busy=true;
    function swap(){
      if(done||t!==tok)return;done=true;busy=false;
      nw.classList.add('on');nw.removeAttribute('aria-hidden');old.classList.remove('on');old.setAttribute('aria-hidden','true');old.alt='';
      front=1-front;cur=i;paint(i,say);
    }
    set(nw,i);
    // a picture that fails to load keeps the old face (and the old name) instead of showing a broken image
    function fail(){if(nw.complete&&nw.naturalWidth)swap();else if(t===tok&&!done){done=true;busy=false;if((tries||0)<F.length)show(i+dir,say,(tries||0)+1,dir)}} // a broken face is skipped
    (nw.decode?nw.decode():Promise.resolve()).then(swap,fail);
    // some browsers leave decode() pending (e.g. in a background pane): fall back to the load state after a moment
    setTimeout(function(){if(!done&&t===tok){if(nw.complete&&nw.naturalWidth)swap();else nw.addEventListener('load',swap,{once:true}),nw.addEventListener('error',fail,{once:true})}},700);
    if(!saveData)set(new Image(),wrap(i+1)); // the next big face only (the browser picks the size); not with Data Saver on
  }
  function sync(){
    var want=inView&&!hover&&!kb&&Date.now()>=holdUntil&&!userPaused&&!calm.matches&&!document.hidden;
    if(want&&!tm)tm=setInterval(function(){if(!busy)show(cur+1,false)},2800);
    else if(!want&&tm){clearInterval(tm);tm=0}
  }
  function paintPP(){
    if(!pp)return;
    pp.classList.toggle('is-paused',userPaused); // icon and label follow the same state
    pp.setAttribute('aria-label',T(userPaused?'wfPlay':'wfPause',userPaused?'Play the slideshow':'Pause the slideshow'));
  }
  function take(){userPaused=true;paintPP();sync()} // the visitor took over
  function hold(){holdUntil=Date.now()+8000;sync();clearTimeout(holdT);holdT=setTimeout(sync,8100)} // browsing the row: a short hold
  if(pp){
    if(calm.matches)pp.hidden=true;
    pp.addEventListener('click',function(){userPaused=!userPaused;paintPP();if(!userPaused){if(sr)sr.textContent='';kb=false;show(cur+1,false)}sync()});
  }
  if(window.siteOnLang)window.siteOnLang(labels);
  labels();
  // row arrows (mostly for mice without a sideways wheel): scroll the row by most of its width
  [].forEach.call(plate.querySelectorAll('.wf-arr'),function(a){
    a.addEventListener('click',function(){if(a.getAttribute('aria-disabled')==='true')return;hold();row.scrollBy({left:(a.classList.contains('wf-next')?1:-1)*row.clientWidth*.8,behavior:calm.matches?'auto':'smooth'})});
  });
  function arrows(){
    var max=row.scrollWidth-row.clientWidth-2;
    plate.querySelectorAll('.wf-arr').forEach(function(a){a.setAttribute('aria-disabled',String(a.classList.contains('wf-next')?row.scrollLeft>=max:row.scrollLeft<=2))});
  }
  // browsing the row by touch or a sideways wheel hands control to the visitor
  row.addEventListener('touchstart',hold,{passive:true});row.addEventListener('wheel',function(e){if(Math.abs(e.deltaX)>Math.abs(e.deltaY))hold()},{passive:true});
  row.addEventListener('scroll',arrows,{passive:true});addEventListener('resize',arrows);arrows();
  row.addEventListener('keydown',function(e){
    var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,k=e.key==='Home'?0:e.key==='End'?F.length-1:-1;
    if(!d&&k<0)return;
    e.preventDefault();take();
    var i=k>=0?k:wrap(cur+d); // wraps, like the big watch
    btns[i].focus({preventScroll:true});show(i,true);
  });
  // the big watch: a click (or tap, or a screen reader's default action) = next face; a horizontal swipe = previous / next
  // and swallows the click that follows it (vertical scrolling stays with the page, touch-action:pan-y)
  if(watch){
    var sx=0,sy=0,sid=null,swiped=false,sw=0;
    var step=function(d){take();show(cur+d,true)};
    watch.addEventListener('pointerdown',function(e){if(e.button)return;sid=e.pointerId;sx=e.clientX;sy=e.clientY;swiped=false;clearTimeout(sw);try{watch.setPointerCapture(e.pointerId)}catch(x){}});
    watch.addEventListener('pointerup',function(e){
      if(sid!==e.pointerId)return;sid=null;
      var dx=e.clientX-sx,dy=e.clientY-sy;
      if(Math.abs(dx)>=30&&Math.abs(dx)>Math.abs(dy)){swiped=true;step(dx<0?1:-1)}
      else if(Math.abs(dx)>=10||Math.abs(dy)>=10)swiped=true; // a drag that was not a swipe: no click either
      if(swiped)sw=setTimeout(function(){swiped=false},400);
    });
    watch.addEventListener('pointercancel',function(){sid=null});
    watch.addEventListener('click',function(){if(swiped){swiped=false;return}step(1)});
    watch.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();step(1)}
      else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}
    });
  }
  // a mouse resting on the plate holds the current face (a short pause, not a state: the button does not change)
  vis.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){hover=true;sync()}});
  vis.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'){hover=false;sync()}});
  // keyboard focus inside the picture holds the face too (not on the play button itself)
  vis.addEventListener('focusin',function(e){kb=e.target!==pp&&!!(e.target.matches&&e.target.matches(':focus-visible'));sync()});
  vis.addEventListener('focusout',function(e){if(!(e.relatedTarget&&vis.contains(e.relatedTarget)))kb=false;sync()});
  document.addEventListener('visibilitychange',sync);
  if(calm.addEventListener)calm.addEventListener('change',function(){if(pp)pp.hidden=calm.matches;sync()});
  plate.classList.add('wf-js'); // the controls only show once they work
  function first(){
    if(seen)return;seen=true;
    btns.forEach(function(b){var im=b.firstChild;im.src=im.dataset.src});
    if(!saveData)set(new Image(),1);arrows();
  }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){if(e[0].isIntersecting)first()},{rootMargin:'400px 0px'}).observe(vis);
    new IntersectionObserver(function(e){inView=e[0].isIntersecting;sync()},{threshold:.35}).observe(vis);
  }else{first();inView=true;sync()}
})();
