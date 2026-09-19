import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { LastViewedSpotProvider } from './lib/LastViewedSpotContext'
import * as useSpotsModule from './lib/useSpots'
import * as useSpotModule from './lib/useSpot'
import * as useAllPostsModule from './lib/useAllPosts'
import * as useVisitorsDailyModule from './lib/useVisitorsDaily'
import * as authModule from './lib/AuthContext'
import { getSupabaseClientSafe } from './lib/supabaseClient'

vi.mock('./lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

beforeEach(() => {
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
})

describe('App', () => {
  it('renders the home page at /', () => {
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loading' })
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loading' })
    vi.spyOn(useVisitorsDailyModule, 'useVisitorsDaily').mockReturnValue({ status: 'loading' })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'ホーム' })).toBeInTheDocument()
  })

  it('renders the spots list page at /spots', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loading' })
    render(
      <MemoryRouter initialEntries={['/spots']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '定点一覧' })).toBeInTheDocument()
  })

  it('renders the spot detail page with the route param', () => {
    vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({ status: 'loading' })
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    render(
      <LastViewedSpotProvider>
        <MemoryRouter initialEntries={['/spots/abc-123']}>
          <App />
        </MemoryRouter>
      </LastViewedSpotProvider>,
    )
    expect(screen.getByRole('heading', { name: '定点詳細' })).toBeInTheDocument()
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
  })

  it('renders the new spot page at /spots/new', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    render(
      <MemoryRouter initialEntries={['/spots/new']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '新しい定点をつくる' })).toBeInTheDocument()
  })

  it('always renders the bottom navigation', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loading' })
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    render(
      <LastViewedSpotProvider>
        <MemoryRouter initialEntries={['/post']}>
          <App />
        </MemoryRouter>
      </LastViewedSpotProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'メインナビゲーション' })).toBeInTheDocument()
  })
})
