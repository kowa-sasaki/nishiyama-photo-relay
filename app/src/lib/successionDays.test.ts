import { describe, it, expect } from 'vitest'
import { buildSuccessionDaysRanking, getSuccessionDaysBySpot, sortSpotsBySuccessionDays } from './successionDays'
import type { Spot, Post } from './types'

function makeSpot(overrides: Partial<Spot>): Spot {
  return {
    id: 'spot-1',
    name: '北口ベンチ',
    theme: 'ランニング途中によってみた',
    lat: 35.9,
    lng: 136.2,
    description: null,
    kind: 'user',
    order: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function makePost(overrides: Partial<Post>): Post {
  return {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: null,
    tags: [],
    avg_color: '#000000',
    created_at: '2026-07-01T00:00:00Z',
    device_id: 'device-1',
    ...overrides,
  }
}

const NOW = new Date('2026-08-19T00:00:00Z')

describe('buildSuccessionDaysRanking', () => {
  it('counts days from the start of the chain that is still active', () => {
    const spots = [makeSpot({ id: 'spot-active' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-active', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-active', created_at: '2026-08-10T00:00:00Z' }), // 9日後(連鎖継続)
    ]
    // NOW(08-19) - p2(08-10) = 9日(14日以内) → 継続中
    // 日数 = NOW(08-19) - p1(08-01) = 18日
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([
      { spotId: 'spot-active', spotName: '北口ベンチ', days: 18, latestPostAt: '2026-08-10T00:00:00Z' },
    ])
  })

  it('resets the start date when a gap longer than the window breaks the chain', () => {
    const spots = [makeSpot({ id: 'spot-revived', created_at: '2026-06-01T00:00:00Z' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-revived', created_at: '2026-06-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-revived', created_at: '2026-06-05T00:00:00Z' }), // p1から4日後(連鎖)
      makePost({ id: 'p3', spot_id: 'spot-revived', created_at: '2026-08-01T00:00:00Z' }), // p2から57日後 → 連鎖切れ
      makePost({ id: 'p4', spot_id: 'spot-revived', created_at: '2026-08-10T00:00:00Z' }), // p3から9日後(連鎖)
    ]
    // 現在生きている連鎖は p3〜p4 のみ。日数 = NOW(08-19) - p3(08-01) = 18日(p1の06-01は無視)
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([
      { spotId: 'spot-revived', spotName: '北口ベンチ', days: 18, latestPostAt: '2026-08-10T00:00:00Z' },
    ])
  })

  it('excludes a spot whose revival chain has only one post so far', () => {
    const spots = [makeSpot({ id: 'spot-revived-once', created_at: '2026-06-01T00:00:00Z' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-revived-once', created_at: '2026-06-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-revived-once', created_at: '2026-06-05T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-revived-once', created_at: '2026-08-10T00:00:00Z' }), // 連鎖切れの後、1件のみ
    ]
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([])
  })

  it('excludes a spot whose latest post is older than the window', () => {
    const spots = [makeSpot({ id: 'spot-stale' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-stale', created_at: '2026-06-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-stale', created_at: '2026-06-05T00:00:00Z' }), // 74日以上前
    ]
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([])
  })

  it('excludes a spot with only a single post', () => {
    const spots = [makeSpot({ id: 'spot-solo' })]
    const posts = [makePost({ id: 'p1', spot_id: 'spot-solo', created_at: '2026-08-15T00:00:00Z' })]
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([])
  })

  it('excludes official spots even when they have a connected recent chain', () => {
    const spots = [makeSpot({ id: 'spot-official', kind: 'official' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-official', created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-official', created_at: '2026-08-15T00:00:00Z' }),
    ]
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toEqual([])
  })

  it('treats a gap of exactly windowDays as still connected (inclusive boundary)', () => {
    const spots = [makeSpot({ id: 'spot-boundary' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-boundary', created_at: '2026-08-05T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-boundary', created_at: '2026-08-19T00:00:00Z' }), // ちょうど14日後
    ]
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result).toHaveLength(1)
  })

  it('sorts by days descending, tie-broken by the most recent post', () => {
    const spots = [
      makeSpot({ id: 'spot-a', name: 'A' }),
      makeSpot({ id: 'spot-b', name: 'B' }),
    ]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-a', created_at: '2026-07-28T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-a', created_at: '2026-08-10T00:00:00Z' }), // 連鎖13日
      makePost({ id: 'p3', spot_id: 'spot-b', created_at: '2026-08-05T00:00:00Z' }),
      makePost({ id: 'p4', spot_id: 'spot-b', created_at: '2026-08-12T00:00:00Z' }), // 連鎖7日
    ]
    // spot-a: 日数=NOW(08-19)-07-28=22日 / spot-b: 日数=NOW(08-19)-08-05=14日
    const result = buildSuccessionDaysRanking(spots, posts, NOW)
    expect(result.map((r) => r.spotId)).toEqual(['spot-a', 'spot-b'])
  })

  it('truncates to topN', () => {
    const spots = [makeSpot({ id: 'spot-1' }), makeSpot({ id: 'spot-2' }), makeSpot({ id: 'spot-3' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-1', created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-2', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p4', spot_id: 'spot-2', created_at: '2026-08-11T00:00:00Z' }),
      makePost({ id: 'p5', spot_id: 'spot-3', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p6', spot_id: 'spot-3', created_at: '2026-08-12T00:00:00Z' }),
    ]
    const result = buildSuccessionDaysRanking(spots, posts, NOW, { topN: 2 })
    expect(result).toHaveLength(2)
  })

  it('returns an empty array when there are no spots or posts', () => {
    expect(buildSuccessionDaysRanking([], [], NOW)).toEqual([])
  })
})

describe('sortSpotsBySuccessionDays', () => {
  it('moves qualifying user spots to the front, ordered by days descending', () => {
    const spots = [
      makeSpot({ id: 'spot-official', kind: 'official', name: '大噴水前' }),
      makeSpot({ id: 'spot-quiet', name: '静かな定点' }), // 投稿なし
      makeSpot({ id: 'spot-b', name: 'B' }),
      makeSpot({ id: 'spot-a', name: 'A' }),
    ]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-a', created_at: '2026-07-28T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-a', created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-b', created_at: '2026-08-05T00:00:00Z' }),
      makePost({ id: 'p4', spot_id: 'spot-b', created_at: '2026-08-12T00:00:00Z' }),
    ]
    const result = sortSpotsBySuccessionDays(spots, posts, NOW)
    expect(result.map((s) => s.id)).toEqual(['spot-a', 'spot-b', 'spot-official', 'spot-quiet'])
  })

  it('keeps the original relative order among non-qualifying spots', () => {
    const spots = [makeSpot({ id: 'spot-1' }), makeSpot({ id: 'spot-2' }), makeSpot({ id: 'spot-3' })]
    const result = sortSpotsBySuccessionDays(spots, [], NOW)
    expect(result.map((s) => s.id)).toEqual(['spot-1', 'spot-2', 'spot-3'])
  })

  it('does not mutate the input array', () => {
    const spots = [makeSpot({ id: 'spot-1' }), makeSpot({ id: 'spot-2' })]
    const original = [...spots]
    sortSpotsBySuccessionDays(spots, [], NOW)
    expect(spots).toEqual(original)
  })

  it('breaks ties in days by the most recent latestPostAt', () => {
    const spots = [
      makeSpot({ id: 'spot-tie-early', name: '早い方' }),
      makeSpot({ id: 'spot-tie-late', name: '遅い方' }),
    ]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-tie-early', created_at: '2026-08-09T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-tie-early', created_at: '2026-08-12T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-tie-late', created_at: '2026-08-09T00:00:00Z' }),
      makePost({ id: 'p4', spot_id: 'spot-tie-late', created_at: '2026-08-16T00:00:00Z' }),
    ]
    // 両方とも連鎖の開始日は08-09なので days は同じ(10日)だが、
    // latestPostAt は spot-tie-late の方が新しい(08-16 > 08-12)。
    const result = sortSpotsBySuccessionDays(spots, posts, NOW)
    expect(result.map((s) => s.id)).toEqual(['spot-tie-late', 'spot-tie-early'])
  })
})

describe('getSuccessionDaysBySpot', () => {
  it('includes a qualifying spot with its days and latestPostAt', () => {
    const spots = [makeSpot({ id: 'spot-active' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-active', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-active', created_at: '2026-08-10T00:00:00Z' }),
    ]
    const result = getSuccessionDaysBySpot(spots, posts, NOW)
    expect(result.get('spot-active')).toEqual({ days: 18, latestPostAt: '2026-08-10T00:00:00Z' })
  })

  it('omits a non-qualifying spot (single post, no chain)', () => {
    const spots = [makeSpot({ id: 'spot-solo' })]
    const posts = [makePost({ id: 'p1', spot_id: 'spot-solo', created_at: '2026-08-15T00:00:00Z' })]
    const result = getSuccessionDaysBySpot(spots, posts, NOW)
    expect(result.has('spot-solo')).toBe(false)
  })
})
