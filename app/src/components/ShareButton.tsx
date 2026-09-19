import { useState } from 'react'
import './ShareButton.css'

export function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    if (navigator.share) {
      await navigator.share({ text, url })
      return
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    setCopied(true)
  }

  return (
    <div className="share-button">
      <button type="button" className="share-button__button" onClick={() => void handleClick()}>
        共有する
      </button>
      {copied && <p className="share-button__copied">URLをコピーしました</p>}
    </div>
  )
}
