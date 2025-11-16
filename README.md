# 记账应用部署文档

## 项目概述

本项目是一个基于React和Node.js的记账应用，采用前后端分离架构。前端使用Vite构建，后端提供RESTful API服务。本文档详细说明在Windows和Linux系统中部署生产环境的步骤。

## 系统架构

- **前端**：React + Ant Design + Vite
- **后端**：Node.js + Express
- **数据存储**：JSON文件存储（可扩展为数据库）

## 部署前准备

### 环境要求

- **Node.js**：v16.x 或更高版本
- **npm**：v8.x 或更高版本
- **操作系统**：Windows Server / Linux (Ubuntu/CentOS)

### 必要软件

- Windows: Git, Node.js, PM2 (可选，用于进程管理)
- Linux: Git, Node.js, PM2, Nginx (可选，用于反向代理)

## 部署步骤

### 1. 克隆代码库

### 2. 安装依赖

### 3. 构建前端

### 4. 配置后端

### 5. 启动服务

### 6. 配置Nginx（可选）

### 7. 设置开机自启动（推荐）

## Windows系统部署

### 1. 克隆代码库

```bash
# 打开命令提示符或PowerShell
git clone https://your-repository-url.git
cd 记账
```

### 2. 安装Node.js

1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载并安装LTS版本
3. 验证安装：
   ```bash
   node -v
   npm -v
   ```

### 3. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 4. 构建前端

```bash
npm run build
```
构建完成后，静态文件会生成在 `dist` 目录中。

### 5. 配置后端

1. 复制后端配置文件（如果有）
2. 确保数据目录具有写入权限

### 6. 启动后端服务

#### 使用PM2管理进程（推荐）

```bash
# 全局安装PM2
npm install -g pm2

# 启动后端服务
cd backend
npm start

# 或者使用PM2启动
cd backend
npm run pm2-start  # 确保package.json中有此脚本
```

#### 手动启动（不推荐用于生产环境）

```bash
cd backend
npm start
```

### 7. 配置IIS（可选，用于反向代理）

1. 安装IIS
2. 安装URL重写模块
3. 创建网站，指向 `dist` 目录
4. 配置反向代理规则，将API请求转发到Node.js服务

### 8. 设置开机自启动

#### 使用PM2的开机自启动

```bash
# 设置PM2开机自启动
npm install -g pm2
npm install pm2-windows-startup -g
npm install pm2-windows-service -g
npm install pm2-windows-startup --save
pm-windows-startup install
```

#### 使用Windows服务

