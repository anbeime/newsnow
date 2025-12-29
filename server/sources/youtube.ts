import process from "node:process"

interface InvidiousVideo {
  videoId: string
  title: string
  author: string
  authorId: string
  videoThumbnails: {
    quality: string
    url: string
    width: number
    height: number
  }[]
  viewCount: number
  published: number
  lengthSeconds: number
}

const INVIDIOUS_INSTANCE
  = process.env.INVIDIOUS_INSTANCE || "https://invidious.perennialte.ch"

export default defineSource(async () => {
  const url = `${INVIDIOUS_INSTANCE}/api/v1/trending`

  const response = await myFetch<InvidiousVideo[]>(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    },
  })

  return response.slice(0, 50).map((video) => {
    const thumbnail
      = video.videoThumbnails.find(t => t.quality === "medium")
        || video.videoThumbnails[0]

    return {
      id: video.videoId,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      extra: {
        info: formatViews(video.viewCount),
        image: thumbnail?.url && proxyPicture(thumbnail.url),
        hover: `${video.author} · ${formatDuration(video.lengthSeconds)}`,
      },
    }
  })
})

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return String(views)
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
