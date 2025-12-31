import type { NewsItem } from "@shared/types"

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

const INVIDIOUS_INSTANCES = [
  "https://invidious.perennialte.ch",
  "https://invidious.snopyta.org",
  "https://inv.nadeko.net",
  "https://invidious.kavin.rocks",
  "https://yewtu.be",
  "https://invidious.nerdvpn.de",
  "https://invidious.projectsegfau.lt",
  "https://inv.bp.projectsegfau.lt",
  "https://inv.vern.cc",
  "https://invidious.esmailelbob.xyz",
]

async function fetchYouTubeTrending(): Promise<Video[]> {
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

export default eventHandler(async (event) => {
  const method = event.method

  if (method === "OPTIONS") {
    setResponseStatus(event, 204)
    setHeaders(event, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })
    return null
  }

  try {
    const videos = await fetchYouTubeTrending()

    const news: NewsItem[] = videos.slice(0, 30).map(video => ({
      id: video.videoId,
      title: video.title,
      url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
      pubDate: (video.published || Math.floor(Date.now() / 1000)) * 1000,
      extra: {
        info: `👁 ${video.viewCountText || video.viewCount || 0}`,
      },
    }))

    return {
      success: true,
      data: news,
      items: videos,
      count: news.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("YouTube proxy error:", error)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
})
