import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ParkMapIllustration,
  FOUNTAIN_ANCHOR,
  DOUBUTSUEN_ANCHOR,
  TSUTSUJIEN_ANCHOR,
  JODAN_NO_NIWA_ANCHOR,
  AI_NO_KANE_ANCHOR,
} from './ParkMapIllustration'
import { ILLUSTRATION_VIEWBOX, projectToIllustration } from '../lib/illustrationProjection'

describe('ParkMapIllustration', () => {
  it('renders an SVG with the illustration viewBox', () => {
    render(<ParkMapIllustration />)
    const svg = screen.getByRole('img', { name: '西山公園マップ' })
    expect(svg).toHaveAttribute('viewBox', ILLUSTRATION_VIEWBOX)
  })

  it.each([
    ['大噴水前', FOUNTAIN_ANCHOR, 35.95, 136.182041],
    ['西山動物園前', DOUBUTSUEN_ANCHOR, 35.948694, 136.180694],
    ['つつじ園（結びの広場）', TSUTSUJIEN_ANCHOR, 35.9503, 136.1815],
    ['上段の庭（もみじ）', JODAN_NO_NIWA_ANCHOR, 35.95111, 136.184471],
    ['愛の鐘・展望台', AI_NO_KANE_ANCHOR, 35.952414, 136.181033],
  ])('keeps the %s anchor near its projected position', (_name, anchor, lat, lng) => {
    const projected = projectToIllustration(lat, lng)
    const distance = Math.hypot(anchor.x - projected.x, anchor.y - projected.y)
    expect(distance).toBeLessThan(15)
  })
})
