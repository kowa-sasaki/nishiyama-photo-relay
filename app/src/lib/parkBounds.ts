// 西山公園の大まかな範囲（左上・右下の座標）。投稿を公園内に限るための柵。
// 広げる・狭めるときはこの4つの数字だけを変える。
export const PARK_BOUNDS = {
  north: 35.959389,
  south: 35.947222,
  west: 136.175674,
  east: 136.185499,
} as const

export function isInsidePark(lat: number, lng: number): boolean {
  return (
    lat <= PARK_BOUNDS.north &&
    lat >= PARK_BOUNDS.south &&
    lng >= PARK_BOUNDS.west &&
    lng <= PARK_BOUNDS.east
  )
}
