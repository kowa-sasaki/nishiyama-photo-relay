import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import * as geolocationModule from './useGeolocation'
import { useParkAccess } from './useParkAccess'

function mockGeolocation(state: geolocationModule.GeolocationState, retry = vi.fn()) {
  vi.spyOn(geolocationModule, 'useGeolocation').mockReturnValue({ state, retry })
  return retry
}

describe('useParkAccess', () => {
  it('is checking while the location lookup is in flight', () => {
    mockGeolocation({ status: 'loading' })
    const { result } = renderHook(() => useParkAccess())
    expect(result.current.access).toEqual({ status: 'checking' })
  })

  it('is inside with coordinates when the location is within the park', () => {
    mockGeolocation({ status: 'success', lat: 35.9503, lng: 136.1815 })
    const { result } = renderHook(() => useParkAccess())
    expect(result.current.access).toEqual({ status: 'inside', lat: 35.9503, lng: 136.1815 })
  })

  it('is outside with coordinates when the location is beyond the park bounds', () => {
    mockGeolocation({ status: 'success', lat: 35.9, lng: 136.2 })
    const { result } = renderHook(() => useParkAccess())
    expect(result.current.access).toEqual({ status: 'outside', lat: 35.9, lng: 136.2 })
  })

  it('is unavailable with the message when the location cannot be read', () => {
    mockGeolocation({ status: 'error', message: '位置情報の利用が許可されていません' })
    const { result } = renderHook(() => useParkAccess())
    expect(result.current.access).toEqual({
      status: 'unavailable',
      message: '位置情報の利用が許可されていません',
    })
  })

  it('passes retry through from useGeolocation', () => {
    const retry = mockGeolocation({ status: 'error', message: 'timeout' })
    const { result } = renderHook(() => useParkAccess())
    result.current.retry()
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
