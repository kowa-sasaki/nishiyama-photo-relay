import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCredits } from './credits'
import type { Credit } from './credits'

afterEach(() => {
  vi.unstubAllGlobals()
})

const sampleCredit: Credit = {
  title: '【日別】令和７年度　西山公園東側来訪者数（人流データ）',
  package_name: '18207_nishiyamakoenhigashigawanraihosyasu',
  source_url: 'https://ckan.odp.jig.jp/dataset/5bb6a5ed-2529-4fb6-88e9-ff78c1badcd1',
  format: 'CSV',
  license: 'CC-BY-2.1',
  license_title: 'クリエイティブ・コモンズ 表示 2.1',
  license_url: 'https://creativecommons.org/licenses/by/2.1/jp/',
  organization: '福井県鯖江市',
  used: true,
}

describe('useCredits', () => {
  it('starts in loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { result } = renderHook(() => useCredits())
    expect(result.current.status).toBe('loading')
  })

  it('loads and filters to used=true entries', async () => {
    const unusedCredit: Credit = { ...sampleCredit, package_name: 'unused', used: false }
    const data = [sampleCredit, unusedCredit]
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }) as unknown as Promise<Response>),
    )
    const { result } = renderHook(() => useCredits())
    await waitFor(() => expect(result.current.status).toBe('loaded'))
    expect(result.current).toEqual({ status: 'loaded', credits: [sampleCredit] })
  })

  it('returns an error state when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404 }) as unknown as Promise<Response>),
    )
    const { result } = renderHook(() => useCredits())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.status).toBe('error')
  })
})
