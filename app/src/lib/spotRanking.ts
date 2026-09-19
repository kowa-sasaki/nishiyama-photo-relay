import type { Post, PostWithSpot, Spot } from './types'

export type RankingEntry = {
  spotId: string
  spotName: string
  displayValue: string
  latestPostAt: string
}

const DEFAULT_WINDOW_DAYS = 30
const DEFAULT_TOP_N = 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

type SpotPostStats = { count: number; spotName: string; latestPostAt: string }

function countRecentPostsBySpot(
  posts: PostWithSpot[],
  now: Date,
  windowDays: number,
): Map<string, SpotPostStats> {
  const cutoff = now.getTime() - windowDays * MS_PER_DAY
  const bySpot = new Map<string, SpotPostStats>()

  for (const post of posts) {
    if (new Date(post.created_at).getTime() < cutoff) continue

    const existing = bySpot.get(post.spot_id)
    if (existing) {
      existing.count += 1
      if (post.created_at > existing.latestPostAt) {
        existing.latestPostAt = post.created_at
      }
    } else {
      bySpot.set(post.spot_id, {
        count: 1,
        spotName: post.spots?.name ?? '定点',
        latestPostAt: post.created_at,
      })
    }
  }

  return bySpot
}

export function buildSpotRanking(
  posts: PostWithSpot[],
  now: Date,
  options?: { windowDays?: number; topN?: number },
): RankingEntry[] {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const topN = options?.topN ?? DEFAULT_TOP_N
  const bySpot = countRecentPostsBySpot(posts, now, windowDays)

  return Array.from(bySpot.entries())
    .sort(([, a], [, b]) => b.count - a.count || b.latestPostAt.localeCompare(a.latestPostAt))
    .slice(0, topN)
    .map(([spotId, stats]) => ({
      spotId,
      spotName: stats.spotName,
      displayValue: `${stats.count}件`,
      latestPostAt: stats.latestPostAt,
    }))
}

export function countAllPostsBySpot(posts: Post[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const post of posts) {
    counts.set(post.spot_id, (counts.get(post.spot_id) ?? 0) + 1)
  }
  return counts
}

export function getLatestPostImageBySpot(posts: Post[]): Map<string, string> {
  const latest = new Map<string, { imagePath: string; createdAt: string }>()
  for (const post of posts) {
    const existing = latest.get(post.spot_id)
    if (!existing || post.created_at > existing.createdAt) {
      latest.set(post.spot_id, { imagePath: post.image_path, createdAt: post.created_at })
    }
  }
  return new Map(Array.from(latest, ([spotId, v]) => [spotId, v.imagePath]))
}

export function sortSpotsByPopularity(
  spots: Spot[],
  posts: PostWithSpot[],
  now: Date,
  options?: { windowDays?: number },
): Spot[] {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const statsBySpot = countRecentPostsBySpot(posts, now, windowDays)

  return [...spots].sort((a, b) => {
    const sa = statsBySpot.get(a.id)
    const sb = statsBySpot.get(b.id)
    if (!sa && !sb) return 0
    if (!sa) return 1
    if (!sb) return -1
    return sb.count - sa.count || sb.latestPostAt.localeCompare(sa.latestPostAt)
  })
}
