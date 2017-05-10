'use strict';
/**
 * 服务端测试代码
 */

const http = require('http');

let server = http.createServer();

server.on('connect', function() {
    console.log('connect');
});

server.on('connection', function() {
    console.log('connection');
    server.getConnections(function(err, count) {
        console.log(err, `${count}`);
    });
});

server.on('request', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('okayB');
});


server.on('close', function() {
    console.log('close');
});

server.listen(3000, '0.0.0.0', 11);
