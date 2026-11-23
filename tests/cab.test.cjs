'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Run,courses,payout}=require('../app/src/main/assets/cab-run.js');
const {levels,expressLevel}=require('../app/src/main/assets/levels.js');
const {Save,sanitize}=require('../app/src/main/assets/storage.js');
const Customs=require('../app/src/main/assets/customs.js');

test('every signed entrance has a gold route using ordinary lane changes',()=>{
  for(const [id,course] of Object.entries(courses)){
    const level=levels.find(route=>route.id===id);
    assert.ok(level.cabGate>400&&level.cabGate<level.goal);
    assert.equal(expressLevel(level).cabGate,undefined);
    const run=new Run(course);
    let at=0;
    for(const wave of course.waves){
      const safe=[0,1,-1].find(lane=>!wave.includes(lane));
      while(run.lane!==safe)run.steer(Math.sign(safe-run.lane));
      at+=at?course.gap:3.55;
      while(run.elapsed<at&&!run.finished)run.step(1/60);
    }
    while(!run.finished)run.step(1/60);
    assert.equal(run.medal,3,id);
  }
});
test('three collisions end the trial and steering stops at the road edge',()=>{
  const intact=new Run(courses.tort);
  intact.steer(-1);intact.steer(-1);
  assert.equal(intact.lane,-1);
  for(let i=0;i<35;i++)intact.step(1/60);
  assert.ok(intact.offset<-.9&&intact.offset>=-1);
  const idle=new Run(courses.tort);
  while(!idle.finished)idle.step(1/60);
  assert.equal(idle.hits,3);
  assert.equal(idle.medal,0);
  const ended=idle.elapsed;
  idle.step(1);
  idle.steer(1);
  assert.equal(idle.elapsed,ended);
  assert.equal(idle.lane,0);
});
test('medal rewards are paid once per threshold and unlock real steering upgrades',()=>{
  let stored;
  const storage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
  let save=new Save(storage);
  save.value.workshop.wallet=55;
  assert.equal(save.buyUpgrade('steering'),false);
  assert.equal(save.finishCab('tort',1),payout[1]);
  assert.equal(save.finishCab('tort',1),0);
  assert.equal(save.finishCab('tort',3),payout[3]-payout[1]);
  assert.equal(save.finishCab('tort',2),0);
  assert.equal(save.finishCab('missing',3),0);
  assert.equal(save.finishCab('depou',4),0);
  assert.equal(save.buyUpgrade('steering'),true);
  save=new Save(storage);
  assert.equal(save.value.workshop.wallet,payout[3]);
  assert.equal(save.value.cabRecords.tort,3);
  const stock=new Run(courses.depou), tuned=new Run(courses.depou,save.value.workshop.levels.steering);
  stock.steer(1);tuned.steer(1);
  stock.step(.12);tuned.step(.12);
  assert.ok(tuned.offset>stock.offset);
});
test('appearance is earned, saved per vehicle and sanitized with older saves',()=>{
  let stored;
  const storage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
  const save=new Save(storage);
  assert.equal(save.equip('van','trim','rally'),false);
  assert.equal(save.equip('monster','rims','stock'),false);
  save.record('cutii',3,24);
  save.record('tort',3,26);
  assert.equal(save.equip('van','trim','rally'),true);
  assert.equal(save.equip('monster','rims','steel'),true);
  save.finishCab('tort',1);
  assert.equal(save.equip('van','cab','lake'),true);
  const reopened=new Save(storage);
  assert.equal(Customs.equipped(reopened.value,'van').trim.id,'rally');
  assert.equal(Customs.equipped(reopened.value,'van').rims.id,'stock');
  assert.equal(Customs.equipped(reopened.value,'monster').rims.id,'steel');
  assert.equal(Customs.equipped(reopened.value,'van').cab.id,'lake');
  const old=sanitize({version:1,results:{cutii:{stars:3,time:25}},customs:{van:{trim:'bolt'}},cabRecords:{tort:9}});
  assert.equal(Customs.equipped(old,'van').trim.id,'stock');
  assert.deepEqual(old.cabRecords,{});
  assert.equal(old.results.cutii.stars,3);
});
