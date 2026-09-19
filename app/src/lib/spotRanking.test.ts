import { describe, it, expect } from 'vitest'
import { buildSpotRanking, countAllPostsBySpot, getLatestPostImageBySpot, sortSpotsByPopularity } from './spotRanking'
import type { Post, PostWithSpot, Spot } from './types'

function makePost(overrides: Partial<PostWithSpot>): PostWithSpot {
  return {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: null,
    tags: [],
    avg_color: '#000000',
    created_at: '2026-08-01T00:00:00Z',
    device_id: 'device-1',
    spots: { name: '大噴水前' },
    ...overrides,
  }
}

function makeSpot(overrides: Partial<Spot>): Spot {
  return {
    id: 'spot-1',
    name: '定点',
    theme: null,
    lat: 35.9,
    lng: 136.2,
    description: null,
    kind: 'user',
    order: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const NOW = new Date('2026-08-19T00:00:00Z')

describe('buildSpotRanking', () => {
  it('counts posts per spot within the default 30-day window', () => {
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', spots: { name: '大噴水前' }, created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-1', spots: { name: '大噴水前' }, created_at: '2026-08-15T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-2', spots: { name: 'つつじ園' }, created_at: '2026-08-18T00:00:00Z' }),
    ]
    const result = buildSpotRanking(posts, NOW)
    expect(result).toEqual([
      { spotId: 'spot-1', spotName: '大噴水前', displayValue: '2件', latestPostAt: '2026-08-15T00:00:00Z' },
      { spotId: 'spot-2', spotName: 'つつじ園', displayValue: '1件', latestPostAt: '2026-08-18T00:00:00Z' },
    ])
  })

  it('excludes posts older than the window', () => {
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2026-07-19T00:00:00Z' }), // 31日前 → 除外
      makePost({ id: 'p2', spot_id: 'spot-2', created_at: '2026-07-20T00:00:00Z' }), // ちょうど30日前 → 含む
    ]
    const result = buildSpotRanking(posts, NOW)
    expect(result.map((r) => r.spotId)).toEqual(['spot-2'])
  })

  it('breaks ties in post count by the most recent post', () => {
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-2', created_at: '2026-08-16T00:00:00Z' }),
    ]
    const result = buildSpotRanking(posts, NOW)
    expect(result.map((r) => r.spotId)).toEqual(['spot-2', 'spot-1'])
  })

  it('truncates to topN', () => {
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2026-08-18T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-2', created_at: '2026-08-17T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-3', created_at: '2026-08-16T00:00:00Z' }),
      makePost({ id: 'p4', spot_id: 'spot-4', created_at: '2026-08-15T00:00:00Z' }),
    ]
    const result = buildSpotRanking(posts, NOW, { topN: 2 })
    expect(result).toHaveLength(2)
  })

  it('falls back to a generic name when spots is null', () => {
    const posts = [makePost({ spots: null })]
    const result = buildSpotRanking(posts, NOW)
    expect(result[0].spotName).toBe('定点')
  })

  it('returns an empty array when there are no posts', () => {
    expect(buildSpotRanking([], NOW)).toEqual([])
  })
})

describe('sortSpotsByPopularity', () => {
  it('orders spots by recent post count descending', () => {
    const spots = [makeSpot({ id: 'spot-1', name: 'A' }), makeSpot({ id: 'spot-2', name: 'B' })]
    const posts = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2026-08-15T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-2', created_at: '2026-08-10T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-2', created_at: '2026-08-16T00:00:00Z' }),
    ]
    const result = sortSpotsByPopularity(spots, posts, NOW)
    expect(result.map((s) => s.id)).toEqual(['spot-2', 'spot-1'])
  })

  it('keeps spots without recent posts at the end, in their original order', () => {
    const spots = [
      makeSpot({ id: 'spot-quiet-1', name: 'Q1' }),
      makeSpot({ id: 'spot-active', name: 'Active' }),
      makeSpot({ id: 'spot-quiet-2', name: 'Q2' }),
    ]
    const posts = [makePost({ id: 'p1', spot_id: 'spot-active', created_at: '2026-08-15T00:00:00Z' })]
    const result = sortSpotsByPopularity(spots, posts, NOW)
    expect(result.map((s) => s.id)).toEqual(['spot-active', 'spot-quiet-1', 'spot-quiet-2'])
  })

  it('does not mutate the input array', () => {
    const spots = [makeSpot({ id: 'spot-1' }), makeSpot({ id: 'spot-2' })]
    const original = [...spots]
    sortSpotsByPopularity(spots, [], NOW)
    expect(spots).toEqual(original)
  })
})

describe('countAllPostsBySpot', () => {
  it('counts all posts per spot regardless of age', () => {
    const posts: Post[] = [
      makePost({ id: 'p1', spot_id: 'spot-1', created_at: '2020-01-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-1', created_at: '2026-08-15T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-2', created_at: '2026-08-18T00:00:00Z' }),
    ]
    const result = countAllPostsBySpot(posts)
    expect(result).toEqual(
      new Map([
        ['spot-1', 2],
        ['spot-2', 1],
      ]),
    )
  })

  it('returns an empty map when there are no posts', () => {
    expect(countAllPostsBySpot([])).toEqual(new Map())
  })
})

describe('getLatestPostImageBySpot', () => {
  it('returns the image path of the most recent post per spot', () => {
    const posts: Post[] = [
      makePost({ id: 'p1', spot_id: 'spot-1', image_path: 'spot-1/old.jpg', created_at: '2026-08-01T00:00:00Z' }),
      makePost({ id: 'p2', spot_id: 'spot-1', image_path: 'spot-1/new.jpg', created_at: '2026-08-15T00:00:00Z' }),
      makePost({ id: 'p3', spot_id: 'spot-2', image_path: 'spot-2/only.jpg', created_at: '2026-08-10T00:00:00Z' }),
    ]
    const result = getLatestPostImageBySpot(posts)
    expect(result).toEqual(
      new Map([
        ['spot-1', 'spot-1/new.jpg'],
        ['spot-2', 'spot-2/only.jpg'],
      ]),
    )
  })

  it('excludes spots with no posts and handles an empty list', () => {
    expect(getLatestPostImageBySpot([])).toEqual(new Map())
  })
})
