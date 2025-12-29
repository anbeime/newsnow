import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  try {
    console.log("正在获取 YouTube 热门视频...")
    const invidiousInstances = [
      "https://invidious.snopyta.org",
      "https://invidious.kavin.rocks",
      "https://invidious.namazso.eu",
      "https://invidious.projectsegfau.lt",
      "https://inv.bp.projectsegfau.lt",
      "https://inv.vern.cc",
      "https://invidious.flokinet.to",
      "https://invidious.esmailelbob.xyz",
    ]

    const randomInstance
      = invidiousInstances[Math.floor(Math.random() * invidiousInstances.length)]
    const response: any = await myFetch(`${randomInstance}/api/v1/trending`)

    const news: NewsItem[] = []

    if (Array.isArray(response)) {
      response.slice(0, 30).forEach((video: any) => {
        if (video.videoId && video.title) {
          news.push({
            id: video.videoId,
            title: video.title,
            url:
              video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
            pubDate: (video.published || Math.floor(Date.now() / 1000)) * 1000,
            extra: {
              info: `👁 ${video.viewCountText || video.viewCount || 0}`,
            },
          })
        }
      })
    }

    return news
  } catch (error) {
    console.error("YouTube 获取错误:", error)
    return []
  }
})
