interface KuaishouRes {
  defaultClient: {
    ROOT_QUERY: {
      "visionHotRank({\"page\":\"home\"})": {
        type: string
        id: string
        typename: string
      }
      [key: string]: any
    }
    [key: string]: any
  }
}

interface HotRankData {
  result: number
  pcursor: string
  webPageArea: string
  items: {
    type: string
    generated: boolean
    id: string
    typename: string
  }[]
}

export default defineSource(async () => {
  console.log("开始获取快手热榜...")
  try {
    // 获取快手首页HTML
    const html = await myFetch("https://www.kuaishou.com/?isHome=1")
    console.log(
      "快手 HTML 获取成功，长度:",
      typeof html === "string" ? html.length : 0,
    )

    // 提取window.__APOLLO_STATE__中的数据
    const matches = (html as string).match(
      /window\.__APOLLO_STATE__\s*=\s*(\{.+?\});/,
    )
    if (!matches) {
      console.error("无法获取快手热榜数据：未找到 __APOLLO_STATE__")
      return []
    }

    console.log("__APOLLO_STATE__ 匹配成功")

    // 解析JSON数据
    const data: KuaishouRes = JSON.parse(matches[1])
    console.log("快手数据解析成功")

    // 获取热榜数据ID
    const hotRankId
      = data.defaultClient.ROOT_QUERY["visionHotRank({\"page\":\"home\"})"].id
    console.log("热榜数据ID:", hotRankId)

    // 获取热榜列表数据
    const hotRankData = data.defaultClient[hotRankId] as HotRankData
    console.log("热榜列表数据获取成功，项数:", hotRankData?.items?.length || 0)

    // 转换数据格式
    const news = hotRankData.items
      .filter(k => data.defaultClient[k.id].tagType !== "置顶")
      .map((item) => {
        // 从id中提取实际的热搜词
        const hotSearchWord = item.id.replace("VisionHotRankItem:", "")

        // 获取具体的热榜项数据
        const hotItem = data.defaultClient[item.id]

        return {
          id: hotSearchWord,
          title: hotItem.name,
          url: `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(hotItem.name)}`,
          extra: {
            icon: hotItem.iconUrl,
          },
        }
      })

    console.log("快手热榜成功获取:", news.length, "条数据")
    return news
  } catch (error) {
    console.error("快手热榜获取错误:", error)
    return []
  }
})
