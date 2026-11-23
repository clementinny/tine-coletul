(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const { Bodies, Body, Composite } = node ? require('./vendor/matter.min.js') : root.Matter;
  const { roadY } = node ? require('./levels.js') : root.CurierData;
  const speedLimit = 3.2;
  const warningDistance = 270;

  class RouteTrial {
    constructor(sim) {
      this.sim = sim;
      this.errors = 0;
      this.passed = 0;
      this.cleanStreak = 0;
      this.obstacles = (sim.level.obstacles || []).map(spec => {
        const y = roadY(sim.level, spec.x);
        const obstacle = {
          ...spec, y, done:false,
          clearance:spec.kind === 'leap' ? (sim.level.rules?.clearance ?? 20) : 12,
          speedLimit:sim.level.rules?.speedLimit ?? speedLimit
        };
        if (spec.kind === 'barrier') {
          obstacle.body = Bodies.rectangle(spec.x, y - 100, 16, 200, {
            isStatic:true, label:'barrier', friction:0, restitution:0
          });
          Composite.add(sim.engine.world, obstacle.body);
        }
        return obstacle;
      });
    }

    distance(obstacle) {
      return obstacle.x - this.sim.truck.bounds.max.x;
    }

    get next() {
      return this.obstacles.find(obstacle => !obstacle.done);
    }

    canOpen(obstacle) {
      const distance = this.distance(obstacle);
      return distance >= -12 && distance <= 105 && this.sim.grounded && !this.sim.controls.gas &&
        Math.abs(this.sim.truck.velocity.x) < 1.05;
    }

    honk() {
      const obstacle = this.next;
      if (!obstacle || obstacle.kind !== 'barrier' || !this.canOpen(obstacle)) return;
      Composite.remove(this.sim.engine.world, obstacle.body);
      obstacle.openedAt=this.sim.elapsed;
      this.complete(obstacle, 'Poarta e deschisă!', true);
    }

    complete(obstacle, text, clean) {
      obstacle.done = true;
      obstacle.clean = clean;
      let points = 0;
      if (clean) {
        this.passed++;
        this.cleanStreak++;
        points = 35 * Math.min(this.cleanStreak, 3);
        this.sim.bonus += points;
      } else {
        this.errors++;
        this.cleanStreak = 0;
      }
      this.sim.events.push({ type:'obstacle', clean, points, text, x:obstacle.x, y:obstacle.y - 90 });
    }

    step() {
      for (const obstacle of this.obstacles) {
        if (obstacle.done || obstacle.kind === 'barrier') continue;
        const front = this.frontWheel;
        if (front.position.x < obstacle.x) continue;
        const clearance = roadY(this.sim.level, front.position.x) - front.position.y - this.sim.vehicle.wheel;
        if (clearance >= obstacle.clearance) {
          this.complete(obstacle, 'Ai sărit peste prag!', true);
          continue;
        }
        const speed = Math.abs(this.sim.truck.velocity.x);
        if (obstacle.kind !== 'leap' && speed <= obstacle.speedLimit) {
          this.complete(obstacle, 'Trecere lină!', true);
          continue;
        }
        this.shakeCargo(obstacle, speed);
        this.complete(obstacle, obstacle.kind === 'leap' ? 'Prea jos! Trebuie să sari.' :
          'Buf! Frânează înainte de prag.', false);
      }
    }

    get frontWheel() {
      const [first, second] = this.sim.wheels;
      return first.position.x > second.position.x ? first : second;
    }

    shakeCargo(obstacle, speed) {
      const sim = this.sim;
      const damage = obstacle.kind === 'leap' ? 44 : Math.min(28, 8 + (speed - obstacle.speedLimit) * 5);
      sim.combo = 0;
      for (const cargo of sim.cargo) {
        if (cargo.lost || cargo.protectedUntil > sim.elapsed || sim.fun.bubble > 0) continue;
        cargo.health = Math.max(0, cargo.health - damage * sim.tuning.damageFactor);
        if (cargo.health === 0) sim.lose(cargo);
        else if (!sim.ties.some(tie => tie.cargo === cargo)) {
          const { x, y } = cargo.body.velocity;
          Body.setVelocity(cargo.body, { x, y:Math.min(0,y) - Math.min(4, speed * .65) });
        }
      }
    }

    hint() {
      const obstacle = this.next;
      if (!obstacle || this.distance(obstacle) > warningDistance) return '';
      if (obstacle.kind === 'barrier') {
        if (!this.canOpen(obstacle)) return 'Barieră · frânează la linie și eliberează gazul';
        if (this.sim.fun.hornCooldown > 0) return 'Rămâi oprit · claxonul se încarcă';
        return 'Acum claxonează!';
      }
      const speed = Math.abs(this.sim.truck.velocity.x);
      const wheelDistance = obstacle.x - this.frontWheel.position.x;
      if (obstacle.kind === 'leap') {
        if (this.sim.grounded && this.sim.jumpCooldown <= 0 &&
            wheelDistance >= 4 && wheelDistance <= Math.max(20, speed * 19)) {
          return 'Acum sari!';
        }
        return 'Prag înalt · pregătește săritura';
      }
      if (speed <= obstacle.speedLimit - .25) return 'Viteză bună · treci încet peste dungi';
      if (obstacle.kind === 'rough') return 'Pavaj denivelat · frânează înainte de dungi';
      if (this.sim.grounded && this.sim.jumpCooldown <= 0 && wheelDistance <= speed * 20) {
        return 'Acum sari!';
      }
      return 'Prag de șantier · pregătește saltul sau frânează';
    }
  }

  function draw(ctx, trial, from, to, reduced=false) {
    for (const obstacle of trial.obstacles) {
      const { x, y, kind, done } = obstacle;
      if (x < from - 180 || x > to + 180) continue;
      ctx.save();
      if (kind === 'barrier') {
        ctx.fillStyle = '#fff0bf';
        ctx.fillRect(x - 118, roadY(trial.sim.level,x-118) + 5, 24, 8);
        const elapsed=trial.sim.elapsed-(obstacle.openedAt??0);
        const opening=done?(reduced?1:Math.min(1,elapsed*3.7)):0;
        const arm=Math.ceil(170*(1-opening)*(1-opening));
        ctx.fillStyle='#344653';
        ctx.fillRect(x-15,y-204,31,34);
        ctx.fillRect(x+21,y-186,6,191);
        ctx.fillStyle='#677980';
        ctx.fillRect(x+22,y-166,2,163);
        ctx.fillStyle=done?'#86ddab':'#fc886f';
        ctx.beginPath();ctx.arc(x,y-187,7,0,Math.PI*2);ctx.fill();
        for(let i=0;i*26<arm;i++){
          ctx.fillStyle=i%2?'#ffe9ba':'#d5796e';
          ctx.fillRect(x-8,y-170+i*26,17,Math.min(26,arm-i*26));
        }
      } else {
        const lip = kind === 'leap' ? 23 : 4;
        ctx.fillStyle = kind === 'rough' ? '#927464' : '#705f48';
        ctx.fillRect(x - 20, y - lip, 40, lip + 6);
        ctx.fillStyle = '#f6d482';
        for (let i=0; i<3; i++) ctx.fillRect(x - 16 + i*13, y - lip, 5, lip + 6);
      }
      if (!done) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px Trebuchet MS';
        const label = kind === 'barrier' ? 'STOP • CLAXON' : kind === 'leap' ? '↑ SARI!' :
          kind === 'jump' ? '↑ HOP' : 'ÎNCET';
        const height = kind === 'barrier' ? y - 233 : y - 127;
        ctx.fillStyle = '#fff0bf';
        ctx.fillRect(x - 57,height,114,24);
        ctx.strokeStyle = '#80664d';
        ctx.strokeRect(x - 57,height,114,24);
        ctx.fillStyle = '#253746';
        ctx.fillText(label,x,height+16);
      }
      ctx.restore();
    }
  }

  const api = { RouteTrial, draw };
  if (node) module.exports = api;
  else root.CurierRouteTrial = api;
})(globalThis);
