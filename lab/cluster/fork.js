'use strict';

const { fork } = require('child_process');

const child = fork('./child.js', null, {
    stdio: 'ignoreiwegin'
});

console.log(child, 'change');
