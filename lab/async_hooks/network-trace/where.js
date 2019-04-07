'use strict';

const net = require('net');

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

process.on('uncaughtException', (err) => {
  console.log(err.stack);
});