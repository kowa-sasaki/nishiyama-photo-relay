// Google Maps の座標検索URL。iOS / Android では地図アプリ、PC ではブラウザで開く。
export function buildMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}
