(function (root) {
  'use strict';
  const Characters=typeof module!=='undefined'&&module.exports?require('./characters.js'):root.CurierCharacters;
  const extraRoutes=typeof module!=='undefined'&&module.exports?require('./districts.js'):root.CurierExtraRoutes;
  const expansion=typeof module!=='undefined'&&module.exports?require('./cities.js'):root.CurierCities;
  const chapters=[{id:'cartier',name:'Cartier'},{id:'dealuri',name:'Dealuri'},{id:'depou',name:'Depou'},...expansion.cities];
  const levels = [
    { id: 'cutii', title: 'Prima livrare', district: 'Cartierul de acasă', subtitle: 'Trei cutii. Două pedale. Te descurci.', cargo: ['box','box','box'], seed: 12, sky: '#d9e8df', route: [[0,470],[700,470],[1200,445],[1650,470],[2100,470],[2500,430],[3000,470],[3700,470],[4300,470]], goal: 3750 },
    { id: 'tort', title: 'La mulți ani!', district: 'Strada Castanilor', subtitle: 'Tortul trebuie să ajungă înaintea invitaților.', cargo: ['cake'], seed: 38, sky: '#e9e5dc', route: [[0,470],[650,470],[1100,435],[1550,470],[2050,450],[2500,480],[2850,430],[3400,470],[3900,470],[4500,470]], goal: 3950 },
    { id: 'pepeni', title: 'Se rostogolesc!', district: 'Drumul spre piață', subtitle: 'Pepenii au propriile planuri de călătorie.', cargo: ['melon','melon','melon','melon'], seed: 64, sky: '#d5e5e7', route: [[0,470],[650,470],[1150,410],[1550,445],[2050,390],[2500,440],[2950,470],[3350,425],[3900,470],[4450,470],[5050,470]], goal: 4500 },
    { id: 'piata', title: 'Cu de toate', district: 'Piața de duminică', subtitle: 'Puțină organizare, multă răbdare.', cargo: ['box','melon','box'], seed: 87, sky: '#e7e4d0', route: [[0,470],[650,470],[1100,440],[1450,470],[1900,420],[2300,470],[2700,440],[3100,485],[3650,430],[4100,470],[4700,470],[5300,470]], goal: 4750 },
    { id: 'vaza', title: 'Vaza bunicii', district: 'Aleea cu tei', subtitle: 'Scrie FRAGIL. Chiar este fragil.', cargo: ['vase'], seed: 123, sky: '#e2deeb', route: [[0,470],[700,470],[1150,450],[1550,480],[2000,435],[2450,465],[2850,425],[3300,460],[3750,435],[4200,470],[4750,470],[5350,470]], goal: 4800 },
    { id: 'cartier', title: 'Tot cartierul', district: 'Tura de seară', subtitle: 'Livrarea pentru care te-ai pregătit.', cargo: ['box','box','cake'], seed: 194, sky: '#eadfd8', route: [[0,470],[650,470],[1100,420],[1500,465],[1950,390],[2400,450],[2800,420],[3200,480],[3650,410],[4050,465],[4500,425],[4950,470],[5500,470],[6100,470]], goal: 5550 }
  ];
  levels.push(...extraRoutes,...expansion.routes);
  const palettes = [
    { id: 'coral', name: 'Ardei copt', color: '#e87356', dark: '#bd493d', stars: 0 },
    { id: 'mint', name: 'Mentă', color: '#64b7a6', dark: '#3d8179', stars: 3 },
    { id: 'yellow', name: 'Soare', color: '#e7b94e', dark: '#b58235', stars: 7 },
    { id:'blue', name:'Cobalt', color:'#658edc', dark:'#2d528f', stars:15 },
    { id:'violet', name:'Amurg', color:'#ba7cbc', dark:'#6d447d', stars:25 },
    { id:'ivory', name:'Scoică', color:'#efddbd', dark:'#9d8975', stars:10 },
    { id:'forest', name:'Brad', color:'#7f9f72', dark:'#415e4b', stars:20 },
    { id:'teal', name:'Adânc', color:'#44a5b1', dark:'#2c6278', stars:31 },
    { id:'rose', name:'Bujor', color:'#d883a1', dark:'#8e4b70', stars:37 },
    { id:'frost', name:'Promoroacă', color:'#b1d6df', dark:'#608da6', stars:43 },
    { id:'copper', name:'Aramă', color:'#c57c54', dark:'#783e42', stars:52 },
    { id:'ink', name:'Tuș', color:'#4f6580', dark:'#253951', stars:59 }
  ];
  const vehicles = [
    {id:'van',name:'Dubița',tag:'Bună la toate',description:'Echilibrată. Prima ta parteneră de drum.',stars:0,speed:.205,motor:.12,density:.0025,wheel:24,grip:.8,roof:60},
    {id:'monster',name:'Bizonul',tag:'Greu de clintit',description:'Roți mari, greutate mare. Marfa respiră ușurată.',stars:3,speed:.145,motor:.10,density:.004,wheel:29,grip:.95,roof:64},
    {id:'rocket',name:'Racheta',tag:'Repede și jucăușă',description:'Mai ușoară, mai rapidă. Frâna e prietena ta.',stars:7,speed:.255,motor:.13,density:.002,wheel:23,grip:.7,roof:48},
    {id:'delfin',name:'Delfinul',tag:'Demaraj sprinten',description:'Pleacă rapid la gaz după bariere și curbe.',stars:15,speed:.227,motor:.151,density:.00265,wheel:24,grip:.86,roof:57},
    {id:'carpatin',name:'Carpatinul',tag:'Aderență pe polei',description:'Roți mari și tracțiune mai bună pe porțiunile înghețate.',stars:29,speed:.175,motor:.126,density:.0038,wheel:28,grip:.92,roof:63,iceGrip:.14},
    {id:'vijelie',name:'Vijelia',tag:'Viteză de vârf',description:'Profil jos și viteză maximă mare pe linie dreaptă.',stars:46,speed:.276,motor:.114,density:.0026,wheel:23,grip:.80,roof:47}
  ];
  const stories=[
    {character:'geta',title:'Sarmale la pachet',cargo:['pot','pot','pot'],subtitle:'Masa de duminică nu se livrează singură.',challenge:{kind:'all',target:3,title:'Toate oalele acasă',description:'Livrează toate cele trei oale.'}},
    {character:'dj',title:'Chef de cartier',cargo:['speaker','speaker','cake'],subtitle:'Boxele, tortul și primul refren.',challenge:{kind:'jumps',target:2,title:'Curier pe ritm',description:'Fă două aterizări cu stil și livrează.'}},
    {character:'doru',title:'Pepenii lui Doru',cargo:['melon','melon','melon','melon'],subtitle:'Marfă rotundă. Nervi pătrați.',challenge:{kind:'rings',target:3,title:'Monede în aer',description:'Prinde cel puțin trei monede și livrează.'}},
    {character:'admin',title:'Ședință cu livrare',cargo:['box','melon','box'],subtitle:'Totul trebuie să ajungă în procesul verbal.',challenge:{kind:'integrity',target:.99,title:'Sigiliul intact',description:'Livrează cu cel puțin 99% integritate.'}},
    {character:'geta',title:'Vaza de familie',cargo:['vase'],subtitle:'Mai fragilă decât răbdarea vecinilor.',challenge:{kind:'rescues',target:1,title:'Mână sigură',description:'Livrează folosind cel mult o chingă.'}},
    {character:'dj',title:'Petrecerea blocului',cargo:['speaker','speaker','cake'],subtitle:'Tot cartierul te așteaptă la petrecere.',challenge:{kind:'bonus',target:550,title:'Legenda cartierului',description:'Adună minimum 550 de puncte bonus și livrează.'}}
  ];
  const skies=['#9eddeb','#b5d7ed','#a5dce8','#bcdcc9','#c8c5ea','#edc7b3'];
  const padPositions=[[1100],[1750,3150],[1750,3450],[1650,3500],[1800],[1750,3400,4700]];
  const routeObstacles = [
    [['rough',2020]],
    [['barrier',2590],['jump',3550]],
    [['rough',1250],['leap',2700],['rough',3060]],
    [['rough',1190],['barrier',2070],['rough',2590],['leap',3870]],
    [['rough',1450],['leap',2150],['rough',2940],['leap',3570],['rough',4020]],
    [['barrier',1350],['rough',2010],['leap',2680],['rough',2940],['leap',3790],
      ['barrier',4290],['rough',4550],['leap',5060]]
  ];
  const routeRules = [
    {par:34, label:'Antrenament'},
    {par:29, label:'Începător'},
    {par:26, deadline:34, minIntegrity:.45, clearance:17, speedLimit:2.9, label:'Intermediar'},
    {par:25, deadline:31, minIntegrity:.55, clearance:22, speedLimit:2.6, label:'Dificil'},
    {par:28, deadline:32, minIntegrity:.72, clearance:25, speedLimit:2.4, bayEnd:265, label:'Expert'},
    {par:30, deadline:34, minIntegrity:.75, clearance:29, speedLimit:2.25, bayEnd:170, label:'Finală'}
  ];
  const cabGates={tort:1420,livada:1760,depou:3710};
  const serviceBays={cutii:3200,livada:4940,depou:4470};
  // Each entry places two coin arcs and, on selected deliveries, one separate aerial pickup.
  const rewardSpots={
    cutii:[840,2660], tort:[1040,2950,'bubble',1990],
    pepeni:[850,2130,'magnet',3800], piata:[940,3100],
    vaza:[920,2600,'bubble',4320], cartier:[960,3320,'magnet',4740],
    livada:[890,3170], serpentine:[910,1760,'magnet',4500],
    cabana:[930,3320,'bubble',5520], depou:[860,2770],
    viaduct:[880,2390,'magnet',5825], festival:[905,3030]
  };
  const encounters={
    cutii:[['puddle',1450],['chickens',2350]],
    tort:[['party',3050]], pepeni:[['chickens',2190]], piata:[['puddle',3260]],
    cartier:[['party',4800]], livada:[['chickens',3390]], cabana:[['puddle',4140]],
    depou:[['puddle',2920]], viaduct:[['puddle',2850]], festival:[['party',6560]]
  };
  levels.forEach((level,i)=>{
    level.serviceBay??=serviceBays[level.id];
    level.cabGate??=cabGates[level.id];
    const story=stories[i];
    const pads=level.pads??padPositions[i];
    const obstacles=level.obstacles??routeObstacles[i];
    if(story){
      Object.assign(level,story,{chapter:'cartier',rules:routeRules[i],sky:skies[i]});
    }
    const character=Characters.get(level.character);
    level.par=level.rules.par;
    level.client={id:character.id,name:character.name,quote:character.lines.start[0]};
    level.pads=pads.map((x,j)=>({id:'hop-'+j,x,power:i===4?3.5:4.2+(i>1?.45:0)}));
    const [first,second,kind,special]=(level.reward||rewardSpots[level.id]);
    const makePrize=(id,x,height)=>({id,x,y:roadY(level,x)-height});
    level.obstacles=obstacles.map(([kind,x])=>({kind,x}));
    level.rings=[first,second].flatMap((center,group)=>{
      const coins=group===0?[[-28,103],[21,119]]:[[-35,105],[7,122],[51,106]];
      return coins.map(([offset,height],i)=>makePrize('coin-'+group+'-'+i,center+offset,height));
    });
    level.pilotGates=[makePrize('workshop-part',first+77,112)];
    level.goodies=kind?[{...makePrize(kind,special,125),kind}]:[];
    level.jumpSpots=[first-65,second-77,...(kind?[special-64]:[])];
    level.surprises=(encounters[level.id]||[]).map(([kind,x])=>({id:kind,kind,x,y:roadY(level,x)}));
  });
  function roadY(level, x) {
    const r = level.route;
    if (x <= r[0][0]) return r[0][1];
    for (let i=1;i<r.length;i++) if (x <= r[i][0]) {
      const a=r[i-1], b=r[i], t=(x-a[0])/(b[0]-a[0]);
      return a[1]+(b[1]-a[1])*t;
    }
    return r[r.length-1][1];
  }
  function score(delivery) {
    const fraction = Math.max(0,Math.min(1,delivery.integrity));
    if (fraction <= 0) return 0;
    if (fraction >= .94 && delivery.delivered === delivery.total && delivery.seconds <= delivery.par &&
        !delivery.penalty) return 3;
    if (fraction >= .60) return 2;
    return 1;
  }
  function challengeMet(level,result){const q=level.challenge;if(!q||!result||result.stars<1)return false;switch(q.kind){case'all':return result.delivered===result.total;case'jumps':return result.jumps>=q.target;case'rings':return result.rings>=q.target;case'integrity':return result.integrity>=q.target;case'rescues':return result.rescuesUsed<=q.target;case'probes':return result.probes>=q.target;case'bonus':return result.score-Math.round(result.integrity*1000)>=q.target;default:return false;}}
  const goldGoals=[24,26,24,25,28,30,28,31,38,29,34,37];
  const expressTarget=level=>level.rules.express??goldGoals[levels.findIndex(route=>route.id===level.id)]??level.rules.par;
  const expressMedals=['','Bronz','Argint','Aur'];
  function expressLevel(level) {
    const goalTime=expressTarget(level);
    return {
      ...level, express:true, par:goalTime, goodies:[], jumpSpots:level.jumpSpots.slice(0,2), serviceBay:undefined, cabGate:undefined,
      rules:{...level.rules, par:goalTime, deadline:level.rules.deadline??level.rules.par+4, minIntegrity:Math.max(.72,level.rules.minIntegrity||0)}
    };
  }
  function expressMedal(level,result) {
    if(!result.stars)return 0;
    if(result.integrity>=.94&&!result.penalty&&result.seconds<=expressTarget(level))return 3;
    if(result.integrity>=.84&&result.seconds<=expressTarget(level)*1.16)return 2;
    return 1;
  }
  const api = { levels, chapters, palettes, vehicles, roadY, score, challengeMet, expressMedals, expressTarget, expressLevel, expressMedal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CurierData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
