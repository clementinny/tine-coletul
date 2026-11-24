'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {levels,expressLevel}=require('../app/src/main/assets/levels.js');
const {Simulation}=require('../app/src/main/assets/physics.js');
const Checkpoint=require('../app/src/main/assets/checkpoint.js');
const {Save}=require('../app/src/main/assets/storage.js');
const Story=require('../app/src/main/assets/story.js');
const step=require('./route-driver.cjs');

test('every delivery has a distinct setup and outcome in both languages',()=>{
  const scenes=levels.map(level=>Story.scene(level.id));
  assert.equal(new Set(scenes.map(scene=>scene.title)).size,21);
  for(const level of levels){
    const ro=Story.scene(level.id,'ro'),en=Story.scene(level.id,'en');
    for(const key of ['title','before','after']){
      assert.ok(ro[key]);
      assert.ok(en[key]);
      assert.notEqual(ro[key],en[key]);
    }
  }
});

test('reverse slows a moving van before backing up and brake takes priority',()=>{
  const sim=new Simulation(levels[0]);
  sim.setControls(true,false);
  for(let i=0;i<95;i++)sim.step();
  assert.ok(sim.truck.velocity.x>2);
  const x=sim.truck.position.x;
  sim.setControls(false,false,false,true);
  sim.step();
  assert.equal(sim.reversing,false);
  for(let i=0;i<155;i++)sim.step();
  assert.ok(sim.truck.position.x<x-70);
  assert.ok(sim.truck.velocity.x<-.8&&sim.truck.velocity.x>-2.4);
  sim.setControls(false,true,false,true);
  for(let i=0;i<40;i++)sim.step();
  assert.ok(Math.abs(sim.truck.velocity.x)<.13);
  sim.dispose();
});

test('checkpoint resumes a passed gate and settles rewards atomically once',()=>{
  let stored;
  const storage={getItem:()=>stored,setItem:(_key,value)=>{stored=value;}};
  let save=new Save(storage);
  save.record('cutii',3,24);
  const level=levels[1],sim=new Simulation(level);
  sim.runId='run-test-checkpoint';sim.contract='careful';
  for(let i=0;i<2100&&sim.truck.position.x<2780;i++)step(sim,3.0);
  assert.equal(sim.routeTrial.passed,1);
  sim.cargo[0].health=85;
  sim.collected.add(level.rings[0].id);sim.bonus+=65;
  const checkpoint=Checkpoint.capture(sim,save.value.workshop);
  assert.ok(checkpoint);
  assert.equal(save.saveCheckpoint(checkpoint),true);
  save=new Save(storage);
  const saved=save.value.checkpoint;
  assert.ok(saved);
  const resumed=new Simulation(level,saved.vehicle,saved.setup);
  Checkpoint.restore(resumed,saved);
  assert.equal(resumed.runId,sim.runId);
  assert.equal(resumed.elapsed,sim.elapsed);
  assert.equal(resumed.truck.position.x,sim.truck.position.x);
  assert.equal(resumed.cargo[0].health,85);
  assert.equal(resumed.collected.size,1);
  assert.equal(resumed.routeTrial.passed,1);
  assert.equal(resumed.engine.world.bodies.includes(resumed.routeTrial.obstacles[0].body),false);
  for(let i=0;i<3200&&resumed.status==='playing';i++){
    step(resumed,3.05);
    if(resumed.readyToDeliver)resumed.deliver();
  }
  assert.equal(resumed.status,'delivered');
  const result=resumed.result();
  assert.ok(save.finishRun(level.id,result,resumed.contract,resumed.runId));
  const reopened=new Save(storage);
  assert.equal(reopened.value.checkpoint,null);
  const wallet=reopened.value.workshop.wallet;
  assert.equal(reopened.finishRun(level.id,result,resumed.contract,resumed.runId),null);
  assert.equal(reopened.value.workshop.wallet,wallet);
  sim.dispose();resumed.dispose();
});

test('unsafe or malformed checkpoint cannot replace a valid save, and short trials keep the campaign draft',()=>{
  let stored;
  const save=new Save({getItem:()=>stored,setItem:(_key,value)=>{stored=value;}});
  save.record('cutii',3,26);
  save.value.language='en';
  const sim=new Simulation(levels[0]);
  sim.runId='run-valid';sim.contract='careful';
  const good=Checkpoint.capture(sim,save.value.workshop);
  assert.ok(good);
  assert.equal(save.saveCheckpoint(good),true);
  assert.equal(save.saveCheckpoint({...good,truck:['broken']}),false);
  assert.equal(sim.useRescue(),true);
  assert.equal(Checkpoint.capture(sim,save.value.workshop),null);
  const express=expressLevel(levels[0]);
  assert.equal(save.finishExpress(express.id,{stars:3,seconds:22,integrity:1},'express-1').medal,3);
  save.read();
  assert.equal(save.value.checkpoint.id,'run-valid');
  assert.equal(save.value.language,'en');
  sim.dispose();
});
