import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostWithSpot } from './types'

export type AllPostsState =
  | { status: 'loading' }
  | { status: 'loaded'; posts: PostWithSpot[] }
  | { status: 'error'; message: string }

export function useAllPosts(client: SupabaseClient): AllPostsState {
  const [state, setState] = useState<AllPostsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data, error } = await client
          .from('posts')
          .select('*, spots!inner(name, is_hidden)')
          .eq('is_hidden', false)
          .eq('spots.is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(2000)

        if (cancelled) return
        if (error) {
          setState({ status: 'error', message: error.message })
          return
        }
        setState({ status: 'loaded', posts: (data ?? []) as PostWithSpot[] })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '投稿の取得に失敗しました'
        setState({ status: 'error', message })
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [client])

  return state
}
