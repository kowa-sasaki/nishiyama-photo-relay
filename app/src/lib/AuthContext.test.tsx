import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AuthProvider, resolveAuthClient, useAuth } from './AuthContext'

function createMockClient(): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null }),
    },
  } as unknown as SupabaseClient
}

function StatusText() {
  const state = useAuth()
  return <p>status: {state.status}</p>
}

describe('useAuth', () => {
  it('throws when called outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth は AuthProvider の内側でのみ使用できる',
    )
  })
})

describe('AuthProvider', () => {
  it('provides loading then signed-in state to descendants', async () => {
    const client = createMockClient()
    render(
      <AuthProvider client={client}>
        <StatusText />
      </AuthProvider>,
    )
    expect(screen.getByText('status: loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('status: signed-in')).toBeInTheDocument())
  })

  it('lands in error state instead of crashing when the resolver throws', async () => {
    const brokenClient = resolveAuthClient(undefined, () => {
      throw new Error('no env')
    })
    render(
      <AuthProvider client={brokenClient}>
        <StatusText />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText('status: error')).toBeInTheDocument())
  })
})

describe('resolveAuthClient', () => {
  it('returns the given client when provided', () => {
    const client = createMockClient()
    expect(
      resolveAuthClient(client, () => {
        throw new Error('should not be called')
      }),
    ).toBe(client)
  })

  it('falls back to an error-producing client when resolve throws', async () => {
    const resolved = resolveAuthClient(undefined, () => {
      throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません')
    })
    const { data, error } = await resolved.auth.signInAnonymously()
    expect(data.user).toBeNull()
    expect(error?.message).toBe('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません')
  })
})
