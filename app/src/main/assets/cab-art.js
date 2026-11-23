(function(root){
  'use strict';
  const scenes={
    town:{sky:['#79b6c9','#f8ce9a'],haze:'#f7dfa7',far:'#819a9e',near:'#71948e',ground:'#a99c80',asphalt:'#49586a',edge:'#d7b58b'},
    orchard:{sky:['#82acc4','#ffcc99'],haze:'#ffe3a9',far:'#8ba4a3',near:'#557b6b',ground:'#8d9668',asphalt:'#46576a',edge:'#bca678'},
    depot:{sky:['#172843','#7c7391'],haze:'#e9c39e',far:'#606987',near:'#424e70',ground:'#535970',asphalt:'#333e55',edge:'#7f7483'},
    coast:{sky:['#4e8cac','#f4d5a1'],haze:'#ffdfa4',far:'#82aeb1',near:'#558f9f',ground:'#90a8a7',asphalt:'#41596a',edge:'#dcbb87'},
    snow:{sky:['#5876a4','#dce6ee'],haze:'#fbf0cb',far:'#9fb9cf',near:'#7b9caf',ground:'#d8e7ed',asphalt:'#465e77',edge:'#b4dce9'},
    copper:{sky:['#81728f','#ffb77b'],haze:'#ffe0a3',far:'#bb8989',near:'#956c75',ground:'#baa17c',asphalt:'#533e4f',edge:'#b6806b'}
  };
  const bodies=['#e1846c','#7ebcaa','#edbe69','#92a5d8'];

  function polygon(c,points,fill,stroke,width=1){
    c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();
    c.fillStyle=fill;c.fill();
    if(stroke){c.lineJoin='round';c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
  }
  function box(c,x,y,w,h,r,fill){
    c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
  }
  function line(c,x,y,endX,endY,color,width){
    c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);
    c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function oval(c,x,y,rx,ry,fill){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
  }
  function gradient(c,y0,y1,a,b){
    const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;
  }
  function skyline(c,w,h,horizon,shift,theme,name){
    c.fillStyle=gradient(c,0,horizon+40,...theme.sky);
    c.fillRect(0,0,w,h);
    const sun=Math.min(w*.1,h*.135);
    oval(c,w*.74+shift*.24,horizon-h*.10,sun,sun,theme.haze);
    const ridge=(depth,steps,color,base)=>{
      const points=[[-55,horizon+40]];
      for(let i=-1;i<=steps+1;i++){
        const x=i*w/steps+shift*depth;
        const y=horizon-h*(base+.08*Math.abs(Math.sin(i*2.4+depth)));
        points.push([x,y]);
      }
      points.push([w+55,horizon+40]);polygon(c,points,color);
    };
    ridge(.22,7,theme.far,.045);
    ridge(.38,9,theme.near,.017);
    for(let i=-1;i<13;i++){
      const x=i*w/11+shift*.48,y=horizon+5,span=w*.071;
      if(name==='orchard'){
        const tree=h*(.074+(.024*(i%3)));
        c.fillStyle='#5c5247';c.fillRect(x-2,y-tree*.42,4,tree*.53);
        oval(c,x-6,y-tree*.65,span*.32,tree*.48,i%2?'#476f5f':'#618564');
        oval(c,x+6,y-tree*.56,span*.31,tree*.43,i%2?'#5a845f':'#3b695d');
        continue;
      }
      const ht=h*(.048+(.023*((i+3)%4)));
      const wall=name==='depot'?'#455471':i%2?'#e5b889':'#c7c4a4';
      polygon(c,[[x+span,y-ht],[x+span+span*.24,y-ht-ht*.13],[x+span+span*.24,y-ht*.16],[x+span,y]],name==='depot'?'#343f58':'#ac9985');
      box(c,x,y-ht,span,ht,2,wall);
      polygon(c,[[x-3,y-ht],[x+span*.56,y-ht-h*.037],[x+span+4,y-ht]],name==='depot'?'#343e5a':'#a87468');
      c.fillStyle=name==='depot'?'#edbd81a6':'#74929a';
      for(let j=0;j<3;j++)c.fillRect(x+span*.17+j*span*.23,y-ht*.68,span*.11,ht*.28);
      c.fillStyle=name==='depot'?'#323b54':'#958477';
      c.fillRect(x+span*.58,y-ht*.27,span*.18,ht*.27);
    }
  }
  function traffic(c,car,x,y,s,night){
    c.save();c.translate(x,y);c.scale(s,s);
    const ink='#212b3c', roof=car.tall?-48:-37;
    oval(c,0,0,35,6,'#16233966');
    box(c,-31,-14,12,15,3,ink);box(c,19,-14,12,15,3,ink);
    polygon(c,[[-32,-7],[-33,-21],[-25,-28],[-19,roof],[19,roof],[25,-28],[33,-21],[32,-7]],bodies[car.color],ink,2.2);
    polygon(c,[[-22,-27],[-16,roof+4],[16,roof+4],[22,-27]],'#26465c',ink,1.6);
    polygon(c,[[-14,roof+6],[-3,roof+6],[6,-29],[-4,-29]],'#91b7c493');
    polygon(c,[[-31,-20],[-23,-27],[23,-27],[31,-20]],'#ffffff35');
    box(c,-29,-18,13,6,1.7,'#fff0b9');box(c,16,-18,13,6,1.7,'#fff0b9');
    box(c,-13,-17,26,5,2,ink);
    box(c,-30,-9,60,4,2,'#9aa5ae');
    box(c,-7,-9,14,5,1,'#ede7cb');
    if(night){oval(c,-22,-14,12,7,'#ffe59e34');oval(c,22,-14,12,7,'#ffe59e34');}
    c.restore();
  }
  function dashboard(c,w,h,run,paint,trim,reduced){
    const bottom=h*.78, wheelY=h*.947, radius=Math.min(w*.142,h*.133);
    polygon(c,[[0,0],[w,0],[w,h*.045],[w*.60,h*.064],[w*.34,h*.061],[0,h*.046]],'#162436');
    polygon(c,[[0,0],[w*.032,0],[w*.089,bottom],[w*.165,h],[0,h]],'#192a3b');
    polygon(c,[[w,0],[w*.968,0],[w*.911,bottom],[w*.835,h],[w,h]],'#192a3b');
    polygon(c,[[w*.033,0],[w*.04,0],[w*.102,bottom],[w*.085,bottom]],'#698595');
    polygon(c,[[w*.966,0],[w*.96,0],[w*.898,bottom],[w*.915,bottom]],'#698595');
    polygon(c,[[0,bottom+.09*h],[w*.20,bottom+.018*h],[w*.39,bottom],[w*.63,bottom],[w*.84,bottom+.018*h],[w,bottom+.09*h],[w,h],[0,h]],gradient(c,bottom,h,trim,'#152336'),'#1a3043',2);
    polygon(c,[[0,bottom+.088*h],[w*.27,bottom+.005*h],[w*.72,bottom+.005*h],[w,bottom+.088*h],[w,bottom+.103*h],[w*.71,bottom+.025*h],[w*.27,bottom+.025*h],[0,bottom+.103*h]],paint.dark);
    const ventsW=w*.094;
    for(const x of [w*.225,w*.775]){
      box(c,x-ventsW/2,bottom+h*.074,ventsW,h*.049,3,'#142637');
      for(let i=0;i<2;i++)box(c,x-ventsW*.40,bottom+h*(.088+i*.015),ventsW*.80,Math.max(1,h*.003),1,'#577185');
    }
    const r0=radius*.53;
    oval(c,w*.45,h*.879,r0,r0*.70,'#142234');
    oval(c,w*.55,h*.879,r0,r0*.70,'#142234');
    for(const [x,tilt] of [[w*.45,-.56],[w*.55,.18]]){
      c.save();c.translate(x,h*.879);
      c.strokeStyle='#a6c5be';c.lineWidth=1.65;
      c.beginPath();c.arc(0,0,r0*.74,Math.PI,Math.PI*1.95);c.stroke();
      c.rotate(tilt+(reduced?0:Math.sin(run.elapsed*7)*.05));
      c.beginPath();c.moveTo(0,0);c.lineTo(0,-r0*.66);c.strokeStyle='#ffbb76';c.stroke();
      c.restore();
    }
    c.save();
    c.translate(w*.50,wheelY);c.rotate((run.lane-run.offset)*.74);
    c.lineWidth=Math.max(6,radius*.20);
    c.strokeStyle='#121e2d';c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();
    c.lineWidth=Math.max(2,radius*.065);c.strokeStyle='#7f98a4';c.beginPath();c.arc(0,0,radius,Math.PI*1.09,Math.PI*1.91);c.stroke();
    polygon(c,[[-radius,-3],[-6,-1],[0,radius],[6,-1],[radius,-3],[radius,5],[7,8],[6,radius],[-6,radius],[-7,8],[-radius,5]],'#17283b');
    oval(c,0,0,radius*.30,radius*.24,trim);
    c.restore();
  }
  function mirror(c,w,h,run,style,reduced){
    const x=w*.5,y=h*.125,k=Math.min(w/700,h/405);
    c.save();c.translate(x,y);c.scale(k,k);
    box(c,-46,-14,92,25,7,'#1a3047');
    box(c,-41,-10,82,17,4,'#758c97');
    polygon(c,[[-38,3],[-15,-2],[13,-2],[39,3],[39,6],[-38,6]],'#4b6679');
    const charm=style?.charm;
    if(charm&&charm.id!=='stock'){
      c.rotate(reduced?0:(run.lane-run.offset)*.31+Math.sin(run.elapsed*3.4)*.10);
      line(c,0,10,1,36,'#b8bcaf',1.8);
      if(charm.id==='leaf'){
        oval(c,5,43,9,6,charm.color,'#335f5d');line(c,-1,47,11,41,'#45695c',1.4);
      }else if(charm.id==='star'){
        const points=Array.from({length:10},(_,i)=>{
          const a=-Math.PI/2+i*Math.PI/5,r=i%2?5:10;
          return [Math.cos(a)*r,44+Math.sin(a)*r];
        });
        polygon(c,points,charm.color,'#6e6353',1);
      }else if(charm.id==='flake'){
        for(let i=0;i<3;i++){
          const a=i*Math.PI/3;
          line(c,-9*Math.cos(a),44-9*Math.sin(a),9*Math.cos(a),44+9*Math.sin(a),charm.color,2.7);
        }
      }else{
        oval(c,0,39,3,3,charm.color);line(c,0,42,0,53,charm.color,2.7);
        polygon(c,[[-8,46],[0,51],[8,46],[5,54],[-5,54]],charm.color);
      }
    }
    c.restore();
  }
  function draw(c,w,h,run,paint,style,reduced){
    const scene=run.course.scene,theme=scenes[scene];
    const horizon=h*(w>h?.31:.34);
    const width=Math.min(w*.59,h*1.10);
    const shift=-run.offset*width*.048;
    const elapsed=run.elapsed;
    skyline(c,w,h,horizon,shift,theme,scene);
    c.fillStyle=gradient(c,horizon,h,theme.ground,scene==='depot'?'#2e3a51':'#776b57');
    c.fillRect(0,horizon,w,h-horizon);
    const perspective=(lane,q)=>{
      const spread=width*(.025+q*.975);
      const space=spread*2/3;
      return [w*.50+shift*(1-q)+(lane-run.offset)*space,
        horizon+q*(h*.785-horizon)];
    };
    function strip(left,right,from,to,color){
      polygon(c,[perspective(left,from),perspective(right,from),perspective(right,to),perspective(left,to)],color);
    }
    strip(-1.68,1.68,0,1.6,theme.edge);
    strip(-1.51,1.51,0,1.6,theme.asphalt);
    strip(-1.46,-1.42,0,1.6,'#fff0c89e');
    strip(1.42,1.46,0,1.6,'#fff0c89e');
    const phase=(elapsed*1.8)%1;
    for(let i=0;i<12;i++){
      const q=(i+phase)/10,q0=q*q,q1=(q+.068)**2;
      for(const lane of [-.5,.5])strip(lane-.018,lane+.018,q0,q1,'#ffe4aeaa');
    }
    const drift=(elapsed*.43)%1;
    for(let i=0;i<9;i++){
      const q=((i+drift)/8)**2;
      for(const side of [-1,1]){
        const [x,y]=perspective(side*(2.13+(i%3)*.32),q);
        const size=h*(.008+q*.18);
        if(x<-size||x>w+size)continue;
        if(scene==='depot'){
          box(c,x-size*.055,y-size*1.24,size*.11,size*1.24,1,'#303c54');
          box(c,x-size*.19,y-size*1.28,size*.38,size*.12,2,'#edcaa1');
          oval(c,x,y-size*1.18,size*.32,size*.12,'#f3be8150');
        }else if(scene==='snow'){
          box(c,x-size*.06,y-size*.72,size*.12,size*.72,1,'#697777');
          polygon(c,[[x,y-size*1.25],[x-size*.54,y-size*.22],[x+size*.54,y-size*.22]],'#557f91');
          polygon(c,[[x,y-size*1.25],[x-size*.32,y-size*.64],[x,y-size*.78],[x+size*.29,y-size*.64]],'#e6eeef');
        }else{
          oval(c,x+size*.18,y,size*.61,size*.13,'#3441452a');
          box(c,x-size*.059,y-size*.72,size*.118,size*.72,1,'#665747');
          oval(c,x-size*.19,y-size*.68,size*.46,size*.50,'#4d7164');
          oval(c,x+size*.20,y-size*.76,size*.41,size*.45,'#3b625c');
          oval(c,x-size*.18,y-size*.90,size*.37,size*.35,'#80a47a');
        }
      }
    }
    for(let i=0;i<10;i++){
      const q=((i+(elapsed*.65)%1)/8)**2;
      for(const side of [-1,1]){
        const [x,y]=perspective(side*1.81,q);
        const ht=h*.185*q+1;
        if(x<-30||x>w+30)continue;
        box(c,x-ht*.058,y-ht,Math.max(1,ht*.116),ht,1,scene==='depot'?'#43415c':'#6e8b86');
        box(c,x-ht*.12,y-ht,ht*.24,ht*.12,1,scene==='depot'?'#ffd59a':'#ffe9c5');
      }
    }
    for(let i=run.traffic.length-1;i>=0;i--){
      const car=run.traffic[i];
      const distance=car.at-elapsed;
      if(distance>run.course.view||distance<-.25)continue;
      const q=(1-distance/run.course.view)**2;
      const [x,y]=perspective(car.lane,q);
      traffic(c,car,x,y,(.072+q*1.75)*Math.min(w/480,h/390),scene==='depot');
    }
    dashboard(c,w,h,run,paint,style?.cab.color||'#233b50',reduced);
    mirror(c,w,h,run,style,reduced);
  }
  root.CurierCabArt={draw};
})(globalThis);
