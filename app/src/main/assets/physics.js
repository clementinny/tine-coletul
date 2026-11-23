(function (root) {
  'use strict';
  const M = typeof module !== 'undefined' && module.exports ? require('./vendor/matter.min.js') : root.Matter;
  const Data = typeof module !== 'undefined' && module.exports ? require('./levels.js') : root.CurierData;
  const Fun = typeof module !== 'undefined' && module.exports ? require('./fun.js') : root.CurierFun;
  const Workshop = typeof module !== 'undefined' && module.exports ? require('./workshop.js') : root.CurierWorkshop;
  const Trial = typeof module !== 'undefined' && module.exports ? require('./route-trial.js') : root.CurierRouteTrial;
  const { Engine, Bodies, Body, Composite, Constraint, Events, Vertices }=M;
  const STEP=1000/60;
  const SERVICE_TICKS=72;
  const cargoTypes={
    box:{w:32,h:32,density:.0016,threshold:6.5,damage:2,color:'#d1a05e'},
    pot:{w:32,h:32,density:.0016,threshold:6.5,damage:2,color:'#91b9b2'},
    speaker:{w:32,h:32,density:.0016,threshold:6.5,damage:2,color:'#465866'},
    cake:{w:58,h:48,density:.0013,threshold:4.0,damage:5,color:'#efa0ac'},
    melon:{r:19,density:.0014,threshold:5.5,damage:3,color:'#7ca35b'},
    lantern:{w:32,h:34,density:.0014,threshold:6.1,damage:3},
    tools:{w:32,h:32,density:.0018,threshold:7.1,damage:2},
    compass:{w:32,h:27,density:.0019,threshold:7.1,damage:2},
    globe:{r:19,density:.0015,threshold:5.9,damage:4},
    sprout:{w:33,h:35,density:.0014,threshold:6.4,damage:3},
    vase:{w:34,h:54,density:.0011,threshold:5.8,damage:6,color:'#85b6c3'}
  };
  class Simulation {
    constructor(level,vehicleId='van',setup) {
      this.level=level; this.engine=Engine.create({positionIterations:8,velocityIterations:8,constraintIterations:4});
      this.tuning=Workshop.params(setup);this.energy=this.tuning.turboCapacity;this.boosting=false;this.turboSeconds=0;this.manualJumps=0;this.prizeJumpAt=-Infinity;this.jumpCooldown=0;this.gates=new Set();this.readyToDeliver=false;
      this.service=level.serviceBay?{x:level.serviceBay,ticks:0,active:false,used:false}:null;
      this.vehicle=Data.vehicles.find(v=>v.id===vehicleId)||Data.vehicles[0];
      this.engine.gravity.y=1; this.engine.gravity.scale=.001;
      this.elapsed=0; this.steps=0; this.status='playing'; this.deliveryHold=0; this.overturned=0; this.impacts=[];
      this.controls={gas:false,brake:false,turbo:false}; this.cargo=[]; this.ground=[];
      this.events=[];this.collected=new Set();this.triggeredPads=new Set();this.bonus=0;this.airborne=false;this.airTime=0;this.bestAir=0;this.jumps=0;this.combo=0;
      this.initialRescueCharges=this.tuning.rescueCharges;this.rescueCharges=this.initialRescueCharges;this.rescueRemaining=0;this.ties=[];this.lastLand=0;
      this.buildGround(); this.buildVehicle(); this.buildCargo();
      Events.on(this.engine,'collisionStart',event=>this.collisions(event));
      // Settle wheels and packages before the timer/controls begin.
      for(let i=0;i<90;i++) Engine.update(this.engine,STEP);
      this.impacts=[];
      this.fun=new Fun.Run(this);
      this.routeTrial=new Trial.RouteTrial(this);
    }
    buildGround() {
      const r=[[-1000,this.level.route[0][1]],...this.level.route,[this.level.route.at(-1)[0]+1200,this.level.route.at(-1)[1]]];
      for(let i=1;i<r.length;i++) {
        const a=r[i-1],b=r[i],vertices=[{x:a[0],y:a[1]},{x:b[0],y:b[1]},{x:b[0],y:1100},{x:a[0],y:1100}];
        const center=Vertices.centre(vertices);
        const body=Bodies.fromVertices(center.x,center.y,[vertices],{isStatic:true,friction:1.2,frictionStatic:2,label:'road'},false);
        this.ground.push(body);
      }
      // Invisible end boundaries are beyond the start and delivery bay.
      this.ground.push(Bodies.rectangle(-420,300,40,800,{isStatic:true,label:'boundary'}));
      this.ground.push(Bodies.rectangle(this.level.route.at(-1)[0]+400,300,40,800,{isStatic:true,label:'boundary'}));
      Composite.add(this.engine.world,this.ground);
    }
    buildVehicle() {
      const x=260, y=Data.roadY(this.level,x)-48, group=Body.nextGroup(true);
      const filter={group};
      const parts=[
        Bodies.rectangle(x-10,y,174,16,{collisionFilter:filter}),
        Bodies.rectangle(x+64,y-this.vehicle.roof/2+1,48,this.vehicle.roof,{collisionFilter:filter}),
        Bodies.rectangle(x-94,y-19,8,46,{collisionFilter:filter})
      ];
      this.truck=Body.create({parts,collisionFilter:filter,density:this.vehicle.density,friction:this.vehicle.grip,frictionStatic:1.2,frictionAir:.006,label:'truck'});
      this.truck.plugin.visualOffset={x:x-this.truck.position.x,y:y-this.truck.position.y};
      this.wheels=[-58,60].map(dx=>Bodies.circle(x+dx,y+23,this.vehicle.wheel,{collisionFilter:filter,density:.003,friction:1.5,frictionStatic:3,restitution:0,frictionAir:.004,label:'wheel'}));
      const axles=this.wheels.map(w=>Constraint.create({bodyA:this.truck,bodyB:w,pointA:{x:w.position.x-this.truck.position.x,y:w.position.y-this.truck.position.y},length:0,stiffness:.95,damping:.15}));
      Composite.add(this.engine.world,[this.truck,...this.wheels,...axles]);
    }
    buildCargo() {
      const points={1:[[-35,-40]],3:[[-70,-25],[-28,-25],[-49,-65]],4:[[-70,-28],[-30,-28],[10,-28],[-30,-67]]};
      const origins=points[this.level.cargo.length];
      let bed=-92;
      this.level.cargo.forEach((type,index)=>{
        const config=cargoTypes[type];
        let p=origins[index];
        if(this.level.lowStack&&this.level.cargo.length===3){
          const width=config.w??config.r*2;
          const height=config.h??config.r*2;
          p=[bed+width/2,-height/2-12];
          bed+=width+2;
        }
        const x=260+p[0],y=Data.roadY(this.level,260)-48+p[1];
        const opts={density:config.density,friction:.65,frictionStatic:.9,restitution:.04,frictionAir:.008,label:'cargo'};
        const body=config.r?Bodies.circle(x,y,config.r,opts):Bodies.rectangle(x,y,config.w,config.h,{...opts,chamfer:{radius:3}});
        const cargo={type,body,health:100,lost:false,index,config,groundTicks:0,anchor:{x:x-this.truck.position.x,y:y-this.truck.position.y}}; body.plugin.cargo=cargo;
        this.cargo.push(cargo); Composite.add(this.engine.world,body);
      });
    }
    collisions(event) {
      if(this.steps<20||this.status!=='playing') return;
      for(const pair of event.pairs) for(const [a,b] of [[pair.bodyA,pair.bodyB],[pair.bodyB,pair.bodyA]]) {
        const c=a.plugin.cargo||a.parent?.plugin.cargo;
        if(!c||c.lost) continue;
        const relative=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);
        if(b.label==='road'||b.parent?.label==='road') this.lose(c);
        else if(relative>c.config.threshold && !(this.fun?.bubble>0) && !(c.protectedUntil>this.elapsed)) {
          c.health=Math.max(0,c.health-Math.max(0,relative-c.config.threshold-this.tuning.impactBonus)*c.config.damage*this.tuning.damageFactor);
          this.impacts.push({x:a.position.x,y:a.position.y,force:relative});
          if(c.health<=0) this.lose(c);
        }
      }
    }
    lose(c) {
      if(c.lost) return;
      if(c.protectedUntil>this.elapsed)return;
      if(this.fun?.protect(c))return;
      c.lost=true; c.health=0;
      this.ties=this.ties.filter(tie=>{if(tie.cargo!==c)return true;Composite.remove(this.engine.world,tie.constraint);return false;});
      this.impacts.push({x:c.body.position.x,y:c.body.position.y,force:9,lost:true});
      this.combo=0;this.events.push({type:'lost',text:c.type==='melon'?'PEPENE FUGAR!':'COLET PE CONT PROPRIU!',x:c.body.position.x,y:c.body.position.y});
    }
    useRescue(){
      if(this.status!=='playing'||this.rescueCharges<=0||this.rescueRemaining>0)return false;
      const nearby=this.cargo.filter(c=>!c.lost&&Math.abs(c.body.position.x-this.truck.position.x)<190&&Math.abs(c.body.position.y-this.truck.position.y)<190);
      if(!nearby.length)return false;
      this.rescueCharges--;this.rescueRemaining=this.tuning.rescueDuration;
      for(const c of nearby){const tether=Constraint.create({bodyA:this.truck,pointA:M.Vector.rotate(c.anchor,this.truck.angle),bodyB:c.body,length:10,stiffness:.035,damping:.16});this.ties.push({constraint:tether,cargo:c});Composite.add(this.engine.world,tether);}
      this.events.push({type:'rescue',text:'ȚINE COLETUL!',x:this.truck.position.x,y:this.truck.position.y-90});return true;
    }
    clearTies(){for(const tie of this.ties)Composite.remove(this.engine.world,tie.constraint);this.ties=[];this.rescueRemaining=0;}
    get grounded(){return this.wheels.some(w=>w.position.y+this.vehicle.wheel>=Data.roadY(this.level,w.position.x)-6);}
    jump(){if(this.status!=='playing'||this.jumpCooldown>0||!this.grounded||Math.abs(this.truck.angle)>.8)return false;this.jumpCooldown=1.5;this.manualJumps++;this.prizeJumpAt=this.elapsed;const group=[this.truck,...this.wheels,...this.cargo.filter(c=>!c.lost&&Math.abs(c.body.position.x-this.truck.position.x)<170).map(c=>c.body)];for(const b of group)Body.setVelocity(b,{x:b.velocity.x,y:Math.min(b.velocity.y,0)-6.4});this.events.push({type:'hop',text:'HOP LA COMANDĂ!',x:this.truck.position.x,y:this.truck.position.y-90});return true;}
    deliver(){if(this.status!=='playing'||!this.readyToDeliver)return false;this.status='delivered';this.readyToDeliver=false;return true;}
    honk() {
      if (!this.fun.honk()) return false;
      this.routeTrial.honk();
      return true;
    }
    arcadeStep(){
      const t=this.truck;
      const flying=this.wheels.every(w=>w.position.y+this.vehicle.wheel<Data.roadY(this.level,w.position.x)-7);
      const precisionJump=flying&&this.elapsed-this.prizeJumpAt<1;
      this.fun.step(precisionJump);
      if(precisionJump){
        for(const gate of this.level.pilotGates||[]){
          if(this.gates.has(gate.id)||Math.hypot(gate.x-t.position.x,gate.y-t.position.y)>=25)continue;
          this.gates.add(gate.id);
          this.bonus+=100;
          this.events.push({type:'gate',text:'PIESĂ PENTRU ATELIER',points:100,x:gate.x,y:gate.y});
        }
        const radius=this.fun.magnet>0?62:22;
        for(const coin of this.level.rings||[]){
          if(this.collected.has(coin.id)||Math.hypot(coin.x-t.position.x,coin.y-t.position.y)>=radius)continue;
          this.collected.add(coin.id);
          this.bonus+=65;
          this.events.push({type:'ring',points:65,x:coin.x,y:coin.y});
          this.energy=Math.min(this.tuning.turboCapacity,this.energy+.045);
        }
      }
      for(const pad of this.level.pads||[]){
        if(!this.triggeredPads.has(pad.id)&&t.position.x>=pad.x&&t.position.x<pad.x+90&&t.velocity.x>.8&&!this.airborne){
          this.triggeredPads.add(pad.id);
          const group=[t,...this.wheels,...this.cargo.filter(c=>!c.lost&&Math.abs(c.body.position.x-t.position.x)<160).map(c=>c.body)];
          for(const body of group)Body.setVelocity(body,{x:body.velocity.x,y:body.velocity.y-pad.power});
          this.events.push({type:'hop',text:'HOP ȘI-AȘA!',x:pad.x,y:Data.roadY(this.level,pad.x)-40});
        }
      }
      if(flying){this.airTime+=1/60;this.bestAir=Math.max(this.bestAir,this.airTime);}
      else if(this.airborne){
        this.prizeJumpAt=-Infinity;
        if(this.airTime>.16&&Math.abs(Math.atan2(Math.sin(t.angle),Math.cos(t.angle)))<.7&&this.integrity>0){
          this.combo++;this.jumps++;const points=Math.round(this.airTime*120)*Math.min(this.combo,4);this.bonus+=points;this.lastLand=this.elapsed;
          this.events.push({type:'landing',text:this.combo>1?`COMBO ×${Math.min(this.combo,4)}`:'ATERIZARE CU STIL!',points,x:t.position.x,y:t.position.y-95});
        }
        this.airTime=0;
      }
      this.airborne=flying;
      if(this.rescueRemaining>0){this.rescueRemaining=Math.max(0,this.rescueRemaining-1/60);if(this.rescueRemaining===0)this.clearTies();}
    }
    setControls(gas,brake,turbo=false) { this.controls.gas=!!gas; this.controls.brake=!!brake; this.controls.turbo=!!turbo; if(!gas||!turbo)this.boosting=false; }
    get nearService() {
      return this.service&&!this.service.used&&Math.abs(this.truck.position.x-this.service.x)<235;
    }
    get canService() {
      return this.status==='playing'&&this.nearService&&Math.abs(this.truck.position.x-this.service.x)<=112&&
        this.grounded&&!this.controls.gas&&Math.abs(this.truck.velocity.x)<.85;
    }
    startService() {
      if(!this.canService||this.service.active)return false;
      this.service.active=true;
      this.service.ticks=0;
      return true;
    }
    stepService() {
      const stop=this.service;
      if(!stop?.active)return;
      if(!this.canService){
        stop.active=false;
        stop.ticks=0;
        return;
      }
      stop.ticks++;
      if(stop.ticks<SERVICE_TICKS)return;
      stop.active=false;
      stop.used=true;
      for(const item of this.cargo){
        if(!item.lost)item.health=Math.min(100,item.health+16);
      }
      this.energy=Math.min(this.tuning.turboCapacity,this.energy+this.tuning.turboCapacity*.40);
      this.events.push({type:'service',text:'MARFĂ REAMBALATĂ!',x:this.truck.position.x,y:this.truck.position.y-66});
    }
    onSurface(type) {
      const x=this.truck.position.x;
      return Boolean(this.level[type]?.some(([from,to])=>x>=from&&x<to)&&this.grounded);
    }
    get onGravel() { return this.onSurface('gravel'); }
    get onIce() { return this.onSurface('ice'); }
    step() {
      if(this.status!=='playing') return;
      const gas=this.controls.gas&&!this.controls.brake;
      const brake=this.controls.brake||(this.service?.active&&!gas);
      this.jumpCooldown=Math.max(0,this.jumpCooldown-1/60);
      this.boosting=gas&&this.controls.turbo&&this.energy>.01;
      if(this.boosting){this.energy=Math.max(0,this.energy-.18/60);this.turboSeconds+=1/60;}else this.energy=Math.min(this.tuning.turboCapacity,this.energy+this.tuning.turboRegen/60);
      let target=0, motor=.04;
      if(gas) {
        target=this.vehicle.speed*this.tuning.maxSpeed*(this.boosting?1.4:1);
        motor=this.vehicle.motor*this.tuning.revs*(this.boosting?1.5:1);
      }
      if(brake)motor=.35;
      if(this.onIce){
        const grip=this.tuning.iceGrip+(this.vehicle.iceGrip||0);
        target*=Math.min(1,.85+grip*.44);
        motor*=Math.min(1,(brake?.44:.64)+grip);
      }else if(this.onGravel){
        target*=this.tuning.gravelSpeed;
        motor*=brake?this.tuning.gravelBrake:this.tuning.gravelMotor;
      }
      for(const w of this.wheels) {
        if(gas||brake) Body.setAngularVelocity(w,w.angularVelocity+(target-w.angularVelocity)*motor);
      }
      if(!this.grounded){const tilt=(this.controls.gas?1:0)-(this.controls.brake?1:0);const gain=.0015+this.tuning.balance*.00045;Body.setAngularVelocity(this.truck,Math.max(-.045,Math.min(.045,this.truck.angularVelocity*(1-this.tuning.balance*.012)+tilt*gain)));}
      Engine.update(this.engine,STEP);
      this.steps++; this.elapsed+=1/60;
      this.arcadeStep();
      this.routeTrial.step();
      const t=this.truck;
      for(const c of this.cargo) {
        if(c.lost) continue;
        if(c.body.position.y>Data.roadY(this.level,c.body.position.x)+100 || Math.abs(c.body.position.x-t.position.x)>600) this.lose(c);
      }
      const intact=this.cargo.filter(c=>!c.lost);
      const angle=Math.atan2(Math.sin(t.angle),Math.cos(t.angle));
      const { deadline, minIntegrity, bayEnd=420 } = this.level.rules || {};
      if(Math.abs(angle)>1.7) this.overturned+=1/60; else this.overturned=0;
      this.readyToDeliver=false;
      if(!intact.length) { this.status='failed'; this.reason='Marfa a luat-o pe alt drum.'; }
      else if (deadline && this.elapsed >= deadline) {
        this.status='failed'; this.reason='A expirat timpul. Recuperează pe porțiunile drepte.';
      }
      else if (minIntegrity && this.integrity < minIntegrity) {
        this.status='failed'; this.reason=`Marfa a coborât sub ${Math.round(minIntegrity*100)}%. Reîncearcă cu frânare și sărituri.`;
      }
      else if (t.position.x > this.level.goal + bayEnd) {
        this.status='failed'; this.reason='Ai ieșit din zona de livrare. Frânează mai devreme.';
      }
      else if(this.overturned>2.3||t.position.y>1000||t.position.x< -300) { this.status='failed'; this.reason='Dubița are nevoie de o pauză.'; }
      else if(t.position.x>=this.level.goal-75 && Math.abs(t.velocity.x)<1.15 && Math.abs(angle)<.45 && !this.routeTrial.next) {
        this.deliveryHold+=1/60;
        if(this.deliveryHold>=.8) this.readyToDeliver=true;
      } else this.deliveryHold=0;
      if(this.status==='playing')this.stepService();
    }
    get integrity() { return this.cargo.reduce((s,c)=>s+(c.lost?0:c.health),0)/(this.cargo.length*100); }
    get progress() { return Math.max(0,Math.min(1,(this.truck.position.x-260)/(this.level.goal-260))); }
    result() {
      const delivered=this.cargo.filter(c=>!c.lost).length;
      const r={integrity:this.integrity,seconds:this.elapsed,par:this.level.par,delivered,total:this.cargo.length,
        penalty:Boolean(this.level.rules?.deadline && this.routeTrial.errors)};
      return {...r,probes:this.routeTrial.passed,stars:this.status==='delivered'?Data.score(r):0,score:Math.round(this.integrity*1000)+this.bonus,rings:this.collected.size,jumps:this.jumps,bestAir:this.bestAir,rescuesUsed:this.initialRescueCharges-this.rescueCharges,vehicle:this.vehicle.id,fun:this.fun.result(),pilot:{manualJumps:this.manualJumps,turboSeconds:this.turboSeconds,gates:this.gates.size}};
    }
    dispose() { Events.off(this.engine); Composite.clear(this.engine.world,false); Engine.clear(this.engine); }
  }
  const api={Simulation,STEP,SERVICE_TICKS,cargoTypes};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.CurierPhysics=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
