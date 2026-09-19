import { createContext, useContext, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabaseClient'
import { useAnonAuth, type AnonAuthState } from './useAnonAuth'

const AuthContext = createContext<AnonAuthState | undefined>(undefined)

const MISSING_ENV_CLIENT = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    signInAnonymously: async () => ({
      data: { user: null },
      error: { message: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません' },
    }),
  },
} as unknown as SupabaseClient

export function resolveAuthClient(
  client: SupabaseClient | undefined,
  resolve: () => SupabaseClient,
): SupabaseClient {
  if (client) return client
  try {
    return resolve()
  } catch {
    return MISSING_ENV_CLIENT
  }
}

export function AuthProvider({
  children,
  client,
}: {
  children: ReactNode
  client?: SupabaseClient
}) {
  const resolvedClient = resolveAuthClient(client, getSupabaseClient)
  const state = useAnonAuth(resolvedClient)
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AnonAuthState {
  const state = useContext(AuthContext)
  if (!state) {
    throw new Error('useAuth は AuthProvider の内側でのみ使用できる')
  }
  return state
}
