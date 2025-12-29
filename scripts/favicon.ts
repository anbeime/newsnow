import fs from "node:fs"

import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { Buffer } from "node:buffer"
import { consola } from "consola"
import { originSources } from "../shared/pre-sources"

const projectDir = fileURLToPath(new URL("..", import.meta.url))
const iconsDir = join(projectDir, "public", "icons")

async function downloadIconWithFallback(
  domain: string,
  outputPath: string,
  id: string,
) {
  const sources = [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    `https://favicon.yandex.net/favicon/${domain}`,
  ]

  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })
      if (response.ok) {
        const image = await response.arrayBuffer()
        fs.writeFileSync(outputPath, Buffer.from(image))
        consola.success(`${id}: downloaded from ${url}`)
        return true
      }
    } catch {
      continue
    }
  }

  consola.error(`${id}: failed to download from all sources`)
  return false
}

async function main() {
  await Promise.all(
    Object.entries(originSources).map(async ([id, source]) => {
      try {
        const icon = join(iconsDir, `${id}.png`)
        if (fs.existsSync(icon)) {
          // consola.info(`${id}: icon exists. skip.`)
          return
        }
        if (!source.home) return
        const domain = source.home
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")
        await downloadIconWithFallback(domain, icon, id)
      } catch (e) {
        consola.error(id, "\n", e)
      }
    }),
  )
}

main()
