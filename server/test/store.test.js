const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'payments-test.json');

before(() => {
  process.env.NODE_ENV = 'test';
});

after(() => {
  if (fs.existsSync(DATA)) fs.unlinkSync(DATA);
});

describe('store', () => {
  it('creates retention record with CREATED status', () => {
    const storePath = path.join(__dirname, '..', 'store.js');
    delete require.cache[storePath];
    const store = require('../store');
    const rec = store.createRetentionRecord({ practiceArea: 'tax', serviceType: 'consult' });
    assert.ok(rec.id);
    assert.strictEqual(rec.status, 'CREATED');
  });
});
