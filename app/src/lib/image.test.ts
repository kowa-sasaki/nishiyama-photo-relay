import { describe, it, expect } from 'vitest'
import { computeResizedDimensions, rgbaToHex } from './image'

describe('computeResizedDimensions', () => {
  it('keeps the original size when within maxSide', () => {
    expect(computeResizedDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('scales down the longer side to maxSide, preserving aspect ratio', () => {
    expect(computeResizedDimensions(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
  })

  it('scales down a portrait image using height as the longer side', () => {
    expect(computeResizedDimensions(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
  })
})

describe('rgbaToHex', () => {
  it('formats RGB values as a lowercase hex string', () => {
    expect(rgbaToHex(255, 0, 0)).toBe('#ff0000')
    expect(rgbaToHex(0, 255, 0)).toBe('#00ff00')
    expect(rgbaToHex(18, 52, 86)).toBe('#123456')
  })
})
