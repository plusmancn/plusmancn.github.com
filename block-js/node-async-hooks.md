```
Async Hooks 场景实践
2019-03-28 09:01:01
```

Async Hooks 是在 Node.js 8 版本引入的新特性，截止目前仍处于 `Stability: 1 - Experimenta` 状态。  
Async Hooks 为我们提供了强大的异步监控调试的能力，接下来我们将用 3 个案例，来感受该特性的强大之处。  
1. 我们在日常开发中，经常会碰到 `ETIMEOUT` 之类的网络报错，但是由于没有上下文，完全不知是何处发起的网络调起，调试犹如海底捞针。
2. 在全链路监控中，由于 Node.JS 的单线程模型，我们无法通过设置全局 traceId 方式来聚合请求，现在通常的做法是层层传递，Async Hooks 给了我们新的途径。
3. Async Hooks 和 Performance Hooks 结合，会有什么神奇的魔力？

## ETIMTOUT 之谜
