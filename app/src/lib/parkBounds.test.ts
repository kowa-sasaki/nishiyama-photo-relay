import { describe, it, expect } from 'vitest'
import { PARK_BOUNDS, isInsidePark } from './parkBounds'

describe('isInsidePark', () => {
  it('accepts the five official spots', () => {
    const officialSpots: Array<[number, number]> = [
      [35.95, 136.182041], // 大噴水前
      [35.9503, 136.1815], // つつじ園（結びの広場）
      [35.95111, 136.184471], // 上段の庭（もみじ）
      [35.952414, 136.181033], // 愛の鐘・展望台
      [35.948694, 136.180694], // 西山動物園前（道の駅側）
    ]
    for (const [lat, lng] of officialSpots) {
      expect(isInsidePark(lat, lng)).toBe(true)
    }
  })

  it('accepts the two 祈りの道 user spots posted on 2026-09-20', () => {
    expect(isInsidePark(35.9520944, 136.1819283)).toBe(true)
    expect(isInsidePark(35.9512759, 136.1808915)).toBe(true)
  })

  it('treats the four corners as inside (inclusive)', () => {
    expect(isInsidePark(PARK_BOUNDS.north, PARK_BOUNDS.west)).toBe(true)
    expect(isInsidePark(PARK_BOUNDS.north, PARK_BOUNDS.east)).toBe(true)
    expect(isInsidePark(PARK_BOUNDS.south, PARK_BOUNDS.west)).toBe(true)
    expect(isInsidePark(PARK_BOUNDS.south, PARK_BOUNDS.east)).toBe(true)
  })

  it('rejects points just outside each edge', () => {
    const midLat = 35.9533
    const midLng = 136.1806
    expect(isInsidePark(PARK_BOUNDS.north + 0.0001, midLng)).toBe(false)
    expect(isInsidePark(PARK_BOUNDS.south - 0.0001, midLng)).toBe(false)
    expect(isInsidePark(midLat, PARK_BOUNDS.west - 0.0001)).toBe(false)
    expect(isInsidePark(midLat, PARK_BOUNDS.east + 0.0001)).toBe(false)
  })

  it('rejects a far-away location', () => {
    expect(isInsidePark(35.9, 136.2)).toBe(false)
  })
})

describe('PARK_BOUNDS', () => {
  it('matches the agreed north-west / south-east corners', () => {
    expect(PARK_BOUNDS).toEqual({
      north: 35.959389,
      south: 35.947222,
      west: 136.175674,
      east: 136.185499,
    })
  })
})
