---
title: 'Mysql Node CURD 简记'
date: '2017-12-03 23:34:14'
tags:
- 'mysql'
- 'node'
- '基石'
---

## 目录
1. ORM 库选择
2. 建表建议
3. 索引使用
4. 数据分割 & 清理
5. 读写分离

## ORM 库选择
目前在工作中使用过的 ORM 库有两个：  
[Sequelize](http://docs.sequelizejs.com/)  
Sequelize is a promise-based ORM for Node.js v4 and up. It supports the dialects PostgreSQL, MySQL, SQLite and MSSQL and features solid transaction support, relations, read replication and more.

[Toshihiko](https://github.com/XadillaX/Toshihiko)  
Yet another simple ORM for Node.js.

简单的抉择方式为，如果你只有简单的 CURD 操作，没有对于映射关系、读写分离、事务、批量读写等需求，那么选择 Toshihiko，然则可以考虑上 Sequelize 了。

## 建表建议
* 表库的编码一般选择为：utf8mb4（支持表情符号），引擎选择为 InnoDB。
* 表名、字段名使用下划线 + 小写字母命名，例如 foo_bar
* 主键尽量简短，因为所有索引里面都会存储有和主键的映射关系。
* 默认值问题：尽量避免 null 值，mysql 索引对 null 值优化不足。

>常用数据类型:
原始文档：[mysql data types](https://dev.mysql.com/doc/refman/5.7/en/data-types.html)

**int**  
如果在 unsigned 状态下，大概在 42 亿（2^32）的数据量，js 不支持 `long` 类型。  

`int(1)` vs `tinyint(1)`  等价吗？  
指定长度，只是改变数据的展示长度，并不会改变数据本身的存储结构。
所以 int 类型还是会占据 4 bytes，`tinyint` 还是会占据 1 byte
所以，BOOL 类型建议使用 `tinyint(1)`

JS 内可以表示的最大安全整型为，`Number.MAX_SAFE_INTEGER`，约为 `2^53 - 1`，对应的数据库的 `BIGINT`，所以碰到一些大于 2^32 的数，数据库一定要用 `BIGINT` 类型，这在对接一些三方服务的时候，可能会碰到一些超过 `2^32` 的 `id` 值。

**char 定长字符串**  
空间一定，会截断尾部空格，适合数据大小分布大致在同一范围内的数据。

截断尾部空格，有时候可以避免我们犯一些人为错误，人眼很多时候很难分辨出一串字符串是否带了尾部空格。

但是直接操作数据库，也不是什么好习惯，可以通过 API 进行数据维护，API 层可以做输入控制。

**varchar 可变长字符串**  
上限为 65535 字节，会占据 1 至 3 bytes 来存储后面字节的长度。

超过 255 长度的 varchar 也是无法被全文索引的，多数汉字在 utf8 编码下占据 3 个字节。
 
>The index key prefix length limit is 767 bytes for InnoDB tables that use the REDUNDANT or COMPACT row format  
参见：[mysql innodb-mximums-minimums](https://dev.mysql.com/doc/refman/5.7/en/innodb-restrictions.html#innodb-mximums-minimums)

**text**  
上限为 65535 字节，可变长，没有默认值。  
不适合建立索引，有 `FULLTEXT` 类型的索引，但是真到了这步，我们会选择引入 `Elastic` 等专业的索引服务，把 mysql 当做一个数据存储。

**enum**  
字面描述可读性强；存储是 `numbers` 类型，更加紧凑高效。  
强烈不建议使用数字作为 `enum` 的字面量，如果非要请使用 `tinyint` 或者 `smallint`。  
尤其要注意，`enum` 的排序问题，先后顺序是按照值在枚举中的索引值（`index numbers`）来确定先后的，而不是字符串的 `ascall` 码优先级。为了避免混淆，可以在申明枚举类型的时候，就按照字母排序。例如：
```sql
enum('ab' ,'ac', 'b')
```

**datetime**  
相比于 `timestamp` 可读性更佳，还有连接初始化的时候，一定要留意时区设置问题。  

mysql 5.6.5+ 后，可以设置 `datetime` 默认时间为当前时间，通过 `ON UPDATE` 可以自动记录条目变更时间，大多数情况下，会默认在表尾部添加创建时间、更新时间两个字段。
```sql
alter table your_table_name
    add column `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    add column `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';
```

**json**  
参阅：[mysql JSON](https://dev.mysql.com/doc/refman/5.7/en/json.html)，mysql 5.7.8+ 之后，mysql 支持 json 数据类型。

## 索引使用
参阅：[optimization-indexes](https://dev.mysql.com/doc/refman/5.7/en/optimization-indexes.html)  
在磁盘I/O和 CPU 处理能力一定情况下，如果我们能在尽量小的数据集上进行我们的操作，那么我们便能更快的获取到结果，我们建索引、分区、分表、分库，最主要的目的就是，能够尽可能快的缩小数据集范围。

* 索引不是越多越好，由于数据插入的时候需要建立索引，所以会影响数据写入速度。
* 参与索引的键，尽量是小数据类型，可以减少磁盘 I/O 开销，提升读写速度。
* 假如你很确定某个索引在某条语句里面效果更好，你可以通过  `FORCE INDEX(Index_Key)`  来强制指定缩影。
* 通过 `explain` 命令可以查看索引命中情况。

常用索引有：
* `PRIMARY KEY` 每个表最多只能有一个 ``，具有唯一值特性，不能含有 null 值（这对索引性能是一个很大提升）
* `UNIQUE KEY`，允许多个，具有唯一值特性，可以含有 null 值。
* `INDEX KEY`，允许多个，值可重复，可以含有 null 值。

**判断索引性能**  
```javascript
数据重复率 = (1 - uniqValue.length / Value.length) * 100%
```
重复率越低，索引性能相对越优。

**联合索引**  
具有最左匹配原则，例如有 `A-B-C` 的一个索引，可以命中，`A`，`A-B`，但不能跳过 `A`，直接命中 `A` 之后的列，比如 `B`。


## 数据分割 & 清理
数据分割一般分为水平分割（比如基于时间）和垂直分割（比如基于用户），一个良好的分割模式，将大幅降低后期数据清理的难度。

在亿级数据量的时候，使用[分区](https://dev.mysql.com/doc/refman/5.7/en/partitioning.html)，是一个很经济的选择，相比于分表对查询方式的改变，分区在 sql 语句层面是连贯的，可以直接通过 `SELECT * FROM t PARTITION(p0, p1)` 的形式来指定分区；当某个分区的数据变得不再常用的时候，可以像清空表一样，直接 `DROP` 指定分区。

官方还预告了一个在分区上并发执行聚合操作的特性，并给了优先实现的等级，这可以应付一些简单的数据统计需求  
>Queries involving aggregate functions such as SUM() and COUNT() can easily be parallelized

数据分区类型参见：[mysql partitioning-types](https://dev.mysql.com/doc/refman/5.7/en/partitioning-types.html)

这里对 `Hash Partitioning` 做一个举例：我们需要按天存储短信发送记录，数据保留一个月。

首先解决存储，建表如下：
```sql
CREATE TABLE `sms_record_hash` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `phone_id` varchar(50) NOT NULL DEFAULT '' COMMENT '单个接收者手机号',
  `content` varchar(1024) NOT NULL DEFAULT '' COMMENT '短信内容',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
PARTITION BY HASH( DAY(created_at) ) PARTITIONS 31;
```

`PRIMARY KEY (`id`, `created_at`)` 联合主键问题
>`Unique Keys` 和分区键的关系：[Partitioning Keys, Primary Keys, and Unique Keys](https://dev.mysql.com/doc/refman/5.7/en/partitioning-limitations-partitioning-keys-unique-keys.html)。  
every unique key on the table must use every column in the table's partitioning expression  

即每一个独立键必须包含有分区键，由于 `Primary Key` 也是 `unique` 的，所以该规则同样适用于主键。

思考表 t1，t2 可以使用哪一列作为分区键？  

表 t1
```sql
CREATE TABLE t1 (
    col1 INT NOT NULL,
    col2 INT NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col3),
    UNIQUE KEY (col2, col4)
);
```

表 t2
```sql
CREATE TABLE t2 (
    col1 INT NOT NULL,
    col2 INT NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col2, col3),
    UNIQUE KEY (col3)
);
```

答：表 t1 是没有一列可以作为分区键的，表 t2 是 `clol3` 列。

分成 31 个分区的目的是因为每月最多只有 31 天。  
思考：假如我们需要保留 2 个月的数据，该如何设计 Hash 函数。  
答：可以试试 `DAYOFYEAR` 函数，参阅 [mysql date-and-time-functions](https://dev.mysql.com/doc/refman/5.5/en/date-and-time-functions.html)

清理问题：  
针对数据保留一个月，可以考虑跑一个定时任务，今日清空下一天分区的数据。
如此一个循环下来，可以保持数据量在一个月左右。
如果我们需要清空一个分区，可以执行如下命令，语法参见：[alter-table-partition-operations](https://dev.mysql.com/doc/refman/5.5/en/alter-table-partition-operations.html)
```sql
ALTER TABLE sms_record_hash TRUNCATE PARTITION pN;
```


读取：  
进行数据读取的时候，我们可以通过如下来语法指定操作分区。
```sql
SELECT  * FROM sms_record_hash PARTITION(p0, p1);
```  

同时可以通过，`explain partitions` 的方式来确定分区选择情况。


## 读写分离
目前在项目中实践的做法比较原始。  
在代码里同时实例化一个 `rr`（只读实例），一个 `rw`（读写实例），在代码层面选择操作实例。  
利用 mysql 的 `Replication` 进行实例间的数据同步。