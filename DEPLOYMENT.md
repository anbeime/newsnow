# NewsNow 部署指南

## 快速部署（推荐：Vercel）

### 1. 前置条件

- 有效的 GitHub 账户
- Node.js 18+ 和 pnpm
- Vercel 账户（免费）

### 2. Vercel 部署（推荐）

#### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 部署到生产环境

```bash
cd C:\D\newsnow-deploy
vercel --prod
```

#### 步骤 4: 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

**YouTube 配置：**

```
YOUTUBE_PROXY_URL=https://your-project.vercel.app/api/youtube/trending
```

- 说明：设置为项目自身的 API 端点，无需单独部署代理服务
- 如果不设置，将直接访问多个 Invidious 实例（备用方案）

**Product Hunt 配置：**

```
PRODUCTHUNT_API_TOKEN=your_product_hunt_api_token
```

- 说明：如果需要 Product Hunt 热榜源，必须设置此变量
- 获取方式：访问 https://api.producthunt.com/v2/oauth/authorize

#### 步骤 5: 验证部署

部署完成后，访问以下端点验证：

- 主页: `https://your-project.vercel.app`
- YouTube Proxy: `https://your-project.vercel.app/api/youtube/trending`

### 3. YouTube Proxy 部署说明

项目已内置 YouTube Proxy API 端点，部署到 Vercel 后自动可用！

#### 内置端点

部署后自动可用：`https://your-project.vercel.app/api/youtube/trending`

该端点会：

1. 自动轮询多个 Invidious 实例
2. 返回标准化的热榜数据
3. 支持跨域访问

#### 为什么不需要 Cloudflare Worker？

1. **统一部署** - 所有功能在一个平台上管理
2. **减少延迟** - Vercel Edge Network 接近用户
3. **简化配置** - 只需配置一个 Vercel 项目
4. **无需额外账号** - 不需要 Cloudflare 账户

### 4. Cloudflare Pages 部署（可选）

如果需要使用 Cloudflare D1 数据库或特定功能：

#### 步骤 1: GitHub 配置

```bash
git remote add origin https://github.com/yourusername/newsnow.git
git push -u origin main
```

#### 步骤 2: Cloudflare Pages 部署

1. 访问 https://dash.cloudflare.com/
2. 进入 Pages
3. 点击 "连接到 Git"
4. 授权 GitHub 账户
5. 选择 `newsnow` 仓库
6. 配置构建设置：
   - **框架预设**: 其他
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist/output/public`
   - **环境变量**:
     - `YOUTUBE_PROXY_URL`: 你的 Vercel 项目 URL（如 `https://your-project.vercel.app/api/youtube/trending`）
     - `NODE_VERSION`: `22`
     - `CF_PAGES`: `1`
7. 点击 "保存并部署"

## 5. 部署 YouTube 代理服务（可选，不推荐）

### 选项 A: 部署到 Railway

### 选项 A: 部署到 Railway（可选）

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

### 选项 B: 部署到 Cloudflare Workers（可选）

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

## 6. 本地开发

### 运行整个项目（包括本地代理）

```bash
# 终端 1: 运行 YouTube 代理（如果需要）
INVIDIOUS_INSTANCE=http://localhost:9000 npm run youtube-proxy

# 终端 2: 运行主应用
YOUTUBE_PROXY_URL=http://localhost:3001 npm run dev
```

或者使用合并命令：

```bash
npm run dev:with-proxy
```

**注意：** 部署到 Vercel 后，不需要本地代理服务。

### 运行主应用（推荐）

```bash
npm run dev
```

## 7. 环境变量配置

### 本地开发

创建 `.env.server` 文件：

```env
# YouTube 代理 URL（可选）
YOUTUBE_PROXY_URL=http://localhost:3001

# Product Hunt API Token（如果需要）
PRODUCTHUNT_API_TOKEN=your_token_here
```

### 生产环境 (Vercel)

在 Vercel 项目设置中添加：

```env
# YouTube 代理 URL（推荐设置为项目自身的 API）
YOUTUBE_PROXY_URL=https://your-project.vercel.app/api/youtube/trending

# Product Hunt API Token（必填，如果需要 Product Hunt 源）
PRODUCTHUNT_API_TOKEN=your_token_here
```

### 生产环境 (Cloudflare Pages)

在 Cloudflare Pages 设置中添加：

```env
# YouTube 代理 URL（建议设置为 Vercel 项目的 API）
YOUTUBE_PROXY_URL=https://your-project.vercel.app/api/youtube/trending

# Product Hunt API Token
PRODUCTHUNT_API_TOKEN=your_token_here

# Cloudflare 特定
CF_PAGES=1
NODE_VERSION=22
```

## 8. API 端点

### YouTube 代理 API（内置，部署后自动可用）

```
GET /api/youtube/trending

响应:
{
  "success": true,
  "data": [
    {
      "id": "videoId",
      "title": "视频标题",
      "url": "https://youtube.com/watch?v=...",
      "pubDate": 1234567890000,
      "extra": {
        "info": "👁 1.2M"
      }
    }
  ],
  "count": 30,
  "timestamp": "2024-11-06T..."
}
```

## 9. 故障排除

### YouTube 热榜无法加载

**Vercel 部署：**

1. 检查环境变量 `YOUTUBE_PROXY_URL` 是否设置为：`https://your-project.vercel.app/api/youtube/trending`
2. 如果未设置，检查网络连接和 Invidious 实例可用性
3. 查看 Vercel 日志：`vercel logs --follow`

**Cloudflare Pages 部署：**

1. 检查 `YOUTUBE_PROXY_URL` 是否指向有效的代理服务
2. 检查代理服务的日志
3. 验证 Invidious 实例是否可访问

### Product Hunt 无法获取数据

1. 确认 `PRODUCTHUNT_API_TOKEN` 已设置且有效
2. Token 格式应为: `Bearer your_token_here`
3. 获取新 Token：https://api.producthunt.com/v2/oauth/authorize

### 其他源无法获取数据

1. 检查部署日志（Vercel 或 Cloudflare）
2. 某些源可能有反爬虫机制，可能需要添加代理
3. 查看 `server/sources/` 目录下对应源的实现

### Vercel 部署失败

1. 检查 Node.js 版本（需要 18+）
2. 查看 Vercel 部署日志获取详细错误
3. 确保所有依赖已正确安装

### Cloudflare Pages 构建失败

1. 检查构建命令是否正确
2. 查看构建日志获取详细错误信息
3. 确保所有环境变量已设置
4. 验证 Node.js 版本（需要 18+）

## 10. 数据库配置

### Vercel Edge 部署

Vercel Edge 部署不支持本地 SQLite，当前配置会自动禁用数据库，只使用内存缓存。

如果需要持久化存储，可以：

**选项 1: 使用在线数据库（高级）**

修改 `nitro.config.ts`，在 Vercel 环境中使用在线数据库：

```typescript
if (process.env.VERCEL) {
  nitroOption.preset = "vercel-edge"
  nitroOption.database = {
    default: {
      connector: "postgres", // 或其他支持的连接器
      options: {
        connectionString: process.env.DATABASE_URL,
      },
    },
  }
}
```

然后在 Vercel 环境变量中设置 `DATABASE_URL`。

支持的数据库连接器：https://db0.unjs.io/connectors

**选项 2: 不使用数据库（推荐）**

当前配置已优化为无需数据库的方案，使用内存缓存即可满足基本需求。

### Cloudflare Pages 部署

支持使用 Cloudflare D1 数据库，需要配置 D1 Binding。

## 11. 更新和维护

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
