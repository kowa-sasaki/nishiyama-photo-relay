import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SpotDetailPage } from './SpotDetailPage'
import { LastViewedSpotProvider, useLastViewedSpot } from '../lib/LastViewedSpotContext'
import * as useSpotModule from '../lib/useSpot'
import * as postImageModule from '../lib/postImage'
import * as authModule from '../lib/AuthContext'
import { getSupabaseClientSafe } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
})

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
  vi.spyOn(postImageModule, 'getPostImageUrl').mockReturnValue(
    'https://example.supabase.co/storage/v1/object/public/posts/spot-1/a.jpg',
  )
  vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'signed-in', userId: 'device-1' })
})

function LastViewedSpotDisplay() {
  const { lastViewedSpotId } = useLastViewedSpot()
  return <p>last-viewed: {lastViewedSpotId ?? 'none'}</p>
}

function renderAtSpot(spotId: string) {
  return render(
    <LastViewedSpotProvider>
      <MemoryRouter initialEntries={[`/spots/${spotId}`]}>
        <LastViewedSpotDisplay />
        <Routes>
          <Route path="/spots/:spotId" element={<SpotDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LastViewedSpotProvider>,
  )
}

describe('SpotDetailPage', () => {
  it('shows a loading message while fetching', () => {
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({ status: 'loading' })
    renderAtSpot('spot-1')
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
  })

  it('renders the spot name, theme, post list with a thumbnail, and records it as last-viewed', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
      status: 'loaded',
      spot: {
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
      posts: [
        {
          id: 'post-1',
          spot_id: 'spot-1',
          image_path: 'spot-1/a.jpg',
          comment: 'きれいでした',
          tags: ['桜'],
          avg_color: '#f2a6c2',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'device-1',
        },
      ],
    })
    renderAtSpot('spot-1')
    expect(screen.getByRole('heading', { name: '大噴水前' })).toBeInTheDocument()
    const thumbImage = screen.getByRole('img', { name: '投稿画像' })
    const postRow = thumbImage.closest('li') as HTMLElement
    expect(within(postRow).getByText('きれいでした')).toBeInTheDocument()
    expect(within(postRow).getByText('桜')).toBeInTheDocument()
    expect(thumbImage).toHaveAttribute(
      'src',
      'https://example.supabase.co/storage/v1/object/public/posts/spot-1/a.jpg',
    )
    expect(screen.getByRole('link', { name: '投稿する' })).toHaveAttribute('href', '/post')
    expect(screen.getByText('last-viewed: spot-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'この定点を報告する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'この投稿を報告する' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(share).toHaveBeenCalledWith({
      text: '大噴水前の記録 #西山公園定点観測',
      url: 'http://localhost:3000/spots/spot-1',
    })
  })

  it('renders the spot description when present', () => {
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
      status: 'loaded',
      spot: {
        id: 'spot-1',
        name: '大噴水前',
        theme: null,
        lat: 0,
        lng: 0,
        description: '西口の並木道沿い',
        kind: 'official',
        order: 1,
        created_at: '2026-06-01T00:00:00Z',
      },
      posts: [],
    })
    renderAtSpot('spot-1')
    expect(screen.getByText('西口の並木道沿い')).toBeInTheDocument()
  })

  it('links to the spot location in a map app in a new tab', () => {
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
      status: 'loaded',
      spot: {
        id: 'spot-1',
        name: '大噴水前',
        theme: null,
        lat: 35.9449,
        lng: 136.1889,
        description: null,
        kind: 'official',
        order: 1,
        created_at: '2026-06-01T00:00:00Z',
      },
      posts: [],
    })
    renderAtSpot('spot-1')
    const link = screen.getByRole('link', { name: '地図アプリで開く' })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=35.9449,136.1889',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows an error message when loading fails', () => {
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({ status: 'error', message: 'not found' })
    renderAtSpot('spot-1')
    expect(screen.getByText('定点を取得できませんでした: not found')).toBeInTheDocument()
  })

  it('shows a friendly message instead of crashing when env vars are missing', () => {
    vi.mocked(getSupabaseClientSafe).mockReturnValue({
      client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
      envError: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    })
    renderAtSpot('spot-1')
    expect(
      screen.getByText('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません'),
    ).toBeInTheDocument()
  })

  it('opens the lightbox when the hero photo is clicked and closes it on Escape', async () => {
    const user = userEvent.setup()
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
      status: 'loaded',
      spot: {
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
      posts: [
        {
          id: 'post-1',
          spot_id: 'spot-1',
          image_path: 'spot-1/a.jpg',
          comment: 'ヒーロー写真',
          tags: [],
          avg_color: '#fff',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'device-1',
        },
      ],
    })
    renderAtSpot('spot-1')
    await user.click(screen.getByRole('button', { name: '写真を拡大表示' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the lightbox at the clicked thumbnail index', async () => {
    const user = userEvent.setup()
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
      status: 'loaded',
      spot: {
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
      posts: [
        {
          id: 'post-1',
          spot_id: 'spot-1',
          image_path: 'spot-1/a.jpg',
          comment: '1枚目',
          tags: [],
          avg_color: '#fff',
          created_at: '2026-08-02T00:00:00Z',
          device_id: 'device-1',
        },
        {
          id: 'post-2',
          spot_id: 'spot-1',
          image_path: 'spot-1/b.jpg',
          comment: '2枚目',
          tags: [],
          avg_color: '#fff',
          created_at: '2026-08-01T00:00:00Z',
          device_id: 'device-1',
        },
      ],
    })
    renderAtSpot('spot-1')
    await user.click(screen.getByRole('button', { name: '2枚目の写真を拡大表示' }))
    expect(within(screen.getByRole('dialog')).getByText('2枚目')).toBeInTheDocument()
  })
})
