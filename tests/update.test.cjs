'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const project = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const { key, Save } = require('../app/src/main/assets/storage.js');

test('Android update identity and offline storage origin stay compatible', () => {
  const gradle = read('app/build.gradle');
  const manifest = read('app/src/main/AndroidManifest.xml');
  const activity = read('app/src/main/java/ro/vasi/curier/MainActivity.java');
  assert.match(gradle, /applicationId\s+'ro\.vasi\.curier'/);
  assert.equal(key, 'tine-coletul-save-v1');
  assert.match(activity, /ORIGIN\s*=\s*"appassets\.androidplatform\.net"/);
  assert.match(activity, /loadUrl\("https:\/\/"\s*\+\s*ORIGIN\s*\+\s*"\/assets\/index\.html"\)/);
  assert.match(activity, /setDomStorageEnabled\(true\)/);
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
  assert.equal(gradle.match(/versionName\s+'([^']+)'/)?.[1], JSON.parse(read('package.json')).version);
});

test('an unsuccessful write leaves the previous complete save available', () => {
  const oldSave = JSON.stringify({
    version:1, results:{ cutii:{ stars:2, time:30, challenge:true } },
    workshop:{ version:1, wallet:77, levels:{ turbo:2 } }
  });
  const store = {
    getItem: () => oldSave,
    setItem: () => { throw new Error('Write refused'); }
  };
  const save = new Save(store);
  const result = { stars:3, seconds:25, score:1500, delivered:3, total:3, integrity:1 };
  const reward = save.finishRun('tort',result,'careful','end-of-run');
  assert.equal(reward.saved,false);
  assert.equal(save.value.results.tort.stars,3);
  assert.equal(save.value.workshop.wallet,77+reward.amount);
  assert.equal(save.finishRun('tort',result,'careful','end-of-run'),null);
  const reopened = new Save(store);
  assert.equal(reopened.value.results.tort,undefined);
  assert.equal(reopened.value.results.cutii.challenge,true);
  assert.equal(reopened.value.workshop.wallet,77);
  assert.equal(reopened.value.workshop.levels.turbo,2);
});
