import { useEffect, useState } from 'react'
import type { VisitorDay } from './parkTimeline'

export type VisitorsDailyState =
  | { status: 'loading' }
  | { status: 'loaded'; data: VisitorDay[] }
  | { status: 'error'; message: string }

export function useVisitorsDaily(): VisitorsDailyState {
  const [state, setState] = useState<VisitorsDailyState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/data/visitors_daily.json')
        if (!response.ok) {
          throw new Error(`人流データの取得に失敗しました (status: ${response.status})`)
        }
        const data = (await response.json()) as VisitorDay[]
        if (cancelled) return
        setState({ status: 'loaded', data })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '人流データの取得に失敗しました'
        setState({ status: 'error', message })
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
