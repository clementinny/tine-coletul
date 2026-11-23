(function(root){
  'use strict';
  const upgrades=[
    {id:'suspension',name:'Amortizoare',tag:'Mai blând cu marfa',icon:'M9 3h6M12 3v3l-5 3 10 4-10 4 5 3v3M9 23h6',detail:['Loviturile deteriorează marfa mai puțin.','Încă un strat de protecție la lovituri.','Protecție maximă la lovituri.']},
    {id:'straps',name:'Chingi de cursă',tag:'Ține marfa mai mult',icon:'m3 6 9-4 9 4v13l-9 4-9-4zM3 6l9 5 9-5M8 4l9 5v12',detail:['Chinga durează 2,65 secunde.','Primești 3 chingi, de câte 3,05 secunde.','3 chingi, de câte 3,45 secunde.']},
    {id:'turbo',name:'Rezervă turbo',tag:'Mai multă energie',icon:'m14 2-9 12h6l-1 8L21 9h-7z',detail:['Rezerva de turbo crește cu 25%.','Rezerva crește la 150%, se reface mai repede.','Rezervă de 175% și refacere maximă.']},
    {id:'balance',name:'Stabilizator',tag:'Mai precis în aer',icon:'M3 17h18M12 3v14M5 6h14M6 6l-3 7h6zM18 6l-3 7h6z',detail:['Îndrepți mai ușor mașina în aer.','Control mai rapid și mai puțin balans.','Control maxim și stabilizare îmbunătățită.']},
    {id:'gearbox',name:'Cutie sport',tag:'Demaraj și viteză',unlockAfter:'tort',icon:'M6 4v15m6-15v15m6-15v8H6m12 0v7M4 4h4m2 0h4m2 0h4',detail:['Răspuns mai prompt la gaz și viteză maximă +5%.','Demaraj mai bun și +10% viteză maximă.','Viteză maximă +15% și răspuns maxim la gaz.']},
    {id:'tires',name:'Anvelope de teren',tag:'Aderență pe pietriș',unlockAfter:'cartier',icon:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3',detail:['Pierzi mai puțină viteză pe pietriș.','Accelerezi și frânezi mai bine pe teren afânat.','Viteză și frânare aproape de nivelul asfaltului.']},
    {id:'steering',name:'Servodirecție',tag:'Schimbi banda mai repede din cabină',cabMedal:true,icon:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM4 10h16M6 11l4 4v5m8-9-4 4v5',detail:['Schimbi banda mai repede în probele din cabină.','Dubița răspunde și mai prompt la săgeți.','Cel mai rapid răspuns la schimbarea benzii.']},
    {id:'winter',name:'Anvelope de iarnă',tag:'Frânare pe polei',unlockAfter:'gara_faget',icon:'M12 2v20M3.35 7l17.3 10m0-10L3.35 17M8 4l4 4 4-4M8 20l4-4 4 4',detail:['Roțile prind mai bine la plecare și la frânare pe polei.','Mai multă tracțiune pe gheață.','Cea mai scurtă frânare pe porțiunile înghețate.']}
  ];
  const prices=[55,100,170];
  const contracts=[
    {id:'sprint',name:'Sprint de aur',short:'Turbo + monede',description:'Livrează, folosește turbo cel puțin o secundă și prinde 3 monede din aer.',bonus:30,check:r=>r.pilot?.turboSeconds>=1&&r.rings>=3},
    {id:'acrobat',name:'Curier acrobat',short:'Sari după piese',description:'Livrează, fă 2 sărituri la comandă și prinde o piesă din aer.',bonus:35,check:r=>r.pilot?.manualJumps>=2&&r.pilot?.gates>=1},
    {id:'careful',name:'Marfă de nota zece',short:'Livrare cu grijă',description:'Livrează toate obiectele, cu minimum 94% integritate.',bonus:25,check:r=>r.integrity>=.94&&r.delivered===r.total}
  ];
  const clamp=(n,max=1000000)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
  function defaults(){return {version:1,wallet:0,levels:Object.fromEntries(upgrades.map(u=>[u.id,0])),contract:'sprint',completed:Object.fromEntries(contracts.map(c=>[c.id,0]))};}
  function clean(value,results={}){const out=defaults();if(value===undefined||value===null){out.wallet=Object.keys(results).length*40;return out;}if(value.version!==1)return out;out.wallet=clamp(value.wallet);for(const u of upgrades)out.levels[u.id]=clamp(value.levels?.[u.id],3);if(contracts.some(c=>c.id===value.contract))out.contract=value.contract;for(const c of contracts)out.completed[c.id]=clamp(value.completed?.[c.id]);return out;}
  function params(value){const s=clean(value),l=s.levels;return {damageFactor:1-l.suspension*.17,impactBonus:l.suspension*.35,rescueDuration:2.25+l.straps*.4,rescueCharges:2+(l.straps>=2?1:0),turboCapacity:1+l.turbo*.25,turboRegen:.07+l.turbo*.025,balance:l.balance,maxSpeed:1+l.gearbox*.05,revs:1+l.gearbox*.18,gravelSpeed:.69+l.tires*.095,gravelMotor:.70+l.tires*.10,gravelBrake:.60+l.tires*.13,iceGrip:l.winter*.14};}
  function cost(value,id){const u=upgrades.find(u=>u.id===id);return u?(prices[clean(value).levels[id]]??null):null;}
  function unlocked(upgrade,results={},cabRecords={}){return Boolean(upgrade&&(!upgrade.unlockAfter||results[upgrade.unlockAfter])&&(!upgrade.cabMedal||Object.keys(cabRecords).length));}
  function purchase(value,id,results,cabRecords){const s=clean(value),price=cost(s,id);if(price===null||s.wallet<price||!unlocked(upgrades.find(u=>u.id===id),results,cabRecords))return null;s.wallet-=price;s.levels[id]++;return s;}
  function reward(result,contractId){const r=result||{},contract=contracts.find(c=>c.id===contractId)||contracts[0],won=Number.isInteger(r.stars)&&r.stars>0;const rings=clamp(r.rings,100),gates=clamp(r.pilot?.gates,10);const met=won&&contract.check(r);const base=won?30+Math.min(3,r.stars)*5+rings*5:0,parts=gates*(won?12:5),bonus=met?contract.bonus:0;return {amount:base+parts+bonus,base,parts,contractMet:!!met,contract:contract.id,contractBonus:bonus};}
  function icon(path){return `<svg viewBox="0 0 24 26" aria-hidden="true"><path d="${path}"/></svg>`;}
  const api={upgrades,contracts,prices,defaults,clean,params,cost,purchase,unlocked,reward,icon};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CurierWorkshop=api;
})(typeof globalThis!=='undefined'?globalThis:this);
