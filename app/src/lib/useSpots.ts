import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Spot } from './types'

export type SpotsState =
  | { status: 'loading' }
  | { status: 'loaded'; spots: Spot[] }
  | { status: 'error'; message: string }

export function useSpots(client: SupabaseClient): SpotsState {
  const [state, setState] = useState<SpotsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await client
        .from('spots')
        .select('*')
        .eq('is_hidden', false)
        .order('kind', { ascending: true })
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error) {
        setState({ status: 'error', message: error.message })
        return
      }
      setState({ status: 'loaded', spots: (data ?? []) as Spot[] })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [client])

  return state
}
