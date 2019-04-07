'use strict';
const net = require('net');
const asyncHooks = require('async_hooks');
const eStack = require('../util/error-stack.js');

function connect() {
  try {
    // eslint-disable-next-line no-unused-vars
    const stream = net.createConnection({
      port: 6279,
      host: 'localhost'
    });
  } catch(err) {
    console.log('CATCH:\n', err);
  }
}

// 第一处尝试链接
connect();

process.on('uncaughtException', () => {
  const eid = asyncHooks.executionAsyncId();
  console.log('ASYNC_HOOKS STACK \n', eStack.get(eid));
});