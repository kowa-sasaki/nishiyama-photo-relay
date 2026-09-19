import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGeolocation } from './useGeolocation'

describe('useGeolocation', () => {
  let originalGeolocation: Geolocation | undefined

  beforeEach(() => {
    originalGeolocation = navigator.geolocation
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    })
  })

  it('starts in the loading state', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.state).toEqual({ status: 'loading' })
  })

  it('resolves to success with lat/lng on a successful lookup', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 35.9, longitude: 136.2 },
      } as GeolocationPosition)
    })
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', lat: 35.9, lng: 136.2 }),
    )
  })

  it('resolves to an error state when the browser reports failure', async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ message: '位置情報の利用が許可されていません' } as GeolocationPositionError)
      },
    )
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'error',
        message: '位置情報の利用が許可されていません',
      }),
    )
  })

  it('sets an error state immediately when geolocation is unavailable in this environment', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.state).toEqual({
      status: 'error',
      message: '位置情報がこの環境では利用できません',
    })
  })

  it('passes a timeout and maximumAge so the lookup cannot hang forever', () => {
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
    renderHook(() => useGeolocation())
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ timeout: 15000, maximumAge: 60000 }),
    )
  })

  it('re-runs the lookup when retry() is called', async () => {
    const getCurrentPosition = vi
      .fn()
      .mockImplementationOnce((_success: PositionCallback, error: PositionErrorCallback) => {
        error({ message: 'timeout' } as GeolocationPositionError)
      })
      .mockImplementationOnce((success: PositionCallback) => {
        success({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition)
      })
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'timeout' }))

    act(() => {
      result.current.retry()
    })

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', lat: 1, lng: 2 }),
    )
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('does not request location while disabled', () => {
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    const { result } = renderHook(() => useGeolocation(false))
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(result.current.state).toEqual({ status: 'loading' })
  })

  it('requests location once enabled becomes true', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 35.9, longitude: 136.2 } } as GeolocationPosition)
    })
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    const { result, rerender } = renderHook(({ enabled }) => useGeolocation(enabled), {
      initialProps: { enabled: false },
    })
    expect(getCurrentPosition).not.toHaveBeenCalled()
    rerender({ enabled: true })
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', lat: 35.9, lng: 136.2 }),
    )
  })

  it('requests location immediately when called with no argument (default enabled)', () => {
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    renderHook(() => useGeolocation())
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })
})
