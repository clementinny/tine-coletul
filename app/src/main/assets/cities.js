(function(root){
  'use strict';
  const cities=[
    {id:'brizeni',name:'Brizeni',zone:'coast',sky:['#5089a5','#f7dca3'],sun:'#ffe0a0',hills:['#7da8ae','#648b9a'],
      gravel:'#b08e6d',shoulder:'#d2b181',lights:'#ffe8ae'},
    {id:'faget',name:'Făgetul Alb',zone:'snow',sky:['#5677a5','#d0e2eb'],sun:'#ffefd1',hills:['#a1bed0','#7d9eb5'],
      gravel:'#b9d0d9',shoulder:'#d7e2e7',lights:'#fff3d4'},
    {id:'aramia',name:'Arămia',zone:'copper',sky:['#67668f','#f0ba87'],sun:'#ffd385',hills:['#b98782','#966d76'],
      gravel:'#9e725e',shoulder:'#c69871',lights:'#ffe1ac'}
  ];
  const rough='rough',leap='leap',barrier='barrier';
  const routes=[
    {
      id:'far',chapter:'brizeni',title:'Semnal pentru far',district:'Brizeni · Digul mare',character:'doru',seed:510,
      cargo:['compass','compass','tools'],goal:5680,
      route:[[0,470],[690,470],[1140,438],[1680,461],[2260,432],[2830,427],[3360,473],[3940,421],[4470,457],[5110,470],[6330,470]],
      pads:[1840,3960],obstacles:[[rough,1280],[barrier,2360],[leap,3260],[rough,4670]],
      rules:{pace:3.75,par:31,express:28,deadline:41,minIntegrity:.67,clearance:19,speedLimit:2.8,label:'Dig'},
      reward:[920,3750],landmarks:[[1160,'lighthouse'],[2980,'sail'],[4930,'lighthouse']],
      challenge:{kind:'all',target:3,title:'Busolele la far',description:'Livrează toate cele trei obiecte.'},
      dialogue:{start:'Du busolele peste dig. Farul se vede de pe drum.',finish:'Le-am primit pe toate. Aprindem lumina de seară.'}
    },
    {
      id:'dana',chapter:'brizeni',title:'Ultima barcă',district:'Brizeni · Dana de sud',character:'admin',seed:547,
      cargo:['tools','compass','box'],goal:6350,
      route:[[0,470],[670,470],[1170,432],[1720,457],[2200,482],[2720,427],[3250,439],[3770,466],[4270,425],[4860,451],[5390,470],[7000,470]],
      pads:[1740,3910,5080],obstacles:[[rough,1310],[leap,2470],[barrier,3380],[rough,4450],[leap,5520]],
      gravel:[[2800,3060],[4750,5060]],cabGate:1920,
      rules:{pace:3.95,par:34,express:30,deadline:45,minIntegrity:.7,clearance:22,speedLimit:2.65,label:'Port'},
      reward:[900,2880,'magnet',5840],landmarks:[[1060,'crane'],[2970,'crane'],[5040,'sail']],
      challenge:{kind:'probes',target:5,title:'La cheu la minut',description:'Treci toate cele cinci probe fără greșeli.'},
      dialogue:{start:'Barca pleacă din dana de sud. La macara, pavajul e denivelat.',finish:'Fix la timp pentru ultima barcă. Ai făcut un drum bun.'}
    },
    {
      id:'regata',chapter:'brizeni',title:'Start la regată',district:'Brizeni · Faleza cu vele',character:'dj',seed:574,
      cargo:['speaker','speaker','compass'],goal:7130,
      route:[[0,470],[720,470],[1220,431],[1740,461],[2300,419],[2830,462],[3370,440],[3880,477],[4420,416],[4950,440],[5480,490],[5990,447],[6560,470],[7770,470]],
      pads:[1850,4060,5950],obstacles:[[barrier,1320],[rough,2320],[leap,3090],[rough,3670],[barrier,4640],[leap,5770],[rough,6490]],
      gravel:[[5150,5490]],serviceBay:5120,evening:true,
      rules:{pace:4.0,par:38,express:34,deadline:50,minIntegrity:.74,clearance:23,speedLimit:2.55,bayEnd:210,label:'Finală'},
      reward:[929,3980],landmarks:[[1080,'sail'],[2910,'lighthouse'],[4870,'sail'],[6580,'crane']],
      challenge:{kind:'bonus',target:580,title:'Vânt în pânze',description:'Livrează cu cel puțin 580 de puncte bonus.'},
      dialogue:{start:'Ducem boxele pe faleză înainte de fluierul de start.',finish:'Te auzim până la geamandură. Mulțumim pentru cursă!'}
    },
    {
      id:'gara_faget',chapter:'faget',title:'Trenul de dimineață',district:'Făgetul Alb · Gara mică',character:'geta',seed:610,
      cargo:['pot','box','pot'],goal:6050,
      route:[[0,470],[660,470],[1210,438],[1730,432],[2270,468],[2780,443],[3310,406],[3780,451],[4310,470],[4860,435],[5470,470],[6750,470]],
      pads:[1850,4150],obstacles:[[rough,1220],[leap,2550],[barrier,3550],[rough,4890]],
      ice:[[1450,1870],[2920,3310],[4440,4720]],
      rules:{pace:3.8,par:34,express:30,deadline:44,minIntegrity:.7,clearance:20,speedLimit:2.65,bayEnd:265,label:'Polei'},
      reward:[898,3790,'bubble',5300],landmarks:[[1050,'station'],[2830,'lift'],[4990,'station']],
      challenge:{kind:'integrity',target:.95,title:'Marfă fără urme',description:'Livrează cu minimum 95% integritate.'},
      dialogue:{start:'Se vede poleiul la umbră. Frânează din timp, mamă!',finish:'Totul întreg, chiar și după polei. Trenul încă ne așteaptă.'}
    },
    {
      id:'telecabina',chapter:'faget',title:'Piese la telescaun',district:'Făgetul Alb · Valea pinilor',character:'admin',seed:643,
      cargo:['tools','tools','compass'],goal:6770,
      route:[[0,470],[650,470],[1220,431],[1800,397],[2340,442],[2820,477],[3360,434],[3870,398],[4430,447],[4930,432],[5490,481],[6040,450],[6440,470],[7440,470]],
      pads:[1610,4410,6040],obstacles:[[rough,1340],[barrier,2220],[leap,2700],[rough,3950],[leap,4630],[rough,5770]],
      ice:[[3000,3580],[4830,5360],[6210,6460]],
      rules:{pace:3.9,par:37,express:33,deadline:49,minIntegrity:.72,clearance:22,speedLimit:2.55,bayEnd:230,label:'Urcare'},
      reward:[950,3520],landmarks:[[1330,'lift'],[3380,'lift'],[5460,'station']],
      challenge:{kind:'rescues',target:1,title:'Drumul alpin',description:'Livrează folosind cel mult o chingă.'},
      dialogue:{start:'Piesele astea repornesc telescaunul. La coborâri, fără grabă.',finish:'Am șuruburile și cheia. Până la prânz merge telescaunul.'}
    },
    {
      id:'observator',chapter:'faget',title:'Lumină la observator',district:'Făgetul Alb · Culmea stelelor',character:'dj',seed:685,
      cargo:['globe','lantern','compass'],goal:7330,
      route:[[0,470],[720,470],[1300,424],[1870,461],[2440,403],[2900,440],[3400,478],[3910,429],[4460,436],[5000,482],[5530,423],[6090,451],[6600,470],[8000,470]],
      pads:[1640,3860,5900],obstacles:[[rough,1300],[barrier,2460],[leap,3120],[rough,3690],[leap,4700],[barrier,5520],[rough,6790]],
      ice:[[1840,2150],[3980,4460],[6010,6490]],serviceBay:5160,cabGate:1940,evening:true,
      rules:{pace:4.0,par:40,express:35,deadline:53,minIntegrity:.76,clearance:24,speedLimit:2.45,bayEnd:215,label:'Finală'},
      reward:[912,4260,'magnet',6250],landmarks:[[1180,'lift'],[3450,'observatory'],[6390,'observatory']],
      challenge:{kind:'bonus',target:550,title:'Curier printre stele',description:'Livrează cu cel puțin 550 de puncte bonus.'},
      dialogue:{start:'Globul ajunge în sala mare. Caută cupola, sus pe culme.',finish:'Globul e aici! În seara asta deschidem observatorul.'}
    },
    {
      id:'sere',chapter:'aramia',title:'Răsaduri sub sticlă',district:'Arămia · Serele orașului',character:'geta',seed:722,
      cargo:['sprout','sprout','box'],goal:6380,
      route:[[0,470],[650,470],[1150,427],[1690,440],[2250,463],[2780,414],[3310,448],[3790,476],[4310,430],[4850,448],[5440,470],[7050,470]],
      pads:[1550,3150,4820],obstacles:[[rough,1250],[leap,2100],[barrier,2900],[rough,4020],[leap,5380]],
      gravel:[[3450,3750],[4630,4790]],
      rules:{pace:3.85,par:34,express:31,deadline:46,minIntegrity:.73,clearance:22,speedLimit:2.6,bayEnd:220,label:'Sere'},
      reward:[920,3610],landmarks:[[1090,'greenhouse'],[2560,'greenhouse'],[5100,'copper']],
      challenge:{kind:'all',target:3,title:'Livrare cu frunze',description:'Livrează toate cele trei obiecte.'},
      dialogue:{start:'Răsadurile au loc în sera din capăt. Să le ajungă și pământul!',finish:'Frunzele au ajuns întregi. Le punem la soare.'}
    },
    {
      id:'turn_cupru',chapter:'aramia',title:'Ora exactă',district:'Arămia · Turnul de cupru',character:'admin',seed:758,
      cargo:['compass','tools','globe'],goal:7060,
      route:[[0,470],[690,470],[1220,413],[1730,454],[2280,414],[2790,477],[3270,446],[3820,413],[4350,471],[4870,438],[5360,471],[5910,432],[6470,470],[7680,470]],
      pads:[1880,3710,5140],obstacles:[[barrier,1320],[rough,2230],[leap,3070],[rough,4100],[barrier,4730],[leap,5530],[rough,6470]],
      gravel:[[2500,2780],[5960,6310]],cabGate:3620,serviceBay:5850,
      rules:{pace:4.06,par:38,express:33,deadline:52,minIntegrity:.75,clearance:24,speedLimit:2.5,bayEnd:205,label:'Turn'},
      reward:[910,3500,'bubble',6120],landmarks:[[1150,'copper'],[3000,'greenhouse'],[4750,'clock'],[6410,'clock']],
      challenge:{kind:'probes',target:7,title:'La fix',description:'Treci toate cele șapte probe fără greșeli.'},
      dialogue:{start:'Mecanismul turnului s-a oprit. Adu piesele la rondul de sus.',finish:'Ai livrat la fix. Chiar și ceasul e de acord acum.'}
    },
    {
      id:'parada',chapter:'aramia',title:'Parada de seară',district:'Arămia · Piața lampioanelor',character:'dj',seed:797,
      cargo:['sprout','speaker','lantern'],goal:7880,
      route:[[0,470],[700,470],[1240,425],[1790,467],[2320,412],[2840,449],[3390,482],[3900,429],[4450,459],[4930,408],[5490,455],[6020,485],[6550,434],[7080,447],[7550,470],[8550,470]],
      pads:[1590,3110,5140,6830],obstacles:[[rough,1230],[leap,2080],[barrier,2660],[rough,3630],[leap,4550],[rough,5550],[barrier,6260],[leap,7200]],
      gravel:[[2880,3200],[5690,5990],[6680,6940]],serviceBay:4830,evening:true,
      rules:{pace:4.1,par:42,express:38,deadline:57,minIntegrity:.78,clearance:26,speedLimit:2.45,bayEnd:193,label:'Finală'},
      reward:[895,4230,'magnet',7540],landmarks:[[1070,'clock'],[2940,'copper'],[4540,'greenhouse'],[7130,'clock']],
      challenge:{kind:'probes',target:8,title:'Cap de paradă',description:'Treci toate cele opt probe fără greșeli.'},
      dialogue:{start:'Piața se umple. Adu luminile înainte să pornească parada.',finish:'Se aprind lampioanele! Ai făcut turul orașelor cu bine.'}
    }
  ];
  for(const route of routes){
    route.lowStack=true;
    route.city=cities.find(city=>city.id===route.chapter);
  }
  const api={cities,routes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CurierCities=api;
})(globalThis);
