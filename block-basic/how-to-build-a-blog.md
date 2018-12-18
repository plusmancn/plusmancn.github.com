```
独立博客搭建备忘
创建于 2018-12-18 11:53:33
```

## 缘由
先前使用过 gitbook 搭建过博客，虽说是静态博客，但也需要执行 `gitbook build` 编译成静态文件。  
直到发现了 docsify，连编译都省了，直接前端解析，而且速度也不错，果断切换。

独立博客要实现如下目标
1. 项目托管于 github，这年头独立博客最重要的功能是备份吧，流量真不在这。
2. 可以通过 webhook 自动更新
3. https 支持，并能够自动续费证书
4. 不需要评论功能，真有评论可以去 github 提issue 发起讨论

第1条，可以直接查看本项目源码，docsify 配置很简单，如果你选择了直接使用 githubPages 部署项目，那就不要要配置 webhook 了。如果你也是选择 vps 部署，那就继续阅读吧。

## webhook 更新
选择的包是 [github-webhook](https://www.npmjs.com/package/github-webhook)，搭配 tmux 后台运行，可参照本项目的 `.webhook.json` 和 `package.json -> scripts -> webhook` 配置，通过 npm run webhook 启动监听服务，此时你需要去 github 对应的项目，配置项目的 webhooks 推送。

## 域名配置
nginx 配置
```shell
server {
    listen 80;
    server_name swagger.plusman.cn;

    location / {
        root /root/swagger-ui/dist;
    }
}
```
