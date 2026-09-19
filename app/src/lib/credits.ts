import { useEffect, useState } from 'react'

export type Credit = {
  title: string
  package_name: string
  source_url: string
  format: string
  license: string
  license_title: string
  license_url: string
  organization: string
  used: boolean
  known_issue?: string
  image_count?: number
}

export type CreditsState =
  | { status: 'loading' }
  | { status: 'loaded'; credits: Credit[] }
  | { status: 'error'; message: string }

export function useCredits(): CreditsState {
  const [state, setState] = useState<CreditsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/data/credits.json')
        if (!response.ok) {
          throw new Error(`出典情報の取得に失敗しました (status: ${response.status})`)
        }
        const data = (await response.json()) as Credit[]
        if (cancelled) return
        setState({ status: 'loaded', credits: data.filter((credit) => credit.used) })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '出典情報の取得に失敗しました'
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
