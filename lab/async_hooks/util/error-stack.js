'use strict';
const async_hooks = require('async_hooks');
const stack = new Map();
stack.set(-1, '');
let currentUid = -1;

async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const err =  new Error();
    const localStack = err.stack.split('\n').slice(0).join('\n');
    const extraStack = stack.get(triggerAsyncId || currentUid) || '';

    stack.set(asyncId, localStack + '\n' + extraStack);
  },
  before(asyncId) {
    currentUid = asyncId;
  },
  after(asyncId) {
    currentUid = asyncId;
  },
  destroy(asyncId) {
    stack.delete(asyncId);
  },
}).enable();

module.exports = stack;