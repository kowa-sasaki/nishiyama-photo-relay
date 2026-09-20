import type { Spot } from './types'

export type SpotTab = Spot['kind']

export const SPOT_TABS: ReadonlyArray<{ kind: SpotTab; label: string; emptyMessage: string }> = [
  { kind: 'official', label: '公式', emptyMessage: 'このタブの定点はまだありません' },
  { kind: 'user', label: 'ユーザー登録', emptyMessage: 'このタブの定点はまだありません' },
  { kind: 'collab', label: 'コラボ', emptyMessage: 'イベント連携の定点がここに並びます（準備中）' },
]

export const DEFAULT_SPOT_TAB: SpotTab = 'official'

export function parseSpotTab(value: string | null): SpotTab {
  const found = SPOT_TABS.find((tab) => tab.kind === value)
  return found ? found.kind : DEFAULT_SPOT_TAB
}
