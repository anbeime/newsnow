import { defineSource } from "#/utils/source"

interface ProxyResponse {
  success: boolean
  data: VideoData[]
  count: number
  timestamp: string
}

interface VideoData {
  videoId: string
  title: string
  author: string
  authorId: string
  viewCount: number
  viewCountText: string
  published: number
  publishedText: string
  lengthSeconds: number
  url: string
  invidious_url: string
}

const PROXY_URL
  = "https://hotnow-youtube-proxy.13632833907.workers.dev/api/youtube/trending"

export default defineSource(async () => {
  const response = await myFetch<ProxyResponse>(PROXY_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    },
  })

  return response.data.slice(0, 50).map(video => ({
    id: video.videoId,
    title: video.title,
    url: video.url,
    extra: {
      info: formatViews(video.viewCount),
      hover: video.author,
    },
  }))
})

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return String(views)
}
