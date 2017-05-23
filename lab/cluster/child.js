// child.js
'use strict';

process.on('message', function (message, socket) {
    if (message === 'socket') socket.end('Child handled it.');
});

process.stdin.on('data', function (data) {
    console.log('child', data);
});

console.log('hi');
