'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const assets=path.join(__dirname,'../app/src/main/assets');
const {Simulation}=require(path.join(assets,'physics.js')),{levels}=require(path.join(assets,'levels.js'));
const Fun=require(path.join(assets,'fun.js')),{Save,sanitize}=require(path.join(assets,'storage.js'));
const {Body}=require(path.join(assets,'vendor/matter.min.js'));
const emptyLevel=()=>({...levels[0],goodies:[],surprises:[],rings:[],pads:[]});
test('bonus groups are sparse and powerups are limited to selected deliveries',()=>{
  const allPowers=levels.flatMap(l=>l.goodies.map(p=>p.kind));
  assert.equal(allPowers.filter(k=>k==='magnet').length,7);
  assert.equal(allPowers.filter(k=>k==='bubble').length,5);
  for(const l of levels){
    assert.equal(l.rings.length,5);
    assert.equal(l.pilotGates.length,1);
    assert.ok(l.goodies.length<=1);
    assert.equal(l.jumpSpots.length,2+l.goodies.length);
    const props=[...l.goodies,...l.rings,...l.pilotGates,...l.surprises];
    assert.equal(props.length,new Set(props.map(p=>p.id)).size);
    for(const p of props){
      assert.ok(p.x>400&&p.x<l.goal);
      assert.ok(Number.isFinite(p.y));
    }
  }
});
test('magnet can reach coins during a manual jump but cannot collect from the road',()=>{
  const s=new Simulation(emptyLevel()),{x,y}=s.truck.position;
  s.level.rings=[{id:'near',x:x+43,y:y-68},{id:'outside',x:x+86,y:y-68}];
  s.fun.magnet=1;
  s.step();
  assert.equal(s.collected.size,0);
  assert.equal(s.jump(),true);
  for(let i=0;i<35;i++)s.step();
  assert.deepEqual([...s.collected],['near']);
  assert.equal(s.events.filter(e=>e.type==='ring').length,1);
  for(let i=0;i<35;i++)s.step();
  assert.equal(s.fun.magnet,0);
  s.dispose();
});
test('bubble physically returns escaping cargo, then breaks without consuming a strap',()=>{const s=new Simulation(emptyLevel());for(let i=0;i<30;i++)s.step();const c=s.cargo[0];Body.setPosition(c.body,{x:s.truck.position.x-145,y:s.truck.position.y-80});Body.setVelocity(c.body,{x:-1.5,y:2});s.fun.bubble=6;for(let i=0;i<150;i++)s.step();assert.equal(c.lost,false);assert.ok(c.health>=55);assert.ok(Math.abs(c.body.position.x-s.truck.position.x)<110);assert.equal(s.fun.stats.saves,1);assert.equal(s.fun.bubble,0);assert.equal(s.rescueCharges,2);s.lose(s.cargo[1]);assert.equal(s.cargo[1].lost,true);s.dispose();});
test('an aerial pickup uses simulation time and cannot be farmed by waiting',()=>{
  const level=emptyLevel(),s=new Simulation(level),{x,y}=s.truck.position;
  level.goodies=[{id:'m',kind:'magnet',x,y:y-47}];
  s.step();
  assert.equal(s.fun.stats.magnets,0);
  assert.equal(s.jump(),true);
  for(let i=0;i<30&&s.fun.magnet===0;i++)s.step();
  assert.equal(s.fun.stats.magnets,1);
  assert.equal(s.fun.magnet,7);
  for(let i=0;i<60;i++)s.step();
  assert.ok(Math.abs(s.fun.magnet-6)<.001);
  assert.equal(s.fun.stats.magnets,1);
  const before=s.fun.magnet;
  s.status='delivered';
  for(let i=0;i<120;i++)s.step();
  assert.equal(s.fun.magnet,before);
  s.dispose();
});
test('comic encounters reward a gentle pass once and never collide with animals',()=>{const l=emptyLevel(),s=new Simulation(l);l.surprises=[{id:'ch',kind:'chickens',x:s.truck.position.x,y:s.truck.position.y+60},{id:'p',kind:'puddle',x:s.truck.position.x,y:s.truck.position.y+60}];s.step();assert.equal(s.fun.stats.polite,1);assert.equal(s.fun.stats.splashes,1);const before=s.bonus;for(let i=0;i<30;i++)s.step();assert.equal(s.bonus,before);assert.equal(s.integrity,1);s.dispose();});
test('horn has a cooldown, rotates and cannot be used after the run ends',()=>{const s=new Simulation(emptyLevel());assert.equal(s.fun.honk(),true);assert.equal(s.fun.honk(),false);assert.equal(s.fun.stats.horns,1);for(let i=0;i<151;i++)s.step();assert.equal(s.fun.honk(),true);assert.equal(s.events.filter(e=>e.type==='horn').at(-1).text,'MAC-MAC!');s.status='failed';assert.equal(s.fun.honk(),false);s.dispose();});
test('career totals, earned stickers and chosen decoration survive reload and reset',()=>{const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},a=new Save(storage);a.recordFun({deliveries:1,rings:30,magnets:1,polite:1,jumps:4});a.recordFun({rings:20,jumps:4,saves:1});a.value.sticker='pepene';a.write();const b=new Save(storage);assert.equal(b.value.career.rings,50);assert.equal(b.value.career.jumps,8);assert.equal(b.value.sticker,'pepene');for(const id of ['sarmaua','magnet','gaina','bula','pepene','racheta'])assert.equal(Fun.unlocked(id,b.value.career,b.value.results),true,id);b.reset();assert.equal(b.value.career.rings,0);assert.equal(b.value.sticker,'none');});
test('legacy saves retain progress and reject corrupt totals or locked stickers',()=>{const r={cutii:{stars:3,time:30}},s=sanitize({version:1,results:r,career:{rings:Infinity,jumps:-10,magnets:'bad'},sticker:'coroana'});assert.equal(s.results.cutii.stars,3);assert.equal(s.career.rings,0);assert.equal(s.career.jumps,0);assert.equal(s.sticker,'none');assert.equal(Fun.unlocked('sarmaua',s.career,s.results),true);assert.equal(Fun.unlocked('covrig',s.career,s.results),true);assert.equal(Fun.unlocked('unknown',s.career,s.results),false);});
