import { useEffect, useState } from 'react'
import type { ParkAccessState } from '../lib/useParkAccess'
import './ParkAccessNotice.css'

type ParkAccessPurpose = 'post' | 'spot'

type ParkAccessNoticeProps = {
  access: Exclude<ParkAccessState, { status: 'inside' }>
  onRetry: () => void
  onStartDemo: () => void
  purpose?: ParkAccessPurpose
}

const COPY: Record<ParkAccessPurpose, { outside: string; demo: string; hint: string }> = {
  post: {
    outside: '投稿は西山公園の中でできます。公園内で開き直してください。',
    demo: 'デモ投稿を試す',
    hint: 'デモ投稿は操作を試せますが、保存はされません。',
  },
  spot: {
    outside: '新しい定点は西山公園の中でつくれます。公園内で開き直してください。',
    demo: 'デモで定点をつくってみる',
    hint: 'デモでは操作を試せますが、保存はされません。',
  },
}

const UNAVAILABLE_MESSAGE = '位置情報を確認できませんでした。西山公園の中で、位置情報の利用を許可してください。'

// 位置情報の許可ダイアログは待ち時間に含まれず、無視され続けると確認中のまま動かない。
// その間もデモへ進めるよう、一定時間たったらデモの入口だけを出す。
const DEMO_REVEAL_DELAY_MS = 3000

export function ParkAccessNotice({ access, onRetry, onStartDemo, purpose = 'post' }: ParkAccessNoticeProps) {
  const copy = COPY[purpose]
  const checking = access.status === 'checking'
  const [demoRevealed, setDemoRevealed] = useState(!checking)

  useEffect(() => {
    if (demoRevealed) return
    if (!checking) {
      setDemoRevealed(true)
      return
    }
    const timer = setTimeout(() => setDemoRevealed(true), DEMO_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [checking, demoRevealed])

  const message = checking ? '現在地を確認中…' : access.status === 'outside' ? copy.outside : UNAVAILABLE_MESSAGE

  // 状態が変わってもボタンの並びは変えない（確認中にデモを押そうとした指が、結果表示で別のボタンに当たらないように）。
  // 案内文は同じ live region の中身を差し替えることで、結果をスクリーンリーダーに読み上げさせる。
  return (
    <div className="park-access">
      <p className={`park-access__status${checking ? ' park-access__status--checking' : ''}`} role="status">
        {message}
      </p>
      <button
        type="button"
        className="park-access__button park-access__button--primary"
        onClick={onRetry}
        disabled={checking}
      >
        {access.status === 'unavailable' ? '位置情報を許可して再試行' : '現在地を再確認'}
      </button>
      {demoRevealed && (
        <>
          <button type="button" className="park-access__button" onClick={onStartDemo}>
            {copy.demo}
          </button>
          <p className="park-access__hint">{copy.hint}</p>
        </>
      )}
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
