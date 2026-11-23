(function(root) {
  'use strict';
  const delivery = (id,title,district,chapter,character,cargo,seed,goal,route,pads,obstacles,gravel,rules,challenge) =>
    ({id,title,district,chapter,character,cargo,seed,goal,route,pads,obstacles,gravel,rules,challenge,lowStack:true});
  const rough='rough', leap='leap', barrier='barrier';
  const routes=[
    delivery('livada','Marfă pentru târg','Livezile de sus','dealuri','doru',['melon','box','box'],245,5360,
      [[0,470],[650,470],[1050,436],[1540,403],[1980,461],[2520,480],[3100,413],[3630,455],[4170,408],[4750,470],[5850,470]],
      [1900,3940],[[rough,1270],[leap,2780],[rough,3540],[rough,4520]],[[2110,2620],[3740,4010]],
      {par:34,deadline:43,minIntegrity:.62,clearance:19,speedLimit:2.9,bayEnd:285,pace:3.8,label:'Pietriș'},
      {kind:'rings',target:3,title:'Coșul plin',description:'Prinde 3 monede din aer și livrează.'}),
    delivery('serpentine','Serpentinele din pădure','Drumul forestier','dealuri','geta',['pot','pot','pot'],276,6140,
      [[0,470],[650,470],[1070,421],[1560,370],[1930,395],[2330,449],[2830,489],[3250,434],[3730,390],[4230,445],[4730,481],[5100,441],[5630,470],[6740,470]],
      [2080,4920],[[rough,1360],[leap,2470],[rough,3060],[barrier,3670],[leap,5330]],[[1610,2130],[4110,4800]],
      {par:38,deadline:49,minIntegrity:.66,clearance:22,speedLimit:2.7,bayEnd:250,pace:3.95,label:'Serpentine'},
      {kind:'probes',target:5,title:'Maestru pe deal',description:'Treci toate cele 5 probe fără greșeli.'}),
    delivery('cabana','Vaza de la cabană','Muchia pădurii','dealuri','geta',['vase'],308,6530,
      [[0,470],[720,470],[1190,424],[1740,390],[2250,432],[2760,484],[3200,445],[3640,391],[4160,425],[4750,480],[5300,438],[5930,470],[7120,470]],
      [2280,4410],[[barrier,1280],[rough,1970],[leap,3050],[rough,3650],[leap,5010],[rough,5660]],[[1480,1970],[3880,4700],[5170,5500]],
      {par:43,deadline:55,minIntegrity:.73,clearance:24,speedLimit:2.55,bayEnd:215,pace:2.85,label:'Finală'},
      {kind:'integrity',target:.97,title:'Vază fără cioburi',description:'Păstrează cel puțin 97% integritate.'}),
    delivery('depou','Sculele de la depou','Depoul de tramvaie','depou','admin',['tools','tools','box'],342,5950,
      [[0,470],[720,470],[1240,456],[1850,456],[2240,407],[2600,407],[3060,473],[3490,473],[3940,407],[4400,407],[4880,476],[5330,470],[6550,470]],
      [2740,4530],[[rough,1210],[barrier,1820],[leap,2410],[rough,3430],[leap,4060],[rough,5030]],[[3010,3400]],
      {par:38,deadline:49,minIntegrity:.7,clearance:22,speedLimit:2.6,bayEnd:200,pace:4.05,label:'Șine'},
      {kind:'rescues',target:1,title:'Scule bine așezate',description:'Livrează folosind cel mult o chingă.'}),
    delivery('viaduct','Boxe peste viaduct','Podul fabricii','depou','dj',['speaker','speaker','box'],376,6810,
      [[0,470],[700,470],[1150,445],[1570,390],[2010,390],[2520,448],[3000,474],[3540,397],[4060,397],[4540,464],[4950,487],[5510,420],[6100,470],[7410,470]],
      [2240,4660,5820],[[rough,1290],[leap,1890],[rough,2760],[barrier,3530],[leap,4300],[rough,5000],[leap,6220]],[[2420,2770],[4810,5170]],
      {par:42,deadline:53,minIntegrity:.73,clearance:24,speedLimit:2.45,bayEnd:185,pace:4.05,label:'Viaduct'},
      {kind:'jumps',target:4,title:'Sunet de pod',description:'Leagă cel puțin 4 aterizări cu stil și livrează.'}),
    delivery('festival','Livrare pentru festival','Halele de pe chei','depou','dj',['speaker','speaker','lantern'],409,7440,
      [[0,470],[760,470],[1280,420],[1730,448],[2270,475],[2710,417],[3100,417],[3660,470],[4160,490],[4690,423],[5160,423],[5650,467],[6170,413],[6700,470],[8040,470]],
      [1330,3830,5850],[[rough,1150],[barrier,1930],[leap,2560],[rough,3320],[leap,4430],[barrier,5130],[rough,6060],[leap,6920]],
      [[2720,3200],[3710,4200],[5560,5990]],
      {par:48,deadline:60,minIntegrity:.78,clearance:26,speedLimit:2.4,bayEnd:170,pace:4.05,label:'Finală'},
      {kind:'probes',target:8,title:'Curier de festival',description:'Treci 8 probe fără greșeli și livrează.'})
  ];
  const notes={
    livada:['Pune frână înainte de pietriș. Ne vedem lângă prima tarabă.','Ai prins târgul la timp. Hai să descărcăm!'],
    serpentine:['La vale ai avânt cât pentru două dubițe. Ia curbele cu grijă.','Mă uit la oale și le văd pe toate. Bun drum ai făcut.'],
    cabana:['Vaza asta stă pe masa cabanei de ani buni. Du-o încet.','A ajuns! Mai avem doar de cules florile.'],
    depou:['Sculele merg în hala din capăt. La barieră, claxonează o dată.','Bine că le-ai adus. Putem pune tramvaiul pe roți.'],
    viaduct:['După pod dai de hala roșie. Boxele descarcă-le la ușa mare.','Au ajuns boxele. Acum pot să fac proba de sunet!'],
    festival:['Mai sunt câteva minute până aprindem luminile. Te aștept la scenă.','Boxe, lumini, tot ce ne trebuie. Dăm drumul la festival!']
  };
  for(const route of routes){
    const [start,finish]=notes[route.id];
    route.dialogue={start,finish};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=routes;
  else root.CurierExtraRoutes=routes;
})(globalThis);
