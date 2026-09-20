import { useGeolocation } from './useGeolocation'
import { isInsidePark } from './parkBounds'

export type ParkAccessState =
  | { status: 'checking' }
  | { status: 'inside'; lat: number; lng: number }
  | { status: 'outside'; lat: number; lng: number }
  | { status: 'unavailable'; message: string }

export function useParkAccess(): { access: ParkAccessState; retry: () => void } {
  const { state, retry } = useGeolocation()
  if (state.status === 'loading') return { access: { status: 'checking' }, retry }
  if (state.status === 'error') {
    return { access: { status: 'unavailable', message: state.message }, retry }
  }
  const { lat, lng } = state
  return { access: { status: isInsidePark(lat, lng) ? 'inside' : 'outside', lat, lng }, retry }
}
