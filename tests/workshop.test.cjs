'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'../app/src/main/assets');
const W=require(path.join(root,'workshop.js')),{Simulation}=require(path.join(root,'physics.js')),{levels,vehicles}=require(path.join(root,'levels.js')),{Save,sanitize}=require(path.join(root,'storage.js')),{Body}=require(path.join(root,'vendor/matter.min.js'));
const driveStep=require('./route-driver.cjs');
const flat=()=>({...levels[0],pads:[],rings:[],goodies:[],surprises:[],pilotGates:[]});
const maxSetup=()=>({...W.defaults(),levels:Object.fromEntries(W.upgrades.map(u=>[u.id,3]))});
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
function drive(level,vehicle='van',setup,acrobat=false){
  const s=new Simulation(level,vehicle,setup);
  const aims=acrobat?[level.jumpSpots[0]+32,level.jumpSpots[1]+25]:[];
  for(let i=0;i<6000&&s.status==='playing';i++){
    if(aims.length&&s.truck.position.x>=aims[0]&&s.jump())aims.shift();
    driveStep(s,driveStep.pace(level,vehicle,Boolean(setup)));
    if(s.readyToDeliver)s.deliver();
  }
  return s;
}
test('manual jump leaves the road and cannot repeat in midair',()=>{const s=new Simulation(flat()),y=s.truck.position.y;assert.equal(s.jump(),true);assert.equal(s.jump(),false);for(let i=0;i<12;i++)s.step();assert.ok(s.truck.position.y<y-35);assert.equal(s.grounded,false);assert.equal(s.manualJumps,1);assert.equal(s.jump(),false);s.dispose();});
test('left and right input give opposite steering in the air',()=>{const left=new Simulation(flat()),right=new Simulation(flat());left.jump();right.jump();for(let i=0;i<18;i++){left.setControls(false,true);right.setControls(true,false);left.step();right.step();}assert.ok(left.truck.angle<right.truck.angle-.05);left.dispose();right.dispose();});
test('turbo changes speed, spends energy and braking takes priority',()=>{const normal=new Simulation(flat()),fast=new Simulation(flat());normal.setControls(true,false);fast.setControls(true,false,true);for(let i=0;i<120;i++){normal.step();fast.step();}assert.ok(fast.truck.position.x>normal.truck.position.x+20);assert.ok(fast.energy<normal.energy);assert.ok(fast.turboSeconds>1.9);fast.setControls(true,true,true);fast.step();assert.equal(fast.boosting,false);normal.dispose();fast.dispose();});
test('energy regenerates to its capacity and finished runs do not refill',()=>{const s=new Simulation(flat(), 'van',maxSetup());s.energy=.2;for(let i=0;i<1200;i++)s.step();assert.equal(s.energy,s.tuning.turboCapacity);s.energy=.5;s.status='failed';for(let i=0;i<120;i++)s.step();assert.equal(s.energy,.5);s.dispose();});
test('stopping waits for an explicit unload and cannot award delivery early',()=>{const l=levels[0],s=new Simulation(l);assert.equal(s.deliver(),false);for(let i=0;i<5000&&!s.readyToDeliver&&s.status==='playing';i++){const near=s.truck.position.x>l.goal-40,gas=s.truck.velocity.x<2.8;s.setControls(!near&&gas,near||!gas);s.step();}assert.equal(s.readyToDeliver,true);assert.equal(s.status,'playing');assert.equal(s.result().stars,0);assert.equal(s.deliver(),true);assert.equal(s.result().stars,3);assert.equal(s.deliver(),false);const time=s.elapsed;s.step();assert.equal(s.elapsed,time);s.dispose();});
test('a complete delivery can earn the acrobat contract with actual jumping',()=>{const s=drive(levels[0],'van',undefined,true);assert.equal(s.status,'delivered');assert.ok(s.manualJumps>=2);assert.equal(s.gates.size,1);assert.ok(s.collected.size>=3);assert.equal(W.reward(s.result(),'acrobat').contractMet,true);s.dispose();});
test('all routes and vehicles remain deliverable with maximum upgrades',()=>{for(const l of levels)for(const v of vehicles){const s=drive(l,v.id,maxSetup());assert.equal(s.status,'delivered',`${l.id}/${v.id}`);assert.ok(s.elapsed<(l.rules.deadline ?? l.par));s.dispose();}});
test('upgrades reduce damage and extend real strap capacity and duration',()=>{const a=new Simulation(flat()),b=new Simulation(flat(),'van',maxSetup());for(const s of [a,b]){s.steps=30;const c=s.cargo[0];Body.setVelocity(c.body,{x:15,y:0});s.collisions({pairs:[{bodyA:c.body,bodyB:s.truck}]});}assert.ok(b.cargo[0].health>a.cargo[0].health);assert.equal(b.initialRescueCharges,3);assert.equal(b.useRescue(),true);assert.ok(Math.abs(b.rescueRemaining-3.45)<.001);assert.ok(b.tuning.turboCapacity>a.tuning.turboCapacity);a.dispose();b.dispose();});
test('upgrade transactions reject missing funds, invalid items and maxed levels',()=>{const start=W.defaults();assert.equal(W.purchase(start,'turbo'),null);start.wallet=1000;let current=start;for(let i=0;i<3;i++){const price=W.cost(current,'turbo'),before=current.wallet;current=W.purchase(current,'turbo');assert.equal(current.wallet,before-price);}assert.equal(W.purchase(current,'turbo'),null);assert.equal(W.purchase(current,'unknown'),null);assert.equal(start.levels.turbo,0);});
test('legacy delivery credit is granted once and corrupt workshop data is bounded',()=>{const store=storage(),save=new Save(store);save.value.results={cutii:{stars:3,time:30},tort:{stars:2,time:40}};delete save.value.workshop;save.write();const migrated=new Save(store);assert.equal(migrated.value.workshop.wallet,80);assert.equal(migrated.buyUpgrade('suspension'),true);assert.equal(new Save(store).value.workshop.wallet,25);const bad=sanitize({version:1,workshop:{version:1,wallet:-2,levels:{turbo:100},contract:'bad',completed:{sprint:Infinity}}});assert.equal(bad.workshop.wallet,0);assert.equal(bad.workshop.levels.turbo,3);assert.equal(bad.workshop.contract,'sprint');assert.equal(bad.workshop.completed.sprint,0);});
test('terminal run persists stars, career and rewards together exactly once', () => {
  const writes = [];
  const store = { getItem: () => writes.at(-1) || null, setItem: (_, value) => writes.push(value) };
  const save = new Save(store);
  const result = { stars:3, seconds:20, score:1900, rings:8, integrity:1, delivered:3, total:3,
    pilot:{ manualJumps:2, turboSeconds:2, gates:1 }, fun:{ deliveries:1, rings:8 } };
  const earned = save.finishRun('cutii',result,'sprint','run-1',true);
  assert.equal(earned.saved,true);
  assert.equal(earned.contractMet,true);
  assert.equal(save.finishRun('cutii',result,'sprint','run-1',true),null);
  assert.equal(writes.length,1);
  const reopened = new Save(store);
  assert.equal(reopened.value.results.cutii.stars,3);
  assert.equal(reopened.value.results.cutii.challenge,true);
  assert.equal(reopened.value.career.rings,8);
  assert.equal(reopened.value.workshop.completed.sprint,1);
  assert.equal(reopened.value.workshop.wallet,earned.amount);
  const failed = save.finishRun('tort',{ ...result, stars:0 },'sprint','run-2');
  assert.equal(failed.amount,5);
  assert.equal(failed.contractBonus,0);
  assert.equal(new Save(store).value.results.tort,undefined);
});
test('purchased upgrades, selected contracts and completions survive reload and reset',()=>{const store=storage(),save=new Save(store);save.value.workshop.wallet=300;save.buyUpgrade('straps');save.value.workshop.contract='careful';save.finishRun('cutii',{stars:3,seconds:20,rings:0,integrity:1,delivered:3,total:3},'careful','1');const next=new Save(store);assert.equal(next.value.workshop.levels.straps,1);assert.equal(next.value.workshop.contract,'careful');assert.equal(next.value.workshop.completed.careful,1);next.reset();assert.equal(next.value.workshop.wallet,0);assert.equal(next.value.workshop.levels.straps,0);});
