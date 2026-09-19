import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useVisitorsDaily } from './useVisitorsDaily'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useVisitorsDaily', () => {
  it('starts in loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { result } = renderHook(() => useVisitorsDaily())
    expect(result.current.status).toBe('loading')
  })

  it('loads visitor data on success', async () => {
    const data = [{ date: '2025-04-01', visitors: 450 }]
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }) as unknown as Promise<Response>),
    )
    const { result } = renderHook(() => useVisitorsDaily())
    await waitFor(() => expect(result.current.status).toBe('loaded'))
    expect(result.current).toEqual({ status: 'loaded', data })
  })

  it('returns an error state when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404 }) as unknown as Promise<Response>),
    )
    const { result } = renderHook(() => useVisitorsDaily())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.status).toBe('error')
  })
})
