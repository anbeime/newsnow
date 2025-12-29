import { myFetch } from "#/utils/fetch"
import { defineSource } from "#/utils/source"

export default defineSource(async () => {
  try {
    const invidiousInstances = [
      "https://invidious.snopyta.org",
      "https://invidious.kavin.rocks",
      "https://inv.nadeko.net",
      "https://inv.puffyan.us",
      "https://invidious.perennialte.ch",
      "https://yewtu.be",
    ]

    for (const instance of invidiousInstances) {
      try {
        const response: any = await myFetch(`${instance}/api/v1/trending`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        })

        if (!Array.isArray(response)) continue

        const news = response
          .slice(0, 30)
          .map((video: any) => {
            if (video.videoId && video.title) {
              return {
                id: video.videoId,
                title: video.title,
                url:
                  video.url
                  || `https://www.youtube.com/watch?v=${video.videoId}`,
                pubDate:
                  (video.published || Math.floor(Date.now() / 1000)) * 1000,
                extra: {
                  info: `👁 ${video.viewCountText || video.viewCount || 0}`,
                },
              }
            }
            return null
          })
          .filter(Boolean)

        if (news.length > 0) return news
      } catch {
        continue
      }
    }

    return []
  } catch (error) {
    console.error("YouTube 获取错误:", error)
    return []
  }
})
