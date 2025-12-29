import _sources from "./sources.json" with { type: "json" }

export const sources = _sources as Record<SourceID, Source>
export default sources
