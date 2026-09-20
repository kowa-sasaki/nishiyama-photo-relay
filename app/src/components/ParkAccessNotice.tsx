import { useEffect, useState } from 'react'
import type { ParkAccessState } from '../lib/useParkAccess'
import './ParkAccessNotice.css'

type ParkAccessNoticeProps = {
  access: Exclude<ParkAccessState, { status: 'inside' }>
  onRetry: () => void
  onStartDemo: () => void
}

// 位置情報の許可ダイアログは待ち時間に含まれず、無視され続けると確認中のまま動かない。
// その間もデモへ進めるよう、一定時間たったらデモの入口だけを出す。
const DEMO_REVEAL_DELAY_MS = 3000

function CheckingNotice({ onStartDemo }: { onStartDemo: () => void }) {
  const [demoRevealed, setDemoRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDemoRevealed(true), DEMO_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="park-access">
      <p className="park-access__status" role="status">
        現在地を確認中…
      </p>
      {demoRevealed && (
        <>
          <button type="button" className="park-access__button" onClick={onStartDemo}>
            デモ投稿を試す
          </button>
          <p className="park-access__hint">デモ投稿は操作を試せますが、保存はされません。</p>
        </>
      )}
    </div>
  )
}

export function ParkAccessNotice({ access, onRetry, onStartDemo }: ParkAccessNoticeProps) {
  if (access.status === 'checking') {
    return <CheckingNotice onStartDemo={onStartDemo} />
  }

  return (
    <div className="park-access">
      {access.status === 'outside' ? (
        <p>投稿は西山公園の中でできます。公園内で開き直してください。</p>
      ) : (
        <p>位置情報を確認できませんでした。西山公園の中で、位置情報の利用を許可してください。</p>
      )}
      <button type="button" className="park-access__button park-access__button--primary" onClick={onRetry}>
        {access.status === 'outside' ? '現在地を再確認' : '位置情報を許可して再試行'}
      </button>
      <button type="button" className="park-access__button" onClick={onStartDemo}>
        デモ投稿を試す
      </button>
      <p className="park-access__hint">デモ投稿は操作を試せますが、保存はされません。</p>
    </div>
  )
}

export function DemoBanner() {
  return (
    <p className="park-access__banner" role="status">
      デモ：保存されません
    </p>
  )
}
