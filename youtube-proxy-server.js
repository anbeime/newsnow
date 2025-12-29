#!/usr/bin/env node

/**
 * YouTube 热榜 API 代理服务
 * 可部署到 Cloudflare Workers、Railway、Render 等平台
 * 也可作为 MCP (Model Context Protocol) 服务运行
 */

import http from 'http'
import https from 'https'
import { URL } from 'url'

// 配置
const PORT = process.env.PORT || 3001
const INVIDIOUS_INSTANCE = process.env.INVIDIOUS_INSTANCE || 'http://localhost:9000'

// 获取 YouTube 热门视频
async function fetchYouTubeTrending() {
  return new Promise((resolve, reject) => {
    const invidious_url = new URL('/api/v1/trending', INVIDIOUS_INSTANCE)
    const client = INVIDIOUS_INSTANCE.startsWith('https') ? https : http

    const options = {
      hostname: invidious_url.hostname,
      port: invidious_url.port,
      path: invidious_url.pathname + invidious_url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    }

    const req = client.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const videos = JSON.parse(data)
          resolve(videos)
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

// 转换视频数据
function formatVideos(videos) {
  return (videos || []).slice(0, 30).map((video) => ({
    videoId: video.videoId,
    title: video.title,
    author: video.author,
    authorId: video.authorId,
    viewCount: video.viewCount,
    viewCountText: video.viewCountText,
    published: video.published,
    publishedText: video.publishedText,
    lengthSeconds: video.lengthSeconds,
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
    invidious_url: `${INVIDIOUS_INSTANCE}/watch?v=${video.videoId}`
  }))
}

// HTTP 服务器
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
  const pathname = parsedUrl.pathname

  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  try {
    if (pathname === '/api/youtube/trending') {
      const videos = await fetchYouTubeTrending()
      const formatted = formatVideos(videos)
      
      res.writeHead(200)
      res.end(JSON.stringify({
        success: true,
        data: formatted,
        count: formatted.length,
        timestamp: new Date().toISOString()
      }))
    } else if (pathname === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({
        error: 'Not found',
        available_endpoints: [
          '/api/youtube/trending',
          '/health'
        ]
      }))
    }
  } catch (error) {
    console.error('Error:', error.message)
    res.writeHead(500)
    res.end(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }))
  }
})

server.listen(PORT, () => {
  console.log(`YouTube Proxy Server running on http://localhost:${PORT}`)
  console.log(`Invidious Instance: ${INVIDIOUS_INSTANCE}`)
  console.log(`Trending API: http://localhost:${PORT}/api/youtube/trending`)
  console.log(`Health Check: http://localhost:${PORT}/health`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
