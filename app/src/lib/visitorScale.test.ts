import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { computeVisitorCap, movingAverage } from './visitorScale'

// 計画では fileURLToPath(new URL('../../public/data/visitors_daily.json', import.meta.url))
// を使う想定だったが、このプロジェクトのvitest環境(environment: 'jsdom')で実行すると
// `TypeError: The URL must be of scheme file` が投げられ、テストファイルの読み込み自体が
// 失敗する（実測で確認済み）。そのため計画の形は採用できず、__dirnameを使う。
// package.jsonはtype: moduleだが、__dirnameはVitestのモジュールランナーが
// 注入するCJSシムとして存在するため、これを使う。
const datasetPath = resolve(__dirname, '../../public/data/visitors_daily.json')
const dataset = JSON.parse(readFileSync(datasetPath, 'utf-8')) as { visitors: number | null }[]
const shippedVisitors = dataset
  .map((d) => d.visitors)
  .filter((v): v is number => v !== null)

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index]
}

describe('computeVisitorCap', () => {
  it('リポジトリに同梱された令和7年度データで1400を返す', () => {
    // このアサーションは意図的なトリップワイヤー。ETLで年度データを
    // 差し替えてこの数値が変わった場合は、単に書き換えるのではなく
    // 上限を再導出し、描画帯の使い切り具合（デザイン）を見直すこと。
    expect(computeVisitorCap(shippedVisitors)).toBe(1400)
  })

  it('同梱データで上限を超える日は全体の2%以下に収まる', () => {
    const cap = computeVisitorCap(shippedVisitors)
    const clipped = shippedVisitors.filter((v) => v > cap).length
    expect(clipped / shippedVisitors.length).toBeLessThanOrEqual(0.02)
  })

  it('同梱データでp90が描画帯の30%以上を占める(平坦化の検知)', () => {
    // クリップ超過側の閾値だけでは「上限が緩すぎて季節リズムが
    // 帯の下位に潰れる」逆方向の劣化を検知できない。中央値の近くに
    // 分布が集まる年（例: 300〜500人でmedian 400 → cap 1800）では
    // 既存のテストは0%クリップで通ってしまうため、p90が帯をどれだけ
    // 使い切っているかを別途保証する。
    const cap = computeVisitorCap(shippedVisitors)
    const p90 = percentile(shippedVisitors, 90)
    expect(p90 / cap).toBeGreaterThanOrEqual(0.3)
  })

  it('中央値の4.5倍を100人単位に四捨五入する', () => {
    // 中央値100 → 450 → 四捨五入で500
    expect(computeVisitorCap([100, 100, 100])).toBe(500)
    // 中央値320 → 1440 → 四捨五入で1400（切り上げなら1500になる）
    expect(computeVisitorCap([100, 320, 4550])).toBe(1400)
  })

  it('偶数個のときは中央2値の平均を中央値とする', () => {
    // 中央値 (200+400)/2 = 300 → 1350 → 四捨五入で1400
    expect(computeVisitorCap([100, 200, 400, 5000])).toBe(1400)
  })

  it('空配列では下限の100を返す', () => {
    expect(computeVisitorCap([])).toBe(100)
  })

  it('全てゼロでも下限の100を返す（ゼロ除算防止）', () => {
    expect(computeVisitorCap([0, 0, 0])).toBe(100)
  })

  it('入力配列を破壊しない', () => {
    const input = [4550, 100, 320]
    computeVisitorCap(input)
    expect(input).toEqual([4550, 100, 320])
  })
})

describe('movingAverage', () => {
  it('中央寄せの窓で平均を返す', () => {
    const result = movingAverage([1, 2, 3, 4, 5, 6, 7], 7)
    // index 3 は前後3日ずつ全て揃うので (1+2+3+4+5+6+7)/7 = 4
    expect(result[3]).toBe(4)
  })

  it('端では窓が縮む', () => {
    const result = movingAverage([1, 2, 3, 4, 5, 6, 7], 7)
    // index 0 は [1,2,3,4] の平均 = 2.5
    expect(result[0]).toBe(2.5)
    // index 6 は [4,5,6,7] の平均 = 5.5
    expect(result[6]).toBe(5.5)
  })

  it('nullの日を窓から除外する', () => {
    expect(movingAverage([10, null, 20], 3)).toEqual([10, 15, 20])
  })

  it('窓内が全てnullならnullを返す', () => {
    expect(movingAverage([null, null], 3)).toEqual([null, null])
  })

  it('空配列では空配列を返す', () => {
    expect(movingAverage([], 7)).toEqual([])
  })
})
