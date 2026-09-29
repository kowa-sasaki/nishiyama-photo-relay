import type { PostWithSpot } from './types'

// 「いま見頃」で数える季節のタグ。TagInputの候補のうち、景色の見頃を表すものだけ。
export const SEASON_TAGS = ['桜', 'つつじ', '新緑', '紅葉', '雪', '花'] as const

// 自由入力で表記が揺れやすいものを、候補タグの表記にそろえる
const TAG_ALIASES: Record<string, string> = {
  さくら: '桜',
  サクラ: '桜',
  夜桜: '桜',
  ツツジ: 'つつじ',
  躑躅: 'つつじ',
  もみじ: '紅葉',
  モミジ: '紅葉',
  こうよう: '紅葉',
  ゆき: '雪',
  雪景色: '雪',
  はな: '花',
}

const DEFAULT_WINDOW_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function normalizeTag(tag: string): string {
  const trimmed = tag.trim().replace(/^[#＃]/, '')
  return TAG_ALIASES[trimmed] ?? trimmed
}

export function postHasTag(post: { tags: string[] }, tag: string): boolean {
  const target = normalizeTag(tag)
  return post.tags.some((t) => normalizeTag(t) === target)
}

export function filterPostsByTag<T extends { tags: string[] }>(posts: T[], tag: string): T[] {
  return posts.filter((post) => postHasTag(post, tag))
}

export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(normalizeTag(tag))}`
}

export type InSeasonEntry = {
  tag: string
  count: number
  // 投稿の多い順。同数なら新しい投稿がある順
  spotNames: string[]
  latestImagePath: string
}

type TagStats = {
  count: number
  latestPostAt: string
  latestImagePath: string
  spots: Map<string, { name: string; count: number; latestPostAt: string }>
}

// 季節の見頃は重ならないので、直近で最も多く付いた季節のタグを1つだけ返す
export function findInSeason(
  posts: PostWithSpot[],
  now: Date,
  options?: { windowDays?: number },
): InSeasonEntry | null {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const cutoff = now.getTime() - windowDays * MS_PER_DAY
  const seasonTags = new Set<string>(SEASON_TAGS)
  const byTag = new Map<string, TagStats>()

  for (const post of posts) {
    const postedAt = new Date(post.created_at).getTime()
    if (postedAt < cutoff || postedAt > now.getTime()) continue

    // 1投稿に「紅葉」「もみじ」が両方付いていても1件と数える
    const tags = new Set(post.tags.map(normalizeTag).filter((t) => seasonTags.has(t)))
    for (const tag of tags) {
      let stats = byTag.get(tag)
      if (!stats) {
        stats = { count: 0, latestPostAt: '', latestImagePath: '', spots: new Map() }
        byTag.set(tag, stats)
      }
      stats.count += 1
      if (post.created_at > stats.latestPostAt) {
        stats.latestPostAt = post.created_at
        stats.latestImagePath = post.image_path
      }
      const spot = stats.spots.get(post.spot_id)
      if (spot) {
        spot.count += 1
        if (post.created_at > spot.latestPostAt) spot.latestPostAt = post.created_at
      } else {
        stats.spots.set(post.spot_id, {
          name: post.spots?.name ?? '定点',
          count: 1,
          latestPostAt: post.created_at,
        })
      }
    }
  }

  const top = Array.from(byTag.entries()).sort(
    ([, a], [, b]) => b.count - a.count || b.latestPostAt.localeCompare(a.latestPostAt),
  )[0]
  if (!top) return null

  const [tag, stats] = top
  return {
    tag,
    count: stats.count,
    spotNames: Array.from(stats.spots.values())
      .sort((a, b) => b.count - a.count || b.latestPostAt.localeCompare(a.latestPostAt))
      .map((spot) => spot.name),
    latestImagePath: stats.latestImagePath,
  }
}
