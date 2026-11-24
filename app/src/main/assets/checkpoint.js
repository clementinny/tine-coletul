(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const Data=node?require('./levels.js'):root.CurierData;
  const Workshop=node?require('./workshop.js'):root.CurierWorkshop;
  const Fun=node?require('./fun.js'):root.CurierFun;
  const {Body,Composite,Engine}=node?require('./vendor/matter.min.js'):root.Matter;
  const bounded=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  const clamp=(value,min,max)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):min;
  const bodyParts=['x','y','angle','vx','vy','spin'];
  const scalars={
    elapsed:[0,1800],steps:[0,108000],energy:[0,2],turboSeconds:[0,1800],manualJumps:[0,600],
    jumpCooldown:[0,2],bonus:[0,1000000],bestAir:[0,40],jumps:[0,600],combo:[0,600],
    rescueCharges:[0,3],deliveryHold:[0,1],overturned:[0,2.3]
  };
  const timers={magnet:8,bubble:8,horn:1,hornCooldown:3};
  const pose=body=>[body.position.x,body.position.y,Math.atan2(Math.sin(body.angle),Math.cos(body.angle)),body.velocity.x,body.velocity.y,body.angularVelocity];
  const bodyOk=(body,goal)=>Array.isArray(body)&&body.length===bodyParts.length&&
    bounded(body[0],-90,goal+650)&&bounded(body[1],70,790)&&bounded(body[2],-150,150)&&
    bounded(body[3],-24,24)&&bounded(body[4],-24,24)&&bounded(body[5],-4,4);
  function filter(ids,items){
    if(!Array.isArray(ids))return [];
    return (items||[]).map(item=>item.id).filter(id=>ids.includes(id));
  }
  function safe(sim){
    return sim.status==='playing'&&sim.grounded&&!sim.airborne&&Math.abs(sim.truck.angle)<.53&&
      !sim.service?.active&&sim.rescueRemaining<=0&&sim.cargo.some(item=>!item.lost)&&
      sim.cargo.every(item=>item.lost||
        (Math.abs(item.body.position.x-sim.truck.position.x)<145&&
         Math.abs(item.body.position.y-sim.truck.position.y)<130&&
         Math.hypot(item.body.velocity.x-sim.truck.velocity.x,item.body.velocity.y-sim.truck.velocity.y)<3.8));
  }
  function capture(sim,setup,force=false){
    if(!force&&!safe(sim))return null;
    return {
      version:1,id:sim.runId,level:sim.level.id,vehicle:sim.vehicle.id,
      setup:Workshop.clean(setup),contract:sim.contract,truck:pose(sim.truck),wheels:sim.wheels.map(pose),
      cargo:sim.cargo.map(item=>({body:item.lost?null:pose(item.body),lost:item.lost,health:item.health,
        protectedUntil:item.protectedUntil||0,groundTicks:item.groundTicks||0})),
      fields:Object.fromEntries(Object.keys(scalars).map(key=>[key,sim[key]])),
      rings:[...sim.collected],gates:[...sim.gates],pads:[...sim.triggeredPads],
      cabEntered:Boolean(sim.cabEntered),serviceUsed:Boolean(sim.service?.used),
      obstacles:sim.routeTrial.obstacles.map(o=>o.done?(o.clean?1:2):0),
      fun:{collected:[...sim.fun.collected],visited:[...sim.fun.visited],stats:{...sim.fun.stats},
        ...Object.fromEntries(Object.keys(timers).map(key=>[key,sim.fun[key]]))}
    };
  }
  function clean(raw,results){
    if(!raw||raw.version!==1||typeof raw.id!=='string'||!/^run-[a-z0-9-]{1,64}$/.test(raw.id))return null;
    const i=Data.levels.findIndex(level=>level.id===raw.level);
    if(i<0||(i>0&&!results[Data.levels[i-1].id]))return null;
    const level=Data.levels[i],stars=Object.values(results).reduce((sum,item)=>sum+item.stars,0);
    if(!Data.vehicles.some(vehicle=>vehicle.id===raw.vehicle&&vehicle.stars<=stars))return null;
    if(!bodyOk(raw.truck,level.goal)||!Array.isArray(raw.wheels)||raw.wheels.length!==2||
       !raw.wheels.every(w=>bodyOk(w,level.goal)&&Math.abs(w[0]-raw.truck[0])<110&&Math.abs(w[1]-raw.truck[1])<110))return null;
    if(!Array.isArray(raw.cargo)||raw.cargo.length!==level.cargo.length||
       !raw.cargo.every(item=>item&&(item.lost===true||(bodyOk(item.body,level.goal)&&
         Math.abs(item.body[0]-raw.truck[0])<155&&Math.abs(item.body[1]-raw.truck[1])<145&&bounded(item.health,1,100))))||
       raw.cargo.every(item=>item.lost===true))return null;
    if(!Array.isArray(raw.obstacles)||raw.obstacles.length!==level.obstacles.length||
       !raw.obstacles.every(value=>value===0||value===1||value===2))return null;
    if(!bounded(raw.fields?.elapsed,0,level.rules.deadline||1800))return null;
    return {
      version:1,id:raw.id,level:level.id,vehicle:raw.vehicle,
      setup:Workshop.clean({...raw.setup,wallet:0}),contract:Workshop.contracts.some(item=>item.id===raw.contract)?raw.contract:'sprint',
      truck:raw.truck,wheels:raw.wheels,
      cargo:raw.cargo.map(item=>({
        body:item.lost===true?null:item.body,lost:item.lost===true,health:item.lost===true?0:item.health,
        protectedUntil:clamp(item.protectedUntil,0,1802),groundTicks:clamp(item.groundTicks,0,200)
      })),
      fields:Object.fromEntries(Object.entries(scalars).map(([key,[min,max]])=>[key,clamp(raw.fields[key],min,max)])),
      rings:filter(raw.rings,level.rings),gates:filter(raw.gates,level.pilotGates),pads:filter(raw.pads,level.pads),
      cabEntered:raw.cabEntered===true,serviceUsed:raw.serviceUsed===true,obstacles:[...raw.obstacles],
      fun:{collected:filter(raw.fun?.collected,level.goodies),visited:filter(raw.fun?.visited,level.surprises),
        stats:Fun.cleanCareer(raw.fun?.stats),
        ...Object.fromEntries(Object.entries(timers).map(([key,max])=>[key,clamp(raw.fun?.[key],0,max)]))}
    };
  }
  function apply(body,[x,y,angle,vx,vy,spin]){
    Body.setPosition(body,{x,y});
    Body.setAngle(body,angle);
    Body.setVelocity(body,{x:vx,y:vy});
    Body.setAngularVelocity(body,spin);
  }
  function restore(sim,saved){
    apply(sim.truck,saved.truck);
    sim.wheels.forEach((wheel,i)=>apply(wheel,saved.wheels[i]));
    sim.cargo.forEach((item,i)=>{
      const {body,lost,health,protectedUntil,groundTicks}=saved.cargo[i];
      Object.assign(item,{lost,health,protectedUntil,groundTicks});
      if(lost)Composite.remove(sim.engine.world,item.body);
      else apply(item.body,body);
    });
    const trial=sim.routeTrial;
    saved.obstacles.forEach((state,i)=>{
      const obstacle=trial.obstacles[i];
      if(state===0)return;
      obstacle.done=true;
      obstacle.clean=state===1;
      if(obstacle.body)Composite.remove(sim.engine.world,obstacle.body);
      if(obstacle.clean){trial.passed++;trial.cleanStreak++;}
      else{trial.errors++;trial.cleanStreak=0;}
    });
    Object.assign(sim,saved.fields,{
      runId:saved.id,contract:saved.contract,cabEntered:saved.cabEntered,
      collected:new Set(saved.rings),gates:new Set(saved.gates),triggeredPads:new Set(saved.pads)
    });
    Object.assign(sim.fun,saved.fun,{collected:new Set(saved.fun.collected),visited:new Set(saved.fun.visited)});
    if(sim.service)sim.service.used=saved.serviceUsed;
    Engine.clear(sim.engine);
  }
  const api={capture,clean,restore};
  if(node)module.exports=api;
  else root.CurierCheckpoint=api;
})(globalThis);
