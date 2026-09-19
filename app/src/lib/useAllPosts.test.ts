import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useAllPosts } from './useAllPosts'
import type { PostWithSpot } from './types'

function createMockClient(result: {
  data: PostWithSpot[] | null
  error: { message: string } | null
}): SupabaseClient {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  }
  return { from: vi.fn(() => builder) } as unknown as SupabaseClient
}

const samplePosts: PostWithSpot[] = [
  {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: null,
    tags: [],
    avg_color: '#4c7a32',
    created_at: '2026-08-01T00:00:00Z',
    device_id: 'device-1',
    spots: { name: '大噴水前' },
  },
]

describe('useAllPosts', () => {
  it('starts in loading state', () => {
    const client = createMockClient({ data: [], error: null })
    const { result } = renderHook(() => useAllPosts(client))
    expect(result.current.status).toBe('loading')
  })

  it('loads posts on success', async () => {
    const client = createMockClient({ data: samplePosts, error: null })
    const { result } = renderHook(() => useAllPosts(client))
    await waitFor(() => expect(result.current.status).toBe('loaded'))
    expect(result.current).toEqual({ status: 'loaded', posts: samplePosts })
  })

  it('returns an error state when the query fails', async () => {
    const client = createMockClient({ data: null, error: { message: 'network error' } })
    const { result } = renderHook(() => useAllPosts(client))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'network error' })
  })
})
