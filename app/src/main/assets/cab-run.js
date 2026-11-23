(function(root){
  'use strict';
  const courses={
    tort:{title:'Aleea Castanilor',view:3.8,gap:1.6,scene:'town',
      waves:[[0],[-1],[1],[0],[-1,0],[1],[0,1],[-1],[0]]},
    livada:{title:'Drumul dintre livezi',view:3.6,gap:1.31,scene:'orchard',
      waves:[[0],[-1],[0,1],[-1,0],[1],[-1,1],[0],[-1,0],[0,1],[-1,1],[1],[-1,0],[0,1]]},
    depou:{title:'Șoseaua depoului',view:3.35,gap:1.14,scene:'depot',
      waves:[[0,1],[-1,0],[-1,1],[1],[0,1],[-1],[0,-1],[-1,1],[0,1],[0,-1],[0],[0,1],[1,-1],[0,-1],[0,1],[0,-1],[1,-1],[0,1]]},
    dana:{title:'Digul din Brizeni',view:3.4,gap:1.18,scene:'coast',
      waves:[[0],[1,-1],[-1,0],[0,1],[1],[-1,0],[0,1],[1,-1],[-1],[0,1],[-1,0],[0,1],[-1,1],[0,1]]},
    observator:{title:'Drumul alb',view:3.6,gap:1.18,scene:'snow',
      waves:[[1,0],[-1,0],[-1,1],[0,1],[1],[-1,0],[1,-1],[0,1],[-1,0],[0,1],[-1,1],[0],[-1,0],[-1,1],[0,1],[0,-1]]},
    turn_cupru:{title:'Bulevardul din Arămia',view:3.3,gap:1.04,scene:'copper',
      waves:[[0,-1],[0,1],[-1,1],[0,-1],[0,1],[-1],[0,-1],[-1,1],[0,1],[0,-1],[0,1],[1,-1],[0,-1],[0,1],[0,-1],[1,-1],[0,1],[0,-1]]}
  };
  const payout=[0,35,63,105];
  const medalNames=['','Bronz','Argint','Aur'];
  const maxHits=3;
  const lead=3.55;
  class Run {
    constructor(course,steering=0){
      this.course=course;
      this.traffic=course.waves.flatMap((lanes,i)=>lanes.map((lane,j)=>({
        lane, at:lead+i*course.gap, color:(i*5+j*2)%4, tall:(i+j)%3===0
      })));
      this.duration=this.traffic.at(-1).at+1.1;
      this.response=9+2*steering;
      this.elapsed=0;
      this.next=0;
      this.lane=0;
      this.offset=0;
      this.hits=0;
      this.lastHit=-Infinity;
      this.finished=false;
    }
    steer(direction){
      if(this.finished||(direction!==-1&&direction!==1))return;
      this.lane=Math.max(-1,Math.min(1,this.lane+direction));
    }
    step(dt){
      if(this.finished)return;
      this.elapsed=Math.min(this.duration,this.elapsed+dt);
      this.offset+=(this.lane-this.offset)*(1-Math.exp(-dt*this.response));
      while(this.next<this.traffic.length&&this.traffic[this.next].at<=this.elapsed){
        const car=this.traffic[this.next++];
        if(this.lastHit!==this.elapsed&&Math.abs(car.lane-this.offset)<.55){
          this.hits++;
          this.lastHit=this.elapsed;
        }
      }
      this.finished=this.hits>=maxHits||this.elapsed>=this.duration;
    }
    get medal(){return this.finished?Math.max(0,maxHits-this.hits):0;}
  }
  const api={Run,courses,payout,medalNames,maxHits};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CurierCabRun=api;
})(globalThis);
