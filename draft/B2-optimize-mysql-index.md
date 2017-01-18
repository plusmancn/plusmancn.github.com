---
title: 'mysql 查询性能优化总结'
createdAt: '2016-09-29 14:28:13'
tags:
- 'mysql'
- 'node'
---
![disk-io](../images/disk-io.jpg)

开始做性能优化前，先要明白你当前所面对的查询缓慢问题，是不是由 `I/O` 瓶颈所导致的，如果不是，可以关闭这篇文章了。
不管是磁盘和内存，他们都有自己的 `IOPS`(每秒读取数) 极限，所以查询性能优化的本质是:  *尽可能的缩小单次查询的数据范围，达到更小的 `IO` 开销。*

## 存储引擎抉择

## 表设计

## 索引设计

## 查询优化

## 缓存设计

* 区分度
* 最左匹配特性
* unique 的效率是不是比 index 要高，primary 呢
* between 性能和 <> 性能比较
* Table Type 选择
* 数据记录在多少的时候需要考虑分表
* 对于重查询的表，将无用字段剔除，改存到 store 里去
* cardinality 值定义
* forceIndex 会不会导致数据获取错误
* 索引的值不应该被频繁更新
* 列名长度不要超过 18 个字节
* 记得指定 `row_format`，[Physical Row Structure of InnoDB Tables](http://dev.mysql.com/doc/refman/5.7/en/innodb-physical-record.html)


Q: 字段类型定义，与实际内存值占用  
A: [Optimizing Data Size](http://dev.mysql.com/doc/refman/5.7/en/data-size.html)

>If you always use many columns when selecting from the table, the first column in the index should be the one with the most duplicates, to obtain better compression of the index.
最大区分度牺牲了 size，那么实际速度是 实际读取数据 / I/O 速率 

Q: 时间类型的选择，如何保持可读性和性能的平衡
A：在MySql5.6.5 之后，可以使用 `CURRENT_TIMESTAMP` 作为默认值。
[Automatic Initialization and Updating for TIMESTAMP and DATETIME](http://dev.mysql.com/doc/refman/5.7/en/timestamp-initialization.html)
[How do you set a default value for a MySQL Datetime column?](http://stackoverflow.com/questions/168736/how-do-you-set-a-default-value-for-a-mysql-datetime-column/168832#168832)

Q: 排序字段，是否一定要在索引末尾
A: [Section 9.2.1.15, “ORDER BY Optimization](http://dev.mysql.com/doc/refman/5.7/en/order-by-optimization.html)

Q: join 并不意味着低性能，Using FOREIGN KEY Constraints，可以提高索引速率
A: 查询依旧是 join，外键的作用是约束

Q: 类型分析
A: [Using PROCEDURE ANALYSE](http://dev.mysql.com/doc/refman/5.7/en/procedure-analyse.html)

Q: 哪些情况下，会造成死锁
A: `select ... for update`

Q: Speed of INSERT Statements
A: 结果批量插入，利用默认值特性

Q: free data size 控制
A: optimize table

`SQL_NO_CACHE`

## 表设计
[MySQL 5.7 Reference Manual Optimizing Data Size](http://dev.mysql.com/doc/refman/5.7/en/data-size.html)
* 尽量缩小数据大小
* 更小的数据，拥有更小的索引，更小的磁盘I/O，更小的内存占用
* 选择正确的表类型
InnoDB 
  * 遵 ACID model，支持事务
  * 支持行级锁
  * 一定要有主键：choose primary columns that are rarely or never updated.
  * B-tree indexes  所以特别适合 SSD

字段类型概览
[MySQL 5.7 Reference Manual Data Type Overview](http://dev.mysql.com/doc/refman/5.7/en/data-type-overview.html)
* text 长度限制
* varchar 长度限制

## 参考资料
* [美团点评技术团队：MySQL索引原理及慢查询优化](http://tech.meituan.com/mysql-index.html) PS: 不赞同在业务中使用如此复杂的SQL语句  
* [MySQL 5.7 Reference Manual Optimization](http://dev.mysql.com/doc/refman/5.7/en/optimization.html)  
