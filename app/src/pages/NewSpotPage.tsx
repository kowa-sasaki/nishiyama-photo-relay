import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { resizeAndAnalyzeImage } from '../lib/image'
import { TagInput } from '../components/TagInput'
import { ShareButton } from '../components/ShareButton'
import { createUserSpot } from '../lib/createUserSpot'
import { useParkAccess } from '../lib/useParkAccess'
import { ParkAccessNotice, DemoBanner } from '../components/ParkAccessNotice'
import { SHARE_HASHTAG } from '../lib/shareText'
import './NewSpotPage.css'

type Step = 'select' | 'compose' | 'confirm' | 'done'

const NAME_MAX = 40
const THEME_MAX = 60
const DESCRIPTION_MAX = 200

export function NewSpotPage() {
  const { client, envError } = getSupabaseClientSafe()
  const auth = useAuth()
  const { access, retry: retryAccess } = useParkAccess()
  const [demo, setDemo] = useState(false)

  const [step, setStep] = useState<Step>('select')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [avgColor, setAvgColor] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [createdSpotId, setCreatedSpotId] = useState<string | null>(null)

  const trimmedName = name.trim()
  const trimmedTheme = theme.trim()
  const trimmedDescription = description.trim()
  const canProceedToConfirm = trimmedName.length > 0 && trimmedTheme.length > 0

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
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
    if (demo) {
      setStep('done')
      return
    }
    if (
      !pendingBlob ||
      !avgColor ||
      auth.status !== 'signed-in' ||
      access.status !== 'inside' ||
      !canProceedToConfirm
    ) {
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const post = await createUserSpot(client, {
        name: trimmedName,
        theme: trimmedTheme,
        description: trimmedDescription,
        lat: access.lat,
        lng: access.lng,
        blob: pendingBlob,
        avgColor,
        tags,
        comment,
      })
      setCreatedSpotId(post.spot_id)
      setStep('done')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (envError) {
    return (
      <section aria-labelledby="new-spot-heading">
        <h1 id="new-spot-heading">新しい定点をつくる</h1>
        <p>{envError}</p>
      </section>
    )
  }

  if (!demo && access.status !== 'inside') {
    return (
      <section aria-labelledby="new-spot-heading">
        <h1 id="new-spot-heading">新しい定点をつくる</h1>
        <ParkAccessNotice access={access} onRetry={retryAccess} onStartDemo={() => setDemo(true)} />
      </section>
    )
  }

  return (
    <section aria-labelledby="new-spot-heading">
      <h1 id="new-spot-heading">新しい定点をつくる</h1>
      {demo && <DemoBanner />}

      {step === 'select' && (
        <div>
          {imageError && <p className="new-spot__error">画像を処理できませんでした: {imageError}</p>}
          {processing && <p>処理中…</p>}
          <div className="new-spot__picker-group">
            <label className={`new-spot__picker${processing ? ' new-spot__picker--disabled' : ''}`}>
              カメラで撮る
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelected}
                disabled={processing}
              />
            </label>
            <label className={`new-spot__picker${processing ? ' new-spot__picker--disabled' : ''}`}>
              ギャラリーから選ぶ
              <input type="file" accept="image/*" onChange={handleFileSelected} disabled={processing} />
            </label>
          </div>
        </div>
      )}

      {step === 'compose' && previewUrl && (
        <div>
          <img src={previewUrl} alt="投稿する写真のプレビュー" className="new-spot__preview" />
          <label className="new-spot__field">
            定点名
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={NAME_MAX}
              className="new-spot__text-input"
            />
          </label>
          <label className="new-spot__field">
            お題
            <input
              type="text"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              maxLength={THEME_MAX}
              className="new-spot__text-input"
            />
          </label>
          <label className="new-spot__field">
            説明（任意）
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={DESCRIPTION_MAX}
              className="new-spot__text-input"
            />
          </label>
          <TagInput value={tags} onChange={setTags} />
          <label className="new-spot__field">
            ひとこと（任意）
            <input
              type="text"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="new-spot__text-input"
            />
          </label>
          <div className="new-spot__actions">
            <button
              type="button"
              className="new-spot__button new-spot__button--secondary"
              onClick={() => setStep('select')}
            >
              戻る
            </button>
            <button
              type="button"
              className="new-spot__button new-spot__button--primary"
              onClick={() => setStep('confirm')}
              disabled={!canProceedToConfirm}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && previewUrl && (
        <div>
          <img src={previewUrl} alt="投稿する写真のプレビュー" className="new-spot__preview" />
          <dl className="new-spot__summary">
            <div className="new-spot__summary-row">
              <dt>定点名</dt>
              <dd>{trimmedName}</dd>
            </div>
            <div className="new-spot__summary-row">
              <dt>お題</dt>
              <dd>{trimmedTheme}</dd>
            </div>
            {trimmedDescription && (
              <div className="new-spot__summary-row">
                <dt>説明</dt>
                <dd>{trimmedDescription}</dd>
              </div>
            )}
            {tags.length > 0 && (
              <div className="new-spot__summary-row">
                <dt>タグ</dt>
                <dd>{tags.join('、')}</dd>
              </div>
            )}
            {comment && (
              <div className="new-spot__summary-row">
                <dt>ひとこと</dt>
                <dd>{comment}</dd>
              </div>
            )}
          </dl>
          {!demo && auth.status === 'loading' && <p>認証準備中…</p>}
          {!demo && auth.status === 'error' && <p className="new-spot__error">認証に失敗しました: {auth.message}</p>}
          {submitError && <p className="new-spot__error">送信に失敗しました: {submitError}</p>}
          <div className="new-spot__actions">
            <button
              type="button"
              className="new-spot__button new-spot__button--secondary"
              onClick={() => setStep('compose')}
            >
              戻る
            </button>
            <button
              type="button"
              className="new-spot__button new-spot__button--primary"
              onClick={() => void handleSubmit()}
              disabled={submitting || (!demo && auth.status !== 'signed-in')}
            >
              送信する
            </button>
          </div>
        </div>
      )}

      {step === 'done' && demo && (
        <div className="new-spot__done">
          <p className="new-spot__done-title">デモ投稿が完了しました</p>
          <p>デモのため保存されていません。</p>
          <div className="new-spot__done-actions">
            <Link to="/spots" className="new-spot__button new-spot__button--secondary">
              定点一覧へ
            </Link>
          </div>
        </div>
      )}

      {step === 'done' && createdSpotId && (
        <div className="new-spot__done">
          <p className="new-spot__done-title">定点をつくりました！</p>
          <div className="new-spot__done-actions">
            <Link to={`/spots/${createdSpotId}`} className="new-spot__button new-spot__button--secondary">
              この定点を見る
            </Link>
            <ShareButton
              url={`${window.location.origin}/spots/${createdSpotId}`}
              text={`${trimmedName}をつくりました ${SHARE_HASHTAG}`}
            />
          </div>
        </div>
      )}
    </section>
  )
}
