/**
 * Cloudflare Workers - YouTube 热榜 API 代理
 */

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
  const INVIDIOUS_INSTANCES = [
    "https://invidious.perennialte.ch",
    "https://invidious.snopyta.org",
    "https://inv.nadeko.net",
    "https://invidious.kavin.rocks",
    "https://yewtu.be",
    "https://yewtu.be",
    "https://invidious.nerdvpn.de",
  ]

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/trending`, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        console.warn(`${instance} returned ${response.status}`)
        continue
      }

      const contentType = response.headers.get("content-type") || ""

      if (!contentType.includes("application/json")) {
        console.warn(`Non-JSON response from ${instance}`)
        continue
      }

      const text = await response.text()

      if (
        text.trim().startsWith("<!DOCTYPE")
        || text.trim().startsWith("<html")
      ) {
        console.warn(`HTML response from ${instance}`)
        continue
      }

      try {
        const videos: Video[] = JSON.parse(text)

        if (Array.isArray(videos) && videos.length > 0) {
          console.log(`Successfully fetched from ${instance}`)
          return videos.slice(0, 50).map(video => ({
            videoId: video.videoId,
            title: video.title,
            author: video.author,
            authorId: video.authorId,
            viewCount: video.viewCount || 0,
            viewCountText: String(video.viewCount || 0),
            published: video.published || 0,
            publishedText: "",
            lengthSeconds: video.lengthSeconds || 0,
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            invidious_url: `${instance}/watch?v=${video.videoId}`,
          }))
        }
      } catch (parseError) {
        console.warn(`JSON parse error from ${instance}:`, parseError)
        continue
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${instance}:`, error)
      continue
    }
  }

  throw new Error("All Invidious instances failed")
}

function jsonResponse(data: any, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...headers,
    },
  })
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    }

    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      if (pathname === "/api/youtube/trending") {
        const videos = await fetchYouTubeTrending()
        return jsonResponse({
          success: true,
          data: videos,
          count: videos.length,
          timestamp: new Date().toISOString(),
        })
      } else if (pathname === "/health") {
        return jsonResponse({
          status: "ok",
          timestamp: new Date().toISOString(),
        })
      } else {
        return jsonResponse(
          {
            error: "Not found",
            available_endpoints: ["/api/youtube/trending", "/health"],
          },
          404,
        )
      }
    } catch (error) {
      console.error("Error:", error)
      return jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        500,
      )
    }
  },
}
