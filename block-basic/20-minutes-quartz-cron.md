```
20 分钟学会 Quartz Cron 配置
创建于 2019-05-21 12:37:14
```
> Quartz Cron 采用类 Unix Cron 的写法的，但又有些语法拓展。最近使用时，查阅了一些网上资料，但大多是三、四年前的旧文，碰巧在 Quartz Cron 官网看到许多不错的资料，翻译整理为下文。

## 格式详解
Cron 表达式由 6 个必填字段和 1个可选字段组成，每个字段之间通过空格分割。
排列顺序为：Seconds Minutes Hours `Day-of-month` Month `Day-of-Week` Year，其中 Year 为可选。

每个字段详细定义如下表所示：  

| Field Name | Allowed Values | Allowed Special Characters |
| --- | --- | --- |
| `Seconds` | `0-59` | `, - * /` |
| `Minutes` | `0-59` | `, - * /` |
| `Hours` | `0-23` | `, - * /` |
| `Day-of-month` | `1-31` | `, - * ? / L W` |
| `Month` | `1-12 or JAN-DEC` | `, - * /` |
| `Day-of-Week` | `1-7 or SUN-SAT` | `, - * ? / L #` |
| `Year (Optional)` | `empty, 1970-2199` | `, - * /` |

## 特殊字符
`*` ：用于圈定范围所有值。例如，在 Minutes 位置使用 `*` 代表 “每分钟”  

`?` ：只能用于 Day-of-month 和 Day-of-Week 字段，表示‘无指定值’。由于同时指定这两个字段可能会产生规则上的冲突，你可以通过指定某个字段为 `?` 来忽略该字段的设置  
`-` ：用于圈定一段范围。例如，在 Hours 设置为 “10-12” 代表“第10、11、12 小时”  

`,` ：用于补充额外值，例如在 `Day-of-week` 设置为 “MON,WED,FRI”，表示选定“Monday, Wednesday, and Friday”  

`/` ：用于表示递进值，例如 Seconds 设置为 “0/15” 表示选定 “第 0，15，30 和 45 秒”，“5/15” 表示选定 “第 5，20，35 和 50 秒”。在 `/` 前指定为 `*` 或 `0` 两者是等价的。 `/` 只会在每个字段的合法取值范围内触发事件，递增后的值如果发生越界，不会作取模操作，而是回到起点。例如 Month 设置为 “7/6”，由于 7 + 6 > 11，第1次递增越界，回到起点，该表达式只会在 7 月份触发，等价于 “7”。这里的 6 不是指每 6 个月，需要注意到这细微的差别。  

`L` ：只能用于 Day-of-month 和 Day-of-Week 字段， `L` 为 “last” 的缩写，在不同字段中有不同的定义。如果Day-of-month 设置为 “L” 指月末，如 1月的第 31 天，平年 2 月的第 28 天等。如果 Day-of-Week 设置为 “L”，代表 “7” 或者 “SAT”。但如果 `L` 在 Day-of-Week 中出现在其他值之后，表示 “当月的最后一个星期几”，例如 “6L” 表示 “本月的最后一个星期五”。你也可以设置距离月末几天，例如设置 Day-of-month 为 “L-3” 代表距离月末还有三天的时候触发。使用 “L” 参数的时候，避免使用范围取值或者多个枚举值，这会产生不可预期的运行结果。  

`W` ：只可用于 Day-of-month 字段，确定离指定日期最近的工作日（周一至周五）。例如，“15W" 表示 “离 15 号最新的工作日”，如果 15 号是周六，那么 14 号周五将会被选定；如果 15 号是周日，则 16 号周一会被选定；如果 15 号是工作日，那么 15 号自身会被选定。但如果你设置为 “1W”，而且 1 号是星期六，那么当月的 3 号周一会被选定， `W` 的选定范围被圈定在当月，不会越界。  

`LW` ：混合使用时代表本月最后一个工作日。  

`#` ：只可用于 Day-of-Week 字段。代表“本月第几个 XXX 天”。例如，“6#3” 表示本月的第 3 个星期五（day 6 = 星期五，“#3” 代表本月第3个 XXX 天）。再比如，“4#5” 代表本月第 5 个星期三，但是，如果本月没有第 5 个星期三，那么该条件不会被触发。同一时刻  `#` 表达式只能出现一次，“3#1,6#3” 是不合法的。

_**上诉介绍的合法字符大小写不敏感，例如 W 和 w，MON 与 mon 是等价的**_

