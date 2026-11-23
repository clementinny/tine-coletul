(function(root){
  'use strict';
  const Characters=typeof module!=='undefined'&&module.exports?require('./characters.js'):root.CurierCharacters;
  const priorities={idle:1,hop:1,landing:2,start:4,rescue:5,lost:6,finish:7,fail:7};
  class Director{
    constructor(onLine){this.onLine=onLine||(()=>{});this.cursors={};this.reset('geta');}
    reset(character,lines={}){this.overrides=lines;this.character=Characters.get(character).id;this.lastAt=-Infinity;this.lastPriority=0;this.lastLine=null;}
    say(event,now,force=false){
      const c=Characters.get(this.character),priority=priorities[event]||1;
      if(!force&&now-this.lastAt<5&&(priority<=this.lastPriority||now-this.lastAt<1.5))return null;
      const kind=c.lines[event]?event:'idle',key=`${c.id}-${kind}`,index=this.cursors[key]||0,line={...Characters.line(c.id,kind,index)};
      if(this.overrides[event])line.text=this.overrides[event];
      this.cursors[key]=index+1;this.lastAt=now;this.lastPriority=priority;this.lastLine=line;this.onLine(line);return line;
    }
    preview(character){const c=Characters.get(character),key=`${c.id}-idle`,index=this.cursors[key]||0;this.cursors[key]=index+1;return Characters.line(c.id,'idle',index);}
  }
  const api={Director,priorities};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CurierDialogue=api;
})(typeof globalThis!=='undefined'?globalThis:this);
