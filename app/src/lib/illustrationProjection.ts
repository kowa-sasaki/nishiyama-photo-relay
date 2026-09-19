// 公式定点5箇所（tools/spots_coordinates_todo.md参照）の重心。
// 5箇所は東西約340m×南北約412mの範囲に収まる。
const ORIGIN_LAT = 35.9505
const ORIGIN_LNG = 136.18195

const METERS_PER_DEG_LAT = 111320
const METERS_PER_DEG_LNG = 111320 * Math.cos((ORIGIN_LAT * Math.PI) / 180)

// SVG単位 / メートル
const SCALE = 1.5

// bounding boxをviewBoxの正の座標域（0 0 630 740）に収めるための平行移動。
// 公式定点5箇所のbounding box（x_m: 約-113〜227m, y_m: 約-201〜212m、SCALE=1.5適用後は
// 約-170〜340 x 約-302〜318）に、上下左右へ約60単位（=40m）の余白を加えて0基点へシフトした値。
const OFFSET_X = 230
const OFFSET_Y = 378

export const ILLUSTRATION_VIEWBOX = '0 0 630 740'

export function projectToIllustration(lat: number, lng: number): { x: number; y: number } {
  const xMeters = (lng - ORIGIN_LNG) * METERS_PER_DEG_LNG
  const yMeters = (lat - ORIGIN_LAT) * METERS_PER_DEG_LAT
  return {
    x: xMeters * SCALE + OFFSET_X,
    // SVGのY軸は下向きが正のため反転する
    y: -yMeters * SCALE + OFFSET_Y,
  }
}
