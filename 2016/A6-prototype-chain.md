---
title: '关于Error对象继承的几点疑惑'
createdAt: '2015-12-11 10:58:03'
updatedAt: '2017-01-18 11:23:37'
tags:
- js
- es6
---
> 疑惑来自对Error对象的继承

某段业务代码里面的错误定义形式
```
var BadRequest = function(msg, code) {
    this.name = 'BadRequest';
    this.message = msg || 'BadRequest';
    this.code = code || null;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee); /* 是否多余 */
};
BadRequest.prototype.__proto__ = Error.prototype;
Error.badRequest= function(msg, code) {
    return new BadRequest(msg, code);
};
```

疑惑
1. `__proto__`  直接赋值做原型链继承，是否存在隐患
2. Error.captureStackTrace 是否多余

---
<!-- more -->
> 针对疑惑1，搜索了node中stream模块继承的示例代码

1）node中大量模块继承自events，以stream模块为例
```
// 有省略
module.exports = Stream;
const EE = require('events');
util.inherits(Stream, EE); // 原型链继承
function Stream() {
  EE.call(this); // 构造函数方法继承
}
```

对于原型链的继承，尝试探究Stream的Prototype属性，跟踪进入util.inherits 方法
```
// 摘自 node 5.0.0 +  lib/util.js 中 exports.inherits 方法
Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
```
```
// 摘录自 node 0.12 系列，lib/util.js 中 exports.inherits 方法
ctor.prototype = Object.create(superCtor.prototype, {
  constructor: {
    value: ctor,
    enumerable: false,
    writable: true,
    configurable: true
  }
});
```

ctor是Stream对象，superCtor是EE对象，操作完成后，Stream的原型链呈现如下关系
![继承-原型链关系图.png](http://7xnts0.dl1.z0.glb.clouddn.com/image/继承-原型链关系图-v1.png)

结合原型链向上搜索的特性，Stream模块可以通过`__proto__`指针访问到EventEmitter.prototype上的方法，如果对象的`__proto__`指针为null，则停止搜索。
`Object.prototype.__proto__` 指针为null，Object是JS中所有对象类型的源头。

> 所以，`__proto__`直接赋值，做原型链继承，从操作结果上来看，是没有问题的。

---

还有另外几种常见的原型链继承的方法对比

方式1，引自[Error MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Error#.E7.A4.BA.E4.BE.8B.3A_.E8.87.AA.E5.AE.9A.E4.B9.89.E5.BC.82.E5.B8.B8.E7.B1.BB.E5.9E.8B)
```
ctor.prototype = Object.create(superCtor.prototype);
// ctor.prototype.constructor = ctor; // 假如我们注释了这步
```
再看下原型链图（注释了 ctor.prototype.constructor = ctor），[测试代码](https://jsfiddle.net/plusman/gdeake7c/39/)
![Object.create-原型链继承](http://7xnts0.dl1.z0.glb.clouddn.com/image/Object.create-原型链继承.png)

另外一种写法
```
ctor.prototype = new superCtor();
```
对应的原型链图 [测试代码](https://jsfiddle.net/plusman/gdeake7c/40/)
![new-原型链继承](http://7xnts0.dl1.z0.glb.clouddn.com/image/new-原型链继承.png)

> 几种方式`__proto__`最后的指向都相同，但是后两种方法Stream对象的constructor发生了变化，这里碰到了一个问题，假如Stream的constructor指向自己，那么EventEmitter构造函数的方法将丢失，如何既保留Stram的构造函数方法，又拥有父类的构造函数方法，就牵涉到继承的另一个层面，构造函数方法的继承。

首先可以确定一点，Stream的constructor肯定要指向自己(ctor.prototype.constructor = ctor)，然后再在function Stream里面想办法执行function EventEmitter的方法。但是，面对传参数问题，很难有一种统一的方法。
1）传空参数给父类
```
function ctor(){
  superCtor.call(this);
}
```
2）所有参数继续传递
```
function ctor(arg1, arg2){
  superCtor.apply(this, arguments);
}
```
3）参数经过处理后，继续传递，毕竟superCtor能接受的参数，和ctor总会有不同的时候。

所以，node里面的util.inherits方法，只做了原型链继承，构造函数方法继承或不继承、如何继承，全交于程序员自由发挥。
但是在ES6的标准类实现里面，子类必须继承父类的constructor方法，参见阮一峰的[class继承](http://es6.ruanyifeng.com/#docs/class#Class的继承)，但是不管是ES2015还是ES5，本质上都是基于原型链的继承。

---

>回到疑惑2，Error对象的继承里面，Error.captureStackTrace 是否多余

第一反应查看Error对象，但是显示`function Error() { [native code] }`是v8的代码，那就先当黑盒处理。
1）先注释掉 captureStackTrace 方法，[示例代码](https://jsfiddle.net/plusman/gdeake7c/45/)
发现stack对象为空。
2）保留 captureStackTrace，删除 Error.call(this, msg),[示例代码](https://jsfiddle.net/plusman/gdeake7c/47/)
得到了stack对象。

> 所以如果我们需要错误对象拥有错误栈的话，需要使用 Error.captureStackTrace 从v8截获。

查阅node文档
Creates a .stack property on targetObject, which when accessed returns a string representing the location in the program at which Error.captureStackTrace was called.
```
var myObject = {};
Error.captureStackTrace(myObject);
myObject.stack  // similar to `new Error().stack`
```
不难理解captureStackTrace 会把错误栈绑定绑定在对象的stack属性上，最后一句注释`similar to new Error().stack`引起了疑惑。

> 如果 new Error().stack 就可以获取到stack，那么 Error.call(this, msg)，为什么不能。

确认下，new 操作符号会做那些事  
1. 新建一个实例对象，内部用this指代，并调用对象的constructor方法
2. 将对象的prototype属性，挂载到实例对象的`__proto__`上

鉴于1，Error.call(this, msg)，有调用Error的constructor方法，按道理，stack会被挂载到this对象上，但是没有。

尝试查看Error对象的源码定义，无奈没找到；后来回想stack未必一定挂载在this对象上，也可以挂载在`__proto__`属性上，这样同样可以通过`new Error().stack`访问到，因为原型链向上搜索的特性。

> 所以，如果需要保留错误栈，文章开头那段，Error.captureStackTrace 还是需要保留的。

(2017年01月18日11:34:52 补充):  
如果利用 ES6 的继承方式，那么不需要再调用 `captureStackTrace` 也能获取到错误堆栈，如此，错误栈首行不再是无用信息，写法如下
```javaScript
class HttpError extends Error {
    constructor(message, code, name) {
        super(message);
        this.status = code || 500;
        this.name = name || this.constructor.name;
    }

    // 可以利用 static 方法，抛出指定类型错误，做统一输出处理
    static badParameter (message) {
        return new HttpError(message, 400, 'BadParameter');
    }
}
```
