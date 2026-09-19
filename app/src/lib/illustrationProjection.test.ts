import { describe, it, expect } from 'vitest'
import { ILLUSTRATION_VIEWBOX, projectToIllustration } from './illustrationProjection'

const OFFICIAL_SPOTS = {
  daifunsui: { lat: 35.95, lng: 136.182041 },
  tsutsujien: { lat: 35.9503, lng: 136.1815 },
  jodanNoNiwa: { lat: 35.95111, lng: 136.184471 },
  aiNoKane: { lat: 35.952414, lng: 136.181033 },
  doubutsuen: { lat: 35.948694, lng: 136.180694 },
}

function parseViewBox(viewBox: string) {
  const [minX, minY, width, height] = viewBox.split(' ').map(Number)
  return { minX, minY, maxX: minX + width, maxY: minY + height }
}

describe('projectToIllustration', () => {
  it('projects all 5 official spots within the illustration viewBox', () => {
    const bounds = parseViewBox(ILLUSTRATION_VIEWBOX)
    for (const { lat, lng } of Object.values(OFFICIAL_SPOTS)) {
      const { x, y } = projectToIllustration(lat, lng)
      expect(x).toBeGreaterThanOrEqual(bounds.minX)
      expect(x).toBeLessThanOrEqual(bounds.maxX)
      expect(y).toBeGreaterThanOrEqual(bounds.minY)
      expect(y).toBeLessThanOrEqual(bounds.maxY)
    }
  })

  it('places 西山動物園前 further south (larger svgY) than 愛の鐘・展望台', () => {
    const doubutsuen = projectToIllustration(OFFICIAL_SPOTS.doubutsuen.lat, OFFICIAL_SPOTS.doubutsuen.lng)
    const aiNoKane = projectToIllustration(OFFICIAL_SPOTS.aiNoKane.lat, OFFICIAL_SPOTS.aiNoKane.lng)
    expect(doubutsuen.y).toBeGreaterThan(aiNoKane.y)
  })

  it('places 上段の庭 further east (larger svgX) than the other 4 official spots', () => {
    const jodanNoNiwa = projectToIllustration(OFFICIAL_SPOTS.jodanNoNiwa.lat, OFFICIAL_SPOTS.jodanNoNiwa.lng)
    const others = [
      OFFICIAL_SPOTS.daifunsui,
      OFFICIAL_SPOTS.tsutsujien,
      OFFICIAL_SPOTS.aiNoKane,
      OFFICIAL_SPOTS.doubutsuen,
    ]
    for (const spot of others) {
      const { x } = projectToIllustration(spot.lat, spot.lng)
      expect(jodanNoNiwa.x).toBeGreaterThan(x)
    }
  })

  it('places 愛の鐘・展望台 further north (smaller svgY) than the other 4 official spots', () => {
    const aiNoKane = projectToIllustration(OFFICIAL_SPOTS.aiNoKane.lat, OFFICIAL_SPOTS.aiNoKane.lng)
    const others = [
      OFFICIAL_SPOTS.daifunsui,
      OFFICIAL_SPOTS.tsutsujien,
      OFFICIAL_SPOTS.jodanNoNiwa,
      OFFICIAL_SPOTS.doubutsuen,
    ]
    for (const spot of others) {
      const { y } = projectToIllustration(spot.lat, spot.lng)
      expect(aiNoKane.y).toBeLessThan(y)
    }
  })

  it('is a pure function: the same input always yields the same output', () => {
    const first = projectToIllustration(35.95, 136.182041)
    const second = projectToIllustration(35.95, 136.182041)
    expect(first).toEqual(second)
  })
})
