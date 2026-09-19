import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { HomePage } from './pages/HomePage'
import { SpotsListPage } from './pages/SpotsListPage'
import { SpotDetailPage } from './pages/SpotDetailPage'
import { NewSpotPage } from './pages/NewSpotPage'
import { PostFlowPage } from './pages/PostFlowPage'
import { SharePage } from './pages/SharePage'

// @vite-ignoreでRollupの静的解析対象から外す。開発用の一時参照ページ
// (app/src/assets/の未コミット画像を読み込む)を本番ビルドの依存グラフに
// 一切含めないため。ビルド時にimport.meta.env.DEVで削除するだけでは、
// dynamic importが先に静的解析されassetsがdist/にコピーされてしまう。
const MapTracePage = lazy(() => import(/* @vite-ignore */ './pages/MapTracePage.tsx'))

function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/spots" element={<SpotsListPage />} />
          <Route path="/spots/new" element={<NewSpotPage />} />
          <Route path="/spots/:spotId" element={<SpotDetailPage />} />
          <Route path="/post" element={<PostFlowPage />} />
          <Route path="/share" element={<SharePage />} />
          {import.meta.env.DEV && (
            <Route
              path="/dev/map-trace"
              element={
                <Suspense fallback={null}>
                  <MapTracePage />
                </Suspense>
              }
            />
          )}
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
