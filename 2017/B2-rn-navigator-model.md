---
title: '《从零开始搭建一个多端 IM》壹：页面导航模式设计-TabBar导航栏'
date: '2017-02-18 15:41:14'
tags:
- '从零开始搭建一个多端 IM'
- 'react'
- 'react-native'
---

# 壹：APP页面导航模式设计
>这是个系列文章，名叫《从零开始搭建一个多端 IM》，将介绍如何利用 `react`, `react-native`, `socket.io`, `NodeJs` 搭建一个跨 `iOS`,`Android`,`web` 三端的 IM 应用，由于我也是初学 RN，难免会有很多理解错误的地方，还请大家多多指正和包涵。

由于没有设计师 MM 支援，所以我们的界面就选择模仿微信啦。  
微信的导航模式主要有：首页底部的横向 TabBar 导航 +  纵向的 Navigator 弹出式导航  
我们先来实现 TabBar 导航。

## 底部 TabBar 实现
> 具体实现参照：[UiLibrary/TabBar](https://github.com/plusmancn/im-client/tree/master/UiLibrary/TabBar)  

先来约定下我们要实现的目标：  
* 懒加载：只有 Tab 被点击后，才会进行首次渲染。
* 视图缓存：第二次切换到视图的时候，不会重新渲染

### 懒加载
要实现懒加载，首先得明白，什么时候组件才会被 `Mount`（挂载），先看下如何初始化一个 `TabBar`
```javascript
<TabBar
    // 指定序号来选定首页渲染视图，默认为 0
    // activeIndex={2}
>
    <TabBar.Item
        title="首页"
        color="#999"
        tintColor="#FB3F16"
        icon="https://f.souche.com/ic_main_home.png"
        tintIcon="https://f.souche.com/ic_main_home_sel.png"
        badge={32}
        onPress={() => {
            Alert.alert('首页 Tab 被点击', '可在此处与 navigator 通讯');
        }}
    >
        {Your Component}
    </TabBar.Item>

    ...more...
</TabBar>
```
作为一个 RN 新手，我下意识地认为，被 `TabBar` 包围的元素是在挂载渲染后，再传入 `TabBar` 的。  
事实上，`TabBar` 内部的元素，将作为 `props.children` 变量传入 `TabBar`，假如 `TabBar` 内部的 `render` 函数不将 `props.children` 做解析渲染，那么它将永远只是个变量，没有实例化和挂载渲染的机会。  
这段初始化代码里，真正被挂载的组件只有 `TabBar` 一个，基于此，我们将通过控制 `TabBar` 的 `render` 函数，来实现 `TabBar.Item` 的懒加载。  





## 参考
[组件的生命周期](https://facebook.github.io/react/docs/react-component.html#componentwillreceiveprops)
