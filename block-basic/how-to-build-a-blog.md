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

## 免费 https 证书配置
### acme 配置
首选 [acme.sh](https://acme.sh) 来管理你的免费证书，安装完毕后，执行如下命令生成证书，`-w` 指向你的文件目录，参见[使用说明](https://github.com/Neilpang/acme.sh/wiki/%E8%AF%B4%E6%98%8E)
```shell
acme.sh --issue -d plusman.cn -d www.plusman.cn -w /root/plusmancn.github.com
```

Iinstall the cert to Nginx，acme 会每 60 天帮你更新一次证书，`fullchain.cer` 名字不可变，不然会影响评级
```
acme.sh --install-cert -d plusman.cn \
--key-file   /etc/nginx/ssl/plusman.cn.key \
--fullchain-file /etc/nginx/ssl/fullchain.cer \
--reloadcmd     "service nginx force-reload"
```

### Nginx config
参考：[简书：acme.sh + Let's Encrypt + nginx 配置通配符HTTPS](https://www.jianshu.com/p/b6b172f69c14)

acme 为了配置安全，不会自动更改 nginx 相关配置，需要我们手动设置 ssl 支持

首先生成 dhparam.pem 文件，这会提升你的域名评级  
>This is going to take a long time
```shell
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
```

配置确认，参考 [Let's Encrypt，免费好用的 HTTPS 证书](https://imququ.com/post/letsencrypt-certificate.html)
```shell
http {
    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
    ssl_prefer_server_ciphers on;

    # 80 端口重定向到 443
    server {
        listen 80;
        server_name www.plusman.cn plusman.cn;

        location / {
            rewrite ^/(.*)$ https://plusman.cn/$1 permanent;
        }
    }

    server {
        listen 443 ssl;
        server_name www.plusman.cn plusman.cn;

        ssl_certificate         /etc/nginx/ssl/fullchain.cer;
        ssl_certificate_key     /etc/nginx/ssl/plusman.cn.key;
        ssl_dhparam             /etc/nginx/ssl/dhparam.pem;

        location / {
            root /root/plusmancn.github.com;
            index index.html;
        }
    }
}
```

最后重启 nginx 就可以啦。

## 证书等级测试
访问 [SSL Labs](https://www.ssllabs.com/ssltest/) 测试你的域名状况，这是我的测试结果 [SSL Report: plusman.cn](https://www.ssllabs.com/ssltest/analyze.html?d=plusman.cn&latest)
