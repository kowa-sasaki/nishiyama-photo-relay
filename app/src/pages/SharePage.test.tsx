import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharePage } from './SharePage'
import * as creditsModule from '../lib/credits'
import type { Credit } from '../lib/credits'

afterEach(() => {
  vi.restoreAllMocks()
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

describe('SharePage', () => {
  it('shows the app concept heading and a share button', () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'loading' })
    render(<SharePage />)
    expect(screen.getByRole('heading', { name: '西山公園フォトリレー' })).toBeInTheDocument()
    expect(screen.getByText('西山公園の"今日"を、みんなで1年分の絵にする。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '共有する' })).toBeInTheDocument()
  })

  it('lists data source credits once loaded', () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'loaded', credits: [sampleCredit] })
    render(<SharePage />)
    expect(screen.getByText('【日別】令和７年度 西山公園東側来訪者数（人流データ）')).toBeInTheDocument()
    expect(screen.getByText('福井県鯖江市 / クリエイティブ・コモンズ 表示 2.1')).toBeInTheDocument()
  })

  it('shows a fallback message when loaded credits are empty', () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'loaded', credits: [] })
    render(<SharePage />)
    expect(screen.getByText('出典情報がありません')).toBeInTheDocument()
  })

  it('shows an error message when credits fail to load', () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'error', message: 'network error' })
    render(<SharePage />)
    expect(screen.getByText('出典情報を取得できませんでした: network error')).toBeInTheDocument()
  })

  it('explains how to use the app in four steps, ending with how to read the home screen', () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'loading' })
    render(<SharePage />)
    expect(screen.getByRole('heading', { name: '使い方' })).toBeInTheDocument()
    const steps = within(screen.getByRole('list', { name: '使い方' })).getAllByRole('listitem')
    expect(steps).toHaveLength(4)
    expect(steps[0]).toHaveTextContent('定点')
    expect(steps[1]).toHaveTextContent('投稿')
    expect(steps[2]).toHaveTextContent('みんなの定点')
    expect(steps[3]).toHaveTextContent('ホーム')
    expect(steps[3]).toHaveTextContent('色のリボン')
  })

  it('shares the app itself with the hashtag', async () => {
    vi.spyOn(creditsModule, 'useCredits').mockReturnValue({ status: 'loading' })
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    const user = userEvent.setup()
    render(<SharePage />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(share).toHaveBeenCalledWith({
      text: '西山公園の"今日"を、みんなで記録するアプリ #西山公園定点観測',
      url: window.location.origin,
    })
  })
})
