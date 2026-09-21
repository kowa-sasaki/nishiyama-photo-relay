import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HeroSlideshow } from './HeroSlideshow'
import type { PostWithSpot } from '../lib/types'
import type { TimelineDay } from '../lib/parkTimeline'

function createMockClient(): SupabaseClient {
  return {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }),
      }),
    },
  } as unknown as SupabaseClient
}

function makePost(overrides: Partial<PostWithSpot>): PostWithSpot {
  return {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: 'きれいでした',
    tags: [],
    avg_color: '#4c7a32',
    created_at: '2026-08-01T00:00:00Z',
    device_id: 'device-1',
    spots: { name: '大噴水前' },
    ...overrides,
  }
}

describe('HeroSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an empty state when there are no posts', () => {
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[]} selectedDay={null} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/まだ投稿がありません/)).toBeInTheDocument()
  })

  it('shows the latest post while idle', () => {
    const posts = [makePost({ id: 'post-1' })]
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={posts} selectedDay={null} />
      </MemoryRouter>,
    )
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
    expect(screen.getByText('自動再生中')).toBeInTheDocument()
  })

  it('cycles through posts on an interval while idle', () => {
    const posts = [
      makePost({ id: 'post-1', spots: { name: '大噴水前' } }),
      makePost({ id: 'post-2', spots: { name: 'つつじ園' } }),
    ]
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={posts} selectedDay={null} />
      </MemoryRouter>,
    )
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByText('つつじ園')).toBeInTheDocument()
  })

  it("shows the selected day's posts instead of the autoplay pool", () => {
    const idlePost = makePost({ id: 'idle', spots: { name: '大噴水前' } })
    const dayPost = makePost({ id: 'day-post', spots: { name: '上段の庭' } })
    const selectedDay: TimelineDay = {
      monthDay: '08-02',
      month: 8,
      visitors: 500,
      posts: [dayPost],
      avgColor: '#4c7a32',
    }
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[idlePost]} selectedDay={selectedDay} />
      </MemoryRouter>,
    )
    expect(screen.getByText('上段の庭')).toBeInTheDocument()
    expect(screen.getByText('選択中')).toBeInTheDocument()
  })

  it('shows dots when the selected day has multiple posts', () => {
    const dayPosts = [
      makePost({ id: 'p1', spots: { name: '大噴水前' } }),
      makePost({ id: 'p2', spots: { name: '大噴水前' } }),
    ]
    const selectedDay: TimelineDay = { monthDay: '08-02', month: 8, visitors: 500, posts: dayPosts, avgColor: '#4c7a32' }
    const { container } = render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[]} selectedDay={selectedDay} />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll('.hero-slideshow__dot')).toHaveLength(2)
  })

  it('switches to a different photo when its dot is clicked, without navigating', () => {
    const dayPosts = [
      makePost({ id: 'p1', spots: { name: '大噴水前' } }),
      makePost({ id: 'p2', spots: { name: '上段の庭' } }),
    ]
    const selectedDay: TimelineDay = { monthDay: '08-02', month: 8, visitors: 500, posts: dayPosts, avgColor: '#4c7a32' }
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[]} selectedDay={selectedDay} />
      </MemoryRouter>,
    )
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
    const dots = document.querySelectorAll('.hero-slideshow__dot')
    fireEvent.click(dots[1])
    expect(screen.getByText('上段の庭')).toBeInTheDocument()
  })

  it("autoplays through the selected day's posts", () => {
    const dayPosts = [
      makePost({ id: 'p1', spots: { name: '大噴水前' } }),
      makePost({ id: 'p2', spots: { name: '上段の庭' } }),
    ]
    const selectedDay: TimelineDay = { monthDay: '08-02', month: 8, visitors: 500, posts: dayPosts, avgColor: '#4c7a32' }
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[]} selectedDay={selectedDay} />
      </MemoryRouter>,
    )
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByText('上段の庭')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
  })

  it('restarts the autoplay timer after a dot is tapped, so the chosen photo stays for a full interval', () => {
    const dayPosts = [
      makePost({ id: 'p1', spots: { name: '大噴水前' } }),
      makePost({ id: 'p2', spots: { name: '上段の庭' } }),
      makePost({ id: 'p3', spots: { name: '展望台' } }),
    ]
    const selectedDay: TimelineDay = { monthDay: '08-02', month: 8, visitors: 500, posts: dayPosts, avgColor: '#4c7a32' }
    render(
      <MemoryRouter>
        <HeroSlideshow client={createMockClient()} recentPosts={[]} selectedDay={selectedDay} />
      </MemoryRouter>,
    )
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.click(screen.getByRole('button', { name: '3枚目の写真を表示' }))
    expect(screen.getByText('展望台')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('展望台')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1800)
    })
    expect(screen.getByText('大噴水前')).toBeInTheDocument()
  })
})
