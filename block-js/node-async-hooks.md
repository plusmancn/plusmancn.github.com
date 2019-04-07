```
Async Hooks 场景实践（1）
2019-03-28 09:01:01
```

Async Hooks 是在 Node.js 8 版本引入的新特性，截止目前仍处于 `Stability: 1 - Experimenta` 状态。  
Async Hooks 为我们提供了强大的异步监控调试的能力，接下来我们将用 3 个案例，来感受该特性的强大之处。  
1. 我们在日常开发中，经常会碰到 `ETIMEOUT` 之类的网络报错，但是由于没有上下文，完全不知是何处发起的网络调起，调试犹如海底捞针。
2. 在全链路监控中，由于 Node.JS 的单线程模型，我们无法通过设置全局 traceId 方式来聚合请求，现在通常的做法是层层传递，Async Hooks 给了我们新的途径。
3. Async Hooks 和 Performance Hooks 结合，会有什么神奇的魔力？

## 异步错误追踪
### 问题
日常开发中遇到最多的异步错误就是网络类报错了，例如使用 `net` 建立连接。
```js
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
```
假如长连接创建失败，你会得到如下报错，顿时一脸懵逼，到底哪里发起的建立连接尝试。
```js
Error: connect ECONNREFUSED 127.0.0.1:6279
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1097:14)
```
### 特性应用
现在我们期望 `connect()` 函数能够出现在报错堆栈里，此时 AsyncHooks 就可以帮你记录前后的调用关系，先看最终效果。我们先创建一个工具类，代码原理很简单，我们创建一个名为 stack 的 map 对象，记录所有未被销毁的 resource 对象的调用堆栈。
```js
//=> ./util/error-stack.js
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
```
应用于创建网络连接的代码，我们捕获全局 `uncaughtException` 错误，通过当前 asyncId 从 eStack 中获取当前调用栈信息。
```js
//=> ./net.js
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
```
再来看下我们能捕获到的错误栈，可以知道 `connect()` 函数的所在行了。
```js
Error
    at AsyncHook.init (/Users/plusman/Desktop/SE.Hexo/plusmancn.github.com/lab/async_hooks/util/error-stack.js:9:18)
    at TCP.emitInitNative (internal/async_hooks.js:137:43)
    at Socket.connect (net.js:909:7)
    at Object.connect (net.js:156:17)
    at connect (/Users/plusman/Desktop/SE.Hexo/plusmancn.github.com/lab/async_hooks/network-trace/net.js:9:24)
    ↓ connect 所在行 ↓
    at Object.<anonymous> (/Users/plusman/Desktop/SE.Hexo/plusmancn.github.com/lab/async_hooks/network-trace/net.js:19:1)
    at Module._compile (internal/modules/cjs/loader.js:701:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:712:10)
    at Module.load (internal/modules/cjs/loader.js:600:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:539:12)
```

### 代价
使用 async_hooks 在目前有较严重的性能损耗，见 https://github.com/bmeurer/async-hooks-performance-impact ，请慎重在生产环境中使用。

### 出路
现阶段针对网络类报错，我们可以通过良好的编程习惯，来及时处理错误。
以 `[ioredis](https://github.com/luin/ioredis)` 为例。
```js
'use strict';
const Redis = require('ioredis');

// eslint-disable-next-line no-unused-vars
const redis1 = new Redis();

// 在源头监听报错，及时处理
redis1.on('error', function(err) {
  console.log('at redsi1', err.stack);
});
```
这给我们几个提醒：
1. 错误越早处理，就能有更加明确的上下文来精准处理事件，也能防止错误的爆炸。
2. 作为一个合格的框架，需要合理开放错误事件。
3. node net 模块本身也提供了一系列事件来跟踪连接的生命周期，作为开发者要善用这些事件，例如 [Event:'error'](https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_event_error_1)


## 后记
使用 AsyncHooks 还有几个坑要知道
1. console.log 也是异步事件，如果在 `createHook` 的回调事件里使用，将会造成无限循环。推而广之，不能在 Hook 的回调事件里使用异步函数。
2. 超出 JavaScript stack 的代码，例如底层 C++ 代码的执行结果 execution 为 0。

AsyncHooks 虽然能够极大的方便我们对异步错误的跟踪调试，且能够无代码侵入的实现全链路追踪，但现阶段该特性对性能的损耗还是偏大，建议看官可以持续关注，但切勿引入产线环境。  
