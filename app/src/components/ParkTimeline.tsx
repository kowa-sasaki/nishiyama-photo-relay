import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { TimelineDay } from '../lib/parkTimeline'
import { seasonRibbonToken } from '../lib/parkTimeline'
import { computeVisitorCap, movingAverage } from '../lib/visitorScale'
import './ParkTimeline.css'

const CELL_WIDTH = 15
const CELL_GAP = 2
const VISITORS_HEIGHT = 80
// 上限超過マーカーを置くための描画帯の上の余白。
const VISITORS_TOP_PAD = 10
const VISITORS_BOTTOM_PAD = 2
const TREND_WINDOW = 7
const POSTS_HEIGHT = 34
// 超過マーカー(▲)の底辺・頂点のY座標。VISITORS_TOP_PADからの相対位置として
// 定義することで、余白を変更してもマーカーが上限線から詰めない。
const OVERFLOW_MARKER_BASE_Y = VISITORS_TOP_PAD - 3
const OVERFLOW_MARKER_APEX_Y = VISITORS_TOP_PAD - 8.5
const OVERFLOW_MARKER_HALF_WIDTH = 3.5

type Point = { x: number; y: number }

function toPath(points: Point[]): string {
  return points
    .map((p, order) => `${order === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
}

export type ParkTimelineProps = {
  days: TimelineDay[]
  selectedMonthDay: string | null
  todayMonthDay: string
  onSelectDay: (monthDay: string) => void
  onReset: () => void
}

function formatMonthDay(monthDay: string): string {
  const [month, day] = monthDay.split('-')
  return `${Number(month)}/${Number(day)}`
}

export function ParkTimeline({ days, selectedMonthDay, todayMonthDay, onSelectDay, onReset }: ParkTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cellStep = CELL_WIDTH + CELL_GAP
  const trackWidth = days.length * cellStep

  const maxPosts = useMemo(() => Math.max(1, ...days.map((d) => d.posts.length)), [days])

  const visitorValues = useMemo(() => days.map((d) => d.visitors), [days])
  const numericVisitors = useMemo(
    () => visitorValues.filter((v): v is number => v !== null),
    [visitorValues],
  )
  const hasVisitorData = numericVisitors.length > 0
  const visitorCap = useMemo(() => computeVisitorCap(numericVisitors), [numericVisitors])
  const maxVisitors = useMemo(
    () => (numericVisitors.length > 0 ? Math.max(...numericVisitors) : 0),
    [numericVisitors],
  )
  const trendValues = useMemo(() => movingAverage(visitorValues, TREND_WINDOW), [visitorValues])

  const plotHeight = VISITORS_HEIGHT - VISITORS_TOP_PAD - VISITORS_BOTTOM_PAD
  const baselineY = VISITORS_HEIGHT - VISITORS_BOTTOM_PAD
  const cellCenterX = useCallback((i: number) => i * cellStep + CELL_WIDTH / 2, [cellStep])
  // 上限を超える値は上限の高さで頭打ちにする(超過はマーカーで示す)。
  const valueY = useCallback(
    (value: number) => baselineY - Math.min(1, value / visitorCap) * plotHeight,
    [baselineY, visitorCap, plotHeight],
  )

  // nullの日はスキップして前後の有効な日を直接つなぐ(パスを分断しない)。
  const dailyPoints = useMemo(
    () => visitorValues.flatMap((v, i) => (v === null ? [] : [{ x: cellCenterX(i), y: valueY(v) }])),
    [visitorValues, cellCenterX, valueY],
  )
  const dailyLinePath = useMemo(() => toPath(dailyPoints), [dailyPoints])
  const dailyAreaPath = useMemo(
    () =>
      dailyPoints.length > 0
        ? `${dailyLinePath} L${dailyPoints[dailyPoints.length - 1].x.toFixed(1)},${baselineY} L${dailyPoints[0].x.toFixed(1)},${baselineY} Z`
        : '',
    [dailyPoints, dailyLinePath, baselineY],
  )
  const trendPath = useMemo(
    () => toPath(trendValues.flatMap((v, i) => (v === null ? [] : [{ x: cellCenterX(i), y: valueY(v) }]))),
    [trendValues, cellCenterX, valueY],
  )
  const overflowDays = useMemo(
    () => visitorValues.flatMap((v, i) => (v !== null && v > visitorCap ? [{ x: cellCenterX(i) }] : [])),
    [visitorValues, visitorCap, cellCenterX],
  )

  const todayIndex = days.findIndex((d) => d.monthDay === todayMonthDay)
  const selectedDay = selectedMonthDay ? (days.find((d) => d.monthDay === selectedMonthDay) ?? null) : null

  useEffect(() => {
    const el = scrollRef.current
    if (!el || todayIndex < 0) return
    el.scrollLeft = Math.max(0, todayIndex * cellStep - el.clientWidth / 2)
  }, [todayIndex, cellStep])

  function scrollToToday() {
    const el = scrollRef.current
    if (!el || todayIndex < 0) return
    el.scrollTo({ left: Math.max(0, todayIndex * cellStep - el.clientWidth / 2), behavior: 'smooth' })
  }

  return (
    <div className="park-timeline">
      <h3 className="park-timeline__heading">公園全体タイムライン</h3>
      <div className="park-timeline__card">
        <div className="park-timeline__head">
          <p>色は投稿写真の平均色。面は令和7年度の日別来訪者数、太線は7日移動平均、棒は投稿数。</p>
          <div className="park-timeline__head-actions">
            {todayIndex >= 0 && (
              <button type="button" className="park-timeline__reset" onClick={scrollToToday}>
                今日へ
              </button>
            )}
            {selectedMonthDay && (
              <button type="button" className="park-timeline__reset" onClick={onReset}>
                自動再生に戻す
              </button>
            )}
          </div>
        </div>
        <div className="park-timeline__scroll" ref={scrollRef}>
          <div className="park-timeline__track" style={{ width: trackWidth }}>
            <div className="park-timeline__ribbon-row">
              {days.map((d) => {
                const hasData = d.posts.length > 0
                const classes = [
                  'park-timeline__day-cell',
                  hasData && 'park-timeline__day-cell--has-data',
                  d.monthDay === todayMonthDay && 'park-timeline__day-cell--today',
                  d.monthDay === selectedMonthDay && 'park-timeline__day-cell--selected',
                ]
                  .filter(Boolean)
                  .join(' ')
                const style = {
                  width: CELL_WIDTH,
                  height: 22,
                  background: d.avgColor ?? `var(${seasonRibbonToken(d.month)})`,
                  opacity: hasData ? 1 : 0.4,
                }
                return hasData ? (
                  <button
                    key={d.monthDay}
                    type="button"
                    className={classes}
                    style={style}
                    onClick={() => onSelectDay(d.monthDay)}
                    aria-label={`${formatMonthDay(d.monthDay)}の投稿を見る`}
                  />
                ) : (
                  <div key={d.monthDay} className={classes} style={style} />
                )
              })}
            </div>
            {hasVisitorData && (
              <svg
                className="park-timeline__visitors-row"
                width={trackWidth}
                height={VISITORS_HEIGHT}
                viewBox={`0 0 ${trackWidth} ${VISITORS_HEIGHT}`}
              >
                <defs>
                  <linearGradient id="park-timeline-visitors-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="park-timeline__visitors-fill-top" />
                    <stop offset="100%" className="park-timeline__visitors-fill-bottom" />
                  </linearGradient>
                </defs>
                {overflowDays.length > 0 && (
                  <line
                    className="park-timeline__visitors-cap-line"
                    x1={0}
                    y1={VISITORS_TOP_PAD}
                    x2={trackWidth}
                    y2={VISITORS_TOP_PAD}
                  />
                )}
                <path className="park-timeline__visitors-area" d={dailyAreaPath} />
                <path className="park-timeline__visitors-daily" d={dailyLinePath} />
                <path className="park-timeline__visitors-trend" d={trendPath} />
                {overflowDays.map((p) => (
                  <path
                    key={p.x}
                    className="park-timeline__visitors-overflow"
                    d={`M${(p.x - OVERFLOW_MARKER_HALF_WIDTH).toFixed(1)},${OVERFLOW_MARKER_BASE_Y} L${p.x.toFixed(1)},${OVERFLOW_MARKER_APEX_Y} L${(p.x + OVERFLOW_MARKER_HALF_WIDTH).toFixed(1)},${OVERFLOW_MARKER_BASE_Y} Z`}
                  />
                ))}
                {todayIndex >= 0 && (
                  <line
                    className="park-timeline__today-line"
                    x1={cellCenterX(todayIndex)}
                    y1={0}
                    x2={cellCenterX(todayIndex)}
                    y2={VISITORS_HEIGHT}
                  />
                )}
              </svg>
            )}
            <div className="park-timeline__posts-row" style={{ height: POSTS_HEIGHT }}>
              {days.map((d) => {
                const count = d.posts.length
                const barHeight = count === 0 ? 0 : Math.max(6, (count / maxPosts) * (POSTS_HEIGHT - 4))
                return (
                  <div key={d.monthDay} className="park-timeline__post-bar-col" style={{ width: CELL_WIDTH }}>
                    {count === 0 ? (
                      <div className="park-timeline__post-baseline" />
                    ) : (
                      <div className="park-timeline__post-bar" style={{ height: barHeight }} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="park-timeline__month-ticks">
              {days.map((d, i) =>
                d.monthDay.endsWith('-01') ? (
                  <span key={d.monthDay} className="park-timeline__month-tick" style={{ left: i * cellStep }}>
                    {d.month}月
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>
        {selectedDay && (
          <div className="park-timeline__tooltip" role="status">
            <span className="park-timeline__tooltip-date">{formatMonthDay(selectedDay.monthDay)}</span>
            <span>来訪者数 {selectedDay.visitors?.toLocaleString('ja-JP') ?? '—'}</span>
            <span>投稿 {selectedDay.posts.length}件</span>
          </div>
        )}
        <div className="park-timeline__legend">
          <span className="park-timeline__legend-item">
            <span className="park-timeline__legend-dot park-timeline__legend-dot--placeholder" />
            季節の目安色（投稿なし）
          </span>
          <span className="park-timeline__legend-item">
            <span className="park-timeline__legend-dot park-timeline__legend-dot--data" />
            投稿の平均色（タップで選択）
          </span>
          {overflowDays.length > 0 && (
            <span className="park-timeline__legend-item">
              <span className="park-timeline__legend-cap-line" aria-hidden="true" />
              <span className="park-timeline__legend-arrow" aria-hidden="true">
                ↑
              </span>
              {`上限 ${visitorCap.toLocaleString('ja-JP')}人（↑は超過日、最大 ${maxVisitors.toLocaleString('ja-JP')}人）`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
