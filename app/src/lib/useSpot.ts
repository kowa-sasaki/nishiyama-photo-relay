import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Spot, Post } from './types'

export type SpotDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; spot: Spot; posts: Post[] }
  | { status: 'error'; message: string }

export function useSpot(client: SupabaseClient, spotId: string | null): SpotDetailState {
  const [state, setState] = useState<SpotDetailState>({ status: 'loading' })

  useEffect(() => {
    if (!spotId) {
      setState({ status: 'loading' })
      return
    }
    let cancelled = false

    async function load(id: string) {
      try {
        const [spotResult, postsResult] = await Promise.all([
          client.from('spots').select('*').eq('id', id).single(),
          client.from('posts').select('*').eq('spot_id', id).eq('is_hidden', false).order('created_at', { ascending: false }),
        ])
        if (cancelled) return
        if (spotResult.error) {
          setState({ status: 'error', message: spotResult.error.message })
          return
        }
        if (postsResult.error) {
          setState({ status: 'error', message: postsResult.error.message })
          return
        }
        setState({
          status: 'loaded',
          spot: spotResult.data as Spot,
          posts: (postsResult.data ?? []) as Post[],
        })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '定点の取得に失敗しました'
        setState({ status: 'error', message })
      }
    }

    void load(spotId)

    return () => {
      cancelled = true
    }
  }, [client, spotId])

  return state
}
