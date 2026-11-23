'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {levels,expressLevel,expressMedal}=require('../app/src/main/assets/levels.js');
const {Simulation}=require('../app/src/main/assets/physics.js');
const {Save}=require('../app/src/main/assets/storage.js');
const Workshop=require('../app/src/main/assets/workshop.js');
const driveStep=require('./route-driver.cjs');

test('a campaign win opens Express and its best medal pays only the difference',()=>{
  let stored=null;
  const storage={getItem:()=>stored,setItem:(_,data)=>{stored=data;}};
  let save=new Save(storage);
  const result={stars:2,seconds:39,integrity:.81};
  assert.equal(save.finishExpress('cutii',result,'locked'),null);
  save.record('cutii',2,38,1100);
  assert.equal(save.finishExpress('cutii',{...result,stars:0},'failed').amount,0);
  assert.equal(save.finishExpress('cutii',result,'bronze').amount,30);
  assert.equal(save.finishExpress('cutii',result,'bronze'),null);
  save=new Save(storage);
  const gold=save.finishExpress('cutii',{...result,seconds:23.1,integrity:.97},'gold');
  assert.equal(gold.medal,3);
  assert.equal(gold.amount,85);
  assert.equal(save.finishExpress('cutii',{...result,seconds:35,integrity:.88},'silver').amount,0);
  assert.deepEqual(new Save(storage).value.express.cutii,{medal:3,time:23.1});
  assert.equal(save.value.workshop.wallet,115);
  assert.deepEqual(save.value.results.cutii,{stars:2,time:38,score:1100});
});

test('each new Express route allows a clean medal with the standard garage',()=>{
  for(const level of levels.slice(6)){
    const sim=new Simulation(expressLevel(level));
    while(sim.status==='playing'&&sim.steps<4500){
      driveStep(sim,driveStep.pace(level));
      if(sim.readyToDeliver)sim.deliver();
    }
    assert.equal(sim.status,'delivered',level.id+': '+sim.reason);
    assert.ok(expressMedal(level,sim.result())>=2,level.id+' at '+sim.elapsed+'s');
    sim.dispose();
  }
});

test('gearbox and tires unlock in order then noticeably change driving',()=>{
  const standard=Workshop.defaults();
  standard.wallet=500;
  assert.equal(Workshop.purchase(standard,'gearbox'),null);
  assert.equal(Workshop.purchase(standard,'tires',{tort:{stars:3}}),null);
  let tuned=Workshop.purchase(standard,'gearbox',{tort:{stars:1}});
  const complete={cartier:{stars:1}};
  for(let i=0;i<3;i++)tuned=Workshop.purchase(tuned,'tires',complete);
  const level={...levels[0],gravel:[[0,1500]],obstacles:[],pads:[],goodies:[],surprises:[],rings:[]};
  const stock=new Simulation(level,'van',standard);
  const built=new Simulation(level,'van',tuned);
  for(const sim of [stock,built]){
    sim.setControls(true,false);
    for(let i=0;i<132;i++)sim.step();
    assert.equal(sim.onGravel,true);
  }
  assert.ok(built.truck.position.x>stock.truck.position.x+90);
  assert.ok(built.truck.velocity.x>stock.truck.velocity.x+.75);
  for(const sim of [stock,built])sim.dispose();
});

test('ice increases stopping distance and winter tires recover braking grip',()=>{
  const icy=levels.find(level=>level.id==='gara_faget');
  const level={...levels[0],obstacles:[],rings:[],pads:[],goodies:[],surprises:[]};
  const season=Workshop.upgrades.find(upgrade=>upgrade.id==='winter');
  assert.equal(Workshop.unlocked(season),false);
  assert.equal(Workshop.unlocked(season,{[icy.id]:{stars:1}}),true);
  function stoppingDistance(ice,vehicle,rank){
    const config=Workshop.defaults();
    config.levels.winter=rank;
    const sim=new Simulation({...level,ice:ice?[[0,1550]]:[]},vehicle,config);
    sim.setControls(true,false);
    for(let i=0;i<180&&sim.truck.velocity.x<3;i++)sim.step();
    assert.equal(sim.onIce,ice);
    assert.ok(sim.truck.velocity.x>=3);
    const start=sim.truck.position.x;
    sim.setControls(false,true);
    for(let i=0;i<150&&sim.truck.velocity.x>.1;i++)sim.step();
    const distance=sim.truck.position.x-start;
    sim.dispose();
    return distance;
  }
  const dry=stoppingDistance(false,'van',0);
  const stock=stoppingDistance(true,'van',0);
  const winter=stoppingDistance(true,'van',3);
  const carpatin=stoppingDistance(true,'carpatin',0);
  assert.ok(stock>dry*1.4);
  assert.ok(winter<stock*.8);
  assert.ok(carpatin<stock*.95);
});

test('new loadout items and paints persist per vehicle with the legacy paint as fallback',()=>{
  let stored;
  const storage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
  const save=new Save(storage);
  save.value.paint='mint';
  assert.equal(save.equip('van','roof','rack'),false);
  assert.equal(save.paintVehicle('carpatin','frost'),false);
  levels.slice(0,15).forEach(level=>save.record(level.id,3,31,1100,true));
  assert.equal(save.equip('carpatin','roof','rack'),true);
  assert.equal(save.equip('carpatin','plate','sea'),true);
  assert.equal(save.paintVehicle('carpatin','frost'),true);
  assert.equal(save.paintVehicle('delfin','teal'),true);
  const reopened=new Save(storage);
  assert.equal(reopened.value.customs.carpatin.roof,'rack');
  assert.equal(reopened.value.customs.carpatin.plate,'sea');
  assert.equal(reopened.value.customs.carpatin.paint,'frost');
  assert.equal(reopened.value.customs.delfin.paint,'teal');
  assert.equal(reopened.value.paint,'mint');
  assert.equal(reopened.value.customs.van,undefined);
});
