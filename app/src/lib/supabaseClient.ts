import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseClient(
  url: string | undefined,
  anonKey: string | undefined,
): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません')
  }
  return createClient(url, anonKey)
}

let cachedClient: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createSupabaseClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }
  return cachedClient
}

export type SupabaseClientSafe = {
  client: SupabaseClient
  envError: string | null
}

/**
 * A stub client whose `.from(...)` / `.storage.from(...)` chains never throw
 * and never hang: any method call returns the same chainable stub, and
 * awaiting it at any point resolves to `{ data: null, error: { message } }`
 * (the shape callers already expect from a failed Supabase query). This
 * mirrors AuthContext's MISSING_ENV_CLIENT pattern, extended to cover the
 * query-builder and storage methods used outside the auth flow.
 */
function createEnvErrorClient(message: string): SupabaseClient {
  const errorResult = { data: null, error: { message } }
  const chain: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (onFulfilled?: (value: typeof errorResult) => unknown) => onFulfilled?.(errorResult)
        }
        return () => chain
      },
    },
  )
  return {
    from: () => chain,
    storage: { from: () => chain },
  } as unknown as SupabaseClient
}

let cachedEnvErrorClient: SupabaseClient | undefined

/**
 * Like getSupabaseClient, but never throws. Pages should use this instead of
 * calling getSupabaseClient() directly, so a missing env var results in a
 * friendly in-page message instead of an unhandled throw during render that
 * unmounts the whole app (there is no error boundary in App.tsx).
 */
export function getSupabaseClientSafe(): SupabaseClientSafe {
  try {
    return { client: getSupabaseClient(), envError: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : '環境変数が設定されていません'
    if (!cachedEnvErrorClient) {
      cachedEnvErrorClient = createEnvErrorClient(message)
    }
    return { client: cachedEnvErrorClient, envError: message }
  }
}
