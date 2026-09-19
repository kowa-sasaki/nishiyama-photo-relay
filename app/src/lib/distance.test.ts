import { describe, it, expect } from 'vitest'
import { distanceMeters, sortSpotsByDistance, getDistancesBySpot, formatDistanceLabel } from './distance'
import type { Spot } from './types'

function makeSpot(overrides: Partial<Spot>): Spot {
  return {
    id: 'spot-1',
    name: '定点',
    theme: null,
    lat: 35.9,
    lng: 136.2,
    description: null,
    kind: 'user',
    order: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('distanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(distanceMeters({ lat: 35.9, lng: 136.2 }, { lat: 35.9, lng: 136.2 })).toBe(0)
  })

  it('returns the great-circle distance between two points', () => {
    // 緯度0.001度差（同経度）はHaversine上、地球半径6371000mに対して
    // R * (0.001度をラジアン変換した値) = 6371000 * 0.001 * (Math.PI/180) ≈ 111.19m
    const distance = distanceMeters({ lat: 35.9, lng: 136.2 }, { lat: 35.901, lng: 136.2 })
    expect(distance).toBeCloseTo(111.19, 1)
  })
})

describe('sortSpotsByDistance', () => {
  const origin = { lat: 35.9, lng: 136.2 }

  it('sorts spots by ascending distance from the origin', () => {
    const near = makeSpot({ id: 'near', lat: 35.901, lng: 136.2 })
    const far = makeSpot({ id: 'far', lat: 35.95, lng: 136.2 })
    const spots = [far, near]
    const result = sortSpotsByDistance(spots, origin)
    expect(result.map((s) => s.id)).toEqual(['near', 'far'])
  })

  it('does not mutate the input array', () => {
    const spots = [makeSpot({ id: 'a', lat: 35.95, lng: 136.2 }), makeSpot({ id: 'b', lat: 35.901, lng: 136.2 })]
    const original = [...spots]
    sortSpotsByDistance(spots, origin)
    expect(spots).toEqual(original)
  })
})

describe('getDistancesBySpot', () => {
  it('returns each spot id mapped to its distance from the origin', () => {
    const origin = { lat: 35.9, lng: 136.2 }
    const spots = [makeSpot({ id: 'spot-a', lat: 35.901, lng: 136.2 })]
    const result = getDistancesBySpot(spots, origin)
    expect(result.get('spot-a')).toBeCloseTo(111.19, 1)
  })

  it('returns an empty map for an empty list', () => {
    expect(getDistancesBySpot([], { lat: 0, lng: 0 })).toEqual(new Map())
  })
})

describe('formatDistanceLabel', () => {
  it('formats sub-kilometer distances in meters, rounded', () => {
    expect(formatDistanceLabel(230.4)).toBe('230m')
    expect(formatDistanceLabel(0)).toBe('0m')
  })

  it('formats kilometer-plus distances with one decimal place', () => {
    expect(formatDistanceLabel(1500)).toBe('1.5km')
    expect(formatDistanceLabel(1000)).toBe('1.0km')
  })

  it('rounds a value just under 1000m up into the km format instead of showing 1000m', () => {
    expect(formatDistanceLabel(999.6)).toBe('1.0km')
  })

  it('keeps a value just under the rounding boundary in the meter format', () => {
    expect(formatDistanceLabel(999.4)).toBe('999m')
  })
})
