'use strict';
const cluster = require('cluster');

if (cluster.isMaster) {
  const worker = cluster.fork();
  worker.send('hi there');
  worker.on('message', msg => {
    console.log(`msg: ${msg} from worker#${worker.id}`);
  });
} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    process.send(msg);
  });
}
