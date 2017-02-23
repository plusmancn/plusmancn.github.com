---
title: '《从零开始搭建一个多端 IM》贰：页面导航模式设计- Navigator 导航'
date: '2017-02-18 15:41:14'
tags:
- '从零开始搭建一个多端 IM'
- 'react'
- 'react-native'
---

在初次接触 rn 的 `navigator` 模块的时候，由于惯性思维，我一直在想那么几个问题。  
1. 每个视图是否需要像 Web 一样有一个路由。
2. 每个视图的渲染时机和缓存问题。

还有碰到的几个问题
1. 视图切换效果问题
2. navBar 通讯问题
3. 是否需要使用 navigator experimental
