import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSpots } from './useSpots'
import type { Spot } from './types'

function createMockClient(result: { data: Spot[] | null; error: { message: string } | null }): SupabaseClient {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  }
  return { from: vi.fn(() => builder) } as unknown as SupabaseClient
}

const sampleSpots: Spot[] = [
  {
    id: 'spot-1',
    name: '大噴水前',
    theme: null,
    lat: 35.95,
    lng: 136.18,
    description: null,
    kind: 'official',
    order: 1,
    created_at: '2026-06-01T00:00:00Z',
  },
]

describe('useSpots', () => {
  it('starts in loading state', () => {
    const client = createMockClient({ data: [], error: null })
    const { result } = renderHook(() => useSpots(client))
    expect(result.current.status).toBe('loading')
  })

  it('loads spots on success', async () => {
    const client = createMockClient({ data: sampleSpots, error: null })
    const { result } = renderHook(() => useSpots(client))
    await waitFor(() => expect(result.current.status).toBe('loaded'))
    expect(result.current).toEqual({ status: 'loaded', spots: sampleSpots })
  })

  it('returns an error state when the query fails', async () => {
    const client = createMockClient({ data: null, error: { message: 'network error' } })
    const { result } = renderHook(() => useSpots(client))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'network error' })
  })

  it('returns an error state when the request throws', async () => {
    const client = {
      from: vi.fn(() => {
        throw new Error('Failed to fetch')
      }),
    } as unknown as SupabaseClient
    const { result } = renderHook(() => useSpots(client))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'Failed to fetch' })
  })

  it('falls back to a Japanese message when a non-Error is thrown', async () => {
    const client = {
      from: vi.fn(() => {
        throw 'boom'
      }),
    } as unknown as SupabaseClient
    const { result } = renderHook(() => useSpots(client))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: '定点の取得に失敗しました' })
  })
})
