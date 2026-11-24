(function (root) {
  'use strict';
  const Fun=typeof module!=='undefined'&&module.exports?require('./fun.js'):root.CurierFun;
  const Workshop=typeof module!=='undefined'&&module.exports?require('./workshop.js'):root.CurierWorkshop;
  const Data=typeof module!=='undefined'&&module.exports?require('./levels.js'):root.CurierData;
  const Cab=typeof module!=='undefined'&&module.exports?require('./cab-run.js'):root.CurierCabRun;
  const Customs=typeof module!=='undefined'&&module.exports?require('./customs.js'):root.CurierCustoms;
  const Checkpoint=typeof module!=='undefined'&&module.exports?require('./checkpoint.js'):root.CurierCheckpoint;
  const levelIds=Data.levels.map(level=>level.id);
  const key = 'tine-coletul-save-v1';
  const defaults = () => ({version:1, results:{}, express:{}, cabRecords:{}, customs:{}, language:'ro', checkpoint:null, settledRuns:[], paint:'coral',vehicle:'van',sound:true,career:Fun.cleanCareer(),sticker:'none',workshop:Workshop.defaults()});
  function sanitize(value) {
    const clean=defaults();
    if (!value || value.version !== 1) return clean;
    clean.sound = value.sound !== false;
    clean.language=value.language==='en'?'en':'ro';
    clean.career=Fun.cleanCareer(value.career);
    for (const id of levelIds) {
      const r=value.results?.[id];
      if (r && Number.isInteger(r.stars) && r.stars>=1 && r.stars<=3 && Number.isFinite(r.time) && r.time>0) {
        clean.results[id]={stars:r.stars,time:Math.min(r.time,86400)};
        if(Number.isFinite(r.score)&&r.score>=0)clean.results[id].score=Math.min(Math.floor(r.score),1000000);
        if(r.challenge===true)clean.results[id].challenge=true;
      }
    }
    const stars=Object.values(clean.results).reduce((s,r)=>s+r.stars,0);
    const paint=Data.palettes.find(item=>item.id===value.paint&&stars>=item.stars);
    const vehicle=Data.vehicles.find(item=>item.id===value.vehicle&&stars>=item.stars);
    if(paint)clean.paint=paint.id;
    if(vehicle)clean.vehicle=vehicle.id;
    for(const id of Object.keys(clean.results)){
      const record=value.express?.[id];
      if(record&&Number.isInteger(record.medal)&&record.medal>=1&&record.medal<=3&&Number.isFinite(record.time)&&record.time>0){
        clean.express[id]={medal:record.medal,time:Math.min(record.time,86400)};
      }
    }
    if(Fun.unlocked(value.sticker,clean.career,clean.results))clean.sticker=value.sticker;
    clean.workshop=Workshop.clean(value.workshop,clean.results);
    for(const id of Object.keys(Cab.courses)){
      const medal=value.cabRecords?.[id];
      if(Number.isInteger(medal)&&medal>0&&medal<=Cab.maxHits)clean.cabRecords[id]=medal;
    }
    for(const vehicle of Data.vehicles.filter(item=>item.stars<=stars)){
      const style=value.customs?.[vehicle.id];
      if(!style)continue;
      const equipped=Object.fromEntries(Customs.groups.flatMap(group=>{
        const option=group.options.find(item=>item.id===style[group.id]);
        return Customs.allowed(option,clean)?[[group.id,option.id]]:[];
      }));
      if(Data.palettes.some(item=>item.id===style.paint&&item.stars<=stars))equipped.paint=style.paint;
      clean.customs[vehicle.id]=equipped;
    }
    clean.settledRuns=Array.isArray(value.settledRuns)
      ? [...new Set(value.settledRuns.filter(id=>typeof id==='string'&&/^run-[a-z0-9-]{1,64}$/.test(id)))].slice(-32) : [];
    const pending=Checkpoint.clean(value.checkpoint,clean.results);
    if(pending&&!clean.settledRuns.includes(pending.id))clean.checkpoint=pending;
    return clean;
  }
  class Save {
    constructor(storage) { this.storage=storage; this.available=true; this.value=defaults(); this.awardedRuns=new Set(); this.read(); }
    read() { try { this.value=sanitize(JSON.parse(this.storage.getItem(key))); } catch (_) { this.value=defaults(); } return this.value; }
    write() { try { this.storage.setItem(key,JSON.stringify(this.value)); return true; } catch (_) { this.available=false; return false; } }
    totalStars() { return Object.values(this.value.results).reduce((s,r)=>s+r.stars,0); }
    buyUpgrade(id){const next=Workshop.purchase(this.value.workshop,id,this.value.results,this.value.cabRecords);if(!next)return false;this.value.workshop=next;this.write();return true;}
    paintVehicle(vehicle,paintId){
      if(!Data.vehicles.some(item=>item.id===vehicle&&item.stars<=this.totalStars())||
          !Data.palettes.some(item=>item.id===paintId&&item.stars<=this.totalStars()))return false;
      const style=this.value.customs[vehicle]??={};
      style.paint=paintId;
      this.write();
      return true;
    }
    equip(vehicle,groupId,optionId){
      if(!Data.vehicles.some(v=>v.id===vehicle&&v.stars<=this.totalStars()))return false;
      const option=Customs.groups.find(group=>group.id===groupId)?.options.find(item=>item.id===optionId);
      if(!Customs.allowed(option,this.value))return false;
      const style=this.value.customs[vehicle]??={};
      style[groupId]=option.id;
      this.write();
      return true;
    }
    finishCab(id,medal){
      if(!Object.hasOwn(Cab.courses,id)||!Number.isInteger(medal)||medal<1||medal>Cab.maxHits)return 0;
      const previous=this.value.cabRecords[id]||0;
      if(medal<=previous)return 0;
      const amount=Cab.payout[medal]-Cab.payout[previous];
      this.value.cabRecords[id]=medal;
      this.value.workshop.wallet=Math.min(1000000,this.value.workshop.wallet+amount);
      this.write();
      return amount;
    }
    saveCheckpoint(snapshot){
      const checked=Checkpoint.clean(snapshot,this.value.results);
      if(!checked||this.value.settledRuns.includes(checked.id))return false;
      this.value.checkpoint=checked;
      return this.write();
    }
    finishRun(id, result, contractId, runId, challenge=false) {
      if (!levelIds.includes(id) || !runId || this.awardedRuns.has(runId) || this.value.settledRuns.includes(runId)) return null;
      if (!result || !Number.isInteger(result.stars) || result.stars<0 || result.stars>3 ||
          !Number.isFinite(result.seconds) || result.seconds<=0) return null;
      const reward = Workshop.reward(result, contractId);
      const previous=this.value.results[id];
      reward.routeBonus=result.stars>0&&!previous?24:0;
      reward.stampBonus=result.stars>0&&challenge&&!previous?.challenge?16:0;
      reward.amount+=reward.routeBonus+reward.stampBonus;
      const workshop = this.value.workshop;
      workshop.wallet = Math.min(1000000, workshop.wallet + reward.amount);
      if (reward.contractMet) {
        workshop.completed[reward.contract] = Math.min(1000000, workshop.completed[reward.contract] + 1);
      }
      this.addCareer(result.fun);
      if (result.stars>0) {
        this.updateBestResult(id, result.stars, result.seconds, result.score, challenge);
      }
      this.awardedRuns.add(runId);
      if(this.value.checkpoint?.id===runId)this.value.checkpoint=null;
      if(/^run-[a-z0-9-]{1,64}$/.test(runId))this.value.settledRuns=[...this.value.settledRuns,runId].slice(-32);
      return { ...reward, saved: this.write() };
    }
    finishExpress(id,result,runId) {
      const level=Data.levels.find(entry=>entry.id===id);
      if(!level||!this.value.results[id]||!runId||this.awardedRuns.has(runId)||
          !Number.isFinite(result?.seconds)||result.seconds<=0)return null;
      const medal=Data.expressMedal(level,result);
      if(!medal)return {medal,amount:0,record:false,saved:true};
      const previous=this.value.express[id];
      const payout=[0,30,65,115];
      const bestMedal=Math.max(medal,previous?.medal||0);
      const amount=payout[bestMedal]-payout[previous?.medal||0];
      const record=!previous||result.seconds<previous.time;
      this.value.express[id]={medal:bestMedal,time:Math.min(result.seconds,previous?.time??Infinity)};
      this.value.workshop.wallet=Math.min(1000000,this.value.workshop.wallet+amount);
      this.awardedRuns.add(runId);
      return {medal,amount,record,saved:this.write()};
    }
    addCareer(result) {
      const earned = Fun.cleanCareer(result);
      for (const key of Fun.careerKeys) {
        this.value.career[key] = Math.min(1000000, this.value.career[key] + earned[key]);
      }
    }
    recordFun(result) {
      this.addCareer(result);
      return this.write();
    }
    record(id,stars,time,arcadeScore,challenge=false) {
      if (!levelIds.includes(id) || !Number.isInteger(stars)||stars<1||stars>3||!Number.isFinite(time)||time<=0) return false;
      this.updateBestResult(id,stars,time,arcadeScore,challenge);
      return this.write();
    }
    updateBestResult(id,stars,time,arcadeScore,challenge) {
      const previous=this.value.results[id];
      this.value.results[id]={stars:Math.max(previous?.stars||0,stars),time:Math.min(previous?.time||Infinity,time)};
      if(Number.isFinite(arcadeScore)&&arcadeScore>=0)this.value.results[id].score=Math.max(previous?.score||0,Math.floor(arcadeScore));
      else if(Number.isFinite(previous?.score))this.value.results[id].score=previous.score;
      if(challenge===true||previous?.challenge===true)this.value.results[id].challenge=true;
    }
    reset() { this.value=defaults(); return this.write(); }
  }
  const api={Save,sanitize,key};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.CurierStorage=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
