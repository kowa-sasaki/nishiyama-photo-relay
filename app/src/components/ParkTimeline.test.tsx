import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParkTimeline } from './ParkTimeline'
import type { TimelineDay } from '../lib/parkTimeline'
import type { PostWithSpot } from '../lib/types'

const samplePost: PostWithSpot = {
  id: 'post-1',
  spot_id: 'spot-1',
  image_path: 'spot-1/a.jpg',
  comment: null,
  tags: [],
  avg_color: '#4c7a32',
  created_at: '2026-08-02T00:00:00Z',
  device_id: 'device-1',
  spots: { name: '大噴水前' },
}

const days: TimelineDay[] = [
  { monthDay: '08-01', month: 8, visitors: 500, posts: [], avgColor: null },
  { monthDay: '08-02', month: 8, visitors: 520, posts: [samplePost], avgColor: '#4c7a32' },
  { monthDay: '08-03', month: 8, visitors: 480, posts: [], avgColor: null },
]

// 中央値100 → 上限500。5000人の日だけが上限を超える。
const spikyDays: TimelineDay[] = [
  { monthDay: '08-01', month: 8, visitors: 100, posts: [], avgColor: null },
  { monthDay: '08-02', month: 8, visitors: 100, posts: [], avgColor: null },
  { monthDay: '08-03', month: 8, visitors: 5000, posts: [], avgColor: null },
]

describe('ParkTimeline', () => {
  it('renders a tappable cell only for days with data', () => {
    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-03" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.getAllByRole('button', { name: /の投稿を見る/ })).toHaveLength(1)
  })

  it("calls onSelectDay with the tapped day's monthDay", () => {
    const onSelectDay = vi.fn()
    render(
      <ParkTimeline
        days={days}
        selectedMonthDay={null}
        todayMonthDay="08-03"
        onSelectDay={onSelectDay}
        onReset={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /の投稿を見る/ }))
    expect(onSelectDay).toHaveBeenCalledWith('08-02')
  })

  it('shows a reset link and tooltip when a day is selected', () => {
    render(
      <ParkTimeline
        days={days}
        selectedMonthDay="08-02"
        todayMonthDay="08-03"
        onSelectDay={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByText('自動再生に戻す')).toBeInTheDocument()
    expect(screen.getByText('来訪者数 520')).toBeInTheDocument()
    expect(screen.getByText('投稿 1件')).toBeInTheDocument()
  })

  it('calls onReset when the reset link is clicked', () => {
    const onReset = vi.fn()
    render(
      <ParkTimeline
        days={days}
        selectedMonthDay="08-02"
        todayMonthDay="08-03"
        onSelectDay={vi.fn()}
        onReset={onReset}
      />,
    )
    fireEvent.click(screen.getByText('自動再生に戻す'))
    expect(onReset).toHaveBeenCalled()
  })

  it('does not show the reset link when no day is selected', () => {
    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-03" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.queryByText('自動再生に戻す')).not.toBeInTheDocument()
  })

  it('always shows a today button and scrolls the track when clicked', () => {
    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-03" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    const button = screen.getByText('今日へ')
    const scrollTo = vi.fn()
    const scrollEl = button.closest('.park-timeline__card')?.querySelector('.park-timeline__scroll')
    if (scrollEl) (scrollEl as HTMLDivElement).scrollTo = scrollTo
    fireEvent.click(button)
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
  })

  it('does not show the today button when todayMonthDay is not in range', () => {
    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="09-15" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.queryByText('今日へ')).not.toBeInTheDocument()
  })

  it('日別の面と7日移動平均の線を両方描画する', () => {
    const { container } = render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(container.querySelector('.park-timeline__visitors-area')).not.toBeNull()
    expect(container.querySelector('.park-timeline__visitors-trend')).not.toBeNull()
  })

  it('上限を超えた日の数だけ超過マーカーを描画する', () => {
    const { container } = render(
      <ParkTimeline days={spikyDays} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(container.querySelectorAll('.park-timeline__visitors-overflow')).toHaveLength(1)
  })

  it('上限を超えた日が無ければ超過マーカーを描画しない', () => {
    const { container } = render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(container.querySelectorAll('.park-timeline__visitors-overflow')).toHaveLength(0)
  })

  it('説明文が面と7日移動平均に言及する', () => {
    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.getByText(/面は令和7年度の日別来訪者数、太線は7日移動平均/)).toBeInTheDocument()
  })

  it('上限を超えた日があるときだけ凡例に上限値と最大値を出す', () => {
    const { unmount } = render(
      <ParkTimeline days={spikyDays} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.getByText(/上限 500人（↑は超過日、最大 5,000人）/)).toBeInTheDocument()
    unmount()

    render(
      <ParkTimeline days={days} selectedMonthDay={null} todayMonthDay="08-02" onSelectDay={vi.fn()} onReset={vi.fn()} />,
    )
    expect(screen.queryByText(/上限/)).toBeNull()
  })
})
