import { useCallback, useEffect, useState } from 'react'

export type GeolocationState =
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; message: string }

export function useGeolocation(enabled: boolean = true): { state: GeolocationState; retry: () => void } {
  const [state, setState] = useState<GeolocationState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!enabled) {
      setState({ status: 'loading' })
      return
    }
    if (!navigator.geolocation) {
      setState({ status: 'error', message: '位置情報がこの環境では利用できません' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        setState({
          status: 'success',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        if (cancelled) return
        setState({
          status: 'error',
          message: error.message || '位置情報を取得できませんでした',
        })
      },
      { timeout: 15000, maximumAge: 60000 },
    )
    return () => {
      cancelled = true
    }
  }, [attempt, enabled])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { state, retry }
}
