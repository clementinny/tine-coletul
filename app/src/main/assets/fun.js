(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./vendor/matter.min.js'):root.Matter;
  const careerKeys=['deliveries','rings','jumps','magnets','bubbles','saves','polite','splashes','horns'];
  const stickers=[
    {id:'covrig',name:'Covrig fericit',hint:'Cadou de bun venit',color:'#ffda7d',test:()=>true},
    {id:'sarmaua',name:'Sarmaua turbo',hint:'Termină o livrare',color:'#a5d4b0',test:(c,r)=>c.deliveries>=1||Object.keys(r).length>0},
    {id:'magnet',name:'Magnet de bunătăți',hint:'Prinde un magnet',color:'#d3b4ed',test:c=>c.magnets>=1},
    {id:'gaina',name:'Găina VIP',hint:'Treci încet pe lângă găini',color:'#ffe5a5',test:c=>c.polite>=1},
    {id:'bula',name:'Bula curajoasă',hint:'Salvează un colet cu bula',color:'#b9e8e9',test:c=>c.saves>=1},
    {id:'pepene',name:'Pepene cu ochelari',hint:'Adună 50 de monede în total',color:'#b6daab',test:c=>c.rings>=50},
    {id:'racheta',name:'Curier de pe Marte',hint:'Fă 8 aterizări cu stil',color:'#efbbb0',test:c=>c.jumps>=8},
    {id:'coroana',name:'Regele cartierului',hint:'Câștigă 3 ștampile',color:'#fae39d',test:(c,r)=>Object.values(r).filter(v=>v.challenge).length>=3}
  ];
  function cleanCareer(value){const out={};for(const k of careerKeys)out[k]=Number.isFinite(value?.[k])?Math.max(0,Math.min(1000000,Math.floor(value[k]))):0;return out;}
  function unlocked(id,career,results){if(id==='none')return true;const s=stickers.find(s=>s.id===id);return !!s&&s.test(cleanCareer(career),results||{});}
  // The same original paths are used by the album and by the Canvas vehicle.
  const art={
    covrig:[['M16 20C4 4 43 1 48 18C61 37 41 56 32 41C22 56 3 41 16 20ZM19 22C26 16 38 16 45 23M19 34L40 34','none','#9f6628',8],['M23 10l-2 4M39 11l1 4M11 30l4 1M49 33l-4 1','none','#fff3c7',2]],
    sarmaua:[['M13 25Q8 13 22 13L43 19Q57 24 49 39L43 49Q37 55 25 48L13 39Z','#65a85d','#294c42',2],['M16 22l31 14M15 30l28 14M28 16l-8 31','none','#a6d28a',3],['M2 22l8 2M1 32l8 1M4 42l7-1','none','#ed935c',3]],
    magnet:[['M15 11V36Q15 54 32 54Q49 54 49 36V11H37V35Q37 41 32 41Q27 41 27 35V11Z','#c77ea3','#294c55',2],['M15 11h12v10H15ZM37 11h12v10H37Z','#fff1c3','#294c55',2],['M4 8l6 5M59 7l-5 6M29 3v7','none','#eec258',3]],
    gaina:[['M13 35Q13 18 31 19Q49 18 49 35Q53 52 32 52Q11 52 13 35Z','#fff4d5','#314b52',2],['M24 17Q18 9 25 9Q29 3 33 9Q42 5 39 17','#ef815c','#314b52',2],['M26 33l7-3 7 3-7 6Z','#efa93e','#314b52',1],['M23 51v6m17-6v6M18 58h9m9 0h9','none','#bb7a31',2]],
    bula:[['M12 32a20 20 0 1 0 40 0 20 20 0 1 0-40 0','#b1e7e6','#4a95aa',2],['M19 23q6-9 16-7','none','#fffce9',4],['M5 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M49 52a4 4 0 1 0 8 0 4 4 0 1 0-8 0','#c6f3ea','#73b8c2',1]],
    pepene:[['M9 30a23 23 0 1 0 46 0 23 23 0 1 0-46 0','#72b772','#294e48',2],['M22 10Q13 29 23 50M42 10Q51 29 41 50M32 8v44','none','#3c805d',3],['M13 26h16l-2 10H17ZM35 26h16l-4 10H37Z','#274956','#274956',2],['M28 28h8','none','#274956',3]],
    racheta:[['M20 40L12 54l14-8M36 44l9 11 0-18','#ef9a61','#294c55',2],['M20 42Q16 18 39 7Q51 31 35 47Z','#f9f1d8','#294c55',2],['M29 23a7 7 0 1 0 14 0 7 7 0 1 0-14 0','#7cc9cf','#294c55',2],['M23 48l-3 12 12-9','#ffd364','#dc8a3d',2]],
    coroana:[['M10 19l12 12L32 12l10 19 12-12-5 28H15Z','#ffd266','#9c783e',2],['M15 47h34v8H15Z','#e7a45e','#9c783e',2],['M28 35l4-5 4 5-4 5Z','#73b6b4','#507f83',1]]
  };
  function icon(id){const item=stickers.find(s=>s.id===id)||stickers[0];return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${item.name}"><circle cx="32" cy="32" r="30" fill="${item.color}" stroke="#fff9de" stroke-width="3"/>${art[item.id].map(p=>`<path d="${p[0]}" fill="${p[1]}" stroke="${p[2]}" stroke-width="${p[3]}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}<path d="M26 42q6 6 12 0" fill="none" stroke="#294b50" stroke-width="2" stroke-linecap="round"/></svg>`;}
  function drawSticker(c,id,x,y,scale=1){if(!art[id])return;c.save();c.translate(x-32*scale,y-32*scale);c.scale(scale,scale);const item=stickers.find(s=>s.id===id);c.beginPath();c.arc(32,32,30,0,7);c.fillStyle=item.color;c.fill();c.strokeStyle='#fff9de';c.lineWidth=3;c.stroke();c.lineJoin='round';c.lineCap='round';for(const p of art[id]){const path=new Path2D(p[0]);if(p[1]!=='none'){c.fillStyle=p[1];c.fill(path);}c.strokeStyle=p[2];c.lineWidth=p[3];c.stroke(path);}c.restore();}
  class Run {
    constructor(sim){this.sim=sim;this.magnet=0;this.bubble=0;this.horn=0;this.hornCooldown=0;this.collected=new Set();this.visited=new Set();this.stats=cleanCareer();}
    event(type,text,x,y,points=0){this.sim.events.push({type,text,x,y,points});if(points)this.sim.bonus+=points;}
    step(precisionJump){
      const s=this.sim,t=s.truck;
      for(const k of ['magnet','bubble','horn','hornCooldown'])this[k]=Math.max(0,this[k]-1/60);
      for(const p of s.level.goodies||[])if(precisionJump&&!this.collected.has(p.id)&&Math.hypot(p.x-t.position.x,p.y-t.position.y)<23){
        this.collected.add(p.id);this[p.kind]=p.kind==='magnet'?7:8;this.stats[p.kind==='magnet'?'magnets':'bubbles']++;this.event('pickup',p.kind==='magnet'?'MAGNET PRINS!':'BULĂ SALVATOARE!',p.x,p.y,50);
      }
      for(const z of s.level.surprises||[])if(!this.visited.has(z.id)&&t.position.x>=z.x-35&&t.position.x<z.x+200){
        this.visited.add(z.id);
        if(z.kind==='puddle'){this.stats.splashes++;this.event('splash','',z.x,z.y);}
        if(z.kind==='chickens'){const polite=Math.abs(t.velocity.x)<=3.5;this.stats.polite+=polite?1:0;this.event('chickens','',z.x,z.y-20);}
        if(z.kind==='party')this.event('party','',z.x,z.y-100);
      }
    }
    protect(c){
      if(this.bubble<=0||c.lost)return false;
      this.bubble=0;this.stats.saves++;
      const t=this.sim.truck,a=M.Vector.rotate(c.anchor,t.angle);
      M.Body.setPosition(c.body,{x:t.position.x+a.x,y:t.position.y+a.y-12});M.Body.setAngle(c.body,t.angle);M.Body.setVelocity(c.body,{...t.velocity});M.Body.setAngularVelocity(c.body,0);
      c.health=Math.max(c.health,55);c.protectedUntil=this.sim.elapsed+.35;this.event('shield','POP! COLET SALVAT!',c.body.position.x,c.body.position.y,100);return true;
    }
    honk(){if(this.sim.status!=='playing'||this.hornCooldown>0)return false;this.horn=.9;this.hornCooldown=2.5;this.stats.horns++;this.event('horn',['PAAAP!','MAC-MAC!','PIU-PIU!'][(this.stats.horns-1)%3],this.sim.truck.position.x+80,this.sim.truck.position.y-90);return true;}
    result(){return {...this.stats,deliveries:this.sim.status==='delivered'?1:0,rings:this.sim.collected.size,jumps:this.sim.jumps};}
  }
  function draw(c,sim,time,reduced){
    const t=reduced?0:time,run=sim.fun;if(!run)return;
    const min=sim.truck.position.x-700,max=sim.truck.position.x+1800;
    for(const p of sim.level.goodies||[]){if(run.collected.has(p.id)||p.x<min||p.x>max)continue;const y=p.y+Math.sin(t*3+p.x)*5;c.save();c.translate(p.x,y);c.beginPath();c.arc(0,0,22,0,7);c.fillStyle=p.kind==='magnet'?'#e4c7f1':'#c5f1eb';c.fill();c.strokeStyle='#315765';c.lineWidth=2;c.stroke();drawSticker(c,p.kind==='magnet'?'magnet':'bula',0,0,.59);c.restore();}
    for(const z of sim.level.surprises||[]){if(z.x<min||z.x>max)continue;c.save();c.translate(z.x,z.y);
      if(z.kind==='puddle'){c.fillStyle='#80cbd3';c.beginPath();c.ellipse(0,4,82,10,0,0,7);c.fill();c.strokeStyle='#d7f5ed';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(-40+i*37,3,13+Math.sin(t*2+i)*3,3,0,0,7);c.stroke();}c.fillStyle='#345e68';c.beginPath();c.arc(-8,1,2,0,7);c.arc(8,1,2,0,7);c.fill();}
      if(z.kind==='chickens'){
        const close=Math.abs(sim.truck.position.x-z.x)<230,excited=run.horn>0&&close;
        for(let i=0;i<3;i++){c.save();c.translate(-38+i*35,-8+Math.sin(t*(excited?20:4)+i)*3);c.rotate(Math.sin(t*4+i)*.07);c.strokeStyle='#bb873f';c.lineWidth=2;c.beginPath();c.moveTo(-5,6);c.lineTo(-7,14);c.moveTo(5,6);c.lineTo(7,14);c.stroke();c.fillStyle='#fff2c9';c.strokeStyle='#47636a';c.beginPath();c.ellipse(0,0,13,10,0,0,7);c.fill();c.stroke();c.beginPath();c.arc(9,-10,8,0,7);c.fill();c.stroke();c.fillStyle='#ef7957';c.beginPath();c.arc(7,-18,3,0,7);c.arc(12,-18,3,0,7);c.fill();c.fillStyle='#eab449';c.beginPath();c.moveTo(16,-12);c.lineTo(24,-8);c.lineTo(16,-6);c.fill();c.fillStyle='#2c4a54';c.beginPath();c.arc(11,-11,1.7,0,7);c.fill();c.strokeStyle='#ccb78b';c.beginPath();c.moveTo(-8,-2);c.quadraticCurveTo(-2,excited?-16:8,6,-1);c.stroke();c.restore();}
        c.fillStyle='#315765';c.font='bold 10px Trebuchet MS';c.textAlign='center';c.fillText('CONVOI CU PENE',0,-43);
      }
      if(z.kind==='party'){c.strokeStyle='#658d86';c.lineWidth=3;c.beginPath();c.moveTo(-65,-135);c.quadraticCurveTo(0,-107,70,-135);c.stroke();for(let i=0;i<6;i++){c.fillStyle=['#f3b957','#ea8c77','#7bbdb1'][i%3];c.beginPath();c.moveTo(-60+i*24,-130);c.lineTo(-48+i*24,-109);c.lineTo(-38+i*24,-130);c.fill();}c.font='bold 14px Trebuchet MS';c.textAlign='center';c.fillStyle='#3d666c';c.fillText('HAI LA JOACĂ!',0,-160);}
      c.restore();
    }
    const truck=sim.truck;
    if(run.bubble>0){c.save();c.translate(truck.position.x-20,truck.position.y-32);c.beginPath();c.ellipse(0,0,115,85,0,0,7);c.fillStyle='rgba(149,232,227,.13)';c.fill();c.strokeStyle=run.bubble<1?'#fff3ba':'#8ae0df';c.lineWidth=4;c.stroke();c.beginPath();c.ellipse(-30,-35,46,21,-.5,Math.PI,Math.PI*1.7);c.strokeStyle='#e0fff2';c.lineWidth=6;c.stroke();c.restore();}
    if(run.magnet>0){c.save();c.translate(truck.position.x,truck.position.y);c.setLineDash([5,12]);c.lineDashOffset=-t*30;c.beginPath();c.ellipse(0,0,62,62,0,0,Math.PI*2);c.strokeStyle='#bf88cf9e';c.lineWidth=2;c.stroke();c.restore();}
    if(run.horn>0){c.save();c.translate(truck.position.x+100,truck.position.y-95);c.rotate(-.08);c.fillStyle='#fff4bc';c.strokeStyle='#315765';c.lineWidth=2;c.beginPath();c.roundRect(-48,-17,100,32,10);c.fill();c.stroke();c.font='bold 14px Trebuchet MS';c.fillStyle='#315765';c.textAlign='center';c.fillText(['PAAAP!','MAC-MAC!','PIU-PIU!'][(run.stats.horns-1)%3],0,4);c.restore();}
  }
  const api={Run,draw,stickers,unlocked,cleanCareer,careerKeys,icon,drawSticker};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CurierFun=api;
})(typeof globalThis!=='undefined'?globalThis:this);