## 注意事项
- 同时支持配置 Day-of-month 和 Day-of-Week 的特性还未完成（所以你需要使用 `?`  忽略其中某个字段）
- 支持范围溢出 - 左值大于右值。比如：22-2 代表晚间 10 点至凌晨 2 点，再如 NOV-FEB 等。但是要避免过度使用范围溢出，这会使得表达式难以理解。一个不好的例子是：“0 0 14-6 ? * FRI-MON”
- 注意夏令时问题，一些欧美国家会在夏令时调整时钟位置，可能会导致任务丢失或者重复触发。但大多数亚非国家没有这个顾虑，参见：[Daylight saving time by country](https://en.wikipedia.org/wiki/Daylight_saving_time_by_country)

## 常见示例
> 请注意在 day-of-week 和 day-of-month 位置的 '?' 和 '*' 

| Expression | Meaning |
| --- | --- |
| `"0 0 12 * * ?"` | `Fire at 12pm (noon) every day`<br />每天中午 12 点触发。 |
| `"0 15 10 ? * *"` | `Fire at 10:15am every day`<br />每天上午 10:15 触发（注意和下面那条相比问号的位置） |
| `"0 15 10 * * ?"` | `Fire at 10:15am every day`<br />每天上午 10:15 触发 |
| `"0 15 10 * * ? *"` | `Fire at 10:15am every day`<br />每天上午 10:15 触发 |
| `"0 15 10 * * ? 2005"` | `Fire at 10:15am every day during the year 2005`<br />在 2015 年的每天上午 10:15 触发 |
| `"0 * 14 * * ?"` | `Fire every minute starting at 2pm and ending at 2:59pm, every day`<br />每天下午 2:00 ~ 2:59 每分钟触发一次 |
| `"0 0/5 14 * * ?"` | `Fire every 5 minutes starting at 2pm and ending at 2:55pm, every day`<br />每天下午 从 2:00 ~ 2:55，每 5 分钟触发一次 |
| `"0 0/5 14,18 * * ?"` | `Fire every 5 minutes starting at 2pm and ending at 2:55pm, AND fire every 5 minutes starting at 6pm and ending at 6:55pm, every day`<br />每天下午 2:00 ~ 2:55，下午6:00 ~ 6:55，每 5 分钟触发一次。 |
| `"0 0-5 14 * * ?"` | `Fire every minute starting at 2pm and ending at 2:05pm, every day`<br />每天下午 2:00 ~ 2:05 ，每分钟触发一次 |
| `"0 10,44 14 ? 3 WED"` | `Fire at 2:10pm and at 2:44pm every Wednesday in the month of March.`<br />在 3 月的每个星期三 下午2:10 和 下午2:44 分触发规则 |
| `"0 15 10 ? * MON-FRI"` | `Fire at 10:15am every Monday, Tuesday, Wednesday, Thursday and Friday`<br />周一到周五每天上午 10:15 分触发 |
| `"0 15 10 15 * ?"` | `Fire at 10:15am on the 15th day of every month`<br />每月第 15 天的上午 10:15 分触发 |
| `"0 15 10 L * ?"` | `Fire at 10:15am on the last day of every month`<br />每月月末上午 10:15 分触发 |
| `"0 15 10 L-2 * ?"` | `Fire at 10:15am on the last day of every month`<br />每月距月末 2 天前上午 10:15 分触发 |
| `"0 15 10 ? * 6L"` | `Fire at 10:15am on the last Friday of every month`<br />每月的最后一个星期五上午 10:15 分触发 |
| `"0 15 10 ? * 6L 2002-2005"` | `Fire at 10:15am on every last Friday of every month during the years 2002, 2003, 2004 and 2005`<br />在 2002-2005 之间的每月的最后一个星期五上午 10:15 分触发 |
| `"0 15 10 ? * 6#3"` | `Fire at 10:15am on the third Friday of every month`<br />每月的第 3 个星期五上午 10:15 分触发 |


## 参考资料
* [http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html](http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html)
* [http://www.quartz-scheduler.org/api/2.4.0-SNAPSHOT/org/quartz/CronExpression.html](http://www.quartz-scheduler.org/api/2.4.0-SNAPSHOT/org/quartz/CronExpression.html)
* [http://www.quartz-scheduler.org/api/2.4.0-SNAPSHOT/org/quartz/CronTrigger.html](http://www.quartz-scheduler.org/api/2.4.0-SNAPSHOT/org/quartz/CronTrigger.html)
* [http://www.bejson.com/othertools/cron/](http://www.bejson.com/othertools/cron/)