/**
 * Cloudflare Workers - YouTube 热榜 API 代理
 * 
 * 部署方式：
 * 1. 安装 wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 创建项目: wrangler init youtube-proxy
 * 4. 复制此代码到 src/index.ts
 * 5. 部署: wrangler deploy
 */

interface Env {
  INVIDIOUS_INSTANCE?: string
}

interface Video {
  videoId: string
  title: string
  author: string
  authorId?: string
  viewCount: number
  viewCountText?: string
  published: number
  publishedText?: string
  lengthSeconds: number
  url: string
  invidious_url: string
}

async function fetchYouTubeTrending(): Promise<Video[]> {
  try {
    // 使用 RSSHub 获取 YouTube 热榜
    const response = await fetch('https://rsshub.app/youtube/trending', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`RSSHub returned ${response.status}`)
    }

    const data = await response.json() as any
    const items = data.items || []

    // 转换 RSS 格式为视频格式
    return items.slice(0, 30).map((item: any) => {
      // 从标题中提取视频 ID（格式："[标题] - [作者]"）
      const match = item.link?.match(/v=([a-zA-Z0-9_-]{11})/)
      const videoId = match ? match[1] : item.id?.split('/').pop() || ''
      
      return {
        videoId,
        title: item.title?.replace(/\s*-\s*YouTube$/, '') || 'Untitled',
        author: item.author || 'Unknown',
        authorId: '',
        viewCount: 0,
        viewCountText: '',
        published: new Date(item.pubDate).getTime() / 1000,
        publishedText: item.pubDate || '',
        lengthSeconds: 0,
        url: item.link || `https://www.youtube.com/watch?v=${videoId}`,
        invidious_url: item.link || `https://www.youtube.com/watch?v=${videoId}`
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch from RSSHub: ${error.message}`)
  }
}

function jsonResponse(data: any, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...headers
    }
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      if (pathname === '/api/youtube/trending') {
        const videos = await fetchYouTubeTrending()
        return jsonResponse({
          success: true,
          data: videos,
          count: videos.length,
          timestamp: new Date().toISOString()
        })
      } else if (pathname === '/health') {
        return jsonResponse({
          status: 'ok',
          timestamp: new Date().toISOString()
        })
      } else {
        return jsonResponse({
          error: 'Not found',
          available_endpoints: [
            '/api/youtube/trending',
            '/health'
          ]
        }, 404)
      }
    } catch (error) {
      console.error('Error:', error)
      return jsonResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}
