'use strict';

// Use ordinary controls for checkpoints and deliveries so route tests exercise the full flow.
module.exports = function driveStep(sim, speed, turbo=false) {
  const next = sim.routeTrial.next;
  if (next?.kind === 'barrier' && sim.routeTrial.distance(next) <= 95) {
    sim.setControls(false, true);
    if (sim.routeTrial.canOpen(next) && sim.fun.hornCooldown <= 0) sim.honk();
  } else {
    const wheelDistance = next ? next.x - sim.routeTrial.frontWheel.position.x : Infinity;
    const speedCap = next?.kind === 'rough' && wheelDistance < 100
      ? Math.min(speed,next.speedLimit - .45) : speed;
    if (next?.kind === 'leap' && wheelDistance > 0 &&
        wheelDistance <= Math.max(25,sim.truck.velocity.x*17)) sim.jump();
    const brake = sim.truck.position.x > sim.level.goal - 40 || sim.truck.velocity.x >= speedCap;
    sim.setControls(!brake, brake, turbo);
  }
  sim.step();
};

module.exports.pace = function pace(level, vehicle='van', upgraded=false) {
  if(level.rules.pace)return level.rules.pace;
  switch (level.id) {
    case 'pepeni': return 3.45;
    case 'piata': return 3.65;
    case 'vaza': return 3.35;
    case 'cartier':
      if (vehicle === 'van') return 3.85;
      if (vehicle === 'rocket' && upgraded) return 3.75;
      return 3.65;
    default: return 2.8;
  }
};
