(function(root){
  'use strict';
  const stars=n=>[
    'Strânge '+n+' stele',
    s=>Object.values(s.results).reduce((sum,r)=>sum+r.stars,0)>=n
  ];
  const stamps=n=>[
    'Câștigă '+n+' ștampile',
    s=>Object.values(s.results).filter(r=>r.challenge).length>=n
  ];
  const deliveries=n=>[
    'Termină '+n+' livrări diferite',
    s=>Object.keys(s.results).length>=n
  ];
  const cabMedals=n=>[
    n===1?'Câștigă o medalie într-o probă din cabină':'Câștigă medalii în '+n+' probe din cabină',
    s=>Object.keys(s.cabRecords).length>=n
  ];
  const cabGold=n=>[
    'Câștigă aur în '+n+' probe din cabină',
    s=>Object.values(s.cabRecords).filter(m=>m===3).length>=n
  ];
  const express=n=>[
    'Câștigă aur în '+n+' curse contra cronometru',
    s=>Object.values(s.express).filter(r=>r.medal===3).length>=n
  ];
  const city=(id,name)=>['Termină „'+name+'”',s=>Boolean(s.results[id])];
  function option(id,name,color,requirement=[],detail){
    const [hint,test]=requirement;
    return {id,name,color,hint,test,detail};
  }
  const groups=[
    {id:'trim',name:'Caroserie',options:[
      option('stock','Clasic','#df7a60'),
      option('rally','Dungi de raliu','#ffe2a5',deliveries(2)),
      option('bolt','Fulger','#9ef2dc',stamps(4)),
      option('check','Drapel în carouri','#f6d6ab',express(2)),
      option('wave','Valuri','#b9f0e1',city('regata','Start la regată')),
      option('ridge','Culmi de zăpadă','#cce7f0',city('observator','Lumină la observator'))
    ]},
    {id:'rims',name:'Jante',options:[
      option('stock','Aliaj','#dbbc92'),
      option('steel','Grafit','#93b4c1',stars(6)),
      option('copper','Cupru','#f0a173',stars(18)),
      option('pearl','Perlă','#f2ede2',stars(28)),
      option('glacier','Gheață','#96dfe8',stars(42)),
      option('champion','Aur mat','#f5cd77',stars(58))
    ]},
    {id:'roof',name:'Plafon',options:[
      option('stock','Liber','#8b95a0'),
      option('bars','Bare de plafon','#bbc9cb',deliveries(2)),
      option('rack','Bagaj de drum','#91b59b',deliveries(5)),
      option('spots','Proiectoare','#ffe197',stamps(7)),
      option('aero','Priză de aer','#83c7da',express(3))
    ]},
    {id:'bumper',name:'Bară',options:[
      option('stock','De serie','#bdc8c4'),
      option('matte','Protecție mată','#788796',deliveries(3)),
      option('tow','Cârlig de tractare','#d99475',deliveries(6)),
      option('guard','Bară tubulară','#d3dcce',city('telecabina','Piese la telescaun')),
      option('copper','Aramă lustruită','#de9c73',city('turn_cupru','Ora exactă'))
    ]},
    {id:'plate',name:'Număr',options:[
      option('stock','Curier 01','#e7e8cb',[],'CR 01'),
      option('pilot','Pilot 07','#f8dc92',stamps(2),'PL 07'),
      option('sea','Brizeni 12','#9be2de',city('far','Semnal pentru far'),'BR 12'),
      option('snow','Făget 18','#d9f0f5',city('gara_faget','Trenul de dimineață'),'FA 18'),
      option('copper','Arămia 25','#efb98d',city('parada','Parada de seară'),'AR 25')
    ]},
    {id:'underglow',name:'Lumini',options:[
      option('stock','Stinse','#879da9'),
      option('mint','Verde mentă','#81e9c2',cabMedals(2)),
      option('amber','Chihlimbar','#ffd187',stamps(9)),
      option('blue','Albastru rece','#96dcff',stars(45)),
      option('violet','Violet','#d0a9ff',stamps(15))
    ]},
    {id:'cab',name:'Interior',options:[
      option('stock','Ardezie','#233b50'),
      option('lake','Laguna','#397d78',cabMedals(1)),
      option('plum','Amurg','#654463',cabGold(2)),
      option('wood','Nuc','#854f43',city('regata','Start la regată')),
      option('polar','Nord','#5f889c',city('observator','Lumină la observator')),
      option('gold','Șofran','#99713d',cabGold(4))
    ]},
    {id:'charm',name:'Breloc',options:[
      option('stock','Liber','#94a4a9'),
      option('leaf','Frunza','#aad392',deliveries(4)),
      option('star','Steaua','#ffdd84',stamps(5)),
      option('anchor','Ancora','#a6d8d1',city('dana','Ultima barcă')),
      option('flake','Fulgul','#bde8f2',city('telecabina','Piese la telescaun'))
    ]}
  ];
  function equipped(save,vehicle){
    const style=save.customs?.[vehicle];
    return Object.fromEntries(groups.map(group=>{
      const item=group.options.find(option=>option.id===style?.[group.id]&&allowed(option,save))||group.options[0];
      return [group.id,item];
    }));
  }
  function allowed(item,save){return Boolean(item&&(!item.test||item.test(save)));}
  const api={groups,equipped,allowed};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CurierCustoms=api;
})(globalThis);
