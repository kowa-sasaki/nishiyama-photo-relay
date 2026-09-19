import type { PostWithSpot } from './types'
import { rgbaToHex } from './image'

export type VisitorDay = {
  date: string
  visitors: number
}

export type TimelineDay = {
  monthDay: string
  month: number
  visitors: number | null
  posts: PostWithSpot[]
  avgColor: string | null
}

// 月日を列挙するためだけの非うるう年の基準年。実際の投稿の年には依存しない。
const REFERENCE_YEAR = 2025

const jstMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  month: '2-digit',
  day: '2-digit',
})

export function monthDayFromIso(iso: string): string {
  if (iso.length <= 10) {
    // 'YYYY-MM-DD'（visitors_daily.jsonの日付。タイムゾーン情報を持たない）はそのままスライス
    return iso.slice(5, 10)
  }
  // posts.created_at は timestamptz（UTC）。公園は日本国内のため常にJST基準で月日を決める。
  const parts = jstMonthDayFormatter.formatToParts(new Date(iso))
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${month}-${day}`
}

export function formatMonthDayLabel(iso: string): string {
  const [month, day] = monthDayFromIso(iso).split('-')
  return `${Number(month)}/${Number(day)}`
}

export function seasonRibbonToken(month: number): string {
  if (month >= 3 && month <= 5) return '--ribbon-tsutsuji'
  if (month >= 6 && month <= 8) return '--ribbon-shinryoku'
  if (month >= 9 && month <= 11) return '--ribbon-koyo'
  return '--ribbon-snow'
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function averageHexColors(colors: string[]): string {
  const sum = colors.reduce(
    (acc, hex) => {
      const [r, g, b] = hexToRgb(hex)
      return [acc[0] + r, acc[1] + g, acc[2] + b]
    },
    [0, 0, 0],
  )
  const n = colors.length
  return rgbaToHex(Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n))
}

function buildMonthDaySequence(): string[] {
  const sequence: string[] = []
  const cursor = new Date(REFERENCE_YEAR, 3, 1) // 4月1日
  for (let i = 0; i < 365; i++) {
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    sequence.push(`${month}-${day}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return sequence
}

export function buildParkTimeline(posts: PostWithSpot[], visitorsDaily: VisitorDay[]): TimelineDay[] {
  const visitorsByMonthDay = new Map<string, number>()
  for (const entry of visitorsDaily) {
    visitorsByMonthDay.set(monthDayFromIso(entry.date), entry.visitors)
  }

  const postsByMonthDay = new Map<string, PostWithSpot[]>()
  for (const post of posts) {
    const key = monthDayFromIso(post.created_at)
    const bucket = postsByMonthDay.get(key)
    if (bucket) {
      bucket.push(post)
    } else {
      postsByMonthDay.set(key, [post])
    }
  }

  return buildMonthDaySequence().map((monthDay) => {
    const dayPosts = (postsByMonthDay.get(monthDay) ?? [])
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    const colors = dayPosts
      .map((post) => post.avg_color)
      .filter((color): color is string => color !== null)

    return {
      monthDay,
      month: Number(monthDay.slice(0, 2)),
      visitors: visitorsByMonthDay.get(monthDay) ?? null,
      posts: dayPosts,
      avgColor: colors.length > 0 ? averageHexColors(colors) : null,
    }
  })
}
