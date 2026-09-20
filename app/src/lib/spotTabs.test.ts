import { describe, it, expect } from 'vitest'
import { DEFAULT_SPOT_TAB, SPOT_TABS, parseSpotTab } from './spotTabs'

describe('parseSpotTab', () => {
  it('returns the tab for each valid value', () => {
    expect(parseSpotTab('official')).toBe('official')
    expect(parseSpotTab('user')).toBe('user')
    expect(parseSpotTab('collab')).toBe('collab')
  })

  it('falls back to official for null, empty, and unknown values', () => {
    expect(parseSpotTab(null)).toBe('official')
    expect(parseSpotTab('')).toBe('official')
    expect(parseSpotTab('nope')).toBe('official')
  })
})

describe('SPOT_TABS', () => {
  it('lists the tabs in display order with the agreed labels', () => {
    expect(SPOT_TABS.map((tab) => [tab.kind, tab.label])).toEqual([
      ['official', '公式'],
      ['user', 'ユーザー登録'],
      ['collab', 'コラボ'],
    ])
  })

  it('uses the coming-soon message for collab and the generic one for the others', () => {
    const message = (kind: string) => SPOT_TABS.find((tab) => tab.kind === kind)?.emptyMessage
    expect(message('collab')).toBe('イベント連携の定点がここに並びます（準備中）')
    expect(message('official')).toBe('このタブの定点はまだありません')
    expect(message('user')).toBe('このタブの定点はまだありません')
  })

  it('defaults to official', () => {
    expect(DEFAULT_SPOT_TAB).toBe('official')
  })
})
