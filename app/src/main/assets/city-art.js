(function(root){
  'use strict';
  const ink='#223b52';
  function poly(c,points,color,outline){
    c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();c.fillStyle=color;c.fill();
    if(outline){c.lineJoin='round';c.lineWidth=2;c.strokeStyle=outline;c.stroke();}
  }
  function box(c,x,y,w,h,color){
    c.fillStyle=color;c.fillRect(x,y,w,h);
  }
  function line(c,x,y,xx,yy,color,width=2){
    c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
  function oval(c,x,y,rx,ry,color,stroke){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    c.fillStyle=color;c.fill();
    if(stroke){c.lineWidth=2;c.strokeStyle=stroke;c.stroke();}
  }
  function caption(c,text,x,y){
    c.font='900 12px Trebuchet MS, sans-serif';
    const w=c.measureText(text).width+22;
    box(c,x-w/2,y-17,w,23,ink);
    c.fillStyle='#ffe5ac';
    c.textAlign='center';c.fillText(text,x,y);c.textAlign='start';
  }
  function houses(c,x,y,i,zone,night){
    const height=54+((i*31+81)%49+49)%49;
    const width=74+(Math.abs(i*43)%29);
    const wall=zone==='coast'?['#e3c9a0','#d2917f','#c0cbbd','#bfafa0'][Math.abs(i)%4]:zone==='snow'?'#7291a8':'#b47c6c';
    const roof=zone==='snow'?'#e1e9e9':zone==='coast'?'#ab6259':'#805462';
    box(c,x,y-height,width,height,wall);
    poly(c,[[x+width,y-height],[x+width+21,y-height-10],[x+width+21,y-10],[x+width,y]],zone==='snow'?'#587586':'#946d66');
    poly(c,[[x+width*.46,y-height-26],[x+width*.46+21,y-height-36],[x+width+27,y-height-10],[x+width+6,y-height]],zone==='snow'?'#bbd4d9':'#876468');
    poly(c,[[x-7,y-height],[x+width*.46,y-height-26],[x+width+7,y-height]],roof);
    for(let row=17;row<height-14;row+=22)for(let u=10;u<width-12;u+=22){
      box(c,x+u,y-height+row,13,13,night?'#f0bb81':'#4f7585');
      if(night||row%3===2)line(c,x+u+6,y-height+row,x+u+6,y-height+row+13,wall,1.5);
    }
    box(c,x+width*.53,y-28,15,28,'#526777');
  }
  function fir(c,x,y,h){
    box(c,x-5,y-h*.65,10,h*.65,'#6e6263');
    for(let k=2;k>=0;k--){
      const top=y-h+h*.21*k;
      const wing=h*(.17+k*.05);
      poly(c,[[x,top],[x-wing,top+h*.48],[x+wing,top+h*.48]],k%2?'#466c80':'#4e7b88');
      poly(c,[[x,top],[x-wing*.71,top+h*.34],[x-4,top+h*.29],[x+wing*.67,top+h*.33]],'#dae9ea');
    }
  }
  function sea(c,w,cam,floor,night){
    const g=c.createLinearGradient(0,floor-145,0,floor+75);
    g.addColorStop(0,night?'#6b8293':'#88bdc0');g.addColorStop(1,night?'#35556c':'#4f9aaf');
    box(c,0,floor-132,w,218,g);
    for(let i=0;i<18;i++){
      const x=((i*129.7-cam*.22)%(w+150)+w+150)%(w+150)-65;
      const y=floor-114+(i*31)%158;
      line(c,x,y,x+28+i%4*13,y,night?'#aeacb974':'#d3e4ceaf',1.3);
    }
  }
  function lighthouse(c,night,t){
    oval(c,0,-7,110,15,'#4e788b65');
    poly(c,[[-79,0],[-57,-32],[51,-36],[73,0]],'#597e91',ink);
    poly(c,[[-29,-21],[-20,-176],[13,-176],[24,-21]],'#eee1c2',ink);
    for(const y of [-136,-80])poly(c,[[-22,y],[-24,y+27],[19,y+27],[16,y]],'#c56e63',ink);
    box(c,-30,-184,55,9,ink);
    box(c,-15,-206,24,22,night?'#ffdd91':'#79a8a8');
    line(c,-3,-204,-3,-184,ink,2);
    poly(c,[[-26,-205],[-3,-224],[21,-205]],'#af645a',ink);
    if(night){
      const spread=174+32*Math.sin(t*.9);
      poly(c,[[5,-192],[spread,-223],[spread,-160]],'#ffdc8a31');
      oval(c,-2,-195,17,13,'#ffe19542');
    }
    caption(c,'FARUL DIN BRIZENI',0,-10);
  }
  function crane(c,night,t){
    box(c,-116,-18,232,18,'#526d7c');
    for(const x of [-77,46]){
      line(c,x,-17,x+15,-135,'#bb7851',8);
      line(c,x+28,-17,x+15,-135,'#85615a',6);
      line(c,x,-56,x+29,-83,'#8e6256',4);
    }
    poly(c,[[-102,-136],[72,-136],[111,-112],[-102,-112]],'#d7a16a',ink);
    for(let i=-91;i<65;i+=26)line(c,i,-115,i+17,-133,'#866154',2);
    const x=66+Math.sin(t)*17;
    line(c,x,-115,x,-62,'#334d5c');
    box(c,x-16,-62,32,15,night?'#deb174':'#ac7761');
    for(let i=0;i<4;i++)box(c,-104+i*32,-36,27,18,i%2?'#799d97':'#c48368');
    caption(c,'DANA DE SUD',-25,-20);
  }
  function sails(c){
    for(const [x,y,k,color] of [[-65,-12,.73,'#f6d9a6'],[22,2,1,'#eac2b2'],[100,-25,.62,'#9acabe']]){
      c.save();c.translate(x,y);c.scale(k,k);
      line(c,0,-96,0,-13,ink,3);
      poly(c,[[0,-91],[-47,-25],[-4,-26]],color,ink);
      poly(c,[[4,-82],[43,-25],[5,-26]],'#f7e8c9',ink);
      poly(c,[[-52,-15],[52,-15],[34,-4],[-43,-4]],'#bd775d',ink);
      c.restore();
    }
  }
  function station(c,night){
    box(c,-111,-100,211,100,'#6590a4');
    poly(c,[[-124,-98],[-42,-149],[111,-98]],'#e2e8e6',ink);
    box(c,-90,-72,54,46,night?'#ffce90':'#9bc3ca');
    box(c,38,-72,44,46,night?'#ffce90':'#9bc3ca');
    for(const x of [-66,60])line(c,x,-72,x,-27,ink);
    box(c,-18,-61,31,61,'#476879');
    line(c,-118,-3,112,-3,'#f4eddb',6);
    caption(c,'GARA FĂGETUL ALB',0,-81);
  }
  function lift(c,t){
    for(const x of [-116,115]){
      line(c,x,-5,x,-165,'#526974',8);
      line(c,x-20,-164,x+20,-164,'#446070',7);
      poly(c,[[x-17,0],[x,-36],[x+21,0]],'#6d8893',ink);
    }
    c.beginPath();c.moveTo(-128,-166);c.quadraticCurveTo(2,-136,140,-176);
    c.strokeStyle='#476173';c.lineWidth=2;c.stroke();
    for(let i=0;i<3;i++){
      const x=((i*84+t*17)%250)-124,y=-157+Math.sin((x+125)/250*Math.PI)*9;
      line(c,x,y,x,y+22,ink,1.5);
      poly(c,[[x-13,y+16],[x+12,y+16],[x+9,y+32],[x-11,y+32]],'#ab745e',ink);
      box(c,x-7,y+19,13,6,'#e6e3b9');
    }
    caption(c,'VALEA PINILOR',0,-8);
  }
  function observatory(c,night){
    box(c,-77,-91,154,91,'#7692a6');
    oval(c,0,-89,75,59,'#c6d5d9',ink);
    box(c,-78,-87,156,20,'#abc5ca');
    poly(c,[[8,-87],[8,-145],[33,-137],[33,-87]],'#516b8c',ink);
    box(c,-63,-60,38,28,night?'#ffc491':'#9ebcc7');box(c,23,-60,39,28,night?'#ffc491':'#9ebcc7');
    box(c,-12,-34,23,34,ink);
    caption(c,'OBSERVATOR',0,-64);
  }
  function greenhouse(c,night){
    const glass=night?'#6f9f8c':'#a5beb0';
    for(const [x,y,k] of [[-112,0,1],[44,-25,.82]]){
      c.save();c.translate(x,y);c.scale(k,k);
      poly(c,[[0,0],[0,-67],[36,-100],[99,-96],[156,-66],[156,0]],glass,ink);
      poly(c,[[0,-67],[36,-100],[99,-96],[70,-64]],'#c9cfb6ad',ink);
      for(let i=0;i<5;i++){
        const a=i*32;
        line(c,a,-65,a,0,'#52766d',2);
        oval(c,a+15,-24,14,12,i%2?'#6c8a60':'#507568');
      }
      line(c,0,-65,156,-65,'#456860',3);
      line(c,0,-29,156,-29,'#456860',2);
      c.restore();
    }
    caption(c,'SERELE ORAȘULUI',-17,-9);
  }
  function copper(c,night){
    for(const [x,h,w] of [[-96,146,37],[-48,212,27],[44,155,48]]){
      box(c,x,-h,w,h,'#a76861');
      box(c,x+w*.77,-h,w*.26,h,'#7a4e5b');
      box(c,x-4,-h,w+8,13,'#d19176');
      for(let y=-h+30;y<-34;y+=31)box(c,x+8,y,w*.43,12,night?'#efaf77':'#775766');
    }
    line(c,-117,-51,97,-51,'#cb8a69',9);
    caption(c,'ATELIERELE ARĂMIEI',0,-14);
  }
  function clock(c,night){
    box(c,-48,-179,96,179,'#b97f6e');
    poly(c,[[-60,-179],[0,-230],[60,-179]],'#785567',ink);
    for(const x of [-43,32])line(c,x,-175,x,0,'#e1a683',4);
    oval(c,0,-139,26,26,night?'#ffe0a5':'#eed0a2',ink);
    line(c,0,-139,0,-161,ink);line(c,0,-139,15,-131,ink,3);
    box(c,-18,-60,36,60,'#62475b');
    for(let i=0;i<5;i++)oval(c,-133+i*63.5,-81+(i%2)*7,8,11,i%2?'#e5ab88':'#f7c77b',ink);
    caption(c,'PIAȚA LAMPIOANELOR',0,-65);
  }

  const structures={lighthouse,crane,sail:sails,station,lift:(c,_night,t)=>lift(c,t),observatory,greenhouse,copper,clock};
  function backdrop(c,w,level,camX,camY,t,night){
    const zone=level.city.zone;
    const horizon=438-camY*.33;
    if(zone==='coast')sea(c,w,camX,horizon,night);
    const scroll=camX*.36;
    const first=Math.floor(scroll/155)-2;
    const last=first+Math.ceil(w/155)+5;
    if(zone==='snow'){
      for(let i=first;i<last;i++){
        const x=i*155-scroll;
        const peak=150+Math.abs(Math.sin(i*2.59))*99;
        poly(c,[[x-105,horizon],[x-40,horizon-peak*.39],[x-14,horizon-peak*.36],[x+48,horizon-peak],
          [x+103,horizon-peak*.49],[x+127,horizon-peak*.43],[x+180,horizon]],night?'#597991':'#8eaebd');
        poly(c,[[x+48,horizon-peak],[x+10,horizon-peak*.60],[x+31,horizon-peak*.65],
          [x+46,horizon-peak*.61],[x+59,horizon-peak*.73],[x+79,horizon-peak*.69]],night?'#c0cdd5':'#f0f5ed');
      }
    }
    for(let i=first;i<last;i++){
      const x=i*155-scroll;
      houses(c,x,horizon-(zone==='coast'?61:0),i,zone,night);
      if(zone==='snow'){
        fir(c,x+103,horizon+25,71+Math.abs(i%4)*22);
        fir(c,x-22,horizon+37,57+Math.abs(i%3)*13);
      }
    }
    for(const [at,name] of level.landmarks){
      const x=(at-camX)*.72;
      if(x<-260||x>w+260)continue;
      c.save();c.translate(x,432-camY*.64);
      structures[name](c,night,t);
      c.restore();
    }
  }
  root.CurierCityArt={backdrop};
})(globalThis);
