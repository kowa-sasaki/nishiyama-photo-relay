import { describe, it, expect } from 'vitest'
import { buildInSeason, filterPostsByTag, normalizeTag, tagPath } from './tags'
import type { PostWithSpot } from './types'

function post(overrides: Partial<PostWithSpot>): PostWithSpot {
  return {
    id: 'p',
    spot_id: 'spot-1',
    image_path: 'spot-1/p.jpg',
    comment: null,
    tags: [],
    avg_color: null,
    created_at: '2026-11-10T00:00:00Z',
    device_id: 'd',
    spots: { name: '上段の庭（もみじ）' },
    ...overrides,
  }
}

const now = new Date('2026-11-12T00:00:00Z')

describe('normalizeTag', () => {
  it('trims, strips a leading hash, and maps aliases to the suggestion spelling', () => {
    expect(normalizeTag(' もみじ ')).toBe('紅葉')
    expect(normalizeTag('#サクラ')).toBe('桜')
    expect(normalizeTag('＃ツツジ')).toBe('つつじ')
    expect(normalizeTag('ランニング')).toBe('ランニング')
  })
})

describe('tagPath', () => {
  it('encodes the normalized tag', () => {
    expect(tagPath('もみじ')).toBe(`/tags/${encodeURIComponent('紅葉')}`)
  })
})

describe('filterPostsByTag', () => {
  it('matches posts whose tags normalize to the same tag', () => {
    const posts = [
      post({ id: 'a', tags: ['紅葉'] }),
      post({ id: 'b', tags: ['もみじ', '夕日'] }),
      post({ id: 'c', tags: ['桜'] }),
    ]
    expect(filterPostsByTag(posts, 'モミジ').map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('buildInSeason', () => {
  it('counts only season tags posted within the last 7 days', () => {
    const posts = [
      post({ id: 'a', tags: ['紅葉', '混雑'], created_at: '2026-11-11T00:00:00Z' }),
      post({ id: 'b', tags: ['紅葉'], created_at: '2026-11-01T00:00:00Z' }),
      post({ id: 'c', tags: ['静か'], created_at: '2026-11-11T00:00:00Z' }),
    ]
    expect(buildInSeason(posts, now)).toEqual([
      { tag: '紅葉', count: 1, spotNames: ['上段の庭（もみじ）'], latestImagePath: 'spot-1/p.jpg' },
    ])
  })

  it('returns nothing when there are no recent season posts', () => {
    expect(buildInSeason([post({ tags: ['静か'] })], now)).toEqual([])
    expect(buildInSeason([post({ tags: ['紅葉'], created_at: '2025-11-10T00:00:00Z' })], now)).toEqual([])
  })

  it('counts a post once even when it has two spellings of the same tag', () => {
    const entries = buildInSeason([post({ tags: ['紅葉', 'もみじ'] })], now)
    expect(entries[0].count).toBe(1)
  })

  it('sorts tags by count, then by the newest post, and keeps the top 3', () => {
    const posts = [
      post({ id: 'a', tags: ['雪'], created_at: '2026-11-11T00:00:00Z' }),
      post({ id: 'b', tags: ['紅葉'], created_at: '2026-11-08T00:00:00Z' }),
      post({ id: 'c', tags: ['紅葉'], created_at: '2026-11-09T00:00:00Z' }),
      post({ id: 'd', tags: ['花'], created_at: '2026-11-10T00:00:00Z' }),
      post({ id: 'e', tags: ['新緑'], created_at: '2026-11-07T00:00:00Z' }),
    ]
    expect(buildInSeason(posts, now).map((e) => e.tag)).toEqual(['紅葉', '雪', '花'])
  })

  it('lists spots with the most posts first and uses the newest image', () => {
    const posts = [
      post({ id: 'a', tags: ['紅葉'], spot_id: 's1', spots: { name: '大噴水前' }, image_path: 's1/a.jpg', created_at: '2026-11-11T00:00:00Z' }),
      post({ id: 'b', tags: ['紅葉'], spot_id: 's2', spots: { name: '上段の庭' }, image_path: 's2/b.jpg', created_at: '2026-11-09T00:00:00Z' }),
      post({ id: 'c', tags: ['紅葉'], spot_id: 's2', spots: { name: '上段の庭' }, image_path: 's2/c.jpg', created_at: '2026-11-10T00:00:00Z' }),
    ]
    const [entry] = buildInSeason(posts, now)
    expect(entry.count).toBe(3)
    expect(entry.spotNames).toEqual(['上段の庭', '大噴水前'])
    expect(entry.latestImagePath).toBe('s1/a.jpg')
  })
})
