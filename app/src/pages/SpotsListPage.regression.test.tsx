import { Profiler } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Deliberately do NOT mock '../lib/supabaseClient' or '../lib/useSpots' here.
// This test exercises the real getSupabaseClientSafe() + useSpots() wiring
// end-to-end, the same way a re-reviewer would render the page for real, to
// empirically confirm the memoization fix prevents the infinite render loop
// that occurred when getSupabaseClientSafe() returned a fresh stub client
// object on every call (a new `client` identity re-triggers useSpots'
// useEffect every render, since `client` is in its dependency array).
describe('SpotsListPage (unmocked, missing env vars)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('settles instead of looping/hanging when env vars are missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { SpotsListPage } = await import('./SpotsListPage')

    // Use React's Profiler (not a wrapping component) to count commits of
    // SpotsListPage itself: the runaway state lives inside SpotsListPage
    // (via useSpots' internal useState), so only SpotsListPage re-renders on
    // each loop iteration — a wrapping component would not re-render and
    // would silently under-count.
    let commitCount = 0
    function onRender() {
      commitCount += 1
    }

    render(
      <MemoryRouter>
        <Profiler id="SpotsListPage" onRender={onRender}>
          <SpotsListPage />
        </Profiler>
      </MemoryRouter>,
    )

    // The env-error branch renders synchronously (no async fetch happens),
    // so the friendly message should already be visible.
    await waitFor(() => {
      expect(
        screen.getByText('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません'),
      ).toBeInTheDocument()
    })

    // Give any runaway effect loop a real chance to fire before asserting
    // the commit count settled at a small, bounded number.
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(commitCount).toBeLessThan(5)
  })
})
