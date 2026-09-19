import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useAnonAuth } from './useAnonAuth'

function createMockClient(overrides: {
  getSession?: ReturnType<typeof vi.fn>
  signInAnonymously?: ReturnType<typeof vi.fn>
} = {}): SupabaseClient {
  return {
    auth: {
      getSession: overrides.getSession ?? vi.fn().mockResolvedValue({ data: { session: null } }),
      signInAnonymously:
        overrides.signInAnonymously ??
        vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
  } as unknown as SupabaseClient
}

describe('useAnonAuth', () => {
  it('starts in loading state', () => {
    const client = createMockClient()
    const { result } = renderHook(() => useAnonAuth(client))
    expect(result.current.status).toBe('loading')
  })

  it('signs in anonymously and returns the user id', async () => {
    const client = createMockClient()
    const { result } = renderHook(() => useAnonAuth(client))
    await waitFor(() => expect(result.current.status).toBe('signed-in'))
    expect(result.current).toEqual({ status: 'signed-in', userId: 'user-123' })
  })

  it('reuses an existing session without calling signInAnonymously', async () => {
    const signInAnonymously = vi.fn()
    const client = createMockClient({
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'existing-user' } } } }),
      signInAnonymously,
    })
    const { result } = renderHook(() => useAnonAuth(client))
    await waitFor(() => expect(result.current.status).toBe('signed-in'))
    expect(result.current).toEqual({ status: 'signed-in', userId: 'existing-user' })
    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('returns an error state when sign-in fails', async () => {
    const client = createMockClient({
      signInAnonymously: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'network error' } }),
    })
    const { result } = renderHook(() => useAnonAuth(client))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'network error' })
  })

  it('does not call signInAnonymously if unmounted before getSession resolves', async () => {
    let resolveGetSession!: (value: { data: { session: null } }) => void
    const getSession = vi.fn(
      () => new Promise<{ data: { session: null } }>((resolve) => {
        resolveGetSession = resolve
      }),
    )
    const signInAnonymously = vi.fn()
    const client = createMockClient({ getSession, signInAnonymously })

    const { unmount } = renderHook(() => useAnonAuth(client))
    unmount()
    resolveGetSession({ data: { session: null } })
    await Promise.resolve()

    expect(signInAnonymously).not.toHaveBeenCalled()
  })
})