可以使用 [NSSM](https://nssm.cc/) 将Node.js服务注册为Windows服务：

```bash
# 下载NSSM并解压
cd nssm-2.24\win64

# 安装服务
nssm install 记账应用
# 在弹出的界面中设置：
# Path: C:\Program Files\nodejs\node.exe
# Startup directory: f:\path\to\projects\记账\backend
# Arguments: server.js

# 启动服务
nssm start 记账应用
```

## Linux系统部署

### 1. 克隆代码库

```bash
# 更新系统包
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
sudo yum install epel-release -y

# 安装Git
sudo apt install git -y  # Ubuntu/Debian
sudo yum install git -y  # CentOS/RHEL

# 克隆代码
git clone https://your-repository-url.git
cd 记账
```

### 2. 安装Node.js

#### Ubuntu/Debian

```bash
# 使用NodeSource安装Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

#### CentOS/RHEL

```bash
# 使用NodeSource安装Node.js 16
sudo curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 4. 构建前端

```bash
npm run build
```
构建完成后，静态文件会生成在 `dist` 目录中。

### 5. 配置后端

```bash
# 确保数据目录存在且有写入权限
cd backend
mkdir -p data
chmod 755 data
```

### 6. 启动后端服务

#### 使用PM2管理进程（推荐）

```bash
# 全局安装PM2
npm install -g pm2

# 启动后端服务
cd backend
npm start

# 或者使用PM2启动
cd backend
npm run pm2-start  # 确保package.json中有此脚本
```

### 7. 配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install nginx -y  # Ubuntu/Debian
sudo yum install nginx -y  # CentOS/RHEL

# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/accounting-app
```

添加以下配置（根据实际情况修改）：

```nginx
server {
    listen 80;
    server_name accounting-app.example.com;

    # 静态文件服务
    location / {
        root /path/to/projects/记账/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置并重启Nginx：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/accounting-app /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 8. 设置防火墙规则

```bash
# Ubuntu/Debian
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 9. 设置开机自启动

#### 使用PM2开机自启动

```bash
# 设置PM2开机自启动
npm install -g pm2
npm run pm2-start  # 先启动服务
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

#### 使用systemd服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/accounting-app.service
```

添加以下内容：

```ini
[Unit]
Description=Accounting Application Backend
After=network.target

[Service]
User=your-username
WorkingDirectory=/path/to/projects/记账/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable accounting-app.service
sudo systemctl start accounting-app.service
```

验证服务状态：

```bash
sudo systemctl status accounting-app.service
```

## 环境变量配置

### 前端环境变量

在项目根目录创建 `.env` 文件（生产环境）或 `.env.production` 文件来配置前端环境变量：

```dotenv
# API基础URL
VITE_API_BASE_URL=http://your-server.com/api

# 应用标题
VITE_APP_TITLE=记账应用

# 是否启用开发模式
VITE_ENABLE_DEV_MODE=false
```

### 后端环境变量

在 `backend` 目录创建 `.env` 文件来配置后端环境变量：

```dotenv
# 服务端口
PORT=3000

# 管理员登录凭据（重要：生产环境必须修改默认值）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 数据库配置
DB_PATH=./data/accounting.db

# JWT密钥（用于会话管理）
JWT_SECRET=your_secure_jwt_secret_key

# 跨域配置
CORS_ORIGIN=http://your-server.com

# 日志级别
LOG_LEVEL=info

# 备份配置（可选）
BACKUP_FREQUENCY=daily  # daily, weekly, monthly
BACKUP_PATH=./data/backups
```

#### 环境变量配置步骤

1. 在 `backend` 目录下，复制 `.env.example` 文件为 `.env` 文件：
   ```bash
   # Linux/Mac
   cp .env.example .env
   
   # Windows
   copy .env.example .env
   ```

2. 编辑 `.env` 文件，根据实际需要修改配置值，特别是管理员凭据部分：
   ```dotenv
   # 生产环境务必修改这些默认值
   ADMIN_USERNAME=your_custom_username
   ADMIN_PASSWORD=your_secure_password
   ```

3. 保存文件并重启后端服务使配置生效：
   ```bash
   cd backend
   npm install  # 安装新增的dotenv依赖
   npm start
   ```

> **安全提示**：确保 `.env` 文件已添加到 `.gitignore` 中，避免将敏感信息提交到版本控制系统。

### 注意事项

1. **不要将敏感信息提交到版本控制**：确保 `.env` 文件已添加到 `.gitignore` 中
2. **环境变量生效**：修改环境变量后需要重启服务才能生效
3. **不同环境使用不同配置**：开发环境、测试环境和生产环境应该使用不同的环境变量配置

## 部署注意事项

### 数据备份

1. **数据库备份**：定期备份 `backend/data` 目录中的数据库文件

   ```bash
   # Linux/Mac
   cp -r backend/data /path/to/backup/`date +%Y%m%d`
   
   # Windows
   xcopy backend\data D:\backup\%date:~0,4%%date:~5,2%%date:~8,2% /s/h/e/k/f/c
   ```

2. **配置文件备份**：备份环境变量配置文件

### 版本升级

1. **停止服务**：升级前先停止运行的服务

2. **备份数据**：确保备份了所有重要数据

3. **更新代码**：拉取最新代码并重新构建

   ```bash
   git pull
   npm install
   npm run build
   ```

4. **启动服务**：重新启动后端服务

### 监控与维护

1. **日志监控**：定期查看应用日志

   ```bash
   # 后端日志（如果使用PM2）
   pm2 logs backend
   ```

2. **性能监控**：监控服务器资源使用情况

   ```bash
   # Linux
   top
   htop
   ```

3. **定时重启**：根据需要设置定时重启策略

## 常见问题与解决方案

### 服务无法启动

1. **端口被占用**：修改 `.env` 文件中的 `PORT` 配置或释放被占用端口

   ```bash
   # 查看端口占用
   netstat -ano | findstr :3000  # Windows
   netstat -tuln | grep 3000     # Linux
   
   # 释放端口（终止占用进程）
   taskkill /PID <进程ID> /F  # Windows
   kill -9 <进程ID>           # Linux
   ```

2. **依赖问题**：确保所有依赖已正确安装

   ```bash
   cd backend
   npm install --force
   ```

### 数据库相关问题

1. **权限不足**：确保应用有数据库文件的读写权限

   ```bash
   # Linux
   chmod -R 755 backend/data
   ```

2. **数据库损坏**：从备份恢复数据库

### 前端访问问题

1. **跨域错误**：检查 `CORS_ORIGIN` 配置是否正确

2. **静态文件加载失败**：确认Nginx/Apache配置中的路径设置正确

## 性能优化

### 前端优化

1. **启用GZIP压缩**

   ```nginx
   # Nginx配置示例
   gzip on;
   gzip_comp_level 6;
   gzip_types text/plain text/css application/javascript application/json;
   ```

2. **使用CDN**：将静态资源部署到CDN

3. **代码分割**：使用动态导入减少初始加载时间

### 后端优化

1. **数据库索引**：为频繁查询的字段创建索引

2. **缓存策略**：实现适当的缓存机制减少数据库查询

3. **连接池**：使用数据库连接池管理连接

## 安全建议

1. **HTTPS配置**：在生产环境中配置SSL证书启用HTTPS

   ```nginx
   # Nginx HTTPS配置示例
   server {
       listen 443 ssl;
       server_name accounting-app.example.com;
       
       ssl_certificate /path/to/ssl/cert.pem;
       ssl_certificate_key /path/to/ssl/key.pem;
       
       # 其他配置...
   }
   ```

2. **定期更新依赖**：保持所有依赖包为最新版本

   ```bash
   npm update
   cd backend
   npm update
   ```

3. **输入验证**：确保所有用户输入都经过适当的验证和清理

4. **限流策略**：实现API请求限流防止滥用

5. **安全头设置**：添加安全相关的HTTP头

   ```nginx
   # Nginx安全头配置
   add_header X-Content-Type-Options nosniff;
   add_header X-Frame-Options SAMEORIGIN;
   add_header X-XSS-Protection "1; mode=block";
   ```