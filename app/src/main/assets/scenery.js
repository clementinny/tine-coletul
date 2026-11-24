(function(root) {
  'use strict';
  const t=text=>root.CurierI18n?.t(text)??text;

  const palettes = {
    cutii:   { sky:['#527ea2','#ffce87'], sun:'#ffdb82', hills:['#9aa6a0','#798d80'], gravel:'#bc8158', shoulder:'#d09f6f', lights:'#ffeac5' },
    tort:    { sky:['#4d94b4','#c8eadf'], sun:'#fff0b1', hills:['#89b6ae','#629998'], gravel:'#9e825d', shoulder:'#c7a875', lights:'#fff4ca' },
    pepeni:  { sky:['#417f98','#e9d78e'], sun:'#ffde7f', hills:['#a4ae72','#71996e'], gravel:'#aa8058', shoulder:'#c6a272', lights:'#ffe3a6' },
    piata:   { sky:['#77769c','#ffc18d'], sun:'#ffd07f', hills:['#ad8997','#777984'], gravel:'#b07152', shoulder:'#be9168', lights:'#ffe6b4' },
    vaza:    { sky:['#333f71','#d9a7c2'], sun:'#ffeac8', hills:['#8583aa','#676689'], gravel:'#806783', shoulder:'#9b8095', lights:'#ffe3ba' },
    cartier: { sky:['#142848','#637aa5'], sun:'#f7e6bb', hills:['#506489','#3e5273'], gravel:'#62556d', shoulder:'#a2808b', lights:'#ffe8aa', night:true },
    livada:  { sky:['#3c7394','#eccc88'], sun:'#ffe19d', hills:['#72937e','#557a67'], gravel:'#956246', shoulder:'#cb9c64', lights:'#fff0bd', zone:'orchard' },
    serpentine:{ sky:['#456891','#98cbbc'], sun:'#fff1bd', hills:['#669083','#406c69'], gravel:'#685f51', shoulder:'#baa879', lights:'#fff0bd', zone:'forest' },
    cabana:  { sky:['#373e75','#e59882'], sun:'#ffd195', hills:['#876c83','#516778'], gravel:'#785a55', shoulder:'#ae815f', lights:'#ffe8ab', zone:'forest' },
    depou:   { sky:['#30495c','#bac6ac'], sun:'#fff3c0', hills:['#859fa0','#697e7d'], gravel:'#745f54', shoulder:'#a68968', lights:'#fff5bd', zone:'rail' },
    viaduct: { sky:['#36557c','#e3aa84'], sun:'#ffc77c', hills:['#8889a0','#576b87'], gravel:'#795a5f', shoulder:'#ac836d', lights:'#ffe9b1', zone:'rail' },
    festival:{ sky:['#1b2350','#8a6b9c'], sun:'#ffd79c', hills:['#554c78','#393959'], gravel:'#4b3d59', shoulder:'#a0798e', lights:'#ffe49c', zone:'rail', night:true }
  };

  const evening={
    coast:['#233854','#c48e82'],snow:['#263659','#8c9ab6'],copper:['#292747','#ae7986']
  };
  const scenery = level => {
    const city=level.city;
    if(!city)return palettes[level.id]||palettes.cutii;
    return level.evening?{...city,sky:evening[city.zone],night:true}:city;
  };
  const wrap = (x, length) => ((x % length) + length) % length;
  const disc = (c,x,y,r,fill) => {
    c.beginPath();
    c.arc(x,y,r,0,Math.PI*2);
    c.fillStyle=fill;
    c.fill();
  };

  function sky(c,width,height,level,camX) {
    const theme=scenery(level);
    const backdrop=c.createLinearGradient(0,0,0,height);
    backdrop.addColorStop(0,theme.sky[0]);
    backdrop.addColorStop(.83,theme.sky[1]);
    c.fillStyle=backdrop;
    c.fillRect(0,0,width,height);
    const x=width*.73-Math.sin(camX*.00028)*57;
    const y=154;
    disc(c,x,y,66,theme.sun+'33');
    disc(c,x,y,49,theme.sun);
    if(theme.night||level.id==='vaza'){
      for(let i=0;i<26;i++){
        disc(c,wrap(i*93.71-camX*.015,width),49+(i*51)%166,i%5===0?2.1:1.1,'#fff1caaa');
      }
    }
  }

  function horizon(c,width,level,camX) {
    const theme=scenery(level);
    for(let band=0;band<2;band++){
      const scroll=camX*(band===0?.13:.23);
      const segment=105;
      const first=Math.floor(scroll/segment)-2;
      c.beginPath();
      c.moveTo(-200,580);
      for(let i=first;i<first+Math.ceil(width/segment)+5;i++){
        const distance=i*segment;
        const y=314+band*63+Math.sin(i*.69+level.seed+band)*49+Math.cos(i*1.73)*23;
        c.lineTo(distance-scroll,y);
      }
      c.lineTo(width+200,580);
      c.closePath();
      c.fillStyle=theme.hills[band];
      c.fill();
    }
  }

  function roadside(c,level,camX,width,roadY) {
    const night=scenery(level).night||level.id==='vaza';
    const first=Math.floor((camX-125)/420);
    const end=Math.ceil((camX+width+125)/420);
    for(let i=first;i<=end;i++){
      const x=i*420+165;
      const y=roadY(level,x)-2;
      if(i%2===0){
        c.fillStyle=night?'#293854':'#5e7166';
        c.fillRect(x,y-112,5,112);
        c.fillRect(x,y-113,26,5);
        c.fillStyle=scenery(level).lights;
        c.fillRect(x+18,y-108,12,4);
        if(night){
          c.beginPath();
          c.moveTo(x+18,y-106);
          c.lineTo(x-19,y);
          c.lineTo(x+76,y);
          c.lineTo(x+30,y-106);
          c.fillStyle='#ffe3a51e';
          c.fill();
        }
      }else{
        for(let j=0;j<6;j++) {
          const offset=j*15;
          const tip=y-13-((j*11)%18);
          c.beginPath();
          c.moveTo(x+offset,y+2);
          c.lineTo(x+offset-7,tip);
          c.lineTo(x+offset+7,y+2);
          c.fillStyle=j%2===0?'#667c69':'#9e9b63';
          c.fill();
        }
      }
    }
  }

  function landmarks(c,width,level,camX,camY,tree) {
    const theme=scenery(level);
    const shift=camX*.49;
    const base=438-camY*.34;
    const first=Math.floor(shift/236)-2;
    const end=first+Math.ceil(width/236)+4;
    for(let i=first;i<end;i++){
      const x=i*236-shift;
      const alt=((i%5)+5)%5;
      if(theme.zone==='orchard'){
        tree(c,x,base,.86+alt*.07);
        for(let j=0;j<5;j++)disc(c,x-22+j*11,base-122+(j*11)%24,4.5,'#db8256');
        c.fillStyle='#374e4a';
        c.fillRect(x-32,base-19,140,4);
        c.fillRect(x-30,base-25,5,25);
        c.fillRect(x+108,base-25,5,25);
      }else if(theme.zone==='forest'){
        for(let j=0;j<3;j++){
          const xx=x+j*72;
          const h=100+((alt*33+j*56)%115);
          c.fillStyle='#584c52';
          c.fillRect(xx-4,base-h*.7,8,h*.7);
          for(let branch=0;branch<3;branch++){
            const peak=base-h+branch*h*.22;
            c.beginPath();
            c.moveTo(xx,peak);
            c.lineTo(xx-30-branch*7,peak+h*.44);
            c.lineTo(xx+34+branch*5,peak+h*.44);
            c.closePath();
            c.fillStyle=branch%2===0?'#385a58':'#476c62';
            c.fill();
          }
        }
      }else{
        c.fillStyle=theme.night?'#323b57':'#63747a';
        c.fillRect(x,base-111,223,111);
        c.beginPath();
        c.moveTo(x-7,base-107);
        c.lineTo(x+104,base-165);
        c.lineTo(x+229,base-107);
        c.closePath();
        c.fillStyle=theme.night?'#463950':'#985f54';
        c.fill();
        c.fillStyle='#334656';
        c.fillRect(x+85,base-85,63,85);
        for(let row=0;row<2;row++) {
          c.fillStyle=theme.night?'#e5a87a':'#acc3ba';
          c.fillRect(x+16,base-75+row*27,46,14);
          c.fillRect(x+171,base-75+row*27,35,14);
        }
      }
    }
  }

  function surface(c,level,from,to,roadY){
    for(const type of ['gravel','ice'])for(const [start,end] of level[type]||[]){
      const ice=type==='ice';
      if(end<from||start>to)continue;
      const left=Math.max(start,from-30);
      const right=Math.min(end,to+30);
      const edge=[[left,roadY(level,left)],...level.route.filter(p=>p[0]>left&&p[0]<right),[right,roadY(level,right)]];
      c.fillStyle=ice?'#94bccd':'#b38c6f';
      c.beginPath();
      c.moveTo(edge[0][0],edge[0][1]+(ice?-30:1));
      for(const [x,y] of edge.slice(1))c.lineTo(x,y+(ice?-30:1));
      for(const [x,y] of edge.slice().reverse())c.lineTo(x,y+(ice?22:44));
      c.closePath();
      c.fill();
      for(let x=Math.ceil(left/70)*70;x<right-20;x+=70){
        const y=roadY(level,x);
        c.strokeStyle=ice?'#e3f4e9':'#e1bb93';
        c.lineWidth=1.6;
        c.beginPath();
        c.moveTo(x,y+(ice?0:30));
        c.lineTo(x+(ice?37:17),roadY(level,x+17)+(ice?-7:30));
        c.stroke();
      }
      for(let x=Math.ceil(left/24)*24;x<right-6;x+=24){
        const y=roadY(level,x);
        if(ice)disc(c,x,y-16+(x%29),1.4,'#edf5dcbd');
        else{
          disc(c,x,y+8+(x%29),2.5,'#593f3d88');
          disc(c,x+7,y+12+(x%21),2,'#e9cb9c');
        }
      }
      if(start>=from-75){
        const y=roadY(level,start);
        c.fillStyle='#24384a';
        c.fillRect(start-10,y-78,5,78);
        c.fillRect(start-51,y-84,93,25);
        c.font='800 12px Trebuchet MS, sans-serif';
        c.textAlign='center';
        c.fillStyle='#ffdb8b';
        c.fillText(t(ice?'POLEI':'PIETRIȘ'),start-5,y-67);
        c.textAlign='start';
      }
    }
  }

  root.CurierScenery={scenery,sky,horizon,roadside,landmarks,surface};
})(globalThis);
