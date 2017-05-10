'use strict';
/**
 * 请求客户端，长连接测试
 */
const async = require('async');
const http = require('http');

let keepAliveAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 2
});

function request(callback) {
    let req = http.request({
        host: '127.0.0.1',
        port: 3000,
        headers: {
            Connection: 'keep-alive'
        },
        agent: keepAliveAgent
    }, function(res) {
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            // console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            // console.log('No more data in response.');
            callback(null);
        });
    });

    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });

    req.end();
}

console.time('req');
async.parallel(Array(2).fill(0).map(() => {
    return request;
}), function (err) {
    console.log(err);
    console.timeEnd('req');
});