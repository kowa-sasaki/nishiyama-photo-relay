/**
 * 来場者数グラフのY軸上限（ドメイン）と平滑化を担う純粋関数群。
 *
 * 日別来場者数は極端な右裾を持つ（令和7年度: 中央値320人に対し最大4,550人。
 * min-max正規化では77%の日が描画帯の下位10%に潰れる）。そのため上限を
 * 中央値ベースで導出してクリップし、季節リズムが描画帯を使い切るようにする。
 */

/** 上限を中央値の何倍に取るか。1,400人（≒p98.9）に着地する係数。 */
export const VISITOR_CAP_MEDIAN_FACTOR = 4.5

/** 退化した入力（空・全ゼロ）でのゼロ除算を防ぐための下限。 */
const MIN_CAP = 100

/** 丸めの単位（人）。 */
const CAP_ROUNDING_UNIT = 100

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Y軸上限を導出する。中央値 × 4.5 を100人単位に四捨五入する。
 * ETLで年度データを差し替えても自動で追従する。
 */
export function computeVisitorCap(values: number[]): number {
  if (values.length === 0) return MIN_CAP
  const sorted = [...values].sort((a, b) => a - b)
  const raw =
    Math.round((median(sorted) * VISITOR_CAP_MEDIAN_FACTOR) / CAP_ROUNDING_UNIT) * CAP_ROUNDING_UNIT
  return Math.max(MIN_CAP, raw)
}

/**
 * 中央寄せの移動平均。端では窓が縮み、nullの日は窓から除外する。
 * 窓内に有効値が1つも無い場合はnullを返す。
 */
export function movingAverage(values: (number | null)[], window: number): (number | null)[] {
  const half = Math.floor(window / 2)
  return values.map((_, i) => {
    const from = Math.max(0, i - half)
    const to = Math.min(values.length - 1, i + half)
    let sum = 0
    let count = 0
    for (let j = from; j <= to; j++) {
      const value = values[j]
      if (value !== null) {
        sum += value
        count += 1
      }
    }
    return count === 0 ? null : sum / count
  })
}
