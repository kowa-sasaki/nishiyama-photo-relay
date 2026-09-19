import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLastViewedSpot } from '../lib/LastViewedSpotContext'
import { useSpots } from '../lib/useSpots'
import { useSpot } from '../lib/useSpot'
import { useAuth } from '../lib/AuthContext'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { resizeAndAnalyzeImage } from '../lib/image'
import { TagInput } from '../components/TagInput'
import { ShareButton } from '../components/ShareButton'
import { createPost } from '../lib/createPost'
import { SHARE_HASHTAG } from '../lib/shareText'
import './PostFlowPage.css'

type Step = 'select' | 'compose' | 'confirm' | 'done'

export function PostFlowPage() {
  const { client, envError } = getSupabaseClientSafe()
  const auth = useAuth()
  const { lastViewedSpotId } = useLastViewedSpot()
  const spotsState = useSpots(client)
  const fallbackSpotId =
    spotsState.status === 'loaded'
      ? (spotsState.spots.find((spot) => spot.kind === 'official')?.id ?? null)
      : null
  const targetSpotId = lastViewedSpotId ?? fallbackSpotId
  const spotState = useSpot(client, targetSpotId)

  const [step, setStep] = useState<Step>('select')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [avgColor, setAvgColor] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so re-selecting the exact same file (e.g. to retry after an
    // error) still fires onChange next time.
    event.target.value = ''
    if (!file) return
    setImageError(null)
    setPreviewUrl(URL.createObjectURL(file))
    setProcessing(true)
    try {
      const { blob, avgColor: color } = await resizeAndAnalyzeImage(file)
      setPendingBlob(blob)
      setAvgColor(color)
      setStep('compose')
    } catch (error) {
      setPreviewUrl(null)
      setImageError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setProcessing(false)
    }
  }

  async function handleSubmit() {
    if (!targetSpotId || !pendingBlob || !avgColor || auth.status !== 'signed-in') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createPost(client, {
        spotId: targetSpotId,
        blob: pendingBlob,
        avgColor,
        tags,
        comment,
        deviceId: auth.userId,
      })
      setStep('done')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (envError) {
    return (
      <section aria-labelledby="post-heading">
        <h1 id="post-heading">投稿</h1>
        <p>{envError}</p>
      </section>
    )
  }

  if (spotsState.status === 'error') {
    return (
      <section aria-labelledby="post-heading">
        <h1 id="post-heading">投稿</h1>
        <p>定点一覧を取得できませんでした: {spotsState.message}</p>
      </section>
    )
  }

  if (!targetSpotId) {
    if (spotsState.status === 'loaded') {
      return (
        <section aria-labelledby="post-heading">
          <h1 id="post-heading">投稿</h1>
          <p>投稿先の定点が見つかりません</p>
          <Link to="/spots">定点一覧へ戻る</Link>
        </section>
      )
    }
    return (
      <section aria-labelledby="post-heading">
        <h1 id="post-heading">投稿</h1>
        <p>読み込み中…</p>
      </section>
    )
  }

  if (spotState.status === 'loading') {
    return (
      <section aria-labelledby="post-heading">
        <h1 id="post-heading">投稿</h1>
        <p>読み込み中…</p>
      </section>
    )
  }

  if (spotState.status === 'error') {
    return (
      <section aria-labelledby="post-heading">
        <h1 id="post-heading">投稿</h1>
        <p>定点を取得できませんでした: {spotState.message}</p>
      </section>
    )
  }

  const { spot } = spotState

  return (
    <section aria-labelledby="post-heading">
      <h1 id="post-heading">投稿</h1>
      <p className="post-flow__target">対象の定点: {spot.name}</p>

      {step === 'select' && (
        <div>
          {imageError && <p className="post-flow__error">画像を処理できませんでした: {imageError}</p>}
          {processing && <p>処理中…</p>}
          <div className="post-flow__picker-group">
            <label className={`post-flow__picker${processing ? ' post-flow__picker--disabled' : ''}`}>
              カメラで撮る
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelected}
                disabled={processing}
              />
            </label>
            <label className={`post-flow__picker${processing ? ' post-flow__picker--disabled' : ''}`}>
              ギャラリーから選ぶ
              <input type="file" accept="image/*" onChange={handleFileSelected} disabled={processing} />
            </label>
          </div>
        </div>
      )}

      {step === 'compose' && previewUrl && (
        <div>
          <img src={previewUrl} alt="投稿する写真のプレビュー" className="post-flow__preview" />
          <TagInput value={tags} onChange={setTags} />
          <label>
            ひとこと（任意）
            <input
              type="text"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="post-flow__comment-input"
            />
          </label>
          <div className="post-flow__actions">
            <button
              type="button"
              className="post-flow__button post-flow__button--secondary"
              onClick={() => setStep('select')}
            >
              戻る
            </button>
            <button
              type="button"
              className="post-flow__button post-flow__button--primary"
              onClick={() => setStep('confirm')}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && previewUrl && (
        <div>
          <img src={previewUrl} alt="投稿する写真のプレビュー" className="post-flow__preview" />
          <p>{spot.name}</p>
          <p>{tags.join('、')}</p>
          <p>{comment}</p>
          {auth.status === 'loading' && <p>認証準備中…</p>}
          {auth.status === 'error' && <p className="post-flow__error">認証に失敗しました: {auth.message}</p>}
          {submitError && <p className="post-flow__error">送信に失敗しました: {submitError}</p>}
          <div className="post-flow__actions">
            <button
              type="button"
              className="post-flow__button post-flow__button--secondary"
              onClick={() => setStep('compose')}
            >
              戻る
            </button>
            <button
              type="button"
              className="post-flow__button post-flow__button--primary"
              onClick={() => void handleSubmit()}
              disabled={submitting || auth.status !== 'signed-in'}
            >
              送信する
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="post-flow__done">
          <p className="post-flow__done-title">送信しました！</p>
          <p className="tabular-nums">この定点への投稿 {spotState.posts.length + 1}件目</p>
          <div className="post-flow__done-actions">
            <Link to={`/spots/${spot.id}`} className="post-flow__button post-flow__button--secondary">
              この定点を見る
            </Link>
            <ShareButton
              url={`${window.location.origin}/spots/${spot.id}`}
              text={`${spot.name}に投稿しました ${SHARE_HASHTAG}`}
            />
          </div>
        </div>
      )}
    </section>
  )
}
