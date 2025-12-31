import process from "node:process"
import type { NewsItem } from "@shared/types"
import { myFetch } from "#/utils/fetch"
import { defineSource } from "#/utils/source"

export default defineSource(async () => {
  console.log("正在获取 YouTube 热门视频...")
  try {
    const proxyUrl = process.env.YOUTUBE_PROXY_URL

    if (proxyUrl) {
      console.log(`使用代理: ${proxyUrl}`)
      const response: any = await myFetch(proxyUrl, {
        headers: {
          Accept: "application/json",
        },
      })

      if (response?.success && Array.isArray(response.data)) {
        console.log(`通过代理获取到 ${response.data.length} 条数据`)
        return response.data
      }

      console.log("代理请求失败，使用备用方法")
    }

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

    for (const instance of invidiousInstances) {
      try {
        console.log(`尝试连接: ${instance}`)
        const response: any = await myFetch(`${instance}/api/v1/trending`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        })

        console.log(`${instance} 响应类型:`, typeof response)
        console.log(`${instance} 是否为数组:`, Array.isArray(response))

        if (!Array.isArray(response)) {
          console.log(`${instance} 响应不是数组，继续下一个实例`)
          continue
        }

        const news: NewsItem[] = response.slice(0, 30).map((video: any) => ({
          id: video.videoId,
          title: video.title,
          url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
          pubDate: (video.published || Math.floor(Date.now() / 1000)) * 1000,
          extra: {
            info: `👁 ${video.viewCountText || video.viewCount || 0}`,
          },
        }))

        console.log(`${instance} 获取到 ${news.length} 条数据`)
        if (news.length > 0) return news
      } catch (error) {
        console.log(
          `${instance} 失败:`,
          error instanceof Error ? error.message : String(error),
        )
        continue
      }
    }

    console.log("所有 Invidious 实例都失败了")
    return []
  } catch (error) {
    console.error("YouTube 获取错误:", error)
    return []
  }
})
