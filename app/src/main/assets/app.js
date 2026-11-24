(function(){
  'use strict';
  const $=id=>document.getElementById(id), {levels,palettes,vehicles}=CurierData;
  let storage;
  try {storage=window.localStorage;}catch(_){storage={getItem(){return null;},setItem(){throw Error('Storage unavailable');}};}
  const save=new CurierStorage.Save(storage);
  const I18n=CurierI18n, Story=CurierStory, Checkpoint=CurierCheckpoint;
  const t=I18n.t;
  I18n.select(save.value.language);
  const renderer=new CurierRenderer.Renderer($('world'));
  const Characters=CurierCharacters,Fun=CurierFun,Workshop=CurierWorkshop;
  const Cab=CurierCabRun,Customs=CurierCustoms;
  for(const [id,kind] of [['magnet-icon','magnet'],['bubble-icon','bula']])$(id).innerHTML=Fun.icon(kind);
  let bubbleUntil=0;
  const director=new CurierDialogue.Director(line=>{const c=Characters.get(line.character);$('drive-client').textContent=t(c.name);$('drive-portrait').innerHTML=Characters.portrait(c.id);$('drive-quote').textContent=t(line.text);$('client-bubble').classList.remove('faded');bubbleUntil=(sim?.elapsed||0)+4.7;});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected=0,runExpress=false,mode='home',sim=null,accumulator=0,last=performance.now(),lastResult=null,toastTimer=0,dialogFocus=null;
  let stuntUntil=0,stuntPriority=0,runSerial=0,jumpQueuedUntil=0;
  let routeMarkerState='',cab=null,customGroup='trim';
  let runSetup=null,lastCheckpoint=-Infinity,lastDriveEffect='';
  const input={gas:new Set(),brake:new Set(),turbo:new Set(),reverse:new Set()};
  class Audio {
    constructor(){
      this.ctx=null;
      this.motor=null;
      this.filter=null;
      this.gain=null;
      this.rev=0;
      this.lastImpact=-Infinity;
    }
    unlock(){
      if(!save.value.sound)return;
      try{
        if(!this.ctx){
          this.ctx=new (window.AudioContext||window.webkitAudioContext)();
          this.motor=this.ctx.createOscillator();
          this.filter=this.ctx.createBiquadFilter();
          this.gain=this.ctx.createGain();
          this.motor.type='sawtooth';
          this.motor.frequency.value=43;
          this.filter.type='lowpass';
          this.filter.frequency.value=160;
          this.gain.gain.value=0;
          this.motor.connect(this.filter).connect(this.gain).connect(this.ctx.destination);
          this.motor.start();
          this.impactBuffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.14),this.ctx.sampleRate);
          const noise=this.impactBuffer.getChannelData(0);
          for(let i=0;i<noise.length;i++)noise[i]=(Math.random()*2-1)*(1-i/noise.length);

        }
        if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      }catch(_){}
    }
    update(){
      if(!this.gain)return;
      const live=mode==='playing'&&save.value.sound;
      const accelerating=live&&input.gas.size>0&&input.brake.size===0;
      const speed=live?Math.abs(sim.truck.velocity.x):0;
      this.rev+=(Math.min(speed,9)-this.rev)*.14;
      const at=this.ctx.currentTime;
      const boost=live&&sim.boosting;
      const backing=live&&sim.reversing;
      this.motor.frequency.setTargetAtTime(43+this.rev*10+(boost?9:backing?-7:0),at,.09);
      this.filter.frequency.setTargetAtTime(145+this.rev*28+(boost?130:0),at,.12);
      this.gain.gain.setTargetAtTime(live?(accelerating?.033:backing?.021:.012):0,at,.06);
    }
    tone(success){if(!save.value.sound)return;this.unlock();if(!this.ctx)return;const now=this.ctx.currentTime;[0,1,2].forEach(i=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=(success?[392,494,587]:[220,175,147])[i];g.gain.setValueAtTime(0,now+i*.11);g.gain.linearRampToValueAtTime(.045,now+i*.11+.015);g.gain.exponentialRampToValueAtTime(.0001,now+i*.11+.2);o.connect(g).connect(this.ctx.destination);o.start(now+i*.11);o.stop(now+i*.11+.22);});}
    honk(){if(!save.value.sound)return;this.unlock();if(!this.ctx)return;const kind=(sim.fun.stats.horns-1)%3,now=this.ctx.currentTime;for(let i=0;i<(kind===1?2:1);i++){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),at=now+i*.16;o.type=kind===0?'sawtooth':kind===1?'triangle':'sine';o.frequency.setValueAtTime([220,620,1000][kind],at);o.frequency.exponentialRampToValueAtTime([175,330,440][kind],at+.15);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(.035,at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+.19);o.connect(g).connect(this.ctx.destination);o.start(at);o.stop(at+.2);}}
    impact(strength){
      if(!save.value.sound||!this.ctx||strength<6.6)return;
      const now=this.ctx.currentTime;
      if(now-this.lastImpact<.13)return;
      this.lastImpact=now;
      const sound=this.ctx.createBufferSource();
      const filter=this.ctx.createBiquadFilter();
      const volume=this.ctx.createGain();
      sound.buffer=this.impactBuffer;
      filter.type='lowpass';
      filter.frequency.value=500+Math.min(700,(strength-6.6)*70);
      volume.gain.setValueAtTime(Math.min(.13,strength*.007),now);
      volume.gain.exponentialRampToValueAtTime(.0001,now+.13);
      sound.connect(filter).connect(volume).connect(this.ctx.destination);
      sound.start(now);
    }
    cue(frequency,end,delay,length,gain,shape='triangle'){
      const at=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),volume=this.ctx.createGain();
      osc.type=shape;
      osc.frequency.setValueAtTime(frequency,at);
      osc.frequency.exponentialRampToValueAtTime(end,at+length);
      volume.gain.setValueAtTime(.0001,at);
      volume.gain.exponentialRampToValueAtTime(gain,at+.007);
      volume.gain.exponentialRampToValueAtTime(.0001,at+length);
      osc.connect(volume).connect(this.ctx.destination);
      osc.start(at);osc.stop(at+length+.01);
    }
    effect(type,clean){
      if(type==='horn'){this.honk();return;}
      if(!save.value.sound||!this.ctx)return;
      const sounds={
        rescue:[[320,245,0,.10,.030],[1240,760,.05,.11,.027]],
        gate:[[688,545,0,.12,.032],[1350,1210,.045,.19,.018,'sine']],
        reverse:[[230,171,0,.12,.017],[470,370,.035,.10,.019]],
        boost:[[115,280,0,.22,.024,'sawtooth']],
        ice:[[850,410,0,.14,.010]],
        gravel:[[185,65,0,.08,.026],[210,83,.035,.11,.017]]
      };
      if(sounds[type]){
        for(const cue of sounds[type])this.cue(...cue);
        return;
      }
      const frequency={ring:980,hop:280,landing:145,rescue:620,pickup:760,shield:920,splash:140,
        chickens:520,party:880,service:520,gate:1100,lost:250,obstacle:clean?670:128}[type];
      if(!save.value.sound||!this.ctx||!frequency)return;
      const now=this.ctx.currentTime;
      const percussive=type==='landing'||type==='splash'||(type==='obstacle'&&!clean);
      const length=percussive?.2:.14;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=percussive?'triangle':'sine';
      o.frequency.setValueAtTime(frequency,now);
      o.frequency.exponentialRampToValueAtTime(frequency*(percussive?.28:type==='lost'?.46:1.27),now+length);
      g.gain.setValueAtTime(.0001,now);
      g.gain.exponentialRampToValueAtTime(percussive?.055:.026,now+.014);
      g.gain.exponentialRampToValueAtTime(.0001,now+length);
      o.connect(g).connect(this.ctx.destination);
      o.start(now);
      o.stop(now+length+.01);
    }
  }
  const audio=new Audio();
  const time=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  const preciseTime=t=>time(t)+(I18n.language==='en'?'.':',')+String(Math.floor(t*10)%10);
  const starsText=n=>'★'.repeat(n)+'☆'.repeat(3-n);
  function isUnlocked(i){return i===0||!!save.value.results[levels[i-1].id];}
  function firstUnfinished(){const i=levels.findIndex(l=>!save.value.results[l.id]);return i<0?levels.length-1:i;}
  function paint(vehicle=save.value.vehicle){
    const id=save.value.customs[vehicle]?.paint||save.value.paint;
    return palettes.find(item=>item.id===id)||palettes[0];
  }
  function cargoSymbol(type){const paths={pot:'M5 9h14v10H5zM3 9h18M9 6h6M12 4v2M2 12h3M19 12h3',speaker:'M5 3h14v18H5zM9 15a3 3 0 1 0 6 0 3 3 0 1 0-6 0M10 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0',box:'m3 6 9-4 9 4v13l-9 4-9-4zM3 6l9 5 9-5M12 11v12M7 4l9 5v6',cake:'M3 12h18v9H3zM5 12V8h14v4M8 8V4M16 8V4M3 16q3 4 6 0 3 4 6 0 3 4 6 0',melon:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M9 4q-5 8 0 16M15 4q5 8 0 16M12 3v18',vase:'M8 3h8l-2 6q9 9 1 13H9q-8-4 1-13zM8 6h8',compass:'M3 15h18v6H3zM4 15V5h16v10M9 12l2-5 4 5z',globe:'M5 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0M5 21h14M12 17v4',sprout:'m6 14 2 7h8l2-7zM12 14V7m0 3Q4 10 4 3q8 0 8 7m0-2q0-5 8-6 0 6-8 6'};return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[type]||paths.box}"/></svg>`;}
  function rememberDelivery(force=false){
    if(!sim||runExpress||sim.status!=='playing'||(!force&&mode!=='playing'))return;
    const snap=Checkpoint.capture(sim,runSetup);
    if(snap){
      save.saveCheckpoint(snap);
      lastCheckpoint=sim.elapsed;
    }
  }
  function clearInput(){jumpQueuedUntil=0;input.gas.clear();input.brake.clear();input.turbo.clear();input.reverse.clear();$('reverse-button').classList.remove('pressed');$('turbo-button').classList.remove('pressed');$('gas').classList.remove('pressed');$('brake').classList.remove('pressed');sim?.setControls(false,false);audio.update();}
  function syncInput(){const gas=input.gas.size>0,brake=input.brake.size>0,turbo=input.turbo.size>0;const reverse=input.reverse.size>0;sim?.setControls(gas,brake,turbo,reverse);$('reverse-button').classList.toggle('pressed',reverse&&mode==='playing');$('turbo-button').classList.toggle('pressed',turbo&&mode==='playing');$('gas').classList.toggle('pressed',gas&&mode==='playing');$('brake').classList.toggle('pressed',brake&&mode==='playing');audio.update();}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.remove('hidden');toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),3200);}
  function cards(){
    const level=levels[selected];
    const record=save.value.express[level.id];
    const completed=save.value.results[level.id];
    const total=save.totalStars();
    const pending=save.value.checkpoint;
    const canContinue=pending?.level===level.id;
    $('continue-button').classList.toggle('hidden',!canContinue);
    $('play-button').classList.toggle('hidden',canContinue);
    $('continue-button').title=pending?t(levels.find(item=>item.id===pending.level).title):'';
    $('home-wallet').textContent=String(save.value.workshop.wallet);
    $('play-label').textContent=t(completed?'Rejoacă livrarea':'La drum!');
    $('express-button').classList.toggle('hidden',!completed);
    $('express-record').textContent=record
      ? t(CurierData.expressMedals[record.medal])+' · '+preciseTime(record.time)
      : t('Țintă aur · {0}',time(CurierData.expressTarget(level)));
    const chapterNav=$('chapter-list');
    const navScroll=chapterNav.scrollLeft;
    chapterNav.replaceChildren();
    for(const chapter of CurierData.chapters){
      const first=levels.findIndex(item=>item.chapter===chapter.id);
      const button=document.createElement('button');
      button.textContent=t(chapter.name);
      button.disabled=!isUnlocked(first);
      if(button.disabled)button.title=t('Se deschide după „{0}”.',t(levels[first-1].title));
      button.setAttribute('aria-pressed',String(level.chapter===chapter.id));
      button.onclick=()=>{
        const next=levels.findIndex((item,i)=>item.chapter===chapter.id&&isUnlocked(i)&&!save.value.results[item.id]);
        selected=next<0?first:next;
        newSim();
        cards();
        chapterNav.querySelector('[aria-pressed=true]').focus({preventScroll:true});
      };
      chapterNav.append(button);
    }

    chapterNav.scrollLeft=navScroll;
    const active=chapterNav.querySelector('[aria-pressed=true]');
    if(active&&active.offsetLeft+active.offsetWidth>chapterNav.scrollLeft+chapterNav.clientWidth)chapterNav.scrollLeft=active.offsetLeft+active.offsetWidth-chapterNav.clientWidth;
    const list=$('level-list');
    list.replaceChildren();
    levels.forEach((entry,i)=>{
      if(entry.chapter!==level.chapter)return;
      const result=save.value.results[entry.id];
      const medal=save.value.express[entry.id]?.medal;
      const b=document.createElement('button');
      b.className='level-card'+(i===selected?' selected':'');
      b.disabled=!isUnlocked(i);
      b.setAttribute('aria-pressed',String(i===selected));
      b.setAttribute('aria-label',[(i+1)+'. '+t(entry.title),t(entry.rules.label),b.disabled?t('Blocat'):starsText(result?.stars||0),
        medal?t('Contra cronometru')+', '+t(CurierData.expressMedals[medal]):''].filter(Boolean).join('. '));
      const n=document.createElement('span');
      n.className='number';
      n.textContent=String(i+1).padStart(2,'0')+' · '+t(entry.rules.label).toUpperCase();
      const title=document.createElement('strong');
      title.textContent=t(entry.title);
      const status=document.createElement('span');
      status.className=b.disabled?'locked':'stars';
      status.textContent=b.disabled?t('Blocat'):starsText(result?.stars||0);
      const symbol=document.createElement('span');
      symbol.className='cargo-label';
      symbol.innerHTML=cargoSymbol(entry.cargo[0]);
      b.append(n,title,status,symbol);
      if(medal){
        const badge=document.createElement('span');
        badge.className='medal-tag medal-'+medal;
        badge.textContent=t(CurierData.expressMedals[medal]);
        b.append(badge);
      }
      b.onclick=()=>{
        selected=i;
        newSim();
        cards();
        list.querySelector('[aria-pressed=true]').focus({preventScroll:true});
      };
      list.append(b);
    });
    const current=list.querySelector('.selected');
    if(current)list.scrollLeft=Math.max(0,current.offsetLeft-list.offsetLeft-current.offsetWidth);
    $('total-stars').replaceChildren(document.createTextNode(total+' / '+levels.length*3+' '));
    const star=document.createElement('b');
    star.textContent='★';
    $('total-stars').append(star);
    $('client-avatar').innerHTML=Characters.portrait(level.character);
    $('home-client').textContent=t(level.title);
    $('home-quote').textContent=t(level.subtitle||level.district);
  }
  function showRoute(){
    const level=levels[selected];
    const map=CurierRouteMap;
    const marks=map.available(level),chart=$('route-chart');
    const rules=level.rules;
    const cabMedal=Cab.medalNames[save.value.cabRecords[level.id]];
    const facts=[t(level.obstacles.length===1?'{0} probă':'{0} probe',level.obstacles.length)];
    if(rules.deadline)facts.push(t('{0} timp limită',time(rules.deadline)),t('{0}% integritate minimă',Math.round(rules.minIntegrity*100)));
    if(cabMedal)facts.push(t('Din cabină')+' · '+t(cabMedal));
    $('route-district').textContent=t(level.district);
    $('route-title').textContent=t(level.title);
    $('route-conditions').textContent=facts.join(' · ');
    const legend=$('route-legend');
    legend.replaceChildren();
    function select(type){
      for(const button of legend.children)button.setAttribute('aria-pressed',String(button.dataset.type===type));
      $('route-feature').textContent=type?t(map.features[type].description):save.value.results[level.id]?(Story.scene(level.id,save.value.language)?.after||''):t('Atinge un punct pe hartă sau un semn din legendă.');
      map.draw(chart,level,marks,type);
    }
    for(const type of Object.keys(map.features)){
      if(!marks.some(mark=>mark.type===type))continue;
      const button=document.createElement('button');
      const dot=document.createElement('i');
      dot.style.backgroundColor=map.features[type].color;
      button.dataset.type=type;
      button.append(dot,t(map.features[type].name));
      button.onclick=()=>select(button.getAttribute('aria-pressed')==='true'?'':type);
      legend.append(button);
    }
    chart.onclick=event=>{const type=map.pick(chart,level,marks,event);if(type)select(type);};
    select('');
    mode='route-map';
    dialog('route-dialog');
  }
  function stampCount(){return Object.values(save.value.results).filter(r=>r.challenge).length;}
  function newSim(checkpoint){
    const vehicle=checkpoint?.vehicle||save.value.vehicle;
    runSetup=checkpoint?.setup||Workshop.clean(save.value.workshop,save.value.results);
    renderer.customs=Customs.equipped(save.value,vehicle);
    renderer.stickerId=save.value.sticker;
    renderer.upgradeLevels={...runSetup.levels};
    sim?.dispose();
    sim=new CurierPhysics.Simulation(runExpress?CurierData.expressLevel(levels[selected]):levels[selected],vehicle,runSetup);
    sim.runId='run-'+(crypto.randomUUID?.()||Date.now().toString(36)+'-'+(++runSerial)+'-'+Math.random().toString(36).slice(2,8));
    sim.contract=runSetup.contract;
    if(checkpoint)Checkpoint.restore(sim,checkpoint);
    lastCheckpoint=sim.elapsed;
    lastDriveEffect='';
    accumulator=0;
    renderer.resetCamera=true;
    renderer.particles=[];
    renderer.floats=[];
    renderer.confetti=[];
    renderer.ripples=[];
    renderer.traces=[];
    renderer.kick=0;
    renderer.lastDust=0;
    stuntUntil=0;stuntPriority=0;
    $('stunt-toast').classList.add('hidden');
  }
  function home(){
    if(mode==='playing')rememberDelivery(true);
    hideCab();clearInput();closeDialogs();mode='home';runExpress=false;
    $('home').classList.remove('hidden');$('hud').classList.add('hidden');cards();newSim();audio.update();
  }
  function begin(index=selected){
    if(!isUnlocked(index)||!levels[index])return false;
    const level=levels[index],story=Story.scene(level.id,save.value.language);
    if(!story||save.value.results[level.id])return start(index);
    selected=index;
    if(mode==='result')home();
    mode='story';
    $('story-chapter').textContent=t(CurierData.chapters.find(item=>item.id===level.chapter).name);
    $('story-title').textContent=story.title;
    $('story-text').textContent=story.before;
    dialog('story-dialog');
    return true;
  }
  function continueDelivery(){
    const checkpoint=save.value.checkpoint;
    if(!checkpoint)return false;
    return start(levels.findIndex(level=>level.id===checkpoint.level),false,checkpoint);
  }
  function start(index=selected,express=false,checkpoint=null) {
    if(!Number.isInteger(index)||index<0||index>=levels.length||!isUnlocked(index))return false;
    if(express&&!save.value.results[levels[index].id])return false;
    selected=index;
    runExpress=express;
    hideCab();clearInput();closeDialogs();
    mode='playing';
    newSim(checkpoint);
    if(!checkpoint)rememberDelivery(true);
    audio.unlock();
    $('home').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('mission-name').textContent=t(sim.level.title);
    $('mission-number').textContent=t(runExpress?'CRONOMETRU':'LIVRAREA')+' '+String(selected+1).padStart(2,'0')+' · '+t(sim.level.district).toUpperCase();
    const marks=sim.routeTrial.obstacles.map(obstacle=>{
      const dot=document.createElement('i');
      dot.style.left=(obstacle.x-260)/(sim.level.goal-260)*100+'%';
      return dot;
    });
    if(sim.service){
      const marker=document.createElement('i');
      marker.className='service-marker';
      marker.style.left=(sim.service.x-260)/(sim.level.goal-260)*100+'%';
      marks.push(marker);
    }
    if(sim.level.cabGate){
      const marker=document.createElement('i');
      marker.className='cab-marker';
      marker.style.left=(sim.level.cabGate-260)/(sim.level.goal-260)*100+'%';
      marks.push(marker);
    }
    $('cargo-slices').replaceChildren(...sim.cargo.map(()=>{
      const slot=document.createElement('i');
      slot.append(document.createElement('b'));
      return slot;
    }));
    $('route-marks').replaceChildren(...marks);
    routeMarkerState='';
    updateRoute();
    updatePowers();
    updateDriveStats();
    updateDrivingHint();
    $('route-progress').style.width=sim.progress*100+'%';
    $('rings-value').textContent=String(sim.collected.size);
    $('arcade-score').textContent=String(sim.bonus);
    $('rescue-charges').textContent=String(sim.rescueCharges);
    $('rescue-button').disabled=false;
    $('rescue-button').classList.remove('active');
    $('rescue-fill').style.width='0%';
    director.reset(sim.level.character,sim.level.dialogue);
    if(!checkpoint)director.say('start',0,true);
    else {bubbleUntil=0;$('client-bubble').classList.add('faded');}
    last=performance.now();
    return true;
  }
  function rescue(){if(mode!=='playing')return false;audio.unlock();return sim.useRescue();}
  function jump(){if(mode!=='playing')return false;audio.unlock();return sim.jump();}
  function tapJump(){
    if(mode!=='playing')return;
    jumpQueuedUntil=jump()?0:sim.elapsed+.14;
  }
  function deliver(){if(mode!=='playing'||!sim.deliver())return false;finish();return true;}
  function honk(){if(mode!=='playing')return false;audio.unlock();return sim.honk();}
  function updateDriveStats() {
    const { deadline, minIntegrity } = sim.level.rules;
    const remaining = deadline ? Math.ceil(Math.max(0, deadline - sim.elapsed)) : sim.elapsed;
    const integrity = Math.round(sim.integrity * 100);
    $('clock-label').textContent = t(deadline?'RĂMAS':'TIMP');
    $('timer').textContent = time(remaining);
    $('timer').classList.toggle('stat-warning', Boolean(deadline && remaining <= 7));
    $('health-value').textContent = integrity+'%';
    const slices=$('cargo-slices').children;
    for(let i=0;i<sim.cargo.length;i++){
      const item=sim.cargo[i];
      slices[i].firstChild.style.width=(item.lost?0:item.health)+'%';
      slices[i].classList.toggle('dented',item.health<74);
    }

    $('health-value').classList.toggle('stat-warning', Boolean(minIntegrity && sim.integrity < minIntegrity + .08));
    $('cargo-count').textContent = minIntegrity ? `Min. ${Math.round(minIntegrity * 100)}%` :
      t('{0} / {1} obiecte',sim.cargo.filter(c=>!c.lost).length,sim.cargo.length);
  }
  function updateRoute() {
    const { obstacles, next, passed, errors, cleanStreak }=sim.routeTrial;
    const state=(passed+errors)+'/'+cleanStreak;
    if(routeMarkerState===state)return;
    routeMarkerState=state;
    for(let i=0;i<obstacles.length;i++){
      const obstacle=obstacles[i];
      $('route-marks').children[i].className=obstacle.done?(obstacle.clean?'passed':'missed'):obstacle===next?'next':'';
    }
    $('probe-readout').textContent=t('{0} / {1} probe',passed+errors,obstacles.length);
    $('clean-streak').textContent=t('Serie ×{0}',cleanStreak);
    $('clean-streak').classList.toggle('hidden',cleanStreak<2);
  }
  function updateDrivingHint() {
    const approaching = sim.truck.position.x > sim.level.goal - 480;
    const obstacle = sim.routeTrial.hint();
    const x = sim.truck.position.x;
    const rewardAhead = sim.level.id==='cutii' && !runExpress &&
      x > sim.level.jumpSpots[0]-155 && x < sim.level.jumpSpots[0]+12;
    const tip = $('tip');
    const deliveryTip = $('delivery-tip');
    const surface=sim.onIce?'Polei · frânează din timp':sim.onGravel?'Pietriș · frânează mai devreme':'';
    const repackage=sim.nearService&&!sim.service.active&&!sim.canService&&!approaching;
    const briefing=sim.level.rules.deadline ? sim.elapsed<4 : sim.elapsed<7&&sim.truck.position.x<410;
    tip.classList.toggle('hidden', !obstacle && (approaching || (!repackage && !surface && !rewardAhead && !briefing)));
    tip.classList.toggle('obstacle-hint', Boolean(obstacle));
    $('horn-button').classList.toggle('cued', obstacle.startsWith('Acum claxonează'));
    $('jump-button').classList.toggle('cued', obstacle.startsWith('Acum sari'));
    if (obstacle) tip.textContent = t(obstacle);
    else if (repackage) tip.textContent=t('Reambalare · oprește în zona turcoaz');
    else if (surface) tip.textContent=t(surface);
    else if (rewardAhead) tip.textContent = t('Monede în aer · sari la marcajul galben');
    else if (sim.level.rules.deadline && sim.elapsed < 4) {
      const { deadline, minIntegrity } = sim.level.rules;
      tip.textContent = runExpress ? t('Aur la {0} · fără magneți sau bule',time(sim.level.par)) : t('Livrează în {0}s cu minimum {1}% integritate.',deadline,Math.round(minIntegrity*100));
    }
    else tip.textContent = t('Ține apăsat Gaz pentru a porni');
    deliveryTip.classList.toggle('hidden', !approaching || Boolean(obstacle));
    deliveryTip.textContent = t(sim.readyToDeliver?'Poți descărca marfa!':'Frânează și oprește în zona verde, apoi apasă Livrează.');
  }
  function gameEvent(e){
    renderer.event(e);
    if(!['splash','party','chickens'].includes(e.type))audio.effect(e.type,e.clean);
    const priority={rescue:4,shield:4,lost:3,obstacle:e.clean?0:4,service:4}[e.type]||0;
    if(!priority)return;
    if(mode==='playing'&&e.type==='lost')director.say('lost',sim.elapsed);
    if(sim.elapsed<stuntUntil&&priority<stuntPriority)return;
    stuntUntil=sim.elapsed+1.4;stuntPriority=priority;const el=$('stunt-toast');el.className=`stunt-toast ${e.type}${e.type==='obstacle'?(e.clean?' passed':' missed'):''}`;el.replaceChildren(document.createTextNode(t(e.text)));if(e.points){const small=document.createElement('small');small.textContent=t('+{0} puncte',e.points);el.append(small);}
  }
  function canEnterCab(){
    return Boolean(mode==='playing'&&sim.level.cabGate&&!sim.cabEntered&&
      Math.abs(sim.truck.position.x-sim.level.cabGate)<122);
  }
  function hideCab(){
    cab=null;
    $('cab-hud').classList.add('hidden');
    $('cab-access').classList.add('hidden');
  }
  function startCab(){
    if(!cab){
      if(!canEnterCab())return;
      sim.cabEntered=true;
      rememberDelivery(true);
    }else if(mode!=='cab-result')return;
    clearInput();
    const course=Cab.courses[sim.level.id];
    cab=new Cab.Run(course,save.value.workshop.levels.steering);
    accumulator=0;
    mode='cab';
    last=performance.now();
    closeDialogs();
    $('cab-access').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('cab-hud').classList.remove('hidden');
    $('cab-name').textContent=t(course.title);
    $('cab-left').focus({preventScroll:true});
    updateCab();
  }
  function leaveCab(){
    if(!cab)return;
    hideCab();
    closeDialogs();
    clearInput();
    mode='playing';
    accumulator=0;
    last=performance.now();
    $('hud').classList.remove('hidden');
    $('pause-button').focus({preventScroll:true});
  }
  function steerCab(direction){
    if(mode==='cab')cab.steer(direction);
  }
  function updateCab(){
    const left=Math.ceil(cab.duration-cab.elapsed);
    const hit=cab.elapsed-cab.lastHit<.42;
    $('cab-time').textContent=left+' s';
    $('cab-progress').value=cab.elapsed/cab.duration;
    $('cab-hud').classList.toggle('hit',hit);
    $('cab-hits').setAttribute('aria-label',t('{0} din {1} lovituri',cab.hits,Cab.maxHits));
    Array.from($('cab-hits').children).forEach((mark,i)=>mark.classList.toggle('spent',i<cab.hits));
    const callout=$('cab-callout');
    if(cab.elapsed<2.6)callout.textContent=t('Ferește-te de trafic cu săgețile');
    else if(hit)callout.textContent=t('Lovitură!');
    callout.classList.toggle('hidden',cab.elapsed>=2.6&&!hit);
  }
  function finishCab(){
    mode='cab-result';
    const medal=cab.medal;
    const firstMedal=medal>0&&Object.keys(save.value.cabRecords).length===0;
    const amount=save.finishCab(sim.level.id,medal);
    $('cab-result-course').textContent=t(cab.course.title);
    $('cab-result-title').textContent=medal?t('Medalie de {0}',t(Cab.medalNames[medal]).toLowerCase()):t('Proba s-a oprit');
    $('cab-result-copy').textContent=amount
      ? t('+{0} piese',amount)+'. '+t(medal===3?'Ai trecut fără lovituri.':'Poți relua proba pentru o medalie mai bună.')
      : t(medal?'Recordul rămâne. Îmbunătățește medalia pentru piese.':'Trei lovituri. Încearcă din nou sau continuă livrarea.');
    if(firstMedal)$('cab-result-copy').append(' '+t('Ai deblocat servodirecția și interiorul Laguna.'));
    dialog('cab-result-dialog');
    audio.tone(Boolean(medal));
  }
  function closeDialogs(){document.querySelectorAll('.dialog').forEach(el=>el.classList.add('hidden'));$('dialog-layer').classList.add('hidden');$('reset-confirm').classList.add('hidden');}
  function dialog(id){dialogFocus=document.activeElement;clearInput();closeDialogs();$('dialog-layer').classList.remove('hidden');$(id).classList.remove('hidden');$(id).querySelector('button:not(:disabled)')?.focus();}
  function pause(){
    if(mode==='cab'){
      mode='cab-paused';
      accumulator=0;
      dialog('cab-pause-dialog');
    }else if(mode==='playing'){
      rememberDelivery(true);
      mode='paused';
      accumulator=0;
      dialog('pause-dialog');
    }
  }
  function resume(){
    if(mode==='cab-paused'){
      closeDialogs();mode='cab';last=performance.now();$('cab-left').focus({preventScroll:true});return;
    }
    if(mode!=='paused')return;closeDialogs();clearInput();mode='playing';accumulator=0;last=performance.now();$('pause-button').focus();audio.update();}
  function finish(){
    if(mode!=='playing')return;
    const success=sim.status==='delivered',previous=save.value.results[sim.level.id],result=sim.result();lastResult={...result,success};
    const challenge=success&&CurierData.challengeMet(sim.level,result);
    mode='result';clearInput();
    if(runExpress){finishExpress(result);return;}
    const oldStars=save.totalStars();
    const styles=Customs.groups.flatMap(group=>group.options).filter(item=>!Customs.allowed(item,save.value));
    const oldStickers=new Set(Fun.stickers.filter(s=>Fun.unlocked(s.id,save.value.career,save.value.results)).map(s=>s.id));
    const reward=save.finishRun(sim.level.id,result,sim.contract,sim.runId,challenge);
    const reveal=success&&!previous?Story.scene(sim.level.id,save.value.language)?.after:'';
    $('story-reveal').textContent=reveal||'';
    $('story-reveal').classList.toggle('hidden',!reveal);
    $('reward-amount').textContent=t('+{0} piese',reward.amount);
    $('reward-detail').textContent=reward.contractMet
      ? t('Contract îndeplinit! +{0} piese bonus. Sold: {1}.',reward.contractBonus,save.value.workshop.wallet)
      : success
        ? t('Livrare și piese adunate. Sold: {0}.',save.value.workshop.wallet)
        : t('{0} piese din acrobații. Mai încercăm?',reward.parts);
    const bonusNotes=[];
    if(reward.routeBonus)bonusNotes.push(t('prima livrare +{0}',reward.routeBonus));
    if(reward.stampBonus)bonusNotes.push(t('ștampilă nouă +{0}',reward.stampBonus));
    if(bonusNotes.length)$('reward-detail').append(' Bonus: '+bonusNotes.join(' · ')+'.');
    if(success)renderer.celebrate();
    if(!reward.saved)toast('Progresul rămâne disponibil până închizi jocul.');
    const newStickers=Fun.stickers.filter(s=>!oldStickers.has(s.id)&&Fun.unlocked(s.id,save.value.career,save.value.results));
    $('fun-result').classList.toggle('new-reward',newStickers.length>0);$('fun-result').textContent=newStickers.length?t('Abțibild nou: {0}! Îl găsești în Cartier.',newStickers.map(item=>t(item.name)).join(', ')):t('{0} magneți · {1} bălți · {2} treceri cu respect pentru pene',result.fun.magnets,result.fun.splashes,result.fun.polite);
    $('result-eyebrow').textContent=t(success?'LIVRARE ÎNCHEIATĂ':'SE MAI ÎNTÂMPLĂ ÎN CARTIER');
    $('result-title').textContent=t(success?(result.stars===3?'Livrare de nota zece!':'A ajuns la destinație!'):'Mai facem o tură?');
    const spoken=director.say(success?'finish':'fail',sim.elapsed,true);
    $('result-copy').textContent=success?`„${t(spoken.text)}” — ${t(sim.level.client.name)}`:`${t(sim.reason,...(sim.reasonValues||[]))} „${t(spoken.text)}”`;
    $('quest-result').classList.toggle('complete',challenge);$('quest-result').textContent=challenge?t('Ștampilă câștigată: {0}',t(sim.level.challenge.title)):t('Provocare opțională: {0}',t(sim.level.challenge.description));
    $('result-stars').replaceChildren();for(let i=0;i<3;i++){const star=document.createElement('span');star.textContent='★';if(i>=result.stars)star.className='empty';$('result-stars').append(star);}$('result-stars').setAttribute('aria-label',t('{0} din 3 stele',result.stars));
    $('result-health').textContent=`${Math.round(result.integrity*100)}%`;$('result-time').textContent=time(result.seconds);
    $('result-score').textContent=String(result.score);$('result-stunts').textContent=t('{0} monede · {1} aterizări cu stil · {2} chingi folosite · {3}/{4} probe fără greșeli',result.rings,result.jumps,result.rescuesUsed,sim.routeTrial.passed,sim.routeTrial.obstacles.length);
    const unlocked=[...Workshop.upgrades.filter(u=>!previous&&success&&u.unlockAfter===sim.level.id),...vehicles.filter(v=>v.stars>oldStars&&v.stars<=save.totalStars()),...palettes.filter(p=>p.stars>oldStars&&p.stars<=save.totalStars()),...Characters.cast.filter(c=>!previous&&success&&c.unlockAfter===sim.level.id),...styles.filter(item=>Customs.allowed(item,save.value))];
    $('unlock-note').textContent=success?(unlocked.length?t('Ai deblocat: {0}!',unlocked.map(item=>t(item.name)).join(', ')):(!previous&&selected<levels.length-1?t('Ai deblocat următoarea livrare.'):selected===levels.length-1?t('Ești legenda cartierului! Cât de mare poți face scorul?'):t('Un nou record? Mai e loc de o tură.'))):t('Încearcă ȚINE! înainte de rampă. Marfa îți va mulțumi.');
    if(success&&!previous&&selected===0)$('unlock-note').append(' '+t('Ai deschis și cursa contra cronometru.'));
    $('next-button').firstChild.textContent=t(success&&selected<levels.length-1?'Următoarea livrare':success?'Înapoi în cartier':'Încerc din nou')+' ';
    dialog('result-dialog');audio.tone(success);
  }
  function finishExpress(result){
    $('story-reveal').classList.add('hidden');
    const unlocked=save.finishExpress(sim.level.id,result,sim.runId);
    const medal=unlocked.medal;
    $('result-eyebrow').textContent=t('CONTRA CRONOMETRU');
    $('result-title').textContent=medal?t('Medalie de {0}',t(CurierData.expressMedals[medal]).toLowerCase())+'!':t('Mai încearcă o tură');
    $('result-copy').textContent=medal?t(unlocked.record?'Record personal!':'Livrare reușită.'):t(sim.reason,...(sim.reasonValues||[]));
    $('quest-result').classList.toggle('complete',medal===3);
    $('quest-result').textContent=t('Țintă aur · {0} · 94% integritate · probe curate',time(sim.level.par));
    $('fun-result').textContent='';
    $('reward-amount').textContent=t('+{0} piese',unlocked.amount);
    $('reward-detail').textContent=t(unlocked.amount?'Bonus pentru o medalie nouă.':'Bonusul crește când îmbunătățești medalia.');
    $('result-stars').textContent=starsText(medal);
    $('result-stars').setAttribute('aria-label',t(medal?CurierData.expressMedals[medal]:'Fără medalie'));
    $('result-health').textContent=Math.round(result.integrity*100)+'%';
    $('result-time').textContent=preciseTime(result.seconds);
    $('result-score').textContent=String(result.score);
    $('result-stunts').textContent=t('{0} / {1} probe curate',sim.routeTrial.passed,sim.routeTrial.obstacles.length);
    $('unlock-note').textContent='';
    $('next-button').firstChild.textContent=t('Înapoi la livrări')+' ';
    if(medal)renderer.celebrate();
    if(!unlocked.saved)toast('Progresul rămâne disponibil până închizi jocul.');
    dialog('result-dialog');
    audio.tone(Boolean(medal));
  }
  function workshop(){home();mode='workshop';renderWorkshop();dialog('workshop-dialog');}
  function renderWorkshop(){const s=save.value.workshop;$('workshop-wallet').textContent=String(s.wallet);$('workshop-warning').classList.toggle('hidden',save.available);const list=$('upgrade-list');list.replaceChildren();for(const u of Workshop.upgrades){const rank=s.levels[u.id],price=Workshop.cost(s,u.id),open=Workshop.unlocked(u,save.value.results,save.value.cabRecords),card=document.createElement('article');card.className='upgrade-card';card.dataset.upgrade=u.id;const icon=document.createElement('span');icon.className='upgrade-icon';icon.innerHTML=Workshop.icon(u.icon);const title=document.createElement('div'),name=document.createElement('h3'),meter=document.createElement('span');name.textContent=t(u.name);meter.className='upgrade-rank';for(let i=0;i<3;i++){const bar=document.createElement('i');if(i<rank)bar.className='done';meter.append(bar);}meter.append(document.createTextNode(` ${rank} / 3`));title.append(name,meter);const desc=document.createElement('p');desc.textContent=rank===3?t(u.tag)+'. '+t('Nivel maxim.'):t(u.detail[rank]);const b=document.createElement('button');b.className='upgrade-buy';b.disabled=!open||price===null||s.wallet<price;b.textContent=!open?(u.cabMedal?t('Câștigă o medalie din cabină'):t('După „{0}”',t(levels.find(l=>l.id===u.unlockAfter).title))):price===null?t('Nivel maxim'):s.wallet<price?t('{0} piese · mai ai nevoie de {1}',price,price-s.wallet):t('Îmbunătățește · {0} piese',price);b.onclick=()=>{if(save.buyUpgrade(u.id)){newSim();cards();renderWorkshop();toast(t('{0}: nivelul {1}!',t(u.name),save.value.workshop.levels[u.id]));}};card.append(icon,title,desc,b);list.append(card);}const jobs=$('contract-list');jobs.replaceChildren();for(const job of Workshop.contracts){const b=document.createElement('button');b.className='contract-card'+(s.contract===job.id?' selected':'');b.dataset.contract=job.id;b.setAttribute('aria-pressed',String(s.contract===job.id));const name=document.createElement('strong'),desc=document.createElement('span'),reward=document.createElement('span'),count=document.createElement('small');name.textContent=t(job.name);desc.className='contract-desc';desc.textContent=t(job.description);reward.className='contract-reward';reward.textContent=t('+{0} piese',job.bonus);count.textContent=t(s.contract===job.id?'Ales pentru următoarea tură':'Alege contractul')+' · '+t('{0} reușite',s.completed[job.id]);b.append(name,desc,reward,count);b.onclick=()=>{save.value.workshop.contract=job.id;save.write();cards();renderWorkshop();};jobs.append(b);}}
  function settings(){mode='settings';renderSettings();dialog('settings-dialog');}
  function renderSettings(){
    $('language-ro').setAttribute('aria-pressed',String(save.value.language==='ro'));
    $('language-en').setAttribute('aria-pressed',String(save.value.language==='en'));
    $('sound-toggle').setAttribute('aria-checked',String(save.value.sound));$('sound-toggle').textContent=t(save.value.sound?'Pornite':'Oprite');
    $('save-warning').classList.toggle('hidden',save.available);const list=$('paint-list');list.replaceChildren();
    palettes.forEach(p=>{const b=document.createElement('button');b.className='paint'+(p.id===paint().id?' selected':'');b.disabled=save.totalStars()<p.stars;b.setAttribute('aria-pressed',String(p.id===paint().id));const sw=document.createElement('span');sw.className='swatch';sw.style.backgroundColor=p.color;sw.setAttribute('aria-hidden','true');b.append(sw,document.createTextNode(t(p.name)));const sub=document.createElement('small');sub.textContent=b.disabled?t('{0} stele',p.stars):t(p.id===paint().id?'Aleasă':'Disponibilă');b.append(sub);b.onclick=()=>{if(save.paintVehicle(save.value.vehicle,p.id))renderSettings();};list.append(b);});
    const garage=$('vehicle-list');garage.replaceChildren();
    vehicles.forEach(v=>{const b=document.createElement('button');b.className='vehicle-card'+(v.id===save.value.vehicle?' selected':'');b.disabled=save.totalStars()<v.stars;b.setAttribute('aria-pressed',String(v.id===save.value.vehicle));b.setAttribute('aria-label',`${t(v.name)}. ${t(v.description)} ${b.disabled?t('{0} stele necesare',v.stars):t(v.id===save.value.vehicle?'Aleasă':'Disponibilă')}`);
      const canvas=document.createElement('canvas');canvas.width=300;canvas.height=150;canvas.setAttribute('aria-hidden','true');garagePreview(canvas,v);
      const name=document.createElement('strong');name.textContent=t(v.name);const tag=document.createElement('span');tag.className='vehicle-tag';tag.textContent=t(v.tag);const lock=document.createElement('span');lock.className='vehicle-lock';lock.textContent=b.disabled?t('{0} stele',v.stars):t(v.id===save.value.vehicle?'La volan':'Alege mașina');const description=document.createElement('span');description.className='vehicle-description';description.textContent=t(v.description);b.append(canvas,name,tag,lock,description);b.onclick=()=>{save.value.vehicle=v.id;save.write();newSim();renderSettings();};garage.append(b);
    });
  }
  function garagePreview(canvas,vehicle){
    const c=canvas.getContext('2d'),style=Customs.equipped(save.value,vehicle.id);
    const scale=Math.min(canvas.width/270,canvas.height/157);
    c.clearRect(0,0,canvas.width,canvas.height);
    c.save();c.translate(canvas.width*.46,canvas.height*.64);c.scale(scale,scale);
    renderer.lightUnderbody(c,style);
    renderer.wheels(c,[-58,60].map(x=>({position:{x,y:23},angle:0,circleRadius:vehicle.wheel})),0,style);
    renderer.van(c,paint(vehicle.id),vehicle.id,false,style);
    c.restore();
  }
  function showCustoms(){
    mode='customs';
    renderCustoms();
    dialog('customs-dialog');
  }
  function renderCustoms(){
    const vehicle=vehicles.find(item=>item.id===save.value.vehicle);
    const equipped=Customs.equipped(save.value,vehicle.id);
    const group=Customs.groups.find(item=>item.id===customGroup)||Customs.groups[0];
    const tabs=$('customs-tabs'),list=$('customs-options'),canvas=$('customs-car');
    tabs.replaceChildren();
    list.replaceChildren();
    $('customs-vehicle').textContent=t(vehicle.name);
    if(group.id==='cab'||group.id==='charm'){
      const c=canvas.getContext('2d');
      CurierCabArt.draw(c,canvas.width,canvas.height,new Cab.Run(Cab.courses.tort),paint(),equipped,true);
    }else garagePreview(canvas,vehicle);
    for(const entry of Customs.groups){
      const tab=document.createElement('button');
      tab.textContent=t(entry.name);
      tab.dataset.category=entry.id;
      tab.setAttribute('aria-pressed',String(entry.id===group.id));
      tab.onclick=()=>{
        customGroup=entry.id;
        renderCustoms();
        tabs.querySelector('[aria-pressed=true]').focus({preventScroll:true});
      };
      tabs.append(tab);
    }
    const choices=document.createElement('div');
    choices.className='customs-choices';
    for(const option of group.options){
      const button=document.createElement('button'),swatch=document.createElement('i'),name=document.createElement('span');
      button.className='customs-choice';
      button.dataset.option=option.id;
      button.dataset.group=group.id;
      button.disabled=!Customs.allowed(option,save.value);
      button.setAttribute('aria-pressed',String(equipped[group.id].id===option.id));
      swatch.style.backgroundColor=group.id==='trim'&&option.id==='stock'?paint().color:option.color;
      swatch.setAttribute('aria-hidden','true');
      name.textContent=t(option.name);
      button.append(swatch,name);
      if(button.disabled){
        const hint=document.createElement('small');hint.textContent=t(option.hint);button.append(hint);
      }
      button.onclick=()=>{
        if(!save.equip(vehicle.id,group.id,option.id))return;
        renderer.customs=Customs.equipped(save.value,vehicle.id);
        renderCustoms();
        list.querySelector('[data-option="'+option.id+'"]').focus({preventScroll:true});
      };
      choices.append(button);
    }
    list.append(choices);
  }
  function collection(){mode='collection';$('collection-preview').textContent='';renderCollection();dialog('collection-dialog');}
  function renderCollection(){renderAlbum();const unlocked=Characters.cast.filter(c=>Characters.isUnlocked(c.id,save.value.results)).length;$('collection-progress').textContent=t('{0} / 4 personaje cunoscute · {1} / {2} ștampile',unlocked,stampCount(),levels.length)+(stampCount()===levels.length?' · '+t('Curier de legendă!'):'');const list=$('character-list');list.replaceChildren();
    for(const c of Characters.cast){const open=Characters.isUnlocked(c.id,save.value.results),card=document.createElement('article');card.className='character-card'+(open?'':' locked');const avatar=document.createElement('span');avatar.className='portrait';avatar.innerHTML=Characters.portrait(c.id,!open);const data=document.createElement('div');const name=document.createElement('h3');name.textContent=t(open?c.name:'Un vecin misterios');const tag=document.createElement('span');tag.className='character-tag';tag.textContent=t(open?c.tag:'Se deblochează pe traseu');const bio=document.createElement('p');bio.textContent=open?t(c.bio):t('Termină „{0}”.',t(levels.find(l=>l.id===c.unlockAfter)?.title));data.append(name,tag,bio);card.append(avatar,data);
      if(open){const b=document.createElement('button');b.className='character-listen';b.textContent=t('Citește o replică');b.onclick=()=>{const line=director.preview(c.id);$('collection-preview').textContent=`${t(c.name)}: „${t(line.text)}”`;};card.append(b);}list.append(card);
    }
    const stamps=$('stamp-list');stamps.replaceChildren();for(const l of levels){const s=document.createElement('div'),earned=!!save.value.results[l.id]?.challenge;s.className='stamp'+(earned?' earned':'');const icon=document.createElement('b');icon.textContent=earned?'✦':'◇';s.append(icon,document.createTextNode(t(l.challenge.title)));s.title=t(l.challenge.description);stamps.append(s);}
  }
  function renderAlbum(){const career=save.value.career,results=save.value.results,list=$('sticker-list');list.replaceChildren();let count=0;for(const s of Fun.stickers){const open=Fun.unlocked(s.id,career,results);if(open)count++;const b=document.createElement('button');b.className='sticker-choice'+(save.value.sticker===s.id?' selected':'');b.disabled=!open;b.setAttribute('aria-pressed',String(save.value.sticker===s.id));b.innerHTML=Fun.icon(s.id);const name=document.createElement('strong'),hint=document.createElement('small');name.textContent=t(s.name);hint.textContent=t(open?(save.value.sticker===s.id?'Pe dubița ta':'Lipește pe dubiță'):s.hint);b.append(name,hint);b.onclick=()=>{save.value.sticker=s.id;save.write();renderer.stickerId=s.id;renderAlbum();toast(t('{0} e pe dubița ta!',t(s.name)));};list.append(b);}$('album-count').textContent=t('{0} / {1} câștigate',count,Fun.stickers.length);$('album-career').textContent=t('{0} monede · {1} aterizări',career.rings,career.jumps);$('sticker-none').disabled=save.value.sticker==='none';}
  function updatePowers(){
    const f=sim.fun;
    $('magnet-status').classList.toggle('hidden',f.magnet<=0);
    $('bubble-status').classList.toggle('hidden',f.bubble<=0);
    $('magnet-time').textContent='Magnet · '+Math.ceil(f.magnet)+'s';
    $('bubble-time').textContent=t('Bulă')+' · '+Math.ceil(f.bubble)+'s';
    $('horn-button').disabled=f.hornCooldown>0;
    $('jump-button').classList.toggle('unavailable',sim.jumpCooldown>0||!sim.grounded);
    $('energy-fill').style.width=sim.energy/sim.tuning.turboCapacity*100+'%';
    $('pieces-value').textContent=sim.gates.size+' / '+sim.level.pilotGates.length;
    $('deliver-wrapper').classList.toggle('hidden',!sim.readyToDeliver);
    $('hud').classList.toggle('can-deliver',sim.readyToDeliver);
    $('cab-access').classList.toggle('hidden',!canEnterCab());
    const active=Boolean(sim.service?.active);
    $('service-wrapper').classList.toggle('hidden',!active&&!sim.canService);
    $('service-button').disabled=active;
    $('service-label').textContent=t(active?'Reambalăm…':'Reambalează');
    $('service-fill').style.width=(active?sim.service.ticks/CurierPhysics.SERVICE_TICKS*100:0)+'%';
  }
  function closeHomeDialog(){closeDialogs();mode='home';audio.update();if(dialogFocus?.isConnected)dialogFocus.focus();}
  function pedal(id,...actions){
    const button=$(id);
    button.addEventListener('pointerdown',e=>{
      if(mode!=='playing'||e.button!==0)return;
      e.preventDefault();
      audio.unlock();
      button.setPointerCapture(e.pointerId);
      for(const action of actions)input[action].add(e.pointerId);
      syncInput();
    });
    const release=e=>{
      for(const action of actions)input[action].delete(e.pointerId);
      syncInput();
    };
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
  }
  pedal('gas','gas');
  pedal('brake','brake');
  pedal('reverse-button','reverse');
  pedal('turbo-button','turbo','gas');
  $('hud').addEventListener('contextmenu',e=>e.preventDefault());
  $('play-button').onclick=()=>begin();$('continue-button').onclick=continueDelivery;$('story-start').onclick=()=>start();$('story-back').onclick=home;$('express-button').onclick=()=>start(selected,true);$('pause-button').onclick=pause;$('restart-button').onclick=()=>start(selected,runExpress);$('resume-button').onclick=resume;$('pause-retry').onclick=()=>start(selected,runExpress);$('pause-home').onclick=home;$('result-retry').onclick=()=>start(selected,runExpress);$('result-home').onclick=home;
  $('next-button').onclick=()=>{if(runExpress){home();return;}if(lastResult.success&&selected<levels.length-1)begin(selected+1);else if(lastResult.success)home();else start();};
  $('route-map-button').onclick=showRoute;
  $('route-close').onclick=closeHomeDialog;
  $('route-start').onclick=()=>begin();
  $('cab-enter').onclick=startCab;
  $('cab-pause').onclick=pause;
  $('cab-resume').onclick=resume;
  $('cab-exit').onclick=leaveCab;
  $('cab-done').onclick=leaveCab;
  $('cab-retry').onclick=startCab;
  for(const [id,direction] of [['cab-left',-1],['cab-right',1]]){
    const button=$(id);
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();
      steerCab(direction);
    });
    button.onclick=event=>{if(event.detail===0)steerCab(direction);};
  }
  $('customs-open').onclick=showCustoms;
  $('customs-back').onclick=settings;
  $('service-button').onclick=()=>{if(mode==='playing'&&sim.startService())audio.unlock();};
  $('help-button').onclick=()=>{mode='help';dialog('help-dialog');};$('help-close').onclick=closeHomeDialog;$('settings-button').onclick=settings;$('garage-button').onclick=workshop;$('settings-close').onclick=closeHomeDialog;$('rescue-button').onclick=rescue;$('collection-button').onclick=collection;$('collection-close').onclick=closeHomeDialog;$('collection-done').onclick=closeHomeDialog;
  $('jump-button').addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    e.preventDefault();
    tapJump();
  });
  $('jump-button').onclick=e=>{if(e.detail===0)tapJump();};$('deliver-button').onclick=deliver;$('result-workshop').onclick=workshop;$('workshop-close').onclick=closeHomeDialog;$('workshop-garage').onclick=settings;$('workshop-play').onclick=()=>begin();
  $('horn-button').onclick=honk;$('sticker-none').onclick=()=>{save.value.sticker='none';save.write();renderer.stickerId='none';renderAlbum();};
  for(const language of ['ro','en']){
    $('language-'+language).onclick=()=>{
      save.value.language=language;save.write();I18n.select(language);cards();renderSettings();
    };
  }
  $('sound-toggle').onclick=()=>{save.value.sound=!save.value.sound;save.write();audio.unlock();audio.update();renderSettings();};
  $('reset-button').onclick=()=>$('reset-confirm').classList.remove('hidden');$('reset-no').onclick=()=>$('reset-confirm').classList.add('hidden');$('reset-yes').onclick=()=>{save.reset();I18n.select(save.value.language);selected=0;cards();newSim();renderSettings();$('reset-confirm').classList.add('hidden');audio.update();toast('Progresul local a fost șters.');};
  function back(){if(mode==='customs'){settings();return true;}if(mode==='story'){home();return true;}if(mode==='cab-paused'||mode==='cab-result'){leaveCab();return true;}if(mode==='playing'||mode==='cab'){pause();return true;}if(mode==='paused'||mode==='result'){home();return true;}if(mode==='settings'||mode==='help'||mode==='collection'||mode==='workshop'||mode==='route-map'){closeHomeDialog();return true;}return false;}
  window.handleAndroidBack=back;window.pauseCurier=pause;
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Tab'&&!$('dialog-layer').classList.contains('hidden')){
      const buttons=[...document.querySelector('.dialog:not(.hidden)').querySelectorAll('button:not(:disabled)')].filter(el=>el.offsetParent!==null);const a=buttons[0],b=buttons.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b?.focus();}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a?.focus();}return;
    }
    if(e.code==='Escape'||e.code==='KeyP'){if(e.repeat)return;e.preventDefault();(mode==='paused'||mode==='cab-paused')?resume():back();return;}
    if(mode==='cab'){
      const steer=['ArrowLeft','KeyA'].includes(e.code)?-1:['ArrowRight','KeyD'].includes(e.code)?1:0;
      if(steer){e.preventDefault();if(!e.repeat)steerCab(steer);}
      return;
    }
    if(mode!=='playing')return;
    if(['Space','KeyW','ArrowUp'].includes(e.code)){e.preventDefault();if(!e.repeat)jump();return;}
    if(['ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();input.turbo.add(e.code);syncInput();return;}
    if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)deliver();return;}
    if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)start(selected,runExpress);return;}
    if(e.code==='KeyC'&&canEnterCab()){e.preventDefault();if(!e.repeat)startCab();return;}
    if(e.code==='KeyH'){e.preventDefault();if(!e.repeat)honk();return;}
    if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)rescue();return;}
    const action=['ArrowDown','KeyS'].includes(e.code)?'reverse':['ArrowRight','KeyD'].includes(e.code)?'gas':['ArrowLeft','KeyA'].includes(e.code)?'brake':null;
    if(action){e.preventDefault();audio.unlock();input[action].add(e.code);syncInput();}
  });
  document.addEventListener('keyup',e=>{input.gas.delete(e.code);input.brake.delete(e.code);input.turbo.delete(e.code);input.reverse.delete(e.code);syncInput();});
  window.addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});window.addEventListener('resize',()=>renderer.resize());
  window.addEventListener('pagehide',()=>{if(mode==='playing')rememberDelivery(true);});
  function driveEffect(){
    const effect=sim.reversing?'reverse':sim.boosting?'boost':sim.onIce?'ice':sim.onGravel?'gravel':'';
    if(effect===lastDriveEffect)return;
    lastDriveEffect=effect;
    if(effect)audio.effect(effect);
  }
  function frame(now){
    const dt=Math.max(0,Math.min((now-last)/1000,.1));last=now;
    if(cab){
      if(mode==='cab'){
        accumulator+=dt;
        while(accumulator>=1/60&&!cab.finished){
          cab.step(1/60);
          accumulator-=1/60;
        }
        updateCab();
        if(cab.finished)finishCab();
      }
      renderer.drawCab(cab,paint(sim.vehicle.id),reduced);
      requestAnimationFrame(frame);
      return;
    }
    if(mode==='playing'){
      accumulator+=dt;let steps=0;while(accumulator>=1/60&&steps<6&&mode==='playing'){if(jumpQueuedUntil>0&&(sim.elapsed>jumpQueuedUntil||jump()))jumpQueuedUntil=0;sim.step();accumulator-=1/60;steps++;if(sim.status!=='playing')finish();}
      if(steps===6)accumulator=0;
      if(mode==='playing'&&sim.elapsed>=lastCheckpoint+1.8)rememberDelivery();
      if(mode==='playing')driveEffect();
      for(const impact of sim.impacts.splice(0)){
        renderer.puff(impact.x,impact.y,impact.lost);
        audio.impact(impact.force);
      }
      for(const event of sim.events.splice(0))gameEvent(event);
      if(sim.elapsed>=stuntUntil)$('stunt-toast').classList.add('hidden');
      updatePowers();
      updateDriveStats();updateRoute();$('route-progress').style.width=`${sim.progress*100}%`;
      updateDrivingHint();audio.update();
      $('rings-value').textContent=String(sim.collected.size);$('arcade-score').textContent=String(sim.bonus);$('rescue-charges').textContent=String(sim.rescueCharges);$('rescue-button').disabled=sim.rescueRemaining>0||sim.rescueCharges<=0;$('rescue-button').classList.toggle('active',sim.rescueRemaining>0);$('rescue-fill').style.width=`${sim.rescueRemaining/sim.tuning.rescueDuration*100}%`;$('client-bubble').classList.toggle('faded',sim.elapsed>bubbleUntil);
    }
    renderer.draw(sim,paint(sim.vehicle.id),['home','help','settings','collection','workshop','route-map','customs','story'].includes(mode),dt,reduced);
    requestAnimationFrame(frame);
  }
  // Read-only snapshot is useful for repeatable QA; progress is awarded only by finish().
  window.CurierGame={snapshot:()=>({mode,language:save.value.language,checkpoint:save.value.checkpoint?{level:save.value.checkpoint.level,elapsed:save.value.checkpoint.fields.elapsed,x:save.value.checkpoint.truck[0]}:null,reversing:sim.reversing,cab:cab?{elapsed:cab.elapsed,duration:cab.duration,lane:cab.lane,hits:cab.hits,medal:cab.medal}:null,cabRecords:{...save.value.cabRecords},customs:Customs.equipped(save.value,save.value.vehicle),level:sim.level.id,elapsed:sim.elapsed,status:sim.status,integrity:sim.integrity,x:sim.truck.position.x,progress:sim.progress,stars:save.totalStars(),gas:input.gas.size>0,brake:input.brake.size>0,vehicle:sim.vehicle.id,turbo:input.turbo.size>0,boosting:sim.boosting,energy:sim.energy,energyMax:sim.tuning.turboCapacity,manualJumps:sim.manualJumps,jumpCooldown:sim.jumpCooldown,airGates:sim.gates.size,angle:sim.truck.angle,speed:sim.truck.velocity.x,route:{passed:sim.routeTrial.passed,errors:sim.routeTrial.errors,cleanStreak:sim.routeTrial.cleanStreak,hint:sim.routeTrial.hint()},readyToDeliver:sim.readyToDeliver,service:sim.service?{...sim.service,canStart:sim.canService}:null,workshop:JSON.parse(JSON.stringify(save.value.workshop)),rings:sim.collected.size,jumps:sim.jumps,score:sim.result().score,rescueCharges:sim.rescueCharges,rescueRemaining:sim.rescueRemaining,airborne:sim.airborne,character:sim.level.character,stamps:stampCount(),dialogue:director.lastLine?.id||null,express:runExpress,expressRecords:{...save.value.express},gravel:sim.onGravel,sticker:save.value.sticker,career:{...save.value.career},fun:{magnet:sim.fun.magnet,bubble:sim.fun.bubble,horn:sim.fun.horn,hornCooldown:sim.fun.hornCooldown,stats:sim.fun.result(),collected:[...sim.fun.collected],visited:[...sim.fun.visited]}}),start,pause,resume};
  selected=save.value.checkpoint?levels.findIndex(level=>level.id===save.value.checkpoint.level):firstUnfinished();home();requestAnimationFrame(frame);
})();
