import { myFetch } from "#/utils/fetch";
import { defineSource } from "#/utils/source";

interface WapRes {
  code: number;
  exp_str: string;
  list: {
    hot_id: number;
    keyword: string;
    show_name: string;
    score: number;
    word_type: number;
    goto_type: number;
    goto_value: string;
    icon: string;
    live_id: any[];
    call_reason: number;
    heat_layer: string;
    pos: number;
    id: number;
    status: string;
    name_type: string;
    resource_id: number;
    set_gray: number;
    card_values: any[];
    heat_score: number;
    stat_datas: {
      etime: string;
      stime: string;
      is_commercial: string;
    };
  }[];
  top_list: any[];
  hotword_egg_info: string;
  seid: string;
  timestamp: number;
  total_count: number;
}

const hotSearch = defineSource(async () => {
  console.log("开始获取 Bilibili 热搜...");
  try {
    const url = "https://s.search.bilibili.com/main/hotword?limit=30";
    const res: WapRes = await myFetch(url);
    console.log(`Bilibili 响应类型:`, typeof res);
    console.log(`Bilibili 响应 list 长度:`, res?.list?.length);

    if (!res?.list || res.list.length === 0) {
      console.error("Bilibili 热搜响应为空");
      return [];
    }

    return res.list.map((k) => ({
      id: k.keyword,
      title: k.show_name || k.keyword,
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(k.keyword)}`,
      extra: {
        icon: k.icon,
      },
    }));
  } catch (error) {
    console.error("Bilibili 热搜获取错误:", error);
    return [];
  }
});

export default defineSource({
  bilibili: hotSearch,
});
