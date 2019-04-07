'use strict';
const Redis = require('ioredis');

// eslint-disable-next-line no-unused-vars
const redis1 = new Redis();

// 在源头监听报错，及时处理
redis1.on('error', function(err) {
  console.log('at redsi1', err.stack);
});
