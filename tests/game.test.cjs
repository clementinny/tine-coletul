'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../app/src/main/assets');
const {levels,vehicles,score,roadY,challengeMet}=require(path.join(root,'levels.js'));
const {Simulation}=require(path.join(root,'physics.js'));
const {Save,sanitize}=require(path.join(root,'storage.js'));
const driveStep=require('./route-driver.cjs');
const Matter=require(path.join(root,'vendor/matter.min.js'));
function drive(level,speed,vehicle='van',turbo=false,aims=[]){
  const s=new Simulation(level,vehicle),attempts=new Set();
  for(let i=0;i<7200&&s.status==='playing';i++){
    const x=s.truck.position.x;
    const aim=aims.find(point=>!attempts.has(point)&&x>=point&&x<point+12);
    if(aim!==undefined&&s.jump())attempts.add(aim);
    driveStep(s,speed ?? driveStep.pace(level,vehicle),turbo);
    if(s.readyToDeliver)s.deliver();
  }
  return s;
}
test('all twenty-one authored missions can be delivered by a cautious driver',()=>{
  for(const level of levels){const s=drive(level);assert.equal(s.status,'delivered',level.id);assert.ok(s.result().delivered>=1,level.id);assert.ok(s.elapsed<(level.rules.deadline ?? level.par),level.id);assert.ok(Number.isFinite(s.truck.position.x));s.dispose();}
});
test('first delivery can earn three stars without losing cargo',()=>{const s=drive(levels[0]);assert.equal(s.result().stars,3);assert.equal(s.result().delivered,3);assert.equal(s.integrity,1);s.dispose();});
test('fragile vase rewards cautious control; reckless turbo loses it',()=>{const l=levels.find(l=>l.id==='vaza'),careful=drive(l),reckless=drive({...l,goodies:[]},10,'van',true);assert.equal(careful.result().stars,3);assert.equal(reckless.status,'failed');assert.ok(reckless.integrity<l.rules.minIntegrity);careful.dispose();reckless.dispose();});
test('braking stops inside the bay rather than automatically reversing',()=>{const s=drive(levels[0]);assert.ok(s.truck.position.x>=s.level.goal-75);assert.ok(s.truck.position.x<s.level.goal+420);assert.ok(Math.abs(s.truck.velocity.x)<1.15);s.dispose();});
test('cargo contacting road is lost and all-cargo loss ends the run',()=>{const s=new Simulation(levels.find(l=>l.id==='vaza'));for(let i=0;i<30;i++)s.step();const c=s.cargo[0];Matter.Body.setPosition(c.body,{x:800,y:roadY(s.level,800)-40});for(let i=0;i<90&&s.status==='playing';i++)s.step();assert.equal(c.lost,true);assert.equal(s.status,'failed');assert.equal(s.result().stars,0);s.dispose();});
test('finished simulations cannot continue or award multiple results',()=>{const s=drive(levels[0]),before=s.elapsed,x=s.truck.position.x;for(let i=0;i<120;i++)s.step();assert.equal(s.elapsed,before);assert.equal(s.truck.position.x,x);s.dispose();});
test('score requires intact cargo and target time for three stars',()=>{const r={integrity:1,delivered:3,total:3,seconds:30,par:40};assert.equal(score(r),3);assert.equal(score({...r,seconds:41}),2);assert.equal(score({...r,integrity:.5,delivered:2}),1);assert.equal(score({...r,integrity:0}),0);});
test('save survives reload and preserves best stars and time',()=>{const map=new Map(),store={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const a=new Save(store);a.record('cutii',3,30);a.record('cutii',1,40);const b=new Save(store);assert.deepEqual(b.value.results.cutii,{stars:3,time:30});assert.equal(b.totalStars(),3);assert.equal(b.record('bad-id',9,-2),false);});
test('malformed or unavailable storage never prevents playing',()=>{assert.equal(sanitize({version:100}).paint,'coral');assert.equal(sanitize({version:1,paint:'yellow',results:{cutii:{stars:100,time:1}}}).paint,'coral');const s=new Save({getItem(){throw Error('blocked');},setItem(){throw Error('full');}});assert.equal(s.totalStars(),0);assert.equal(s.record('cutii',2,44),false);assert.equal(s.totalStars(),2);assert.equal(s.available,false);});
test('all shipped HTML dependencies are local and present',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const p=match[1];assert.ok(!/^https?:/.test(p));assert.ok(fs.existsSync(path.join(root,p)),p);}assert.ok(html.includes("connect-src 'none'"));assert.ok(fs.existsSync(path.join(root,'vendor/MATTER-LICENSE.txt')));});
test('all twenty-one missions remain deliverable with each unlocked vehicle',()=>{for(const v of vehicles)for(const l of levels){const s=drive(l,undefined,v.id);assert.equal(s.status,'delivered',`${v.id}/${l.id}`);assert.ok(s.elapsed<(l.rules.deadline ?? l.par));s.dispose();}});
test('rescue pulls an escaping parcel back into the bed',()=>{
  function scenario(use){const s=new Simulation({...levels[0],pads:[],rings:[]});for(let i=0;i<30;i++)s.step();const c=s.cargo[0];Matter.Body.setPosition(c.body,{x:s.truck.position.x-145,y:s.truck.position.y-80});Matter.Body.setVelocity(c.body,{x:-1.5,y:2});if(use)assert.equal(s.useRescue(),true);for(let i=0;i<150;i++)s.step();return {s,c};}
  const a=scenario(false),b=scenario(true);assert.equal(a.c.lost,true);assert.equal(b.c.lost,false);assert.ok(b.c.health>70);assert.ok(Math.abs(b.c.body.position.x-b.s.truck.position.x)<110);assert.equal(b.s.rescueCharges,1);assert.equal(b.s.ties.length,0);a.s.dispose();b.s.dispose();
});
test('rescue is limited, lasts simulation time and cannot be stacked',()=>{const s=new Simulation(levels[0]);assert.equal(s.useRescue(),true);assert.equal(s.useRescue(),false);assert.equal(s.rescueCharges,1);for(let i=0;i<140;i++)s.step();assert.equal(s.rescueRemaining,0);assert.equal(s.ties.length,0);assert.equal(s.useRescue(),true);for(let i=0;i<140;i++)s.step();assert.equal(s.rescueCharges,0);assert.equal(s.useRescue(),false);s.dispose();});
test('a lost parcel is detached from rescue constraints',()=>{const s=new Simulation(levels[0]);s.useRescue();const c=s.cargo[0];s.lose(c);assert.ok(s.ties.every(t=>t.cargo!==c));s.dispose();});
test('ramps produce airtime and landing points without collecting coins',()=>{const s=drive(levels[0]);assert.ok(s.result().jumps>=1);assert.ok(s.bestAir>.16);assert.equal(s.collected.size,0);assert.equal(s.triggeredPads.size,levels[0].pads.length);assert.ok(s.result().score>1000);const n=s.collected.size,scoreBefore=s.result().score;for(let i=0;i<120;i++)s.step();assert.equal(s.collected.size,n);assert.equal(s.result().score,scoreBefore);s.dispose();});
test('vehicles have distinct physical mass, wheel size and top speed',()=>{const sims=vehicles.map(v=>new Simulation(levels[0],v.id));for(const s of sims){s.setControls(true,false);for(let i=0;i<150;i++)s.step();}const [van,monster,rocket]=sims;assert.ok(monster.truck.mass>van.truck.mass);assert.ok(rocket.truck.mass<van.truck.mass);assert.ok(monster.wheels[0].circleRadius>van.wheels[0].circleRadius);assert.ok(rocket.truck.position.x>van.truck.position.x);assert.ok(van.truck.position.x>monster.truck.position.x);sims.forEach(s=>s.dispose());});
test('old saves migrate without losing stars; locked vehicles cannot be selected',()=>{const old={version:1,results:{cutii:{stars:3,time:24}},paint:'mint',sound:false};const clean=sanitize(old);assert.equal(clean.results.cutii.stars,3);assert.equal(clean.sound,false);assert.equal(clean.vehicle,'van');assert.equal(sanitize({...old,vehicle:'monster'}).vehicle,'monster');assert.equal(sanitize({...old,vehicle:'rocket'}).vehicle,'van');});
test('arcade records preserve the best score independently of stars',()=>{const map=new Map(),store={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const a=new Save(store);a.record('cutii',3,30,1500);a.record('cutii',2,40,1250);const b=new Save(store);assert.deepEqual(b.value.results.cutii,{stars:3,time:30,score:1500});});
const Characters=require(path.join(root,'characters.js'));
const {Director}=require(path.join(root,'dialogue.js'));
test('dialogue is caption-only and no previous media is shipped',()=>{
  assert.equal(Characters.cast.length,4);
  assert.equal(Characters.lines.length,56);
  assert.ok(Characters.lines.every(line=>line.text&&!line.file));
  assert.equal(fs.existsSync(path.join(root,'audio')),false);
  assert.equal(fs.existsSync(path.join(root,'raliu-cartier.jpg')),false);
});
test('dialogue cool-down avoids chatter and high-priority rescue can interrupt',()=>{const heard=[],d=new Director(l=>heard.push(l));d.reset('geta');const first=d.say('start',0);assert.ok(first);assert.equal(d.say('hop',.5),null);assert.ok(d.say('rescue',2));assert.equal(d.say('landing',3),null);assert.ok(d.say('landing',8));assert.equal(heard.length,3);});
test('restarting rotates opening lines and finish always receives a reply',()=>{const d=new Director();d.reset('dj');const a=d.say('start',0,true);d.reset('dj');const b=d.say('start',0,true);assert.notEqual(a.id,b.id);assert.ok(d.say('finish',.1,true).id.includes('finish'));});
test('character unlocks follow deliveries and legacy results remain valid',()=>{assert.equal(Characters.cast.filter(c=>Characters.isUnlocked(c.id,{})).length,1);const results={cutii:{stars:1,time:30},tort:{stars:1,time:30},pepeni:{stars:1,time:30}};assert.equal(Characters.cast.filter(c=>Characters.isUnlocked(c.id,results)).length,4);assert.deepEqual(levels.slice(0,6).map(l=>l.id),['cutii','tort','pepeni','piata','vaza','cartier']);});
test('story challenges and the rare bonus can be earned in complete deliveries',()=>{
  for(const level of levels){
    const pace=level.id==='piata'?3.05:level.id==='livada'?4.25:undefined;
    const aims=[];
    if(level.challenge?.kind==='rings')aims.push(level.jumpSpots[1]-10);
    if(level.goodies.length)aims.push(level.jumpSpots[2]);
    const s=drive(level,pace,'van',false,aims),result=s.result();
    assert.equal(challengeMet(level,result),true,level.id);
    assert.equal(challengeMet(level,{...result,stars:0}),false);
    if(level.goodies.length)assert.equal(s.fun.collected.size,1,level.id);
    s.dispose();
  }
});
test('earned stamps and sound preferences survive reload and later weaker attempts',()=>{const map=new Map(),store={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},a=new Save(store);a.value.sound=false;a.record('cutii',3,30,1400,true);a.record('cutii',1,40,1200,false);const b=new Save(store);assert.equal(b.value.sound,false);assert.equal(b.value.results.cutii.challenge,true);assert.equal(b.value.results.cutii.stars,3);});
