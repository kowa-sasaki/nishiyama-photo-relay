import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSupabaseClient } from './supabaseClient'

describe('createSupabaseClient', () => {
  it('creates a client when url and anonKey are provided', () => {
    const client = createSupabaseClient('https://example.supabase.co', 'anon-key')
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })

  it('throws when url is missing', () => {
    expect(() => createSupabaseClient(undefined, 'anon-key')).toThrow(
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    )
  })

  it('throws when anonKey is missing', () => {
    expect(() => createSupabaseClient('https://example.supabase.co', undefined)).toThrow(
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    )
  })
})

describe('getSupabaseClientSafe', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns envError: null and a working client when env vars are set', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    const { getSupabaseClientSafe } = await import('./supabaseClient')

    const { client, envError } = getSupabaseClientSafe()

    expect(envError).toBeNull()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })

  it('returns a friendly envError and a non-throwing stub client when env vars are missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const { getSupabaseClientSafe } = await import('./supabaseClient')

    const { client, envError } = getSupabaseClientSafe()

    expect(envError).toBe('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません')

    // Query-builder chains resolve to a friendly error instead of throwing.
    const spotsResult = await client
      .from('spots')
      .select('*')
      .eq('is_hidden', false)
      .order('kind', { ascending: true })
    expect(spotsResult).toEqual({ data: null, error: { message: envError } })

    // Storage chains behave the same way.
    const uploadResult = await client.storage.from('posts').upload('a.jpg', new Blob())
    expect(uploadResult).toEqual({ data: null, error: { message: envError } })
  })

  it('returns the same memoized stub client object across repeated calls when env vars are missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const { getSupabaseClientSafe } = await import('./supabaseClient')

    const first = getSupabaseClientSafe()
    const second = getSupabaseClientSafe()

    // Regression guard: an unmemoized stub client is a fresh object identity
    // on every call, which (via useEffect deps in useSpots/useSpot) causes an
    // infinite render loop in pages that call getSupabaseClientSafe() on
    // every render. The client reference must be stable across calls.
    expect(second.client).toBe(first.client)
  })
})
