# HotNow 部署指南

## 1. 前置条件

- 有效的 GitHub 账户
- Cloudflare 账户
- Node.js 18+ 和 pnpm

## 2. 部署 YouTube 代理服务

### 选项 A: 部署到 Railway（推荐）

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 配置环境变量
railway variable set INVIDIOUS_INSTANCE=http://localhost:9000
railway variable set PORT=3001

# 5. 部署
railway up
```

部署后，你会得到一个公网 URL，如：`https://hotnow-youtube-proxy.up.railway.app`

### 选项 B: 部署到 Cloudflare Workers

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录
wrangler login

# 3. 创建新项目
wrangler init youtube-proxy

# 4. 复制 cloudflare-worker.ts 的内容到项目
# 5. 配置环境变量
wrangler secret put INVIDIOUS_INSTANCE

# 6. 部署
wrangler deploy
```

## 3. 部署主应用到 Cloudflare Pages

### 步骤 1: GitHub 配置

```bash
# 1. 创建 GitHub 仓库（如果还没创建）
# 访问 https://github.com/new
# 创建名为 hotnow 的仓库

# 2. 添加远程仓库
git remote add origin https://github.com/yourusername/hotnow.git

# 3. 推送代码
git branch -M main
git push -u origin main
```

### 步骤 2: Cloudflare Pages 部署

1. 访问 https://dash.cloudflare.com/
2. 进入 Pages
3. 点击 "连接到 Git"
4. 授权 GitHub 账户
5. 选择 `hotnow` 仓库
6. 配置构建设置：
   - **框架预设**: 其他
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist/output/public`
   - **环境变量**:
     - `YOUTUBE_PROXY_URL`: 你的代理服务 URL（如 `https://hotnow-youtube-proxy.up.railway.app`）
     - `NODE_VERSION`: `22`
     - `CF_PAGES`: `1`

7. 点击 "保存并部署"

## 4. 本地开发

### 运行整个项目（包括代理服务）

```bash
# 终端 1: 运行 YouTube 代理
INVIDIOUS_INSTANCE=http://localhost:9000 npm run youtube-proxy

# 终端 2: 运行主应用
YOUTUBE_PROXY_URL=http://localhost:3001 npm run dev
```

或者使用合并命令：

```bash
npm run dev:with-proxy
```

## 5. 环境变量配置

### 本地开发

创建 `.env.server` 文件：

```
YOUTUBE_PROXY_URL=http://localhost:3001
```

### 生产环境 (Cloudflare Pages)

在 Cloudflare Pages 设置中添加：

```
YOUTUBE_PROXY_URL=https://your-proxy-url.com
```

## 6. API 端点

### YouTube 代理 API

```
GET /api/youtube/trending

响应:
{
  "success": true,
  "data": [
    {
      "videoId": "...",
      "title": "...",
      "author": "...",
      "viewCount": 123456,
      "url": "https://youtube.com/watch?v=...",
      "invidious_url": "https://invidious.../watch?v=..."
    }
  ],
  "count": 30,
  "timestamp": "2024-11-06T..."
}
```

## 7. 故障排除

### YouTube 热榜无法加载

1. 检查代理服务是否运行
2. 检查 `YOUTUBE_PROXY_URL` 环境变量是否正确设置
3. 检查代理服务的日志
4. 验证 Invidious 实例是否可访问

### Cloudflare Pages 构建失败

1. 检查构建命令是否正确
2. 查看构建日志获取详细错误信息
3. 确保所有环境变量已设置
4. 验证 Node.js 版本（需要 18+）

## 8. 更新和维护

### 推送代码更新

```bash
git add .
git commit -m "描述你的更改"
git push origin main
```

Cloudflare Pages 会自动检测推送并重新部署。

### 更新依赖

```bash
pnpm update
git add pnpm-lock.yaml
git commit -m "Update dependencies"
git push origin main
```
