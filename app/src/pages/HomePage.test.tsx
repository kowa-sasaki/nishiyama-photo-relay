import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import * as useAllPostsModule from '../lib/useAllPosts'
import * as useSpotsModule from '../lib/useSpots'
import * as useVisitorsDailyModule from '../lib/useVisitorsDaily'
import * as postImageModule from '../lib/postImage'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import type { PostWithSpot } from '../lib/types'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

afterEach(() => {
  vi.useRealTimers()
})

const posts: PostWithSpot[] = [
  {
    id: 'post-recent',
    spot_id: 'spot-1',
    image_path: 'spot-1/recent.jpg',
    comment: '最新の投稿',
    tags: [],
    avg_color: '#4c7a32',
    created_at: '2026-08-18T00:00:00Z',
    device_id: 'device-1',
    spots: { name: '大噴水前' },
  },
  {
    id: 'post-aug10',
    spot_id: 'spot-2',
    image_path: 'spot-2/aug10.jpg',
    comment: '8/10の投稿',
    tags: [],
    avg_color: '#6fa8c7',
    created_at: '2026-08-10T00:00:00Z',
    device_id: 'device-2',
    spots: { name: 'つつじ園' },
  },
]

beforeEach(() => {
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
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
  vi.spyOn(postImageModule, 'getPostImageUrl').mockReturnValue('https://example.test/image.jpg')
  vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loaded', posts })
  vi.spyOn(useVisitorsDailyModule, 'useVisitorsDaily').mockReturnValue({
    status: 'loaded',
    data: [{ date: '2025-08-10', visitors: 520 }],
  })
  vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loaded', spots: [] })
})

describe('HomePage', () => {
  it('shows the most recent post in the hero while idle', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    const heroSlideshow = screen.getByRole('link', { name: /大噴水前の投稿写真/ }).closest('a')
    expect(within(heroSlideshow!).getByText('大噴水前')).toBeInTheDocument()
    expect(screen.getByText('自動再生中')).toBeInTheDocument()
  })

  it("switches the hero to the tapped day's post", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /8\/10の投稿を見る/ }))
    const heroSlideshow = screen.getByRole('link', { name: /つつじ園の投稿写真/ }).closest('a')
    expect(within(heroSlideshow!).getByText('つつじ園')).toBeInTheDocument()
    expect(screen.getByText('選択中')).toBeInTheDocument()
  })

  it('shows the env error message when Supabase is not configured', () => {
    vi.mocked(getSupabaseClientSafe).mockReturnValue({
      client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
      envError: '環境変数が設定されていません',
    })
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByText('環境変数が設定されていません')).toBeInTheDocument()
  })

  it('shows a popular-spot ranking based on recent post counts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T00:00:00Z'))
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByText('いま賑わっている定点')).toBeInTheDocument()
    const rankingList = within(screen.getByRole('list'))
    expect(rankingList.getByRole('link', { name: /大噴水前/ })).toHaveAttribute('href', '/spots/spot-1')
    expect(rankingList.getByRole('link', { name: /つつじ園/ })).toHaveAttribute('href', '/spots/spot-2')
  })

  it('shows a ranking of spots with a long-running succession chain', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T00:00:00Z'))
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-official',
          name: '大噴水前',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'official',
          order: 1,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'spot-user-active',
          name: '北口ベンチ',
          theme: 'ランニング途中によってみた',
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-08-01T00:00:00Z',
        },
        {
          id: 'spot-user-solo',
          name: '駅前の桜',
          theme: 'みんなで見守る桜',
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-07-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({
      status: 'loaded',
      posts: [
        ...posts,
        {
          id: 'post-user-active-1',
          spot_id: 'spot-user-active',
          image_path: 'spot-user-active/a.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'device-3',
          spots: { name: '北口ベンチ' },
        },
        {
          id: 'post-user-active-2',
          spot_id: 'spot-user-active',
          image_path: 'spot-user-active/b.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-12T00:00:00Z',
          device_id: 'device-4',
          spots: { name: '北口ベンチ' },
        },
        {
          id: 'post-user-solo',
          spot_id: 'spot-user-solo',
          image_path: 'spot-user-solo/a.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-07-02T00:00:00Z',
          device_id: 'device-5',
          spots: { name: '駅前の桜' },
        },
      ],
    })
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    const successionCard = screen.getByText('長くつながっている定点').closest('.spot-ranking')
    expect(successionCard).not.toBeNull()
    expect(within(successionCard as HTMLElement).getByRole('link', { name: /北口ベンチ/ })).toHaveAttribute(
      'href',
      '/spots/spot-user-active',
    )
    expect(within(successionCard as HTMLElement).getByText('18日目')).toBeInTheDocument()
    expect(screen.queryByText('駅前の桜')).not.toBeInTheDocument()
  })

  it('見出しに「みんなでつなぐ」の前置きと「西山公園フォトリレー」のブランド名を表示する', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    const heading = screen.getByRole('heading', { name: 'みんなでつなぐ西山公園フォトリレー' })
    expect(heading).toBeInTheDocument()
    expect(heading.querySelector('.home-page__title-lead')).toHaveTextContent('みんなでつなぐ')
    expect(heading.querySelector('.home-page__title-brand')).toHaveTextContent('西山公園フォトリレー')
  })
})
