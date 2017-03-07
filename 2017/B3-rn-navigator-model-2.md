---
title: '《从零开始搭建一个多端 IM》贰：页面导航模式设计- Navigator 导航'
date: '2017-02-24 00:18:32'
tags:
- '从零开始搭建一个多端 IM'
- 'react'
- 'react-native'
---

在初次接触 `rn` 的 `navigator` 模块的时候，由于惯性思维，一直在思考路由的问题
**Q: 每个视图是否需要像 Web 一样有一个路由表？**  
这是从用户使用习惯的一个考虑。观察传统的 `Web` 网页，很少有真正意义上的返回概念，大概是因为在 `PC` 时代，屏幕足够大，能够容纳足够多的导航信息，用户基本都是点哪进哪，导致用户的浏览轨迹没有一个稳定的路径， 所以开发去关心上一页是什么状态，也便没有了什么意义。这种情况下，有一个涵盖所有页面的路由表，能够快速的在页面之间进行切换，能够极大提升开发效率，简化开发流程。

回到移动端 `App` 的导航模式，它类似 `树状结构`，一个功能线类似一个树枝，切换到一个功能需要先回到主干，再进入到另一个树枝，不会纵横交错。
这里有一个使用细节，在 `App` 中，你返回上一个页面的时候，上个页面的状态是被保留，为了实现这个特性，应用会保留一个导航栈，导航栈的大小多少会影响到应用的性能，这也侧面导致 `App` 的导航不能无限延伸。

`rn` 生来还是为了做移动端 `App` 的，还是要遵循移动端用户习惯，反应到技术实现上，一个全局的路由表并没有很大意义，既然是导航栈，那么 `push/pop` 装卸视图，会更加契合。



还有碰到的几个问题
1. 视图切换效果问题
2. navBar 通讯问题
3. 是否需要使用 navigator experimental
4. 视图两次渲染问题，onTransmition End
5. component 和 element 的概念，所以缓存还是可以通过单例来解决。

## 参考
[backandroid](http://facebook.github.io/react-native/releases/0.41/docs/backandroid.html)  
[Higher-Order Components](https://facebook.github.io/react/docs/higher-order-components.html)  
