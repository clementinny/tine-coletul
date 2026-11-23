'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {levels,expressLevel}=require('../app/src/main/assets/levels.js');
const {Simulation,SERVICE_TICKS}=require('../app/src/main/assets/physics.js');

function atBay(){
  const early=levels[0];
  return new Simulation({...early,serviceBay:260,pads:[],rings:[],pilotGates:[],goodies:[],surprises:[],obstacles:[]});
}

test('a service stop requires parking and charged actions cancel when departing',()=>{
  const sim=atBay();
  sim.setControls(true,false);
  assert.equal(sim.startService(),false);
  sim.setControls(false,true);
  assert.equal(sim.startService(),true);
  assert.equal(sim.startService(),false);
  for(let i=0;i<17;i++)sim.step();
  assert.ok(sim.service.ticks>0);
  sim.setControls(true,false);
  sim.step();
  assert.equal(sim.service.active,false);
  assert.equal(sim.service.used,false);
  assert.equal(sim.service.ticks,0);
  sim.dispose();
});

test('repacking is a one-time action that tops up remaining cargo and turbo',()=>{
  const sim=atBay();
  sim.cargo[0].health=60;
  sim.cargo[1].health=98;
  sim.lose(sim.cargo[2]);
  sim.energy=.30;
  assert.equal(sim.startService(),true);
  for(let i=0;i<SERVICE_TICKS-1;i++)sim.step();
  assert.equal(sim.cargo[0].health,60);
  assert.equal(sim.service.used,false);
  sim.step();
  assert.equal(sim.cargo[0].health,76);
  assert.equal(sim.cargo[1].health,100);
  assert.equal(sim.cargo[2].lost,true);
  assert.ok(sim.energy>.7&&sim.energy<.85);
  assert.equal(sim.service.used,true);
  assert.equal(sim.startService(),false);
  assert.equal(sim.events.filter(e=>e.type==='service').length,1);
  sim.dispose();

  const race=new Simulation(expressLevel(levels[0]));
  assert.equal(race.service,null);
  assert.equal(race.startService(),false);
  race.dispose();
});
