import { ParkMapIllustration } from '../components/ParkMapIllustration'
import './MapTracePage.css'

// app/src/assets/ 配下のpngはトレース用の一時参照画像（.gitignore対象）。
// 存在しない環境（他のマシン/CI）でもビルドが壊れないようglobで安全に検出する。
const referenceImages = import.meta.glob('../assets/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const referenceImageUrl = Object.values(referenceImages)[0]

export default function MapTracePage() {
  return (
    <div className="map-trace-page">
      <h1 className="map-trace-page__title">マップトレース参照ページ（開発用・一時的）</h1>
      <p className="map-trace-page__note">
        このページはトレース作業のための一時的な開発用ページです。本番ビルドのルーティングには含まれません。
      </p>
      <div className="map-trace-page__columns">
        <section className="map-trace-page__column">
          <h2>参照画像</h2>
          {referenceImageUrl ? (
            <img className="map-trace-page__reference" src={referenceImageUrl} alt="トレース参照用地図" />
          ) : (
            <p>app/src/assets/ に参照画像(png)が見つかりません。</p>
          )}
        </section>
        <section className="map-trace-page__column">
          <h2>現在のイラスト</h2>
          <ParkMapIllustration />
        </section>
      </div>
    </div>
  )
}
