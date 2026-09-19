import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSpot } from '../lib/useSpot'
import { useAuth } from '../lib/AuthContext'
import { useLastViewedSpot } from '../lib/LastViewedSpotContext'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { getPostImageUrl } from '../lib/postImage'
import { ShareButton } from '../components/ShareButton'
import { ReportButton } from '../components/ReportButton'
import { SpotHeroSlideshow } from '../components/SpotHeroSlideshow'
import { PostLightbox } from '../components/PostLightbox'
import { SHARE_HASHTAG } from '../lib/shareText'
import './SpotDetailPage.css'

export function SpotDetailPage() {
  const { spotId } = useParams<{ spotId: string }>()
  const { client, envError } = getSupabaseClientSafe()
  const state = useSpot(client, spotId ?? null)
  const auth = useAuth()
  const deviceId = auth.status === 'signed-in' ? auth.userId : null
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { setLastViewedSpotId } = useLastViewedSpot()

  useEffect(() => {
    if (spotId) {
      setLastViewedSpotId(spotId)
    }
  }, [spotId, setLastViewedSpotId])

  if (envError) {
    return (
      <section aria-labelledby="spot-detail-heading">
        <h1 id="spot-detail-heading">定点詳細</h1>
        <p>{envError}</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="spot-detail-heading">
      {state.status === 'loading' && (
        <>
          <h1 id="spot-detail-heading">定点詳細</h1>
          <p>読み込み中…</p>
        </>
      )}
      {state.status === 'error' && (
        <>
          <h1 id="spot-detail-heading">定点詳細</h1>
          <p>定点を取得できませんでした: {state.message}</p>
        </>
      )}
      {state.status === 'loaded' && (
        <>
          <h1 id="spot-detail-heading" className="spot-detail__title">
            {state.spot.name}
          </h1>
          <SpotHeroSlideshow client={client} posts={state.posts} onPhotoClick={setLightboxIndex} />
          {state.spot.theme && <p className="spot-detail__theme">{state.spot.theme}</p>}
          {state.spot.description && (
            <p className="spot-detail__description">{state.spot.description}</p>
          )}
          <div className="spot-detail__actions">
            <Link to="/post" className="spot-detail__post-button">
              投稿する
            </Link>
            <ShareButton
              url={`${window.location.origin}/spots/${state.spot.id}`}
              text={`${state.spot.name}の記録 ${SHARE_HASHTAG}`}
            />
          </div>
          <ReportButton
            client={client}
            targetType="spot"
            targetId={state.spot.id}
            deviceId={deviceId}
            label="この定点を報告する"
          />
          <ul className="spot-detail__posts">
            {state.posts.map((post, index) => (
              <li key={post.id} className="spot-detail__post">
                <div className="spot-detail__post-row">
                  <button
                    type="button"
                    className="spot-detail__thumb-button"
                    aria-label={`${index + 1}枚目の写真を拡大表示`}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={getPostImageUrl(client, post.image_path)}
                      alt="投稿画像"
                      className="spot-detail__thumb"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                  <div className="spot-detail__post-body">
                    {post.comment && <p>{post.comment}</p>}
                    {post.tags.length > 0 && (
                      <ul className="spot-detail__post-tags">
                        {post.tags.map((tag) => (
                          <li key={tag} className="spot-detail__tag">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <ReportButton
                  client={client}
                  targetType="post"
                  targetId={post.id}
                  deviceId={deviceId}
                  label="この投稿を報告する"
                />
              </li>
            ))}
          </ul>
          {state.posts.length === 0 && <p className="spot-detail__empty">まだ投稿がありません。</p>}
          {lightboxIndex !== null && (
            <PostLightbox
              client={client}
              posts={state.posts}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={setLightboxIndex}
            />
          )}
        </>
      )}
    </section>
  )
}
