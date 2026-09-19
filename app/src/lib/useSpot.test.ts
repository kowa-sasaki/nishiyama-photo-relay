import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSpot } from './useSpot'
import type { Spot, Post } from './types'

const sampleSpot: Spot = {
  id: 'spot-1',
  name: '大噴水前',
  theme: null,
  lat: 35.95,
  lng: 136.18,
  description: null,
  kind: 'official',
  order: 1,
  created_at: '2026-06-01T00:00:00Z',
}

const samplePosts: Post[] = [
  {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/abc.jpg',
    comment: 'きれいでした',
    tags: ['桜'],
    avg_color: '#f2a6c2',
    created_at: '2026-08-01T00:00:00Z',
    device_id: 'device-1',
  },
]

function createMockClient(options: {
  spotResult: { data: Spot | null; error: { message: string } | null }
  postsResult: { data: Post[] | null; error: { message: string } | null }
}): SupabaseClient {
  const spotBuilder = {
    select: vi.fn(() => spotBuilder),
    eq: vi.fn(() => spotBuilder),
    single: vi.fn(() => Promise.resolve(options.spotResult)),
  }
  const postsBuilder = {
    select: vi.fn(() => postsBuilder),
    eq: vi.fn(() => postsBuilder),
    order: vi.fn(() => postsBuilder),
    then: (resolve: (value: typeof options.postsResult) => void) => resolve(options.postsResult),
  }
  return {
    from: vi.fn((table: string) => (table === 'spots' ? spotBuilder : postsBuilder)),
  } as unknown as SupabaseClient
}

describe('useSpot', () => {
  it('stays in loading state while spotId is null', () => {
    const client = createMockClient({
      spotResult: { data: sampleSpot, error: null },
      postsResult: { data: samplePosts, error: null },
    })
    const { result } = renderHook(() => useSpot(client, null))
    expect(result.current.status).toBe('loading')
  })

  it('loads the spot and its posts', async () => {
    const client = createMockClient({
      spotResult: { data: sampleSpot, error: null },
      postsResult: { data: samplePosts, error: null },
    })
    const { result } = renderHook(() => useSpot(client, 'spot-1'))
    await waitFor(() => expect(result.current.status).toBe('loaded'))
    expect(result.current).toEqual({ status: 'loaded', spot: sampleSpot, posts: samplePosts })
  })

  it('returns an error state when the spot query fails', async () => {
    const client = createMockClient({
      spotResult: { data: null, error: { message: 'not found' } },
      postsResult: { data: [], error: null },
    })
    const { result } = renderHook(() => useSpot(client, 'spot-1'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'not found' })
  })
})
