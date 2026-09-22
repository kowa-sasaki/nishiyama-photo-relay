import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AnonAuthState =
  | { status: 'loading' }
  | { status: 'signed-in'; userId: string }
  | { status: 'error'; message: string }

export function useAnonAuth(client: SupabaseClient): AnonAuthState {
  const [state, setState] = useState<AnonAuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function signIn() {
      try {
        const { data: sessionData } = await client.auth.getSession()
        if (cancelled) return
        if (sessionData.session) {
          setState({ status: 'signed-in', userId: sessionData.session.user.id })
          return
        }

        const { data, error } = await client.auth.signInAnonymously()
        if (cancelled) return
        if (error || !data.user) {
          setState({ status: 'error', message: error?.message ?? '匿名認証に失敗しました' })
          return
        }
        setState({ status: 'signed-in', userId: data.user.id })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '匿名認証に失敗しました'
        setState({ status: 'error', message })
      }
    }

    void signIn()

    return () => {
      cancelled = true
    }
  }, [client])

  return state
}
