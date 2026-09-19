import { describe, it, expect } from 'vitest'
import { buildMapUrl } from './mapLink'

describe('buildMapUrl', () => {
  it('builds a Google Maps search URL with latitude before longitude', () => {
    expect(buildMapUrl(35.9449, 136.1889)).toBe(
      'https://www.google.com/maps/search/?api=1&query=35.9449,136.1889',
    )
  })

  it('keeps negative values and long decimals as they are', () => {
    expect(buildMapUrl(-33.86882, 151.209296)).toBe(
      'https://www.google.com/maps/search/?api=1&query=-33.86882,151.209296',
    )
  })
})
