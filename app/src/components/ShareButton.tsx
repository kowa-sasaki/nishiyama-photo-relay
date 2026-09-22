import { useState } from 'react'
import './ShareButton.css'

type ShareResult = 'idle' | 'copied' | 'failed'

export function ShareButton({ url, text }: { url: string; text: string }) {
  const [result, setResult] = useState<ShareResult>('idle')

  async function handleClick() {
    if (navigator.share) {
      try {
        await navigator.share({ text, url })
        return
      } catch (error) {
        // 共有シートを閉じただけ（AbortError）なら、何も起きなかったものとして扱う
        if (error instanceof Error && error.name === 'AbortError') return
        // 共有自体が失敗したときは、下のコピーにフォールバックする
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setResult('copied')
    } catch {
      setResult('failed')
    }
  }

  return (
    <div className="share-button">
      <button type="button" className="share-button__button" onClick={() => void handleClick()}>
        共有する
      </button>
      {result !== 'idle' && (
        <p
          className={
            result === 'failed'
              ? 'share-button__message share-button__message--failed'
              : 'share-button__message'
          }
          role="status"
        >
          {result === 'copied' ? 'URLをコピーしました' : 'コピーできませんでした'}
        </p>
      )}
    </div>
  )
}
