(function(root){
  'use strict';
  const features={
    rough:{name:'Pavaj',color:'#f0c875',description:'Frânează din timp și treci încet peste dungi.'},
    leap:{name:'Praguri',color:'#f79883',description:'La pragurile înalte, sari când apare semnalul. Peste pragurile joase poți trece și încet.'},
    barrier:{name:'Bariere',color:'#aac1fc',description:'Oprește la linie și claxonează cu accelerația eliberată.'},
    ice:{name:'Polei',color:'#a8dfef',description:'Pe gheață, frâna prinde mai greu. Frânează din timp sau folosește Carpatinul ori anvelope de iarnă.'},
    gravel:{name:'Pietriș',color:'#d5a282',description:'Aderența scade. Frânează mai devreme sau montează anvelope de teren.'},
    cab:{name:'Probă din cabină',color:'#9de5e1',description:'La panoul verde, intră pe ruta opțională. Schimbă banda cu săgețile, evită traficul și câștigă o medalie.'},
    reward:{name:'Bonusuri în aer',color:'#edac55',description:'Sari în dreptul marcajului galben. Potrivește viteza ca să ajungi la monede, la piesa de atelier sau la bonusul rar.'},
    service:{name:'Reambalare',color:'#7be0c0',description:'Oprește în zona marcată și apasă Reambalează. Refaci o parte din marfă și din rezerva de turbo.'}
  };
  function available(level){
    const marks=level.obstacles.map(obstacle=>({x:obstacle.x,type:obstacle.kind==='jump'?'leap':obstacle.kind}));
    for(const type of ['gravel','ice'])for(const [from,to] of level[type]||[])marks.push({x:(from+to)/2,type,from,to});
    if(level.serviceBay)marks.push({x:level.serviceBay,type:'service'});
    if(level.cabGate)marks.push({x:level.cabGate,type:'cab'});
    for(const x of level.jumpSpots||[])marks.push({x,type:'reward'});
    return marks.sort((a,b)=>a.x-b.x);
  }
  function profile(canvas,level){
    const w=canvas.width,h=canvas.height,roadY=root.CurierData.roadY;
    const points=[[260,roadY(level,260)],...level.route.filter(([x])=>x>260&&x<level.goal),[level.goal,roadY(level,level.goal)]];
    const ys=points.map(([,y])=>y);
    const low=Math.min(...ys)-5,high=Math.max(...ys)+5;
    return {points,xOf:x=>27+(x-260)*(w-54)/(level.goal-260),yOf:y=>48+(y-low)*(h-105)/(high-low)};
  }
  function pick(canvas,level,marks,event){
    const {left,top,width,height}=canvas.getBoundingClientRect();
    const {xOf,yOf}=profile(canvas,level);
    const roadY=root.CurierData.roadY;
    let match,closest=19;
    for(const mark of marks){
      const x=left+xOf(mark.x)*width/canvas.width;
      const y=top+yOf(roadY(level,mark.x))*height/canvas.height;
      const distance=Math.hypot(event.clientX-x,event.clientY-y);
      if(distance<closest){match=mark.type;closest=distance;}
    }
    return match;
  }
  function draw(canvas,level,marks,selected){
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    const roadY=root.CurierData.roadY;
    const {points,xOf,yOf}=profile(canvas,level);
    const sky=c.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#20374f');sky.addColorStop(1,'#142539');
    c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.strokeStyle='#acc5d733';c.lineWidth=1;
    for(let x=27;x<w;x+=(w-54)/12){
      c.beginPath();c.moveTo(x,22);c.lineTo(x,h-30);c.stroke();
    }
    for(let y=32;y<h-34;y+=26){
      c.beginPath();c.moveTo(27,y);c.lineTo(w-27,y);c.stroke();
    }
    for(const feature of marks.filter(item=>item.from!==undefined)){
      c.fillStyle=features[feature.type].color+(selected===feature.type?'4d':'26');
      c.fillRect(xOf(feature.from),22,xOf(feature.to)-xOf(feature.from),h-54);
    }
    const edge=()=>points.forEach(([x,y],i)=>i===0?c.moveTo(xOf(x),yOf(y)):c.lineTo(xOf(x),yOf(y)));
    c.beginPath();edge();c.lineTo(w-27,h-32);c.lineTo(27,h-32);c.closePath();
    const ground=c.createLinearGradient(0,42,0,h-29);
    ground.addColorStop(0,'#6caa95b3');ground.addColorStop(1,'#4d8b820c');
    c.fillStyle=ground;c.fill();
    c.beginPath();edge();c.strokeStyle='#d2eed5';c.lineWidth=3;c.lineJoin='round';c.stroke();
    for(const mark of marks){
      const x=xOf(mark.x),y=yOf(roadY(level,mark.x));
      const active=!selected||selected===mark.type;
      c.globalAlpha=active?1:.27;
      c.fillStyle=features[mark.type].color;
      c.beginPath();c.arc(x,y,active?8:6,0,Math.PI*2);c.fill();
      c.strokeStyle='#15283b';c.lineWidth=2;c.stroke();
      if(selected===mark.type){c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.strokeStyle=features[mark.type].color;c.stroke();}
    }
    c.globalAlpha=1;
    c.fillStyle='#fff0cf';c.font='bold 13px system-ui';
    c.textAlign='left';c.fillText('START',27,h-12);
    c.textAlign='right';c.fillText('LIVRARE',w-27,h-12);
  }
  root.CurierRouteMap={features,available,draw,pick};
})(globalThis);
