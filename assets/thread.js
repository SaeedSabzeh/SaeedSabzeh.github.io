// Homepage only (loaded by index.html). Two things:
// 1) "One thought, followed down the page": a spark with a short accent tail that follows the scroll.
// 2) window.wololoWave: site.js calls it so the wololo colour change spreads as a circle.
(function(){
  var root=document.documentElement,main=document.querySelector('main'),NS='http://www.w3.org/2000/svg';
  var calm=matchMedia('(prefers-reduced-motion: reduce)');
  function q(s){return document.querySelector(s)}

  // ---- wololo wave ----
  var waveId=0;
  window.wololoWave=function(flip,ev){
    if(calm.matches||!document.startViewTransition){flip();return}
    var w=innerWidth,h=innerHeight,x=w/2,y=h/2;
    if(ev&&(ev.clientX||ev.clientY)){x=ev.clientX;y=ev.clientY}
    else if(ev){ // keyboard click gives 0,0: use the button itself if it is on screen
      var b=q('.egg'),r=b&&b.getBoundingClientRect();
      if(r&&r.bottom>0&&r.top<h&&r.right>0&&r.left<w){x=r.left+r.width/2;y=r.top+r.height/2}
    }
    var s=root.style;
    s.setProperty('--wx',x+'px');s.setProperty('--wy',y+'px');
    s.setProperty('--wr',Math.ceil(Math.sqrt(Math.max(x,w-x)*Math.max(x,w-x)+Math.max(y,h-y)*Math.max(y,h-y)))+'px');
    var id=++waveId,done=function(){if(id===waveId)root.classList.remove('wololo-wave')};
    root.classList.add('wololo-wave');
    var t=document.startViewTransition(flip);
    t.finished.then(done,done);
  };

  // ---- the thread ----
  if(!main||!window.SVGPathElement||!SVGPathElement.prototype.getPointAtLength)return;
  var svg,acc,sp,endSq,marks=[],pts=[],cum=[],total=0,top=0,cur=0,target=0,raf=0,last=0,rt=0;
  function el(tag,cls,at){var e=document.createElementNS(NS,tag);if(cls)e.setAttribute('class',cls);for(var k in at)e.setAttribute(k,at[k]);return e}

  // Measure the route in px relative to <main>. Everything is derived from rects and the page direction, so it mirrors in Persian.
  function geom(){
    var chip=[].slice.call(document.querySelectorAll('.hero .chip')).pop(),head=q('#about .sec-head'),edu=q('#about .edu'),h=q('#cH');
    if(!chip||!head||!edu||!h)return null;
    var mr=main.getBoundingClientRect(),rtl=getComputedStyle(root).direction==='rtl',vw=root.clientWidth;
    var c=chip.getBoundingClientRect(),hr=head.getBoundingClientRect(),er=edu.getBoundingClientRect(),cs=getComputedStyle(chip);
    if(!c.width||!hr.width||!er.height)return null;
    // the chip bullet is the ::before square at the chip's inline-start, centred on the first line
    var lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.6;
    var cx=rtl?c.right-3.5:c.left+3.5,cy=c.top+(parseFloat(cs.borderTopWidth)||0)+(parseFloat(cs.paddingTop)||0)+lh/2;
    // gutter line: just outside the content, on the inline-start side
    var edge=rtl?hr.right:hr.left,free=rtl?vw-edge:edge;
    var gx=Math.max(5,Math.min(vw-5,edge+(rtl?1:-1)*Math.max(8,Math.min(free/2,28))));
    // timeline line: centre of the existing .edu::before (fallback to the CSS constants)
    var ps=getComputedStyle(edu,'::before'),o=parseFloat(rtl?ps.right:ps.left),w=parseFloat(ps.width),m=parseFloat(rtl?ps.marginRight:ps.marginLeft);
    if(isNaN(o)){o=innerWidth<=560?4:122;w=1;m=.5}
    w=w||1;m=m||0;
    var tx=rtl?er.right-o-m-w/2:er.left+o+m+w/2;
    // underline the heading text only (not the block width)
    var rg=document.createRange();rg.selectNodeContents(h);
    var hb=h.getBoundingClientRect(),tr=rg.getBoundingClientRect();if(!tr.width)tr=hb;
    var ex=rtl?tr.left:tr.right,ey=hb.bottom+10;
    var P=[[cx,cy],[gx,cy],[gx,er.top+.5],[tx,er.top+.5],[tx,er.bottom-.5],[gx,er.bottom-.5],[gx,ey],[ex,ey]]
      .map(function(p){return [p[0]-mr.left,p[1]-mr.top]});
    var ys=[].slice.call(document.querySelectorAll('#work .plate')).map(function(p){
      var t=p.querySelector('h3');if(!t)return null;
      // plates fade up from 14px lower until they get .in: measure the settled position
      var off=root.classList.contains('js-anim')&&!p.classList.contains('in')?14:0;
      return t.getBoundingClientRect().top+6-off-mr.top;
    }).filter(function(y){return y!==null});
    return {P:P,ys:ys,gx:gx-mr.left,top:mr.top+scrollY};
  }
  // point at a length along the route (only horizontal and vertical segments)
  function at(l){
    for(var i=1;i<cum.length;i++)if(l<=cum[i]||i===cum.length-1){
      var a=pts[i-1],b=pts[i],s=cum[i]-cum[i-1],f=s?Math.min(1,Math.max(0,(l-cum[i-1])/s)):0;
      return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f};
    }
  }
  // largest length whose y is not below y (y never decreases along the route, so a sideways jog counts as reached)
  function lenAtY(y){
    var t=0;
    for(var i=0;i<pts.length-1;i++){
      var a=pts[i],b=pts[i+1];
      if(a[1]>y)break;
      t=b[1]<=y?cum[i+1]:cum[i]+(y-a[1]);
      if(b[1]>y)break;
    }
    return t;
  }
  function goal(){
    if(!total)return 0;
    if(calm.matches||scrollY+innerHeight>=root.scrollHeight-2)return total;
    return Math.max(Math.min(40,total),Math.min(total,lenAtY(scrollY+innerHeight*.62-top)));
  }
  function render(){
    if(!svg)return;
    // only a short tail behind the spark is drawn, so no line piles up on the page;
    // on the last stretch the tail grows so the whole underline of the heading stays
    var T=Math.max(170,cur-cum[cum.length-2]);
    acc.setAttribute('stroke-dasharray',T+' '+(total+T+2));
    acc.setAttribute('stroke-dashoffset',T-cur);
    var p=at(cur),done=cur>=total-.5;
    sp.setAttribute('transform','translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+')');
    marks.forEach(function(m){m.e.classList.toggle('on',p.y>=m.y-.5)});
    endSq.classList.toggle('on',done);svg.classList.toggle('done',done);
  }
  // ease the head towards the goal; frames run only while it is travelling
  function tick(now){
    raf=0;if(!svg)return;
    var dt=Math.min(.05,Math.max(0,(now-last)/1000)),d=target-cur,s=d*(1-Math.exp(-dt*9)),max=dt*2600;
    last=now;
    if(Math.abs(s)>max)s=d<0?-max:max;
    cur+=s;if(Math.abs(target-cur)<.5)cur=target;
    render();
    if(cur!==target)raf=requestAnimationFrame(tick);else svg.classList.remove('run');
  }
  function ask(){
    if(!svg)return;
    target=goal();
    if(calm.matches){cur=target;render();return}
    if(cur!==target&&!raf){svg.classList.add('run');last=performance.now();raf=requestAnimationFrame(tick)}
  }
  function build(){
    var g=geom();
    if(!g){if(svg){svg.remove();svg=null}total=0;root.classList.remove('thread-on');return}
    var y0=svg&&total?top+at(cur).y:null; // where the head is on the page, to keep it there after the layout changed
    pts=g.P;cum=[0];
    for(var i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]));
    total=cum[cum.length-1];top=g.top;
    var d='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1)}).join('L');
    if(!svg){svg=el('svg','thread',{'aria-hidden':'true'});main.insertBefore(svg,main.firstChild)}
    svg.textContent='';
    svg.setAttribute('class','thread'+(calm.matches?' still':''));
    acc=el('path','acc',{d:d});svg.appendChild(acc);
    marks=[];
    var e=pts[pts.length-1];
    endSq=svg.appendChild(el('rect','end',{x:e[0]-4.5,y:e[1]-4.5,width:9,height:9}));
    var s=svg.appendChild(el('g','spark'));
    sp=s;
    var inner=s.appendChild(el('g','sp'));
    inner.appendChild(el('circle','halo',{r:9}));inner.appendChild(el('circle','core',{r:3.5}));
    root.classList.add('thread-on');
    cur=Math.min(total,y0===null?40:lenAtY(y0-top));
    target=goal();
    if(calm.matches)cur=target;
    render();ask();
  }
  function later(){clearTimeout(rt);rt=setTimeout(build,120)}

  build();
  addEventListener('scroll',ask,{passive:true});
  addEventListener('resize',later);
  addEventListener('load',later);
  if(document.fonts)document.fonts.ready.then(later);
  if('ResizeObserver' in window)new ResizeObserver(later).observe(main);
  new MutationObserver(later).observe(root,{attributes:true,attributeFilter:['lang','dir']});
  if(calm.addEventListener)calm.addEventListener('change',later);
})();
