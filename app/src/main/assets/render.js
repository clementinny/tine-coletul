(function(root){
  'use strict';
  const t=text=>root.CurierI18n?.t(text)??text;
  const ink='#172c43';
  const roofs={van:-59,monster:-65,rocket:-51,delfin:-57,carpatin:-72,vijelie:-47};
  const cargoFaces={
    lantern:[-14,-17,28,34,'#ffd594','#9c594a'],
    tools:[-16,-13,32,29,'#9eb5c8','#405977'],
    speaker:[-16,-16,32,32,'#7c929b','#2e4052'],
    box:[-16,-16,32,32,'#f2d6a0','#a97a4e']
  };
  const rounded=(c,x,y,w,h,r=5)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
  function box(c,x,y,w,h,fill,r=4,stroke=ink){rounded(c,x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function line(c,x1,y1,x2,y2,color=ink,width=2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function circle(c,x,y,r,color,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function polygon(c,points,fill,stroke=ink,width=1.8){
    c.beginPath();
    points.forEach(([x,y],i)=>i===0?c.moveTo(x,y):c.lineTo(x,y));
    c.closePath();
    c.fillStyle=fill;
    c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
  }
  function tint(color,target,amount){
    const rgb=[1,3,5].map((i,index)=>Math.round(parseInt(color.slice(i,i+2),16)*(1-amount)+target[index]*amount));
    return 'rgb('+rgb.join(',')+')';
  }
  function gradient(c,x0,y0,x1,y1,top,bottom){
    const paint=c.createLinearGradient(x0,y0,x1,y1);
    paint.addColorStop(0,top);
    paint.addColorStop(1,bottom);
    return paint;
  }
  function rng(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.camX=0;this.camY=0;this.time=0;this.particles=[];this.traces=[];this.ripples=[];this.floats=[];this.confetti=[];this.kick=0;this.lastDust=0;this.resize();}
    resize(){const r=this.canvas.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);const d=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*d);this.canvas.height=Math.round(this.h*d);this.dpr=d;this.scale=this.h/(this.w>this.h?535:640);this.worldW=this.w/this.scale;this.resetCamera=true;}
    puff(x,y,lost){for(let i=0;i<7;i++)this.particles.push({x,y,vx:(Math.random()-.5)*2.5,vy:-Math.random()*3-1,life:1,lost});if(this.particles.length>90)this.particles.splice(0,this.particles.length-90);}
    event(e){
      if(e.type==='obstacle'&&!e.clean)this.kick=.19;
      if(e.type==='rescue'||e.type==='shield'||e.type==='service'){
        this.ripples.push({x:e.x,y:e.y,life:.42,color:'#92f4d2'});
      }
      const prize=e.type==='ring'||e.type==='gate'||e.type==='pickup';
      const count=e.type==='splash'?6:e.type==='ring'?2:e.type==='rescue'||e.type==='shield'?8:0;
      for(let i=0;i<count;i++)this.particles.push({
        x:e.x,y:e.y,vx:(Math.random()-.5)*4,vy:-1-Math.random()*3,life:.72,
        color:e.type==='splash'?'#84d8e1':prize?'#f4c94d':'#55ddc2'
      });
      if(prize&&e.points)this.floats.push({x:e.x,y:e.y-14,life:.82,text:'+'+e.points});
    }
    celebrate(){for(let i=0;i<54;i++)this.confetti.push({x:Math.random(),y:-Math.random()*.8,vx:(Math.random()-.5)*.1,vy:.15+Math.random()*.2,r:Math.random()*6,life:3,color:['#e87356','#ffd166','#55b9b4','#fff8db'][i%4]});}
    draw(sim,paint,home=false,dt=1/60,reduced=false){
      const c=this.ctx,s=this.scale,W=this.worldW;
      this.time+=dt;
      if(home){this.drawMenu(sim,paint,reduced);return;}
      const truck=sim.truck;
      const offset=truck.plugin.visualOffset;
      const H=this.h/s;
      const forward=reduced?0:Math.max(-20,Math.min(74,truck.velocity.x*9));
      const anchor=this.w>this.h?.31:.41;
      const follow=truck.position.x-W*anchor+forward;
      const desiredY=truck.position.y-H*.66;
      if(this.resetCamera){
        this.camX=follow;
        this.camY=desiredY;
        this.resetCamera=false;
      }
      this.camX+=(follow-this.camX)*(1-Math.exp(-dt*7));
      this.camY+=(desiredY-this.camY)*(1-Math.exp(-dt*3.2));
      c.setTransform(this.dpr*s,0,0,this.dpr*s,0,0);
      const scenery=root.CurierScenery,worldArt=root.CurierWorldArt;
      const theme=scenery.scenery(sim.level);
      scenery.sky(c,W,H,sim.level,this.camX);
      c.save();
      this.kick=Math.max(0,this.kick-dt);
      if(!reduced&&this.kick>0){
        c.translate(Math.sin(this.time*58)*this.kick*20,Math.cos(this.time*49)*this.kick*13);
      }
      for(let i=0;i<5;i++){
        const x=((i*277-this.camX*.06+this.time*1.5)%(W+450)+W+450)%(W+450)-150;
        if(!scenery.scenery(sim.level).night)this.cloud(c,x,85+(i%3)*42,1+(i%2)*.25);
      }
      scenery.horizon(c,W,sim.level,this.camX);
      if(sim.level.city)root.CurierCityArt.backdrop(c,W,sim.level,this.camX,this.camY,reduced?0:sim.elapsed,theme.night);
      else if(theme.zone)scenery.landmarks(c,W,sim.level,this.camX,this.camY,this.tree);
      else this.skyline(c,sim.level,W);
      worldArt.backdrop(c,sim.level,this.camX,this.camY,W,theme,reduced?0:sim.elapsed);
      c.save();
      c.translate(-this.camX,-this.camY);
      scenery.roadside(c,sim.level,this.camX,W,root.CurierData.roadY);
      this.street(c,sim.level,W);
      worldArt.roadDetails(c,sim.level,this.camX,this.camX+W,root.CurierData.roadY);
      scenery.surface(c,sim.level,this.camX,this.camX+W,root.CurierData.roadY);
      worldArt.service(c,sim,this.camX,this.camX+W,root.CurierData.roadY);
      this.cabGate(c,sim);
      root.CurierRouteTrial.draw(c,sim.routeTrial,this.camX,this.camX+W,reduced);
      this.arcadeProps(c,sim);
      this.pilotProps(c,sim);
      root.CurierFun.draw(c,sim,this.time,reduced);
      // Painted delivery bay.
      const goal=sim.level.goal, gy=root.CurierData.roadY(sim.level,goal);
      const bayEnd = goal + (sim.level.rules?.bayEnd ?? 420);
      const bay=c.createLinearGradient(0,gy-104,0,gy);
      bay.addColorStop(0,'#63ebc000');
      bay.addColorStop(1,sim.readyToDeliver?'#63ebc092':'#63ebc044');
      c.fillStyle=bay;
      c.fillRect(goal-75,gy-104,bayEnd-goal+75,104);
      line(c,goal-75,gy+4,bayEnd,gy+4,'#75e4c5',4);
      for(let x=goal-60;x+25<=bayEnd;x+=45)line(c,x,gy+11,x+25,gy+11,'#a5c6aa',5);
      this.delivery(c,Math.min(goal+180,bayEnd-25),gy,sim.readyToDeliver,sim.deliveryHold);
      if(root.CurierCharacters)root.CurierCharacters.drawNPC(c,sim.level.character,goal+310,gy);
      // Wheel shadows and soft contact shadows give the scene weight.
      const roadY=root.CurierData.roadY(sim.level,truck.position.x);
      const altitude=Math.max(0,roadY-truck.position.y-60);
      const shadow=Math.max(.41,1-altitude*.007);
      c.globalAlpha=shadow;
      c.fillStyle='#111e32a6';
      c.beginPath();
      c.ellipse(truck.position.x+10,roadY-4,104*shadow,13*shadow,0,0,Math.PI*2);
      c.fill();
      c.globalAlpha=1;
      this.tireEffects(c,sim,theme,dt,reduced);
      c.save();c.translate(truck.position.x+10,roadY-42);this.lightUnderbody(c,this.customs);c.restore();
      this.wheels(c,sim.wheels,truck.angle);
      if(sim.boosting)this.turboFlame(c,truck,offset,reduced);
      c.save();c.translate(sim.truck.position.x,sim.truck.position.y);c.rotate(sim.truck.angle);c.translate(offset.x,offset.y);this.van(c,paint,sim.vehicle.id,sim.airborne);c.restore();
      this.vehicleLights(c,sim,offset,theme.night||sim.level.id==='vaza');
      for(const item of sim.cargo){if(item.body.position.x<this.camX-100||item.body.position.x>this.camX+W+100)continue;c.save();c.translate(item.body.position.x,item.body.position.y);c.rotate(item.body.angle);c.globalAlpha=item.lost?.52:1;this.cargo(c,item.type,item.config);this.face(c,item.type,item.lost?'lost':sim.airborne?'wow':sim.rescueRemaining>0?'happy':item.health<74?'worried':'normal',item.index);c.restore();}
      if(sim.rescueRemaining>0){
        const tp=sim.truck.position,off=sim.truck.plugin.visualOffset,angle=sim.truck.angle;
        for(const tie of sim.ties){if(tie.cargo.lost)continue;const a={x:tp.x+Math.cos(angle)*(off.x-90)-Math.sin(angle)*(off.y-32),y:tp.y+Math.sin(angle)*(off.x-90)+Math.cos(angle)*(off.y-32)},b={x:tp.x+Math.cos(angle)*(off.x+38)-Math.sin(angle)*(off.y-17),y:tp.y+Math.sin(angle)*(off.x+38)+Math.cos(angle)*(off.y-17)};
          c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(tie.cargo.body.position.x,tie.cargo.body.position.y-28,b.x,b.y);c.strokeStyle='#21b9ac';c.lineWidth=5;c.stroke();c.strokeStyle='#d2fff0';c.lineWidth=1.5;c.stroke();}
      }
      for(const p of this.particles){
        if(!reduced){
          p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vy+=.08*dt*60;
        }
        p.life-=dt*1.5;
        c.globalAlpha=Math.min(1,Math.max(0,p.life))* (p.dust?.64:1);
        const radius=p.dust?2+(1-p.life)*13:p.speck?1.4+p.life*2.4:p.lost?3:2;
        circle(c,p.x,p.y,radius,p.color||(p.lost?'#e87356':'#f3cf78'));
      }
      if(!reduced){
        for(const ripple of this.ripples){
          ripple.life-=dt;
          if(ripple.life<=0)continue;
          const radius=12+(1-ripple.life/.42)*68;
          c.globalAlpha=ripple.life/.48;
          c.strokeStyle=ripple.color;
          c.lineWidth=3;
          c.beginPath();
          c.ellipse(ripple.x,ripple.y,radius,radius*.42,0,0,Math.PI*2);
          c.stroke();
        }
      }else this.ripples.length=0;
      this.ripples=this.ripples.filter(ripple=>ripple.life>0);
      c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
      for(const f of this.floats){f.life-=dt;f.y-=dt*24;c.globalAlpha=Math.min(1,Math.max(0,f.life));c.font='bold 16px Trebuchet MS';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#fff8df';const label=f.text;c.strokeText(label,f.x,f.y);c.fillStyle='#9a5a17';c.fillText(label,f.x,f.y);}c.textAlign='start';c.globalAlpha=1;this.floats=this.floats.filter(f=>f.life>0);
      c.restore();
      c.restore();

      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      for(const p of this.confetti){p.life-=dt;if(!reduced){p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*4;}c.globalAlpha=Math.min(1,Math.max(0,p.life));c.save();c.translate(p.x*this.w,p.y*this.h);c.rotate(p.r);c.fillStyle=p.color;c.fillRect(-3,-5,6,10);c.restore();}c.globalAlpha=1;this.confetti=this.confetti.filter(p=>p.life>0);
    }
    drawCab(run,paint,reduced){
      const c=this.ctx;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      root.CurierCabArt.draw(c,this.w,this.h,run,paint,this.customs,reduced);
    }
    cabGate(c,sim){
      const x=sim.level.cabGate;
      if(!x||x<this.camX-130||x>this.camX+this.worldW+130)return;
      const y=root.CurierData.roadY(sim.level,x);
      const accent=sim.cabEntered?'#a2ada7':'#a1e5d0';
      polygon(c,[[x-115,y-26],[x-58,y-52],[x+108,y-52],[x+56,y-26]],'#7eaaa0','#254459');
      line(c,x-55,y-40,x+37,y-40,accent,3);
      line(c,x+37,y-40,x+49,y-48,accent,3);
      const edge=y-47;
      box(c,x+56,edge-80,7,81,'#3d5266',2);
      box(c,x-60,edge-82,131,35,'#23445b',5,'#142a40');
      circle(c,x-42,edge-65,9,'#23445b',accent);
      line(c,x-49,edge-66,x-35,edge-66,accent,2);
      line(c,x-42,edge-62,x-42,edge-57,accent,2);
      c.font='900 11px Trebuchet MS';c.textAlign='center';c.fillStyle=accent;
      c.fillText(t('DIN CABINĂ'),x+14,edge-61);c.textAlign='start';
    }
    drawMenu(sim,paint,reduced) {
      const c=this.ctx,w=this.w,h=this.h;
      const portrait=h>w;
      const x=w*(portrait?.54:.716);
      const y=h*(portrait?.36:.49);
      const k=Math.min(w*(portrait?.76:.51)/240,h*(portrait?.47:.82)/225,2.95);
      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      const sky=c.createLinearGradient(0,0,w,h*.77);
      sky.addColorStop(0,'#13243d');sky.addColorStop(.51,'#234564');sky.addColorStop(1,'#527d86');
      c.fillStyle=sky;c.fillRect(0,0,w,h);

      c.save();
      c.translate(x,y);
      c.scale(k,k);
      c.rotate(-.15);
      // Broad inks and the original in-game vehicle create the title illustration.
      circle(c,24,-36,101,'#d47469');
      circle(c,24,-36,87,'#f2a66c');
      c.save();
      c.beginPath();c.arc(24,-36,86,0,Math.PI*2);c.clip();
      for(let i=0;i<7;i++){
        c.fillStyle=i%2===0?'#efbb7b':'#df8b6d';
        c.fillRect(-75,6+i*7,207,3+i*.35);
      }
      c.restore();
      c.globalAlpha=.64;
      for(let i=0;i<7;i++){
        const xx=-154+i*32,yy=62+Math.sin(i*2.25)*9;
        box(c,xx,yy-26,26,31,'#23405d',2,null);
        c.fillStyle='#f4ca87';
        c.fillRect(xx+5,yy-17,4,6);
        c.fillRect(xx+13,yy-17,4,6);
        c.fillRect(xx+5,yy-8,4,5);
      }
      c.globalAlpha=1;
      const drift=reduced?0:this.time*28;
      for(let i=0;i<15;i++){
        const dx=((i*23+drift)%125);
        const xx=-57-dx,yy=24+((i*13)%49);
        circle(c,xx,yy,Math.max(2,9-dx*.04),i%3===0?'#f4c77d':'#cd846b');
      }
      line(c,-150,79,132,79,'#e1a480',2);
      line(c,-127,87,59,87,'#f4c77d',2);
      line(c,-159,92,-108,92,'#8c7276',2);
      const bounce=reduced?0:Math.sin(this.time*2)*2.5;
      c.translate(0,bounce);
      this.lightUnderbody(c,this.customs);
      this.wheels(c,[-58,60].map(x=>({position:{x,y:23},angle:drift*.02,circleRadius:sim.vehicle.wheel})));
      this.van(c,paint,sim.vehicle.id,true);
      const slots={1:[[-33,-34]],3:[[-75,-24],[-39,-24],[-56,-59]],4:[[-76,-24],[-39,-24],[-3,-24],[-50,-61]]};
      sim.cargo.forEach((item,index)=>{
        const [px,py]=slots[sim.cargo.length][index];
        c.save();c.translate(px,py);c.rotate(index%2===0?-.11:.13);
        this.cargo(c,item.type,item.config);this.face(c,item.type,'wow',index);c.restore();
      });
      c.restore();
    }
    vehicleLights(c,sim,offset,night){
      const braking=sim.controls.brake||sim.service?.active;
      const reverse=sim.reversing;
      if(!night&&!braking&&!reverse)return;
      c.save();
      c.translate(sim.truck.position.x,sim.truck.position.y);
      c.rotate(sim.truck.angle);
      c.translate(offset.x,offset.y);
      if(night){
        const beam=c.createLinearGradient(102,0,276,0);
        beam.addColorStop(0,'#ffe6a477');
        beam.addColorStop(1,'#ffe6a400');
        c.beginPath();c.moveTo(101,-19);c.lineTo(275,-27);c.lineTo(275,26);c.lineTo(101,-8);c.closePath();
        c.fillStyle=beam;c.fill();
      }
      if(reverse){
        const beam=c.createLinearGradient(-109,0,-204,0);
        beam.addColorStop(0,'#e8f9ffc0');beam.addColorStop(1,'#e8f9ff00');
        polygon(c,[[-105,-11],[-206,-26],[-206,20],[-105,0]],beam,null);
        box(c,-110,-7,7,7,'#f6ffff',2,null);
      }
      if(braking){
        circle(c,-106,-12,7,'#ff988b5c');
        circle(c,-103,-12,3.7,'#ff8d7e');
      }
      c.restore();
    }
    tireEffects(c,sim,theme,dt,reduced){
      if(reduced){this.traces=[];return;}
      const speed=sim.truck.velocity.x,snow=sim.level.city?.zone==='snow';
      const ice=sim.onIce,gravel=sim.onGravel;
      const color=ice?'#dbf5f7':snow?'#eef1e8':gravel?'#d2a07b':theme.shoulder;
      if(sim.grounded&&Math.abs(speed)>1.05&&this.time-this.lastDust>.065){
        this.lastDust=this.time;
        const tire=sim.wheels[speed<0?1:0].position;
        const y=root.CurierData.roadY(sim.level,tire.x);
        if(ice||sim.controls.brake||sim.boosting){
          this.traces.push({x:tire.x,y:y+3,length:7+Math.abs(speed)*4,
            color:ice?'#f2fbff':sim.boosting?'#a8ddff':'#26354c',life:.84});
        }
        if(ice||gravel||snow||sim.boosting||sim.controls.brake){
          for(let i=0;i<(ice||snow||gravel?3:2);i++){
            this.particles.push({x:tire.x+(i-1)*4,y:y-3,vx:-speed*(.16+Math.random()*.21),
              vy:-.7-Math.random()*1.6,life:.28+Math.random()*.28,speck:true,color});
          }
        }
      }
      for(const trace of this.traces){
        trace.life-=dt;
        if(trace.life<=0)continue;
        c.globalAlpha=trace.life*.55;
        line(c,trace.x,trace.y,trace.x-trace.length,trace.y+1,trace.color,1.8);
      }
      c.globalAlpha=1;
      this.traces=this.traces.filter(trace=>trace.life>0);
    }
    turboFlame(c,truck,offset,reduced){
      c.save();
      c.translate(truck.position.x,truck.position.y);
      c.rotate(truck.angle);
      c.translate(offset.x,offset.y);
      const tail=reduced?26:36+Math.sin(this.time*73)*13;
      c.beginPath();
      c.moveTo(-104,-18);
      c.quadraticCurveTo(-122,-23,-110-tail,-6);
      c.quadraticCurveTo(-126,8,-104,4);
      c.fillStyle=gradient(c,-110-tail,-6,-104,-6,'#94a9ff30','#64bdf3');
      c.fill();
      c.beginPath();
      c.moveTo(-106,-14);
      c.lineTo(-111-tail*.62,-6);
      c.lineTo(-106,0);
      c.fillStyle='#b9fbef';
      c.fill();
      if(!reduced)line(c,-116-tail*.55,-3,-125-tail*.8,-3,'#d7f5ff9e',2);
      c.restore();
    }
    pilotProps(c,sim){
      const roadY=root.CurierData.roadY;
      const visible=x=>x>this.camX-40&&x<this.camX+this.worldW+40;
      for(const x of sim.level.jumpSpots||[]){
        if(!visible(x))continue;
        const y=roadY(sim.level,x);
        polygon(c,[[x-17,y-4],[x+7,y-4],[x+17,y-15],[x-7,y-15]],'#302f3c',null);
        line(c,x-8,y-7,x+3,y-12,'#ffcf68',3);
        line(c,x+3,y-12,x+9,y-7,'#ffcf68',3);
      }
      for(const g of sim.level.pilotGates||[]){
        if(sim.gates.has(g.id)||!visible(g.x))continue;
        c.save();
        c.translate(g.x,g.y);
        c.rotate(-.18);
        for(let i=0;i<8;i++){
          c.rotate(Math.PI/4);
          box(c,-3,-17,7,8,'#be7961',1.6,'#543944');
        }
        circle(c,0,0,13,'#b67056','#492f43');
        circle(c,-2,-1,11,'#eba673','#65434e');
        circle(c,-2,-1,5,'#394557','#ffce8c');
        c.restore();
      }
    }
    arcadeProps(c,sim){
      for(const pad of sim.level.pads||[]){
        if(pad.x<this.camX-60||pad.x>this.camX+this.worldW+60)continue;
        const y=root.CurierData.roadY(sim.level,pad.x);
        const color=sim.triggeredPads.has(pad.id)?'#7db3a6':'#f2b865';
        polygon(c,[[pad.x-32,y+4],[pad.x+39,y+4],[pad.x+51,y-13],[pad.x-20,y-13]],color);
        for(let j=0;j<3;j++){
          const x=pad.x-19+j*19;
          line(c,x,y-1,x+10,y-6,ink,2.7);
          line(c,x+10,y-6,x+4,y-9,ink,2.7);
        }
      }
      for(const r of sim.level.rings||[]){
        if(sim.collected.has(r.id)||r.x<this.camX-50||r.x>this.camX+this.worldW+50)continue;
        c.save();
        c.translate(r.x,r.y);
        c.rotate(-.21);
        const width=8+Math.sin(this.time*1.9+r.x)*1.7;
        c.fillStyle='#a56a39';
        c.beginPath();c.ellipse(3,0,width,12,0,0,Math.PI*2);c.fill();
        c.fillStyle=gradient(c,0,-12,0,12,'#fff3b6','#e7a749');
        c.beginPath();c.ellipse(0,0,width,12,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#935a33';c.lineWidth=1.4;c.stroke();
        c.beginPath();c.ellipse(0,0,width-2.6,8.5,0,0,Math.PI*2);c.strokeStyle='#c08647';c.lineWidth=1;c.stroke();
        line(c,-1,-4,-1,4,'#fff4bf',1.7);
        c.restore();
      }
    }
    cloud(c,x,y,k){c.save();c.translate(x,y);c.scale(k,k);c.fillStyle='rgba(255,255,248,.68)';c.beginPath();c.moveTo(-35,12);c.bezierCurveTo(-65,10,-50,-17,-30,-11);c.bezierCurveTo(-30,-40,14,-37,19,-14);c.bezierCurveTo(48,-22,62,14,29,16);c.closePath();c.fill();c.restore();}
    skyline(c,level,W){const seed=level.seed,night=level.id==='cartier'||level.id==='vaza';const step=175;const shift=this.camX*.28;const start=Math.floor((shift-250)/step);c.save();c.translate(0,-this.camY*.25);
      for(let i=start;i<(shift+W+250)/step;i++){const n=((i%100)+100)%100;const r=rng(n*321+seed);const x=i*step-shift;const h=100+r()*130,w=110+r()*55,y=415-h;box(c,x,y,w,h,(night?['#516887','#77758c','#526984','#6a7795']:['#a9c3ad','#d9b59a','#9fb7ba','#dec494'])[n%4],2,'#89a9a8');box(c,x-5,y-7,w+10,9,'#8eaaa8',2,'#829fa1');for(let yy=y+17;yy<395;yy+=30)for(let xx=x+12;xx<x+w-12;xx+=29)box(c,xx,yy,15,19,r()>(night?.55:.87)?'#ffe29f':night?'#354964':'#658591',1,null);}
      c.restore();
      // Closer, low-rise shops and leafy courtyards.
      const scroll=this.camX*.58, base=Math.floor((scroll-400)/480);
      c.save();
      c.translate(0,-this.camY*.42);
      for(let i=base;i<(scroll+W+400)/480;i++){const r=rng(i*997+seed),x=i*480-scroll,y=443;
        if(Math.abs(i%3)===1)this.shop(c,x,y,i);else this.block(c,x,y,r,i);
        this.tree(c,x+280,y, .85+r()*.3);this.bench(c,x+335,y);
      }
      if(night){
        c.globalCompositeOperation='source-atop';
        c.fillStyle='#1c2f6537';
        c.fillRect(0,202,W,243);
      }
      c.restore();
    }
    block(c,x,y,r,i){const w=174,h=168+(Math.abs(i)%3)*29;box(c,x,y-h,w,h,'#eadbc3',3,'#8faaa0');box(c,x-5,y-h-8,w+10,12,'#839f93',2,'#6f9084');
      c.fillStyle='#d4c7ae';c.fillRect(x+55,y-h+6,8,h-6);
      for(let row=0;row<Math.floor((h-24)/35);row++)for(let col=0;col<4;col++){let xx=x+13+col*39,yy=y-h+16+row*35;box(c,xx,yy,24,24,r()>.55?'#83a6a3':'#a8bcb0',1,'#789b94');line(c,xx+12,yy+1,xx+12,yy+23,'#d3ddd2',2);if(col%2===0){box(c,xx-3,yy+19,30,9,'#e3c4aa',1,'#9f9d86');line(c,xx,yy+21,xx+24,yy+21,'#929c86',1);}}
      box(c,x+77,y-37,24,37,'#678d83',2,'#678d83');box(c,x+70,y-43,38,7,'#557e74',1,null);circle(c,x+94,y-16,2,'#e9d9ad');
      if(i%2===0){line(c,x+176,y-h+39,x+247,y-h+48,'#6d8f85',1.3);box(c,x+190,y-h+43,14,17,'#e79e87',1,null);box(c,x+216,y-h+45,15,13,'#f0dfb7',1,null);}
      box(c,x+132,y-16,22,16,'#b88e6a',2,'#937f63');for(let z=0;z<3;z++)circle(c,x+137+z*7,y-19,5,'#6e9e72');
    }
    shop(c,x,y,i){box(c,x,y-109,207,109,'#f0d5b3',5,'#9ca28b');box(c,x-7,y-116,221,15,'#6f9988',3,'#6f9988');box(c,x+14,y-74,93,65,'#9cb9ae',3,'#718f85');box(c,x+124,y-74,60,74,'#79a092',3,'#647e74');line(c,x+151,y-69,x+151,y-1,'#dbe2c6',3);box(c,x+8,y-103,192,28,'#f5edda',2,'#94a28a');c.font='bold 15px Trebuchet MS, sans-serif';c.textAlign='center';c.fillStyle='#527a6c';c.fillText(t(Math.abs(i%2)?'COVRIGI CALZI':'LA COLȚ'),x+103,y-83);for(let j=0;j<6;j++){box(c,x+9+j*32,y-76,32,15,j%2?'#f4e7ca':'#d87e5d',0,null);}for(let j=0;j<3;j++){c.strokeStyle='#c38b4e';c.lineWidth=5;c.beginPath();c.ellipse(x+34+j*25,y-40,7,10,.25,0,Math.PI*2);c.stroke();}c.textAlign='start';}
    tree(c,x,y,k){c.save();c.translate(x,y);c.scale(k,k);box(c,-5,-91,11,91,'#a18d68',4,null);circle(c,0,-115,34,'#8eaf86');circle(c,-25,-99,27,'#8eaf86');circle(c,25,-98,29,'#7f9f76');circle(c,-8,-125,23,'#a1bd90');line(c,0,-27,-19,-69,'#a18d68',5);c.restore();}
    bench(c,x,y){box(c,x,y-31,49,8,'#b88d64',2,null);box(c,x,y-19,49,7,'#b88d64',2,null);line(c,x+6,y-13,x+6,y,'#6a8d80',4);line(c,x+43,y-13,x+43,y,'#6a8d80',4);}
    street(c,level,W){
      const theme=root.CurierScenery.scenery(level);
      const roadY=root.CurierData.roadY;
      const x0=this.camX-100,x1=this.camX+W+100;
      const points=[[x0,roadY(level,x0)],...level.route.filter(p=>p[0]>x0&&p[0]<x1),[x1,roadY(level,x1)]];
      function trace(offset,skew=0){
        c.beginPath();
        points.forEach(([x,y],i)=>i===0?c.moveTo(x+skew,y+offset):c.lineTo(x+skew,y+offset));
      }
      function fillBelow(offset,color,skew=0){
        trace(offset,skew);
        c.lineTo(x1+skew,1300);
        c.lineTo(x0+skew,1300);
        c.closePath();
        c.fillStyle=color;
        c.fill();
      }
      fillBelow(-43,theme.shoulder,22);
      fillBelow(-35,theme.night?'#303950':'#526074',22);
      fillBelow(-9,theme.night?'#2a364c':'#465466',6);
      fillBelow(22,'#28384b');
      fillBelow(31,theme.shoulder);
      fillBelow(57,theme.gravel);
      for(const [height,skew,color,width] of [[-35,22,'#c1c5aaad',2.5],[18,0,'#c1c5aab8',2.6],[23,0,'#213148',2]]){
        trace(height,skew);
        c.strokeStyle=color;
        c.lineWidth=width;
        c.stroke();
      }
      for(let x=Math.floor(x0/137)*137;x<x1;x+=137){
        const y=roadY(level,x);
        line(c,x+10,y-19,x+48,roadY(level,x+38)-19,'#f1d7a692',2.7);
        line(c,x+21,y+45,x+37,y+41,theme.gravel,2);
        line(c,x+70,y+106,x+93,y+100,'#24364e28',3);
      }
      if(this.camX<500){
        const y=roadY(level,74);
        box(c,74,y-114,7,114,'#34495c',2,null);
        box(c,28,y-131,101,32,'#2b4157',6,'#182c47');
        c.fillStyle='#ffdc89';
        c.font='900 14px Trebuchet MS';
        c.textAlign='center';
        c.fillText('START  →',78,y-110);
        c.textAlign='start';
      }
    }
    delivery(c,x,y,ready,hold){
      box(c,x-66,y-119,7,120,'#426678',2);
      box(c,x+64,y-119,7,120,'#426678',2);
      box(c,x-83,y-146,171,49,ink,8);
      box(c,x-78,y-141,161,39,ready?'#92dfc3':'#efddb4',5,null);
      for(let j=0;j<3;j++)for(let i=0;i<3;i++){
        box(c,x-67+i*6,y-132+j*6,6,6,(i+j)%2?'#f9ebc9':ink,0,null);
      }
      c.fillStyle=ink;c.font='900 15px Trebuchet MS';c.textAlign='center';
      c.fillText(t(ready?'DESCARCĂ':'LIVRARE'),x+19,y-125);
      c.font='700 9px Trebuchet MS';c.fillText(t(ready?'MARFĂ LA DESTINAȚIE':'OPREȘTE ÎN ZONĂ'),x+19,y-111);
      c.textAlign='start';
      if(hold>0)box(c,x-77,y-102,160*Math.min(1,hold/.8),4,'#73efcc',1,null);
      box(c,x+75,y-33,42,33,'#c09263',3);
      line(c,x+95,y-31,x+95,y-2,'#edd1a0',7);
      box(c,x+84,y-50,31,17,'#e6c58c',2);
    }
    wheels(c,wheels,angle=0,style=this.customs){
      const dx=27*Math.cos(angle)+24*Math.sin(angle);
      const dy=27*Math.sin(angle)-24*Math.cos(angle);
      for(const wheel of wheels){
        this.wheel(c,wheel,dx,dy,.86,true,style);
      }
      for(const wheel of wheels)this.wheel(c,wheel,0,0,1,false,style);
    }
    wheel(c,w,dx=0,dy=0,scale=1,far=false,style=this.customs){
      const r=w.circleRadius||24;
      c.save();
      c.translate(w.position.x+dx,w.position.y+dy);
      c.scale(.92*scale,scale);
      circle(c,6,-5,r,far?'#253243':'#1f2f41','#152236');
      const rubber=c.createRadialGradient(-r*.35,-r*.47,0,0,0,r);
      rubber.addColorStop(0,'#5b6976');
      rubber.addColorStop(.68,'#384553');
      rubber.addColorStop(1,'#1a2536');
      circle(c,0,0,r,rubber,'#111d30');
      c.rotate(w.angle);
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        line(c,Math.cos(a)*r*.86,Math.sin(a)*r*.86,Math.cos(a+.10)*r*.97,Math.sin(a+.10)*r*.97,'#687983',1.7);
      }
      circle(c,0,0,r*.65,'#202d3d','#66747b');
      circle(c,0,0,r*.46,far?'#899597':style?.rims.color||'#dbbc92','#121f2e');
      const spokes=style?.rims.id==='glacier'||style?.rims.id==='champion'?6:5;
      for(let i=0;i<spokes;i++){
        const a=i*Math.PI*2/spokes;
        if(spokes===6)line(c,Math.cos(a)*r*.21,Math.sin(a)*r*.21,Math.cos(a+.14)*r*.49,Math.sin(a+.14)*r*.49,'#3f5667',2.7);
        else circle(c,Math.cos(a)*r*.32,Math.sin(a)*r*.32,1.8,'#304351');
      }
      circle(c,0,0,r*.16,'#809498','#e0c9a1');
      c.restore();
    }
    van(c,paint,kind='van',flying=false,style=this.customs){
      const fill=paint.color,dark=paint.dark;
      const roof=roofs[kind]||roofs.van;
      const glassBottom=roof+(kind==='carpatin'?39:33);
      const pale=tint(fill,[255,241,200],.47);
      const mid=tint(fill,[21,33,53],.21);
      const shade=tint(fill,[22,33,48],.39);
      const door=gradient(c,0,glassBottom,0,12,fill,shade);
      const chassis=gradient(c,0,-14,0,16,fill,dark);
      const glass=gradient(c,0,roof-9,0,glassBottom,'#91c6cc','#34536b');

      // The near floor and cabin line up with the chassis. The opposite edge is projected up and right.
      polygon(c,[[-103,4],[98,4],[127,-18],[127,-8],[103,15],[-103,15]],'#233346');
      polygon(c,[[-99,-10],[43,-10],[71,-33],[-70,-33]],'#697b79');
      polygon(c,[[-91,-10],[40,-10],[61,-27],[-71,-27]],'#354756',null);
      polygon(c,[[-76,-34],[63,-34],[63,-26],[-76,-26]],mid);
      polygon(c,[[-102,-43],[-75,-64],[-68,-62],[-95,-41]],pale);
      polygon(c,[[-102,-43],[-75,-64],[-75,-33],[-102,-8]],mid);
      polygon(c,[[-102,-43],[-94,-43],[-94,-12],[53,-12],[53,9],[-102,9]],chassis);
      line(c,-92,-11,39,-11,pale,2);
      line(c,-94,5,36,5,'#26354b8f',1.4);
      for(const x of [-83,-22,26])circle(c,x,2,1.3,'#ffdeb6');

      // Cab roof, side door, windshield and grille are distinct faces.
      polygon(c,[[42,roof],[72,roof],[99,roof-23],[70,roof-23]],pale);
      polygon(c,[[42,roof],[72,roof],[84,roof+11],[97,glassBottom],[99,7],[36,7],[36,roof+11]],door);
      polygon(c,[[72,roof],[99,roof-23],[110,roof-12],[124,glassBottom-21],[127,-18],[99,7],[97,glassBottom],[84,roof+11]],mid);
      polygon(c,[[78,roof+1],[99,roof-18],[106,roof-10],[117,glassBottom-19],[96,glassBottom-2],[88,roof+11]],glass);
      polygon(c,[[45,roof+7],[69,roof+7],[83,glassBottom],[45,glassBottom]],glass);
      polygon(c,[[48,roof+9],[54,roof+9],[71,glassBottom-2],[63,glassBottom-2]],'#f3fbdf53',null);
      polygon(c,[[89,roof+9],[101,roof-4],[108,roof-4],[94,roof+16]],'#eaffeb79',null);
      line(c,95,glassBottom-3,116,glassBottom-20,'#21394b',2.6);
      line(c,40,glassBottom+4,89,glassBottom+4,dark,1.5);
      line(c,41,glassBottom+4,40,5,dark,1.5);
      box(c,49,glassBottom+9,12,3,'#27364a',1,null);
      polygon(c,[[96,glassBottom],[122,glassBottom-21],[126,glassBottom-11],[98,glassBottom+11]],pale);
      polygon(c,[[98,glassBottom+11],[126,glassBottom-11],[127,-18],[99,7]],shade);
      polygon(c,[[99,-14],[107,-20],[107,-10],[99,-4]],'#ffdf91');
      polygon(c,[[119,-29],[125,-34],[126,-23],[119,-17]],'#ffebaa');
      line(c,108,-13,118,-21,'#303b46',3);
      line(c,108,-8,118,-16,'#a2ada9',1.2);
      polygon(c,[[98,2],[127,-22],[129,-13],[100,12],[93,12],[93,5]],'#c0c8bd');
      box(c,-110,0,14,9,'#aabad0',2);box(c,-102,-12,7,8,'#e67164',1.4);
      line(c,-101,-10,-97,-10,'#ffb199',1.4);
      box(c,73,glassBottom-1,13,8,shade,2);
      line(c,76,glassBottom+1,83,glassBottom+1,'#b0c5bd',1.4);

      if(style?.trim.id==='rally'){
        polygon(c,[[-90,-9],[-75,-9],[-62,8],[-77,8]],style.trim.color,null);
        polygon(c,[[-72,-9],[-67,-9],[-54,8],[-59,8]],style.trim.color,null);
        box(c,54,glassBottom+15,26,3,style.trim.color,1,null);
      }
      if(style?.trim.id==='bolt'){
        polygon(c,[[19,-9],[-15,0],[-6,1],[-34,8],[-16,8],[21,-2],[10,-3],[33,-9]],style.trim.color,null);
        polygon(c,[[71,glassBottom+10],[65,glassBottom+19],[72,glassBottom+19],[66,glassBottom+26],[83,glassBottom+15],[75,glassBottom+15],[79,glassBottom+10]],style.trim.color,null);
      }
      if(style?.trim.id==='check'){
        for(let row=0;row<2;row++)for(let i=0;i<6;i++){
          if((row+i)%2===0)box(c,-24+i*7,-10+row*7,7,7,style.trim.color,0,null);
        }
      }
      if(style?.trim.id==='wave'){
        c.beginPath();c.moveTo(-92,3);c.bezierCurveTo(-43,-15,-39,13,2,-3);c.quadraticCurveTo(18,-9,32,-5);
        c.strokeStyle=style.trim.color;c.lineWidth=3.5;c.stroke();
      }
      if(style?.trim.id==='ridge'){
        polygon(c,[[-89,7],[-72,-9],[-54,0],[-43,-7],[-24,5],[4,-7],[27,7]],style.trim.color,null);
      }
      const built=this.upgradeLevels||{};
      if(built.gearbox){box(c,44,4,37,9,'#633f4d',2);line(c,49,8,76,8,'#f8be8e',2);}
      if(built.tires){box(c,-90,9,43,5,'#ffd08c',2);box(c,48,9,44,5,'#ffd08c',2);}
      if(built.suspension){
        for(const x of [-58,60]){line(c,x-9,14,x-4,19,'#83d2bf',3);line(c,x-4,19,x+4,14,'#83d2bf',3);line(c,x+4,14,x+10,19,'#83d2bf',3);}
      }
      if(built.straps){box(c,-104,-47,14,8,'#69c5af',3);box(c,24,-15,10,7,'#69c5af',3);}
      if(built.turbo){box(c,-111,-31,10,25,'#edbd59',3);line(c,-106,-28,-106,-35,ink,3);}
      if(built.winter){
        for(const x of [-58,60])line(c,x-20,13,x+20,13,'#bde5ed',2.6);
      }
      if(built.balance){box(c,49,roof-7,31,6,'#f6cb77',2);circle(c,63,roof-11,4,'#6fc5bc',ink);}
      if(this.stickerId&&this.stickerId!=='none')root.CurierFun.drawSticker(c,this.stickerId,-40,-4,.35);
      else{
        box(c,-62,-8,44,13,'#f8edce',3,null);
        c.font='900 8px Trebuchet MS';c.textAlign='center';c.fillStyle=ink;c.fillText(t('CURIER'),-40,1);c.textAlign='start';
      }

      if(kind==='monster'){
        polygon(c,[[40,roof-3],[77,roof-3],[89,roof-13],[52,roof-13]],'#babcaa');
        for(let i=0;i<3;i++)circle(c,49+i*12,roof-9-i*2,4,'#ffdc80',ink);
        box(c,-97,8,27,9,ink,3);box(c,41,8,49,9,ink,3);
      }
      if(kind==='delfin'){
        polygon(c,[[90,1],[102,-7],[131,-30],[136,-23],[127,-11],[104,12],[91,11]],mid);
        line(c,102,1,128,-20,'#c0ddd6',3);
        line(c,45,-6,68,-6,'#94dbcf',3);
        line(c,52,4,78,4,'#263e51',3);
      }
      if(kind==='carpatin'){
        box(c,-97,-51,14,31,'#3d5362',3);
        line(c,-83,-49,-62,-30,'#a5b9af',4);
        line(c,-86,-51,-58,-56,'#a5b9af',4);
        circle(c,-106,-28,14,'#24384b','#172c43');
        circle(c,-107,-28,7,'#617587','#aab9af');
        polygon(c,[[93,1],[128,-28],[134,-26],[132,-14],[99,16],[90,13]],'#455968');
        box(c,40,-12,16,20,'#54676d',2);
        line(c,43,-4,53,-4,'#bcd1be',2);
      }
      if(kind==='vijelie'){
        polygon(c,[[-105,-43],[-79,-52],[-68,-45],[-94,-36]],'#657e93');
        line(c,-95,-40,-91,-21,ink,4);
        polygon(c,[[89,-3],[134,-38],[139,-29],[119,-9],[102,15],[91,14]],shade);
        polygon(c,[[98,-9],[131,-36],[135,-31],[100,-2]],'#ffefb2',null);
        polygon(c,[[47,-18],[69,-10],[88,-15],[67,1]],'#9edcd8',null);
      }
      if(kind==='rocket'){
        polygon(c,[[67,glassBottom+8],[56,-2],[65,-2],[59,7],[78,-8],[69,-8]],'#ffe290',null);
        box(c,-99,-29,8,15,ink,2);
        if(flying)polygon(c,[[-100,-26],[-119-Math.sin(this.time*30)*6,-20],[-100,-14]],'#f5b953',null);
      }
      this.accessories(c,style,roof);
    }
    lightUnderbody(c,style){
      if(!style||style.underglow.id==='stock')return;
      const color=style.underglow.color;
      for(const [rx,ry,alpha] of [[105,13,'25'],[89,8,'3a'],[64,3,'58']]){
        c.beginPath();c.ellipse(9,43,rx,ry,0,0,Math.PI*2);
        c.fillStyle=color+alpha;c.fill();
      }
    }
    accessories(c,style,roof){
      if(!style)return;
      const top=style.roof.id;
      if(top==='bars'||top==='rack'||top==='spots'){
        line(c,44,roof-3,71,roof-25,'#9caeaa',3.4);
        line(c,63,roof-3,90,roof-25,'#9caeaa',3.4);
      }
      if(top==='rack'){
        polygon(c,[[44,roof-21],[72,roof-21],[91,roof-35],[64,roof-35]],'#a4bc9b');
        polygon(c,[[44,roof-21],[72,roof-21],[72,roof-6],[44,roof-6]],'#799a87');
        polygon(c,[[72,roof-21],[91,roof-35],[91,roof-21],[72,roof-6]],'#506f68');
        line(c,56,roof-21,56,roof-7,'#e7ce9d',3);
      }
      if(top==='spots'){
        box(c,44,roof-10,40,8,'#3a5060',2);
        for(let i=0;i<3;i++)circle(c,50+i*12,roof-9,4,style.roof.color,ink);
      }
      if(top==='aero'){
        polygon(c,[[50,roof-6],[53,roof-14],[75,roof-28],[90,roof-24],[75,roof-13]],style.roof.color);
        line(c,54,roof-10,63,roof-11,'#274158',2);
      }
      const bumper=style.bumper;
      if(bumper.id==='matte'||bumper.id==='copper')polygon(c,[[98,2],[127,-22],[129,-13],[100,12],[93,12],[93,5]],bumper.color);
      if(bumper.id==='tow'){
        line(c,-109,5,-115,11,'#354153',4);
        circle(c,-116,12,4,bumper.color,ink);
      }
      if(bumper.id==='guard'){
        line(c,98,5,130,-22,bumper.color,4);
        line(c,100,1,98,-10,bumper.color,4);
        line(c,128,-20,127,-28,bumper.color,4);
        line(c,97,-9,128,-30,bumper.color,3.5);
      }
      const plate=style.plate;
      c.save();c.translate(117,-10);c.rotate(-.65);
      box(c,-10,-3,20,7,1.4,plate.color,ink);
      c.textAlign='center';c.font='bold 5px Trebuchet MS';c.fillStyle=ink;
      c.fillText(plate.detail,0,2);c.restore();
    }
    face(c,type,emotion,index){const y=type==='box'?-1:type==='speaker'?-6:type==='cake'?8:type==='vase'?8:0,spread=type==='cake'?13:7,r=type==='cake'?3:3.5;const blink=emotion==='normal'&&Math.sin(this.time*1.6+index*1.8)>.993;
      for(const x of [-spread,spread]){if(emotion==='lost'){line(c,x-2,y-2,x+2,y+2,ink,1.6);line(c,x+2,y-2,x-2,y+2,ink,1.6);}else if(blink)line(c,x-3,y,x+3,y,ink,2);else{circle(c,x,y,r,'#fff8e2');circle(c,x+1,y,emotion==='wow'?2:1.6,ink);}}
      if(emotion==='worried'){line(c,-spread-3,y-5,-spread+3,y-7,ink,1.8);line(c,spread-3,y-7,spread+3,y-5,ink,1.8);}
      if(emotion==='wow')circle(c,0,y+8,3,ink);else{c.beginPath();c.arc(0,y+5,3,0,Math.PI);c.strokeStyle=ink;c.lineWidth=1.6;c.stroke();}if(emotion==='happy'){circle(c,-spread-4,y+5,2,'#ee927d');circle(c,spread+4,y+5,2,'#ee927d');}
    }
    cargo(c,type,p){
      const crate=cargoFaces[type];
      if(crate){
        const [x,y,w,h,top,side]=crate;
        polygon(c,[[x,y],[x+8,y-6],[x+w+8,y-6],[x+w,y]],top);
        polygon(c,[[x+w,y],[x+w+8,y-6],[x+w+8,y+h-6],[x+w,y+h]],side);
        if(type==='box')polygon(c,[[-4,-16],[4,-22],[12,-22],[4,-16]],'#fff1bf',null);
      }
      if(type==='compass'){
        polygon(c,[[-16,-13],[-8,-19],[24,-19],[16,-13]],'#f2cb90');
        polygon(c,[[16,-13],[24,-19],[24,7],[16,13]],'#937047');
        box(c,-16,-13,32,26,'#bb9761',4);
        circle(c,0,-3,10,'#e9ded0','#5e6d6a');
        polygon(c,[[4,-9],[0,3],[-5,-4]],'#be725d',null);
      }
      if(type==='globe'){
        const glass=c.createRadialGradient(-6,-8,0,0,0,20);
        glass.addColorStop(0,'#cce7df');glass.addColorStop(1,'#568fa6');
        circle(c,0,0,19,glass,ink);
        c.beginPath();c.ellipse(0,0,9,18,-.28,0,Math.PI*2);
        c.strokeStyle='#d2ece0';c.lineWidth=1.55;c.stroke();
        line(c,-16,-6,15,-10,'#e6f2db',1.6);
        box(c,-12,16,24,5,'#8f6c66',2);
      }
      if(type==='sprout'){
        polygon(c,[[-16,-4],[17,-4],[12,17],[-11,17]],gradient(c,-16,0,16,0,'#e19c72','#aa6256'));
        box(c,-17,-7,35,6,'#b97a5c',2);
        line(c,0,-6,1,-24,'#365e54',2.8);
        polygon(c,[[0,-10],[-12,-14],[-16,-25],[-5,-20]],'#87ad73','#416459',1.4);
        polygon(c,[[1,-17],[6,-28],[17,-30],[13,-20]],'#a5c185','#416459',1.4);
      }
      if(type==='lantern'){
        line(c,-7,-16,-5,-23,'#284454',3);line(c,-5,-23,5,-23,'#284454',3);line(c,5,-23,7,-16,'#284454',3);
        box(c,-14,-17,28,34,'#eba36a',5);
        box(c,-10,-11,20,22,'#ffe19b',4,'#b56b55');
        line(c,-11,12,11,12,'#823f46',2);
      }
      if(type==='tools'){
        box(c,-7,-18,14,7,'#ffc675',2);
        box(c,-16,-13,32,29,'#647f9d',4);
        line(c,-15,-4,15,-4,'#dedac7',2);
        box(c,-12,-6,5,7,'#e9b66a',1,null);
        box(c,7,-6,5,7,'#e9b66a',1,null);
      }

      if(type==='pot'){box(c,-16,-12,32,27,gradient(c,-14,0,15,0,'#bcd7c5','#608c90'),5);c.beginPath();c.ellipse(0,-12,20,6,0,0,Math.PI*2);c.fillStyle='#d6e0ce';c.fill();c.strokeStyle=ink;c.lineWidth=1.5;c.stroke();box(c,-4,-20,8,5,'#405e67',2);box(c,-21,-6,5,9,'#405e67',2);box(c,16,-6,5,9,'#405e67',2);line(c,-11,10,11,10,'#548a88',2);}
      if(type==='speaker'){box(c,-16,-16,32,32,'#435766',3);box(c,-12,-12,24,24,'#2d404e',2,null);circle(c,0,6,7,'#677e89',ink);circle(c,0,6,3,'#d6c99b');circle(c,0,-8,4,'#718c96',ink);}
      if(type==='box'){box(c,-16,-16,32,32,'#d6ab72',3);box(c,-4,-15,8,30,'#ead19a',0,null);line(c,-11,-7,-7,-7,'#986f48',2);line(c,8,7,8,-2,ink,1.5);line(c,8,-2,5,1,ink,1.5);}
      if(type==='melon'){const skin=c.createRadialGradient(-7,-10,1,0,0,20);skin.addColorStop(0,'#c1d37f');skin.addColorStop(1,'#48733f');circle(c,0,0,19,skin,ink);c.save();c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.clip();for(let i=-2;i<=2;i++){c.beginPath();c.ellipse(i*9,0,5,24,0,0,Math.PI*2);c.strokeStyle='#527b4a';c.lineWidth=3;c.stroke();}c.restore();circle(c,-6,-8,3,'#a8c27d');}
      if(type==='cake'){box(c,-29,2,58,20,gradient(c,-26,0,30,0,'#f1b8b7','#ac697d'),5);box(c,-29,-15,58,19,gradient(c,-29,0,29,0,'#fff0d0','#d8a598'),5);c.beginPath();c.ellipse(0,-16,28,9,0,0,Math.PI*2);c.fillStyle='#f8bfc4';c.fill();c.strokeStyle=ink;c.lineWidth=1.6;c.stroke();for(let j=0;j<6;j++)circle(c,-21+j*8,-10+(j%2?1:4),4,'#f8e8cd');box(c,-30,20,60,4,'#ccbc96',2);for(let j=-1;j<=1;j++){box(c,j*15-2,-29,4,12,'#6b9f8c',1,null);circle(c,j*15,-32,3,'#e9bd57');}}
      if(type==='vase'){c.beginPath();c.moveTo(-12,-27);c.lineTo(12,-27);c.lineTo(9,-13);c.bezierCurveTo(25,4,19,20,11,27);c.lineTo(-11,27);c.bezierCurveTo(-20,20,-25,4,-9,-13);c.closePath();c.fillStyle=gradient(c,-18,0,19,0,'#c4dfd8','#46808c');c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();line(c,-12,-23,12,-23,'#d8e5d1',3);c.beginPath();c.ellipse(0,6,9,13,0,0,Math.PI*2);c.strokeStyle='#d8e5d1';c.lineWidth=2;c.stroke();}
    }
  }
  root.CurierRenderer={Renderer};
})(globalThis);
