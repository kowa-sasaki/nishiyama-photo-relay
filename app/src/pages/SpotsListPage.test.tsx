import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SpotsListPage } from './SpotsListPage'
import * as useSpotsModule from '../lib/useSpots'
import * as useAllPostsModule from '../lib/useAllPosts'
import * as useGeolocationModule from '../lib/useGeolocation'
import type { GeolocationState } from '../lib/useGeolocation'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import * as postImageModule from '../lib/postImage'
import { distanceMeters, formatDistanceLabel } from '../lib/distance'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

afterEach(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
  vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loaded', posts: [] })
  vi.spyOn(postImageModule, 'getPostImageUrl').mockImplementation(
    (_client, imagePath) => `https://example.test/${imagePath}`,
  )
})

describe('SpotsListPage', () => {
  it('shows a loading message while fetching', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loading' })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
  })

  it('keeps showing the loading message while spots are loaded but posts are still loading', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-1',
          name: '大噴水前',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'official',
          order: 1,
          created_at: '2026-06-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loading' })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '人気' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders spot names as links to the detail page', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-1',
          name: '大噴水前',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'official',
          order: 1,
          created_at: '2026-06-01T00:00:00Z',
        },
        {
          id: 'spot-2',
          name: '駅前の桜',
          theme: 'みんなで見守る桜',
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-06-01T00:00:00Z',
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    const officialLink = screen.getByRole('link', { name: /大噴水前/ })
    expect(officialLink).toHaveAttribute('href', '/spots/spot-1')
    expect(screen.getByRole('link', { name: /駅前の桜/ })).toHaveAttribute('href', '/spots/spot-2')
    expect(screen.getByText('みんなで見守る桜')).toBeInTheDocument()
  })

  it('shows a link to create a new spot', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loaded', spots: [] })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '＋新しい定点をつくる' })).toHaveAttribute(
      'href',
      '/spots/new',
    )
  })

  it('shows an error message when loading fails', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'error', message: 'network error' })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('定点一覧を取得できませんでした: network error')).toBeInTheDocument()
  })

  it('shows a friendly message instead of crashing when env vars are missing', () => {
    vi.mocked(getSupabaseClientSafe).mockReturnValue({
      client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
      envError: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません'),
    ).toBeInTheDocument()
  })

  it('defaults to popularity sort, ranking spots by recent post count', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-quiet',
          name: '静かな定点',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'spot-popular',
          name: '人気の定点',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({
      status: 'loaded',
      posts: [
        {
          id: 'p1',
          spot_id: 'spot-popular',
          image_path: 'a.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: new Date().toISOString(),
          device_id: 'd1',
          spots: { name: '人気の定点' },
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '人気' })).toHaveAttribute('aria-pressed', 'true')
    const names = within(screen.getByRole('list'))
      .getAllByRole('link')
      .map((el) => el.textContent)
    expect(names[0]).toContain('人気の定点')
  })

  it('switches to succession sort when the toggle is clicked', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T00:00:00Z'))
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-quiet',
          name: '静かな定点',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'spot-succession',
          name: 'つながる定点',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({
      status: 'loaded',
      posts: [
        {
          id: 'p1',
          spot_id: 'spot-succession',
          image_path: 'a.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'd1',
          spots: { name: 'つながる定点' },
        },
        {
          id: 'p2',
          spot_id: 'spot-succession',
          image_path: 'b.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-10T00:00:00Z',
          device_id: 'd2',
          spots: { name: 'つながる定点' },
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: '継続中' }))
    expect(screen.getByRole('button', { name: '継続中' })).toHaveAttribute('aria-pressed', 'true')
    const names = within(screen.getByRole('list'))
      .getAllByRole('link')
      .map((el) => el.textContent)
    expect(names[0]).toContain('つながる定点')
  })

  it('shows each spot\'s total post count, with succession days only for qualifying spots', () => {
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
          id: 'spot-succession',
          name: 'つながる定点',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({
      status: 'loaded',
      posts: [
        {
          id: 'p1',
          spot_id: 'spot-official',
          image_path: 'a.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2020-01-01T00:00:00Z',
          device_id: 'd0',
          spots: { name: '大噴水前' },
        },
        {
          id: 'p2',
          spot_id: 'spot-succession',
          image_path: 'b.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'd1',
          spots: { name: 'つながる定点' },
        },
        {
          id: 'p3',
          spot_id: 'spot-succession',
          image_path: 'c.jpg',
          comment: null,
          tags: [],
          avg_color: '#000000',
          created_at: '2026-08-10T00:00:00Z',
          device_id: 'd2',
          spots: { name: 'つながる定点' },
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    const officialCard = screen.getByRole('link', { name: /大噴水前/ })
    expect(within(officialCard).getByText('1件')).toBeInTheDocument()
    expect(within(officialCard).queryByText(/日目/)).not.toBeInTheDocument()

    const successionCard = screen.getByRole('link', { name: /つながる定点/ })
    expect(within(successionCard).getByText('2件 · 18日目')).toBeInTheDocument()
  })

  it('shows a thumbnail for spots with posts and no thumbnail for spots without', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-1',
          name: '大噴水前',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'official',
          order: 1,
          created_at: '2026-06-01T00:00:00Z',
        },
        {
          id: 'spot-2',
          name: '駅前の桜',
          theme: null,
          lat: 0,
          lng: 0,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-06-01T00:00:00Z',
        },
      ],
    })
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({
      status: 'loaded',
      posts: [
        {
          id: 'post-1',
          spot_id: 'spot-1',
          image_path: 'spot-1/a.jpg',
          comment: null,
          tags: [],
          avg_color: '#fff',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'device-1',
          spots: { name: '大噴水前' },
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    const spot1Card = screen.getByRole('link', { name: /大噴水前/ })
    const spot2Card = screen.getByRole('link', { name: /駅前の桜/ })
    expect(within(spot1Card).getByRole('img', { name: '最新の投稿写真' })).toHaveAttribute(
      'src',
      'https://example.test/spot-1/a.jpg',
    )
    expect(within(spot2Card).queryByRole('img')).not.toBeInTheDocument()
  })

  it('sorts by distance and shows each distance once "近い順" is tapped and location succeeds', async () => {
    const user = userEvent.setup()
    const origin = { lat: 35.9, lng: 136.2 }
    const near = { lat: 35.901, lng: 136.2 }
    const far = { lat: 35.95, lng: 136.2 }
    vi.spyOn(useGeolocationModule, 'useGeolocation').mockReturnValue({
      state: { status: 'success', lat: origin.lat, lng: origin.lng },
      retry: vi.fn(),
    })
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-far',
          name: '遠い定点',
          theme: null,
          lat: far.lat,
          lng: far.lng,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'spot-near',
          name: '近い定点',
          theme: null,
          lat: near.lat,
          lng: near.lng,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '近い順' }))
    const names = within(screen.getByRole('list'))
      .getAllByRole('link')
      .map((el) => el.textContent)
    expect(names[0]).toContain('近い定点')
    expect(names[1]).toContain('遠い定点')
    const nearLabel = formatDistanceLabel(distanceMeters(origin, near))
    const nearCard = screen.getByRole('link', { name: /近い定点/ })
    expect(within(nearCard).getByText(new RegExp(nearLabel.replace('.', '\\.')))).toBeInTheDocument()
  })

  it('keeps the previous order and shows a loading message while location is being fetched', async () => {
    const user = userEvent.setup()
    vi.spyOn(useGeolocationModule, 'useGeolocation').mockReturnValue({
      state: { status: 'loading' },
      retry: vi.fn(),
    })
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-1',
          name: '定点1',
          theme: null,
          lat: 35.9,
          lng: 136.2,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '近い順' }))
    expect(screen.getByText('現在地を取得中…')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /定点1/ })).toBeInTheDocument()
  })

  it('shows an error and reverts to the previous sort mode when location fails', async () => {
    const user = userEvent.setup()
    // 実際のuseGeolocationは有効化された直後は必ず'loading'から始まる(useStateの初期値)ため、
    // それを模してloading→errorと遷移させる(errorへ直行するmockは非現実的で、
    // 「近い順」再試行時の競合状態を防ぐ修正後のロジックとは噛み合わない)。
    let mockState: { status: 'loading' } | { status: 'error'; message: string } = { status: 'loading' }
    vi.spyOn(useGeolocationModule, 'useGeolocation').mockImplementation(() => ({
      state: mockState,
      retry: vi.fn(),
    }))
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loaded', spots: [] })
    const { rerender } = render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '近い順' }))
    mockState = { status: 'error', message: '位置情報の利用が許可されていません' }
    rerender(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('位置情報を取得できませんでした。設定を確認して再試行してください'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '人気' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '近い順' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('can retry successfully after a previous failure', async () => {
    const user = userEvent.setup()
    let mockState: GeolocationState = {
      status: 'loading',
    }
    vi.spyOn(useGeolocationModule, 'useGeolocation').mockImplementation(() => ({
      state: mockState,
      retry: vi.fn(),
    }))
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [
        {
          id: 'spot-1',
          name: '定点1',
          theme: null,
          lat: 35.9,
          lng: 136.2,
          description: null,
          kind: 'user',
          order: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    const { rerender } = render(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '近い順' }))
    mockState = { status: 'error', message: '位置情報の利用が許可されていません' }
    rerender(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '人気' })).toHaveAttribute('aria-pressed', 'true')

    // 実際のuseGeolocationはenabledがfalseになった時点でstateをloadingにリセットするため、
    // 再タップの瞬間にはすでにmockStateはloadingに戻っている想定でシミュレートする
    mockState = { status: 'loading' }
    await user.click(screen.getByRole('button', { name: '近い順' }))
    expect(screen.getByText('現在地を取得中…')).toBeInTheDocument()
    expect(
      screen.queryByText('位置情報を取得できませんでした。設定を確認して再試行してください'),
    ).not.toBeInTheDocument()

    mockState = { status: 'success', lat: 35.9, lng: 136.2 }
    rerender(
      <MemoryRouter>
        <SpotsListPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '近い順' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.queryByText('位置情報を取得できませんでした。設定を確認して再試行してください'),
    ).not.toBeInTheDocument()
  })
})
