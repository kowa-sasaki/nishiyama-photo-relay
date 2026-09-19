import type { Post, Spot } from './types'

export type SuccessionDaysEntry = {
  spotId: string
  spotName: string
  days: number
  latestPostAt: string
}

const DEFAULT_WINDOW_DAYS = 14
const DEFAULT_TOP_N = 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

type ActiveChain = {
  firstPostAtMs: number
  latestPostAtMs: number
  postCount: number
}

// postTimesMsAscending must be sorted ascending. Walks backward from the
// latest post, extending the chain while the gap to the previous post is
// <= windowMs. Stops at the first gap that exceeds windowMs, so the
// returned chain is always the suffix that is still connected as of the
// latest post (a 14-day-plus silence "resets" everything before it).
function findActiveChain(postTimesMsAscending: number[], windowMs: number): ActiveChain {
  const latestPostAtMs = postTimesMsAscending[postTimesMsAscending.length - 1]
  let postCount = 1
  let chainStartIndex = postTimesMsAscending.length - 1

  for (let i = postTimesMsAscending.length - 1; i > 0; i--) {
    const gap = postTimesMsAscending[i] - postTimesMsAscending[i - 1]
    if (gap > windowMs) break
    postCount += 1
    chainStartIndex = i - 1
  }

  return { firstPostAtMs: postTimesMsAscending[chainStartIndex], latestPostAtMs, postCount }
}

export function getSuccessionDaysBySpot(
  spots: Spot[],
  posts: Post[],
  now: Date,
  options?: { windowDays?: number },
): Map<string, { days: number; latestPostAt: string }> {
  return buildSuccessionDaysBySpot(spots, posts, now, options?.windowDays ?? DEFAULT_WINDOW_DAYS)
}

function buildSuccessionDaysBySpot(
  spots: Spot[],
  posts: Post[],
  now: Date,
  windowDays: number,
): Map<string, { days: number; latestPostAt: string }> {
  const windowMs = windowDays * MS_PER_DAY
  const nowMs = now.getTime()

  const postTimesBySpot = new Map<string, Array<{ ms: number; iso: string }>>()
  for (const post of posts) {
    const times = postTimesBySpot.get(post.spot_id) ?? []
    times.push({ ms: new Date(post.created_at).getTime(), iso: post.created_at })
    postTimesBySpot.set(post.spot_id, times)
  }
  for (const times of postTimesBySpot.values()) {
    times.sort((a, b) => a.ms - b.ms)
  }

  const result = new Map<string, { days: number; latestPostAt: string }>()
  for (const spot of spots) {
    if (spot.kind !== 'user') continue
    const times = postTimesBySpot.get(spot.id)
    if (!times || times.length < 2) continue

    const msArray = times.map((t) => t.ms)
    const chain = findActiveChain(msArray, windowMs)
    if (chain.postCount < 2) continue
    if (nowMs - chain.latestPostAtMs > windowMs) continue

    // Find the original ISO string for the latest post
    const latestPostIso = times[times.length - 1].iso

    result.set(spot.id, {
      days: Math.floor((nowMs - chain.firstPostAtMs) / MS_PER_DAY),
      latestPostAt: latestPostIso,
    })
  }
  return result
}

export function buildSuccessionDaysRanking(
  spots: Spot[],
  posts: Post[],
  now: Date,
  options?: { windowDays?: number; topN?: number },
): SuccessionDaysEntry[] {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const topN = options?.topN ?? DEFAULT_TOP_N
  const daysBySpot = buildSuccessionDaysBySpot(spots, posts, now, windowDays)
  const spotNameById = new Map(spots.map((spot) => [spot.id, spot.name]))

  return Array.from(daysBySpot.entries())
    .map(([spotId, { days, latestPostAt }]) => ({
      spotId,
      spotName: spotNameById.get(spotId) ?? '定点',
      days,
      latestPostAt,
    }))
    .sort((a, b) => b.days - a.days || b.latestPostAt.localeCompare(a.latestPostAt))
    .slice(0, topN)
}

export function sortSpotsBySuccessionDays(
  spots: Spot[],
  posts: Post[],
  now: Date,
  options?: { windowDays?: number },
): Spot[] {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const daysBySpot = buildSuccessionDaysBySpot(spots, posts, now, windowDays)

  return [...spots].sort((a, b) => {
    const ra = daysBySpot.get(a.id)
    const rb = daysBySpot.get(b.id)
    if (!ra && !rb) return 0
    if (!ra) return 1
    if (!rb) return -1
    return rb.days - ra.days || rb.latestPostAt.localeCompare(ra.latestPostAt)
  })
}
