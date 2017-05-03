---
title: 'callback 和 promise 的错误捕获'
date: '2016-05-09 01:18:43'
tags:
- 'js'
---

![ctp](../images/callbacks_promises.png?imageView2/2/w/920/interlace/0/q/100)
> 1) 千万不要去尝试 catch callback 的回调错误，错误处理应交由 callbac 函数本身。开发中碰到过框架捕获了 callback 的错误，而且直接湮没了，导致代码出了问题，却不能察觉。  
2)  对于进程的 uncaughtException, unhandledRejection 事件，建议结合日志做一些监听处理。

<!-- more -->

## callback
下面是一个 catch callback 回调的错误示例，开发中要避免，运行 `callbask.js`
```javascript
'use strict';

function cbAfter3s(callback) {  
    setTimeout(function() {
        // s2
        try{
            callback(null, '3s');
        }catch(e) {
            console.error('Catch in cbAfter3s', e);
            callback(new Error('Error from cbAfter3s'));
        }

        throw new Error('Error from cbAfter3s ASync');
    }, 3e3);

    throw new Error('Error from cbAfter3s Sync');
}

function handle(err, data) {
    console.info('Reveive: ', err, data);
    if(!err) {
        // s2
        throw new Error('Error from handle');
    }
}

try{
    cbAfter3s(handle);
}catch(e) {
    console.error('Catch in global', e);
}

process.on('uncaughtException', function(e) {  
    console.error('Catch in process', e);
});
```
输出：
```shell
Catch in global [Error: Error from cbAfter3s Sync]
Reveive:  null 3s
Catch in cbAfter3s [Error: Error from handle]
Reveive:  [Error: Error from cbAfter3s] undefined
Catch in process [Error: Error from cbAfter3s ASync]
```

总结（s）：  
1. try catch 只能捕获同步抛出的错误
2. 不要轻易在 callback 里 throw 错误，不然容易形成两次回调。
3. 代码未捕获的错误，会出现在 uncaughtException 事件上，建议做些日志记录；不然，假如你用了进程守护程序（如pm2等），会自动重启应用，进而湮没日志。
4. promise 的错误捕获又是不同的，不能想当然。


## promise
运行 `promise.js`
```javascript
'use strict';

// 内置P romise
var p = (new Promise(function(resolve, reject){
    reject(new Error('Error from promise by reject'));
    // 或者通过 throw 的方式抛出，效果相同
    // throw new Error('Error from promise by throw');

}));

// 或者在 then 通过 throw 抛出错误，也有同样效果
/**
var p = (new Promise(function(resolve){
    resolve('Data');
}))
.then(function(res){
    console.info('Receive: ', res);
    throw new Error('Error from promise by throw');
});
*/

process.on('uncaughtException', function(e){
    console.error('UE:Catch in process', e);
});

process.on('unhandledRejection', (reason) => {
    console.info('UR:Catch in process', reason);
});

process.on('rejectionHandled', (p) => {
    console.info('RH:Catch in process', p);
});

setTimeout(function(){
    p.catch(function(e){
        console.error('Catch in Promise', e);
    });
}, 1e3);

```
输出：
```shell
UR:Catch in process [Error: Error from promise by reject]
RH:Catch in process Promise { <rejected> [Error: Error from promise by reject] }
Catch in Promise [Error: Error from promise by reject]
```

总结（s）:  
1. `rejectionHandled` 事件的触发条件为，`promise` 没有被及时 catch 到错误并触发了 `unhandledRejection` 事件，在这之后的一段时间里，`promise` 错误又被处理了，此时触发 `rejectionHandled`，详情见 [Node-Docs-4.4.1#process_event_rejectionhandled](https://nodejs.org/docs/v4.4.4/api/process.html#process_event_rejectionhandled)。
2. `uncaughtException` 并不能捕获 `Promise` 内抛出的错误，如果开发者是从基于 callback 的 [Async](https://github.com/caolan/async) 转向 `Promise` 的，尤其需要注意未知错误的捕获。

由于历史代码历史包袱，有时我们会写一个 `promiseToCallback` 的函数，类似如下代码：
```javascript
function promiseToCallback(func){
    'use strict';
    return function(){
        let args = Array.prototype.slice.apply(arguments);
        let cb = args.pop();
        func.apply(null, args)
            .then(function(result){
                cb(null, result);
            })
            .catch(function(err){
                log.error(err);
                cb(err);
            });
    };
};
```
这时候，尤其需要当心，cb 内如果抛出错误，会触发 catch 事件，导致发生两次回调。

> 希望这些能让你在开发中少踩些坑。
