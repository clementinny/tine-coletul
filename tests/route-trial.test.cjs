'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { levels } = require('../app/src/main/assets/levels.js');
const { Simulation } = require('../app/src/main/assets/physics.js');
const driveStep = require('./route-driver.cjs');

function trial(kind) {
  return new Simulation({
    ...levels[0], route:[[0,470],[4300,470]], obstacles:[{kind,x:1000}],
    pads:[], rings:[], goodies:[], surprises:[], pilotGates:[]
  });
}

test('the barrier blocks sustained acceleration until the driver stops and honks nearby', () => {
  const sim = trial('barrier');
  assert.equal(sim.honk(),true);
  assert.equal(sim.routeTrial.passed,0);
  sim.setControls(true,false);
  for (let i=0;i<390;i++) sim.step();
  assert.equal(sim.routeTrial.passed,0);
  assert.ok(sim.truck.bounds.max.x < 1010);
  assert.equal(sim.honk(),true);
  assert.equal(sim.routeTrial.passed,0,'holding gas cannot open the barrier');
  sim.setControls(false,true);
  for (let i=0;i<155;i++) sim.step();
  assert.match(sim.routeTrial.hint(), /Acum claxonează/);
  assert.equal(sim.honk(),true);
  assert.equal(sim.routeTrial.passed,1);
  sim.setControls(true,false);
  for (let i=0;i<130;i++) sim.step();
  assert.ok(sim.truck.position.x > 1100);
  sim.dispose();
});

test('speed control protects cargo that a full-throttle crossing would damage', () => {
  const slow = trial('rough');
  const fast = trial('rough');
  for (let i=0; i<550 && slow.routeTrial.next; i++) driveStep(slow,2.8);
  fast.setControls(true,false);
  for (let i=0; i<550 && fast.routeTrial.next; i++) fast.step();
  assert.equal(slow.routeTrial.passed,1);
  assert.equal(slow.integrity,1);
  assert.equal(fast.routeTrial.errors,1);
  assert.ok(fast.integrity < .94);
  fast.dispose();
  slow.dispose();
});

test('a timed jump clears the marked threshold at driving speed', () => {
  const sim = trial('jump');
  sim.setControls(true,false);
  let jumped = false;
  for (let i=0; i<450 && sim.routeTrial.next; i++) {
    if (!jumped && Math.max(...sim.wheels.map(wheel=>wheel.position.x)) > 920) jumped = sim.jump();
    sim.step();
  }
  assert.equal(jumped,true);
  assert.equal(sim.routeTrial.passed,1);
  assert.equal(sim.routeTrial.errors,0);
  assert.equal(sim.integrity,1);
  assert.ok(sim.events.some(event=>event.text==='Ai sărit peste prag!'));
  sim.dispose();
});

test('crawling over a tall hurdle damages cargo even below the safe speed for paving', () => {
  const sim = trial('leap');
  for (let i=0; i<650 && sim.routeTrial.next; i++) {
    const brake = sim.truck.velocity.x >= 2;
    sim.setControls(!brake,brake);
    sim.step();
  }
  assert.equal(sim.routeTrial.errors,1);
  assert.ok(sim.integrity < .65);
  sim.dispose();
});

test('the final requires both clean obstacle work and a brisk pace', () => {
  const level = levels.find(item=>item.id==='cartier');
  function run(speed) {
    const sim = new Simulation(level);
    while (sim.status === 'playing' && sim.steps < (level.rules.deadline+1)*60) {
      driveStep(sim,speed);
      if (sim.readyToDeliver) sim.deliver();
    }
    return sim;
  }
  const slow = run(2.8);
  assert.equal(slow.status,'failed');
  assert.match(slow.reason,/expirat timpul/);
  assert.equal(slow.routeTrial.errors,0);
  const clean = run(driveStep.pace(level));
  assert.equal(clean.status,'delivered');
  assert.equal(clean.result().stars,3);
  assert.equal(clean.routeTrial.passed,8);
  assert.equal(clean.manualJumps,3);
  for (const sim of [slow,clean]) sim.dispose();
});

test('clean trials increase the bonus up to the cap and a miss resets the chain', () => {
  const obstacles = [640, 850, 1070, 1300, 1580, 1860].map(x=>({ kind:'rough', x }));
  const sim = new Simulation({
    ...levels[0], route:[[0,470],[4300,470]], obstacles,
    pads:[], rings:[], goodies:[], surprises:[], pilotGates:[]
  });
  for (let i=0;i<1400 && sim.routeTrial.next;i++) {
    if (sim.routeTrial.next.x===1580) {
      sim.setControls(true,false);
      sim.step();
    } else {
      driveStep(sim,2.65);
    }
  }
  const results = sim.events.filter(event=>event.type==='obstacle');
  assert.deepEqual(results.map(event=>event.points),[35,70,105,105,0,35]);
  assert.equal(sim.routeTrial.cleanStreak,1);
  assert.equal(sim.routeTrial.errors,1);
  assert.equal(sim.bonus,350);
  sim.dispose();
});
