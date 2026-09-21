import { describe, it, expect } from 'vitest'
import {
  averageHexColors,
  buildParkTimeline,
  formatMonthDayLabel,
  monthDayFromIso,
  seasonRibbonToken,
  timelineMonthDay,
} from './parkTimeline'
import type { VisitorDay } from './parkTimeline'
import type { PostWithSpot } from './types'

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

describe('monthDayFromIso', () => {
  it('extracts MM-DD from a timestamp', () => {
    expect(monthDayFromIso('2026-08-01T00:00:00Z')).toBe('08-01')
  })

  it('extracts MM-DD from a date-only string', () => {
    expect(monthDayFromIso('2025-04-01')).toBe('04-01')
  })

  it('converts a UTC timestamp to its JST month-day, crossing the UTC day boundary', () => {
    // 2026-08-18T20:00:00Z is 2026-08-19 05:00 JST (UTC+9)
    expect(monthDayFromIso('2026-08-18T20:00:00Z')).toBe('08-19')
  })

  it('stays on the same day when the UTC and JST month-day match', () => {
    // 2026-08-18T02:00:00Z is 2026-08-18 11:00 JST
    expect(monthDayFromIso('2026-08-18T02:00:00Z')).toBe('08-18')
  })
})

describe('formatMonthDayLabel', () => {
  it('formats an ISO datetime as M/D without leading zeros', () => {
    expect(formatMonthDayLabel('2026-08-01T00:00:00Z')).toBe('8/1')
  })

  it('formats a bare YYYY-MM-DD date the same way', () => {
    expect(formatMonthDayLabel('2026-08-05')).toBe('8/5')
  })
})

describe('seasonRibbonToken', () => {
  it('returns tsutsuji for spring months', () => {
    expect(seasonRibbonToken(3)).toBe('--ribbon-tsutsuji')
    expect(seasonRibbonToken(5)).toBe('--ribbon-tsutsuji')
  })

  it('returns shinryoku for summer months', () => {
    expect(seasonRibbonToken(6)).toBe('--ribbon-shinryoku')
    expect(seasonRibbonToken(8)).toBe('--ribbon-shinryoku')
  })

  it('returns koyo for autumn months', () => {
    expect(seasonRibbonToken(9)).toBe('--ribbon-koyo')
    expect(seasonRibbonToken(11)).toBe('--ribbon-koyo')
  })

  it('returns snow for winter months', () => {
    expect(seasonRibbonToken(12)).toBe('--ribbon-snow')
    expect(seasonRibbonToken(1)).toBe('--ribbon-snow')
    expect(seasonRibbonToken(2)).toBe('--ribbon-snow')
  })
})

describe('averageHexColors', () => {
  it('returns the same color when given one color', () => {
    expect(averageHexColors(['#4c7a32'])).toBe('#4c7a32')
  })

  it('averages two colors channel by channel', () => {
    expect(averageHexColors(['#000000', '#ffffff'])).toBe('#808080')
  })
})

describe('buildParkTimeline', () => {
  const visitorsDaily: VisitorDay[] = [
    { date: '2025-04-01', visitors: 450 },
    { date: '2025-08-01', visitors: 600 },
  ]

  it('returns 365 days starting at 04-01 and ending at 03-31', () => {
    const days = buildParkTimeline([], [])
    expect(days).toHaveLength(365)
    expect(days[0].monthDay).toBe('04-01')
    expect(days[days.length - 1].monthDay).toBe('03-31')
  })

  it('maps visitor counts by month-day', () => {
    const days = buildParkTimeline([], visitorsDaily)
    const apr1 = days.find((d) => d.monthDay === '04-01')
    expect(apr1?.visitors).toBe(450)
  })

  it('leaves visitors null for days with no visitor data', () => {
    const days = buildParkTimeline([], [])
    const apr1 = days.find((d) => d.monthDay === '04-01')
    expect(apr1?.visitors).toBeNull()
  })

  it('groups posts from different years onto the same month-day, newest first, averaging their color', () => {
    const posts = [
      makePost({ id: 'post-2025', created_at: '2025-08-01T00:00:00Z', avg_color: '#000000' }),
      makePost({ id: 'post-2026', created_at: '2026-08-01T00:00:00Z', avg_color: '#ffffff' }),
    ]
    const days = buildParkTimeline(posts, visitorsDaily)
    const aug1 = days.find((d) => d.monthDay === '08-01')
    expect(aug1?.posts.map((p) => p.id)).toEqual(['post-2026', 'post-2025'])
    expect(aug1?.avgColor).toBe('#808080')
  })

  it('leaves avgColor null and posts empty for days with no posts', () => {
    const days = buildParkTimeline([], [])
    const apr1 = days.find((d) => d.monthDay === '04-01')
    expect(apr1?.posts).toEqual([])
    expect(apr1?.avgColor).toBeNull()
  })
})

describe('leap day (02-29)', () => {
  it('folds a 02-29 post into the 02-28 cell, since the timeline has no 02-29', () => {
    // 2028-02-29 12:00 JST
    const leapPost = makePost({ id: 'leap', created_at: '2028-02-29T03:00:00Z', avg_color: '#123456' })
    const days = buildParkTimeline([leapPost], [])
    expect(days.some((d) => d.monthDay === '02-29')).toBe(false)
    const feb28 = days.find((d) => d.monthDay === '02-28')!
    expect(feb28.posts.map((p) => p.id)).toEqual(['leap'])
    expect(feb28.avgColor).toBe('#123456')
  })

  it('maps a 02-29 timestamp to the 02-28 timeline key, leaving other days as-is', () => {
    expect(timelineMonthDay('2028-02-29T03:00:00Z')).toBe('02-28')
    expect(timelineMonthDay('2026-09-21T03:00:00Z')).toBe('09-21')
  })

  it('keeps the real date in the photo label', () => {
    expect(formatMonthDayLabel('2028-02-29T03:00:00Z')).toBe('2/29')
  })
})
