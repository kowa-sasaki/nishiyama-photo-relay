import { describe, it, expect } from 'vitest'
import { randomId } from './id'

describe('randomId', () => {
  it('returns an RFC4122 v4-formatted UUID string', () => {
    const id = randomId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('returns a different value on each call', () => {
    expect(randomId()).not.toBe(randomId())
  })
})
