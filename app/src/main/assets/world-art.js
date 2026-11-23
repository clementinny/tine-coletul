(function(root){
  'use strict';
  const ink='#263749', ivory='#f7e4bf', ochre='#edb56c', mint='#74ccb0';
  const placings={
    cutii:[[950,'post'],[2550,'market']],
    tort:[[1320,'market'],[3290,'post']],
    pepeni:[[1150,'market'],[3190,'market']],
    piata:[[860,'market'],[1700,'market'],[3030,'market']],
    vaza:[[1080,'post'],[3240,'cabin']],
    cartier:[[1280,'post'],[3510,'stage'],[5210,'stage']],
    livada:[[790,'market'],[3280,'market']],
    serpentine:[[1160,'cabin'],[3890,'lookout'],[5260,'lookout']],
    cabana:[[860,'lookout'],[2120,'cabin'],[5270,'cabin']],
    depou:[[870,'tram'],[2390,'tram'],[5400,'post']],
    viaduct:[[760,'tram'],[3170,'lookout'],[5560,'tram']],
    festival:[[790,'stage'],[3130,'stage'],[5050,'stage'],[6910,'stage']]
  };
  const visible=(x,from,to)=>x>=from-280&&x<=to+280;

  function fill(c,color,points,stroke){
    c.beginPath();
    c.moveTo(points[0][0],points[0][1]);
    for(const [x,y] of points.slice(1))c.lineTo(x,y);
    c.closePath();
    c.fillStyle=color;
    c.fill();
    if(stroke){c.lineWidth=2;c.strokeStyle=ink;c.stroke();}
  }
  function box(c,x,y,w,h,color,r=0){
    c.fillStyle=color;
    if(r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
    else c.fillRect(x,y,w,h);
  }
  function stroke(c,color,width,...points){
    c.beginPath();
    c.moveTo(points[0][0],points[0][1]);
    for(const [x,y] of points.slice(1))c.lineTo(x,y);
    c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function dot(c,x,y,r,color){
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  function label(c,text,x,y,color=ink,size=13){
    c.font='900 '+size+'px Trebuchet MS,sans-serif';
    c.textAlign='center';c.fillStyle=color;c.fillText(text,x,y);c.textAlign='start';
  }
  function bunting(c,left,right,y,drop,colors){
    const middle=(left+right)/2;
    c.beginPath();
    c.moveTo(left,y);
    c.quadraticCurveTo(middle,y+drop*2,right,y);
    c.strokeStyle=ink;c.lineWidth=2;c.stroke();
    for(let i=1;i<10;i++){
      const t=i/10,x=left+(right-left)*t, h=y+4*drop*t*(1-t);
      fill(c,colors[i%colors.length],[[x-8,h],[x+9,h],[x+1,h+17]]);
    }
  }
  function window(c,x,y,w,h,night){
    box(c,x-3,y-3,w+6,h+6,ink,2);
    box(c,x,y,w,h,night?'#ffcc85':'#849ca2',1);
    stroke(c,'#f8e3bf6b',2,[x+3,y+h-6],[x+w-5,y+3]);
    box(c,x+w/2-1,y,2,h,ink);
    box(c,x-5,y+h+1,w+10,3,'#d3a383',1);
  }
  function crate(c,x,y,a='#bf7d52'){
    box(c,x,y,35,21,ink,2);
    box(c,x+2,y+2,31,17,a,1);
    stroke(c,'#fff5c950',1.5,[x+4,y+8],[x+31,y+8]);
    stroke(c,'#783f41',1.5,[x+4,y+15],[x+31,y+15]);
  }
  function market(c,theme,level){
    box(c,-91,-90,182,90,'#6f5960',3);
    box(c,-81,-82,162,82,'#c88a62');
    box(c,-71,-76,142,51,'#3d5362',3);
    const awning=level.chapter==='dealuri'?'#74988c':'#c76f64';
    for(let i=0;i<7;i++){
      const x=-93+i*26;
      fill(c,i%2?ivory:awning,[[x+5,-96],[x+31,-96],[x+26,-72],[x,-72]],true);
    }
    box(c,-92,-72,182,5,'#643f50');
    for(let i=0;i<4;i++){
      crate(c,-76+i*37,-34);
      for(let j=0;j<3;j++)dot(c,-70+i*37+j*9,-35+(j%2)*3,5,(i+j)%2?'#b7ba74':'#df8062');
    }
    box(c,-90,-12,180,12,'#8b5e58');
    box(c,-64,-119,128,20,ink,3);
    label(c,level.chapter==='dealuri'?'DIN LIVADĂ':'PIAȚA MICĂ',0,-105,ivory,12);
  }
  function post(c,theme){
    box(c,-92,-128,184,128,'#b77563',2);
    box(c,-90,-126,132,126,'#d3a481');
    fill(c,'#6a5666',[[-102,-129],[-75,-157],[63,-157],[105,-129]],true);
    box(c,-60,-109,120,20,ink,3);
    label(c,'POȘTA DE CARTIER',0,-95,ivory,11);
    window(c,-69,-73,38,32,theme.night);
    window(c,30,-73,38,32,theme.night);
    box(c,-20,-65,39,65,ink,4);
    box(c,-15,-60,29,59,'#527787',2);
    box(c,-12,-56,23,24,'#aec5ba',2);
    box(c,7,-25,5,3,ochre,2);
    box(c,105,-23,27,23,'#a66b5d',3);
    box(c,110,-42,18,24,'#c76f64',3);
    stroke(c,ivory,2,[114,-34],[124,-34]);
  }
  function cabin(c,theme,level,time){
    fill(c,'#655360',[[43,-132],[57,-132],[57,-173],[43,-174]],true);
    for(let i=0;i<3;i++){
      const travel=(time*.57+i*.31)%1;
      dot(c,49+travel*32,-175-travel*38,4+travel*7,'#ffeac061');
    }
    box(c,-83,-98,166,98,'#735458');
    for(let i=0;i<8;i++)box(c,-81,-97+i*12,160,10,i%2?'#aa7359':'#bf8663',4);
    fill(c,'#564755',[[-104,-90],[-9,-168],[16,-168],[107,-90]],true);
    stroke(c,'#ce8266',3,[-84,-96],[4,-156],[85,-96]);
    box(c,-21,-69,43,69,ink,4);
    box(c,-15,-63,30,61,'#946453',3);
    window(c,-68,-64,32,29,true);
    window(c,38,-64,32,29,true);
    box(c,-50,-105,100,20,ink,3);
    label(c,'CABANA',0,-91,ivory);
  }
  function lookout(c){
    for(const x of [-93,-36,22,79]){
      box(c,x,-69,8,69,'#725e5d',1);
      box(c,x-2,-71,12,5,'#cea57b',1);
    }
    stroke(c,'#a7866a',6,[-93,-55],[87,-55]);
    stroke(c,'#b19270',6,[-93,-26],[87,-26]);
    for(let i=0;i<4;i++){
      const x=-68+i*37;
      fill(c,ivory,[[x,-46],[x+13,-46],[x+24,-35],[x+13,-24],[x,-24],[x+11,-35]]);
    }
  }
  function tram(c,theme,level,time){
    stroke(c,'#566172',2,[-164,-149],[167,-149]);
    stroke(c,ink,3,[-19,-113],[13,-143],[33,-143]);
    box(c,-140,-115,280,107,ink,28);
    box(c,-136,-111,270,98,'#b86d62',26);
    box(c,-133,-63,264,21,'#e2b789');
    for(let i=0;i<6;i++)window(c,-113+i*38,-92,25,31,theme.night);
    for(const x of [-81,85])dot(c,x,-5,12,ink);
    box(c,-132,-24,254,9,'#773f55',3);
    label(c,'05',115,-30,'#fff0c9',13);
    dot(c,125,-49,5,'#fff1bf');
    box(c,-170,4,336,4,'#8b7581');
    box(c,-170,11,336,3,'#463f58');
  }
  function stage(c,theme,level,time){
    box(c,-142,-157,284,152,'#292f4c',8);
    fill(c,'#474063',[[-151,-153],[-109,-183],[107,-183],[153,-153]],true);
    box(c,-112,-141,224,114,'#55416b',4);
    for(let i=0;i<6;i++){
      const x=-90+i*35, lit=Math.sin(time*2+i*1.45)>-.4;
      fill(c,lit?'#f8ab7137':'#aa96da25',[[x,-142],[x+9,-142],[x+38,-31],[x-22,-31]]);
      dot(c,x+4,-139,4,lit?'#ffe1a3':'#b9a2db');
    }
    for(const x of [-127,105]){
      box(c,x,-86,23,62,'#242a43',3);
      dot(c,x+11,-69,7,'#686386');dot(c,x+11,-44,8,'#686386');
      dot(c,x+11,-44,3,ochre);
    }
    box(c,-75,-113,150,29,'#262a46',5);
    label(c,level.id==='festival'?'FESTIVAL':'CHEF DE CARTIER',0,-93,'#fbd098',15);
    box(c,-139,-17,278,17,'#6b566d',4);
    bunting(c,-143,143,-72,15,['#f8b178','#d8819e','#71b8ac','#eacd9d']);
  }
  const structures={post,market,cabin,lookout,tram,stage};
  function backdrop(c,level,camX,camY,width,theme,time){
    const shift=camX*.72;
    for(const [at,kind] of placings[level.id]||[]){
      const x=at*.72-shift;
      if(!visible(x,0,width))continue;
      c.save();
      c.translate(x,435-camY*.63);
      structures[kind](c,theme,level,time);
      c.restore();
    }
  }
  function roadDetails(c,level,from,to,roadY){
    if(level.id!=='viaduct')return;
    for(const [start,end] of [[1450,2190],[3410,4240]]){
      if(end<from-215||start>to+215)continue;
      c.save();
      c.beginPath();
      c.moveTo(start,roadY(level,start)+48);
      for(const [x,y] of level.route)if(x>start&&x<end)c.lineTo(x,y+48);
      c.lineTo(end,roadY(level,end)+48);c.lineTo(end,810);c.lineTo(start,810);
      c.closePath();c.clip();
      box(c,start,295,end-start,516,'#997983');
      for(let x=start+84;x<end-38;x+=165){
        const y=roadY(level,x)+124;
        c.beginPath();c.moveTo(x-61,810);c.lineTo(x-61,y);
        c.arc(x,y,61,Math.PI,0);c.lineTo(x+61,810);c.closePath();
        c.fillStyle='#536883';c.fill();c.strokeStyle='#c79b89';c.lineWidth=9;c.stroke();
      }
      for(let x=start;x<=end;x+=16)box(c,x,roadY(level,x)+50,16,9,'#e1b090');
      c.restore();
    }
  }
  function service(c,sim,from,to,roadY){
    const stop=sim.service;
    if(!stop||!visible(stop.x,from,to))return;
    const y=roadY(sim.level,stop.x);
    c.save();
    c.translate(stop.x,y);
    const accent=stop.used?'#93a7aa':stop.active?ochre:mint;
    box(c,-124,-111,248,109,ink,8);
    box(c,-117,-104,234,102,'#456678',5);
    box(c,-97,-78,194,76,'#20364b',4);
    for(let i=0;i<7;i++)box(c,-106+i*31,-83,30,8,i%2?'#f0c584':accent);
    box(c,-103,-137,206,24,ink,4);
    label(c,'REAMBALARE',0,-120,ivory);
    window(c,-79,-58,38,31,true);
    crate(c,49,-25);crate(c,12,-25);
    dot(c,-105,-97,5,accent);
    dot(c,105,-97,5,accent);
    for(let i=0;i<10;i++){
      const x=-110+i*22;
      const ax=stop.x+x;
      fill(c,i%2?accent:'#314a5c',[[x,roadY(sim.level,ax)-y+5],[x+22,roadY(sim.level,ax+22)-y+5],
        [x+22,roadY(sim.level,ax+22)-y+15],[x,roadY(sim.level,ax)-y+15]]);
    }
    c.restore();
  }
  root.CurierWorldArt={backdrop,roadDetails,service};
})(globalThis);
