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
  }[];
}

const hotSearch = defineSource(async () => {
  const url = "https://s.search.bilibili.com/main/hotword?limit=30";
  const res: WapRes = await myFetch(url);

  return res.list.map((k) => ({
    id: k.keyword,
    title: k.show_name || k.keyword,
    url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(k.keyword)}`,
    extra: {
      icon: k.icon,
    },
  }));
});
