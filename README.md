# iirose forge local server

! 此项目不是 iirose-forge 必须的部分 !

一个 iirose-forge 的本地服务  
作为 forge 与本地文件系统通信的桥梁

## 安装

1 - 安装 nodejs

https://nodejs.org/

2 - 安装 pm2

https://github.com/jessety/pm2-installer

请使用带有管理员权限的终端

```bash
git clone https://github.com/jessety/pm2-installer.git
cd pm2-installer
npm run configure
npm run setup
```

安装 pm2 后需要重新打开终端使环境变量刷新

3 - clone 此项目 & 安装依赖

```bash
cd ..
git clone https://github.com/qwq0/iiroseForgeLocalServer.git
cd iiroseForgeLocalServer
npm install
```

4 - 使用 pm2 运行

请使用带有管理员权限的终端

```bash
pm2 update
pm2 start ./src/main.js
pm2 save
```
