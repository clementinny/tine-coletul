'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.CURIER_PLAYWRIGHT||'playwright');
const url=pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href;
const qa=path.resolve(__dirname,'../qa');fs.mkdirSync(qa,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CURIER_CHROME?{executablePath:process.env.CURIER_CHROME}:{})});
 const errors=[],external=[];
 try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  await page.clock.install();await page.goto(url);await page.clock.runFor(100);
  async function play(){
    const pending=page.locator('#continue-button');
    if(await pending.isVisible())await pending.click();
    else{
      await page.click('#play-button');
      if(await page.locator('#story-dialog').isVisible())await page.click('#story-start');
    }
  }
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).mode,'home');
  assert.equal(await page.locator('.level-card:disabled').count(),5);
  await page.screenshot({path:path.join(qa,'home-desktop.png')});await page.click('#garage-button');assert.equal(await page.locator('.upgrade-buy:disabled').count(),8);await page.locator('[data-contract="careful"]').click();assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.contract,'careful');await page.click('#workshop-close');
  await page.click('#collection-button');assert.equal(await page.locator('.character-card.locked').count(),3);assert.equal(await page.locator('.sticker-choice:disabled').count(),7);assert.equal(await page.locator('.sticker-choice').count(),8);await page.screenshot({path:path.join(qa,'collection-locked.png')});await page.click('#collection-close');
  await page.click('#help-button');assert.equal(await page.locator('#help-dialog').isVisible(),true);await page.keyboard.press('Escape');
  await play();await page.keyboard.press('h');await page.clock.runFor(50);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).fun.stats.horns,1);await page.keyboard.press('h');assert.equal((await page.evaluate(()=>CurierGame.snapshot())).fun.stats.horns,1);await page.keyboard.down('ArrowRight');await page.clock.runFor(500);await page.keyboard.press('Space');await page.keyboard.down('ShiftLeft');await page.clock.runFor(300);let pilot=await page.evaluate(()=>CurierGame.snapshot());assert.equal(pilot.manualJumps,1);assert.equal(pilot.boosting,true);assert.ok(pilot.energy<pilot.energyMax);await page.click('#pause-button');
  let snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.mode,'paused');assert.equal(snap.gas,false);const pausedTime=snap.elapsed,pausedEnergy=snap.energy;assert.equal(snap.turbo,false);await page.clock.runFor(3000);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).elapsed,pausedTime);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).energy,pausedEnergy);
  await page.click('#resume-button');await page.keyboard.up('ShiftLeft');await page.keyboard.up('ArrowRight');await page.keyboard.press('r');assert.equal((await page.evaluate(()=>CurierGame.snapshot())).manualJumps,0);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.wallet,0);
  await page.keyboard.down('ArrowRight');
  let rescued=false,shotSplash=false,shotChicken=false,slowed=false;
  for(let i=0;i<80;i++){await page.clock.runFor(250);snap=await page.evaluate(()=>CurierGame.snapshot());if(snap.x>990&&!rescued){await page.click('#rescue-button');await page.clock.runFor(450);rescued=true;snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.rescueCharges,1);assert.ok(snap.rescueRemaining>0);await page.screenshot({path:path.join(qa,'arcade-action.png')});assert.equal(snap.rings,0);assert.equal(snap.fun.magnet,0);assert.equal(snap.fun.bubble,0);await page.click('#pause-button');const funPause=await page.evaluate(()=>CurierGame.snapshot().fun);await page.clock.runFor(1500);assert.equal((await page.evaluate(()=>CurierGame.snapshot().fun)).magnet,funPause.magnet);assert.equal((await page.evaluate(()=>CurierGame.snapshot().fun)).bubble,funPause.bubble);await page.click('#resume-button');await page.keyboard.down('ArrowRight');}if(snap.fun.stats.splashes&&!shotSplash){shotSplash=true;await page.screenshot({path:path.join(qa,'fun-splash.png')});}if(snap.x>1710&&!slowed){
    slowed=true;
    for(let j=0;j<125;j++){
      snap=await page.evaluate(()=>CurierGame.snapshot());
      if(snap.route.passed>0 || snap.route.errors>0)break;
      const brake=snap.speed>2.6;
      if(brake){await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');}
      else{await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowRight');}
      await page.clock.runFor(34);
    }
    await page.keyboard.up('ArrowLeft');
    assert.equal(snap.route.passed,1);
    assert.equal(snap.route.errors,0);
    await page.keyboard.down('ArrowRight');
  }if(snap.x>2200&&!shotChicken){shotChicken=true;await page.click('#horn-button');await page.clock.runFor(80);await page.screenshot({path:path.join(qa,'fun-chickens.png')});}if(snap.x>3710){await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');break;}}
  await page.clock.runFor(1800);await page.keyboard.up('ArrowLeft');snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.mode,'playing');assert.equal(snap.readyToDeliver,true);assert.equal(snap.workshop.wallet,0);assert.equal(await page.locator('#deliver-button').isVisible(),true);await page.keyboard.press('f');snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.mode,'result');assert.ok(snap.workshop.wallet>=55);const paidBalance=snap.workshop.wallet;await page.keyboard.press('f');assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.wallet,paidBalance);assert.equal(snap.status,'delivered');assert.equal(snap.stars,3);
  await page.screenshot({path:path.join(qa,'delivered-desktop.png')});
  assert.equal(snap.rings,0);assert.ok(snap.jumps>0);assert.ok(snap.score>1000);assert.equal(snap.fun.stats.magnets,0);assert.equal(snap.fun.stats.bubbles,0);assert.ok(snap.fun.stats.splashes>=1);assert.equal(snap.career.deliveries,1);assert.equal(snap.career.rings,0);assert.ok((await page.locator('#fun-result').textContent()).includes('Abțibild nou'));
  assert.equal(snap.stamps,1);assert.ok(await page.locator('#quest-result').evaluate(el=>el.classList.contains('complete')));
  await page.click('#result-home');assert.equal(await page.locator('.level-card:disabled').count(),4);
  await page.click('#collection-button');assert.equal(await page.locator('.character-card.locked').count(),2);assert.equal(await page.locator('.stamp.earned').count(),1);await page.screenshot({path:path.join(qa,'collection-desktop.png')});await page.locator('.sticker-choice').nth(1).scrollIntoViewIfNeeded();await page.locator('.sticker-choice').nth(1).click();assert.equal((await page.evaluate(()=>CurierGame.snapshot())).sticker,'sarmaua');assert.equal(await page.locator('.sticker-choice.selected').count(),1);await page.screenshot({path:path.join(qa,'fun-album.png')});await page.click('#collection-close');
  await page.reload();await page.clock.runFor(100);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).stars,3);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).sticker,'sarmaua');
  await page.click('#garage-button');const beforeBuy=(await page.evaluate(()=>CurierGame.snapshot())).workshop.wallet;await page.locator('[data-upgrade="suspension"] .upgrade-buy').click();assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.levels.suspension,1);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.wallet,beforeBuy-55);await page.locator('[data-contract="acrobat"]').click();await page.screenshot({path:path.join(qa,'workshop-desktop.png')});await page.click('#workshop-garage');assert.equal(await page.locator('.vehicle-card:disabled').count(),4);await page.locator('.vehicle-card').nth(1).click();assert.equal((await page.evaluate(()=>CurierGame.snapshot())).vehicle,'monster');await page.locator('.paint').nth(1).click();assert.equal(await page.locator('.paint.selected').textContent(),'MentăAleasă');await page.screenshot({path:path.join(qa,'garage-desktop.png')});await page.click('#sound-toggle');await page.click('#settings-close');
  await page.reload();await page.clock.runFor(100);await page.click('#settings-button');assert.equal(await page.locator('#sound-toggle').getAttribute('aria-checked'),'false');assert.equal(await page.locator('.paint.selected').textContent(),'MentăAleasă');await page.click('#settings-close');
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).vehicle,'monster');assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.levels.suspension,1);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.contract,'acrobat');
  // Inspect both compact landscape and portrait layouts without granting any network access.
  await page.setViewportSize({width:844,height:390});await page.clock.runFor(100);await page.screenshot({path:path.join(qa,'home-landscape.png')});
  await play();await page.clock.runFor(100);await page.screenshot({path:path.join(qa,'drive-landscape.png')});
  assert.doesNotMatch(await page.locator('#hud').innerText(),/Space|Shift|A \/ D|E ·|→ \/ D/);
  await page.keyboard.press('e');await page.clock.runFor(200);snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.rescueCharges,1);await page.click('#pause-button');const rescueTime=(await page.evaluate(()=>CurierGame.snapshot())).rescueRemaining;await page.clock.runFor(2000);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).rescueRemaining,rescueTime);await page.click('#resume-button');

  // The second delivery must stop at the barrier, then cross only after honking.
  await page.keyboard.down('ArrowRight');
  for(let i=0;i<105;i++){
    await page.clock.runFor(180);
    snap=await page.evaluate(()=>CurierGame.snapshot());
    if(snap.x>2430)break;
  }
  assert.equal(snap.level,'tort');
  assert.equal(snap.route.passed,0);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(800);
  await page.keyboard.up('ArrowLeft');
  assert.match(await page.locator('#tip').textContent(),/Acum claxonează/);
  await page.screenshot({path:path.join(qa,'barrier-landscape.png')});
  await page.locator('#horn-button').click();
  await page.clock.runFor(60);
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).route.passed,1);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(1300);
  await page.keyboard.up('ArrowRight');
  assert.ok((await page.evaluate(()=>CurierGame.snapshot())).x>2590);
  const pedal=await page.locator('#gas').boundingBox();assert.ok(pedal.x>=0&&pedal.x+pedal.width<=844&&pedal.y+pedal.height<=390);
  await page.mouse.move(pedal.x+pedal.width/2,pedal.y+pedal.height/2);await page.mouse.down();await page.clock.runFor(350);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).gas,true);
  await page.locator('#gas').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',bubbles:true});await page.mouse.up();assert.equal((await page.evaluate(()=>CurierGame.snapshot())).gas,false);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  const brakeRect=await page.locator('#brake').boundingBox();const point={x:Math.round(pedal.x+pedal.width/2),y:Math.round(pedal.y+pedal.height/2),id:5};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await page.clock.runFor(100);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).gas,true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point,{x:Math.round(brakeRect.x+brakeRect.width/2),y:Math.round(brakeRect.y+brakeRect.height/2),id:6}]});await page.clock.runFor(100);snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.gas,true);assert.equal(snap.brake,true);
  const turboRect=await page.locator('#turbo-button').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(50);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).brake,false);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point,{x:Math.round(turboRect.x+turboRect.width/2),y:Math.round(turboRect.y+turboRect.height/2),id:7}]});await page.clock.runFor(150);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).turbo,true);assert.equal((await page.evaluate(()=>CurierGame.snapshot())).boosting,true);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.clock.runFor(50);snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.gas,false);assert.equal(snap.brake,false);assert.equal(snap.turbo,false);

  const turboPoint={x:Math.round(turboRect.x+turboRect.width/2),y:Math.round(turboRect.y+turboRect.height/2),id:8};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[turboPoint]});
  await page.clock.runFor(160);
  snap=await page.evaluate(()=>CurierGame.snapshot());
  assert.equal(snap.gas,true);
  assert.equal(snap.boosting,true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.clock.runFor(80);
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).gas,false);
  const jumpRect=await page.locator('#jump-button').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(jumpRect.x+jumpRect.width/2),y:Math.round(jumpRect.y+jumpRect.height/2),id:9}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.clock.runFor(80);
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).manualJumps,1);
  await cdp.detach();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));snap=await page.evaluate(()=>CurierGame.snapshot());assert.equal(snap.mode,'paused');assert.equal(snap.brake,false);
  await page.click('#pause-home');await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);await page.screenshot({path:path.join(qa,'home-portrait.png')});await page.click('#garage-button');await page.screenshot({path:path.join(qa,'workshop-portrait.png')});await page.click('#workshop-close');await page.click('#collection-button');await page.locator('.sticker-choice').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(qa,'fun-album-portrait.png')});await page.keyboard.press('Escape');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await play();await page.clock.runFor(100);const controlIds=['brake','gas','jump-button','turbo-button','rescue-button','reverse-button'];const controlRects=await Promise.all(controlIds.map(id=>page.locator('#'+id).boundingBox()));for(const r of controlRects)assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=390&&r.y+r.height<=844);for(let i=0;i<controlRects.length;i++)for(let j=i+1;j<controlRects.length;j++){const a=controlRects[i],b=controlRects[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`overlap ${controlIds[i]}/${controlIds[j]}`);}await page.screenshot({path:path.join(qa,'pilot-portrait.png')});

  // Open the final route from an existing campaign save and check its countdown in the game.
  await page.click('#pause-button');
  await page.evaluate(()=>{
    const key='tine-coletul-save-v1';
    const saved=JSON.parse(localStorage.getItem(key));
    delete saved.checkpoint;
    for(const level of CurierData.levels.slice(0,5))saved.results[level.id]={stars:2,time:28};
    localStorage.setItem(key,JSON.stringify(saved));
  });
  await page.setViewportSize({width:844,height:390});
  await page.reload();
  await play();
  await page.clock.runFor(120);
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).level,'cartier');
  assert.equal(await page.locator('#clock-label').textContent(),'RĂMAS');
  assert.equal(await page.locator('#timer').textContent(),'0:34');
  assert.equal(await page.locator('#cargo-count').textContent(),'Min. 75%');
  await page.screenshot({path:path.join(qa,'finala-landscape.png')});
  await page.click('#pause-button');
  await page.clock.runFor(2100);
  assert.equal(await page.locator('#timer').textContent(),'0:34');
  await page.click('#resume-button');
  await page.clock.runFor(28000);
  assert.ok(await page.locator('#timer').evaluate(el=>el.classList.contains('stat-warning')));
  await page.clock.runFor(6800);
  assert.match(await page.locator('#result-copy').textContent(),/A expirat timpul/);

  await page.click('#result-home');
  assert.equal(await page.locator('#chapter-list button').count(),6);
  await page.locator('#chapter-list button').first().click();
  await page.locator('.level-card').first().click();
  await page.click('#express-button');
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).express,true);
  assert.equal(await page.locator('#timer').textContent(),'0:38');
  await page.click('#restart-button');
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).express,true);
  assert.ok((await page.locator('#drive-quote').textContent()).length>10);
  assert.equal(await page.locator('audio').count(),0);
  await page.click('#pause-button');
  await page.click('#pause-home');
  await page.evaluate(()=>{CurierGame.start(0);});
  await page.clock.runFor(80);
  const touch=await context.newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  async function touchPoint(selector,id){
    const rect=await page.locator(selector).boundingBox();
    return {id,x:Math.round(rect.x+rect.width/2),y:Math.round(rect.y+rect.height/2)};
  }
  const gas=await touchPoint('#gas',1),jump=await touchPoint('#jump-button',2);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas]});
  for(let i=0;i<260;i++){
    snap=await page.evaluate(()=>CurierGame.snapshot());
    if(snap.x>=763)break;
    await page.clock.runFor(18);
  }
  assert.ok(snap.x>=763&&snap.x<826,'Touch gas reached the coin jump at x='+snap.x);
  assert.equal(snap.gas,true);
  assert.equal(snap.rings,0);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,jump]});
  await page.clock.runFor(430);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  snap=await page.evaluate(()=>CurierGame.snapshot());
  assert.equal(snap.manualJumps,1);
  assert.ok(snap.rings>=1);
  await page.screenshot({path:path.join(qa,'bonus-saritura.png')});
  await touch.detach();
  await page.click('#pause-button');
  await page.click('#pause-home');
  await page.click('#collection-button');
  await page.locator('.character-listen').first().click();
  assert.ok((await page.locator('#collection-preview').textContent()).length>10);
  // Enter the optional trial through the marked roadside gate using real controls.
  await page.keyboard.press('Escape');
  await page.evaluate(()=>CurierGame.start(1));
  await page.keyboard.down('ArrowRight');
  await page.locator('#cab-enter').waitFor({state:'hidden'});
  for(let i=0;i<90;i++){
    await page.clock.runFor(100);
    if(await page.locator('#cab-enter').isVisible())break;
  }
  assert.ok(await page.locator('#cab-enter').isVisible());
  await page.click('#cab-enter');
  await page.keyboard.up('ArrowRight');
  snap=await page.evaluate(()=>CurierGame.snapshot());
  assert.equal(snap.mode,'cab');
  const beforeCab={elapsed:snap.elapsed,x:snap.x,wallet:snap.workshop.wallet};
  const cabTouch=await context.newCDPSession(page);
  await cabTouch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  const arrow=await touchPoint('#cab-right',3);
  await cabTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[arrow]});
  await cabTouch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).cab.lane,1);
  await cabTouch.detach();
  await page.clock.runFor(2300);
  await page.screenshot({path:path.join(qa,'cab-town.png')});
  await page.click('#cab-pause');
  const pausedCab=(await page.evaluate(()=>CurierGame.snapshot())).cab.elapsed;
  await page.clock.runFor(1150);
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).cab.elapsed,pausedCab);
  await page.click('#cab-resume');
  const course=await page.evaluate(()=>CurierCabRun.courses.tort);
  for(let i=0;i<course.waves.length;i++){
    const safe=[1,0,-1].find(lane=>!course.waves[i].includes(lane));
    for(let j=0;j<2;j++){
      const lane=(await page.evaluate(()=>CurierGame.snapshot())).cab.lane;
      if(lane===safe)break;
      await page.keyboard.press(lane<safe?'ArrowRight':'ArrowLeft');
    }
    const elapsed=(await page.evaluate(()=>CurierGame.snapshot())).cab.elapsed;
    await page.clock.runFor(Math.max(0,Math.ceil((3.55+i*course.gap+.06-elapsed)*1000)));
  }
  await page.clock.runFor(1300);
  snap=await page.evaluate(()=>CurierGame.snapshot());
  assert.equal(snap.mode,'cab-result');
  assert.equal(snap.cab.medal,3);
  assert.equal(snap.cabRecords.tort,3);
  assert.equal(snap.workshop.wallet,beforeCab.wallet+105);
  assert.equal(snap.elapsed,beforeCab.elapsed);
  assert.equal(snap.x,beforeCab.x);
  await page.click('#cab-done');
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).mode,'playing');
  assert.equal(await page.locator('#cab-enter').isVisible(),false);
  await page.click('#pause-button');
  await page.click('#pause-home');
  await page.click('#garage-button');
  const steering=page.locator('[data-upgrade="steering"] .upgrade-buy');
  await steering.scrollIntoViewIfNeeded();
  assert.ok(await steering.isEnabled());
  await steering.click();
  assert.equal((await page.evaluate(()=>CurierGame.snapshot())).workshop.levels.steering,1);
  await page.click('#workshop-garage');
  await page.click('#customs-open');
  for(const [group,id] of [['trim','rally'],['rims','steel'],['cab','lake'],['charm','leaf']]){
    await page.locator('#customs-tabs [data-category="'+group+'"]').click();
    const option=page.locator('.customs-choice[data-group="'+group+'"][data-option="'+id+'"]');
    await option.click();
    assert.equal(await option.getAttribute('aria-pressed'),'true');
  }
  await page.screenshot({path:path.join(qa,'customs-landscape.png')});
  await page.reload();
  await page.clock.runFor(100);
  snap=await page.evaluate(()=>CurierGame.snapshot());
  assert.equal(snap.customs.trim.id,'rally');
  assert.equal(snap.customs.rims.id,'steel');
  assert.equal(snap.customs.cab.id,'lake');
  assert.equal(snap.customs.charm.id,'leaf');
  assert.equal(snap.cabRecords.tort,3);
  assert.equal(snap.workshop.levels.steering,1);
  const storyContext=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const story=await storyContext.newPage();
  story.on('pageerror',error=>errors.push(error.message));
  story.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
  await story.clock.install();
  await story.goto(url);
  const status=()=>story.evaluate(()=>CurierGame.snapshot());
  await story.locator('#settings-button').tap();
  await story.locator('#language-en').tap();
  assert.equal(await story.locator('html').getAttribute('lang'),'en');
  assert.equal(await story.locator('#settings-title').innerText(),'What are we driving today?');
  assert.equal(await story.locator('.vehicle-card').first().locator('strong').textContent(),'Van');
  await story.reload();
  assert.equal((await status()).language,'en');
  assert.match(await story.locator('#home h1').innerText(),/KEEP THE/);
  await story.locator('#play-button').tap();
  assert.equal((await status()).mode,'story');
  assert.equal(await story.locator('#story-title').innerText(),'The Parcel from Number Zero');
  await story.screenshot({path:path.join(qa,'story-opening.png')});
  await story.locator('#story-start').tap();
  assert.equal(await story.locator('#mission-name').innerText(),'Cabbage Rolls to Go');
  assert.equal(await story.locator('#reverse-button strong').innerText(),'REVERSE');
  const phone=await storyContext.newCDPSession(story);
  async function hold(id){
    const rect=await story.locator('#'+id).boundingBox();
    await phone.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});
  }
  async function release(){await phone.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await hold('gas');
  await story.clock.runFor(2100);
  await release();
  await hold('reverse-button');
  await story.clock.runFor(950);
  const reversing=await status();
  assert.equal(reversing.reversing,true);
  await story.clock.runFor(400);
  assert.ok((await status()).x<reversing.x-10);
  await story.screenshot({path:path.join(qa,'reverse-android.png')});
  await release();
  await story.locator('#pause-button').tap();
  const saved=(await status()).checkpoint;
  assert.ok(saved.elapsed>2);
  await story.reload();
  assert.ok(await story.locator('#continue-button').isVisible());
  assert.equal(await story.locator('#continue-label').innerText(),'Continue');
  await story.locator('#continue-button').tap();
  const restored=await status();
  assert.equal(restored.mode,'playing');
  assert.equal(restored.level,saved.level);
  assert.ok(Math.abs(restored.x-saved.x)<6);
  assert.ok(Math.abs(restored.elapsed-saved.elapsed)<.09);
  await storyContext.close();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const report={passed:true,version:require('../package.json').version,checks:['slowing for the first rough patch','barrier opens only after stopping and using the horn','manual jump and turbo input spend energy','pause freezes jump and turbo state','delivery waits for explicit unload','earned parts pay for a persistent upgrade','contract selection persists','gas plus turbo through real multitouch','turbo with one touch and jump on touch down','no visible keyboard labels','no automatic pickups on the first route','coins collected through a timed touch jump','horn input and cooldown','comic puddles and chickens','sticker album unlocks, equips and persists','career totals awarded at run completion','desktop gameplay and complete story delivery','story challenge earns a persistent stamp','character book and progression unlocks','Express access and restart preserve the selected mode','caption-only dialogue and character lines','ramps, landing score and rescue in a real run','pause freezes rescue duration and simulation','focus loss releases input','save survives reload','level, vehicle and paint unlocks','selected vehicle and settings persist','landscape and portrait layout','mouse capture cancel and genuine CDP multitouch cancel','enter a roadside trial and earn gold with keyboard and touch','cab pause and return preserve the current delivery','trial medals unlock steering and per-vehicle styling persists','English settings, briefing and controls persist after reload','dedicated reverse pedal backs the vehicle up on a touchscreen','automatic checkpoint resumes the delivery and timer after reload','no external requests','no JavaScript errors'],screenshots:fs.readdirSync(qa).filter(n=>n.endsWith('.png'))};
  fs.writeFileSync(path.join(qa,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
