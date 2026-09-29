import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { useAllPosts } from '../lib/useAllPosts'
import { filterPostsByTag, normalizeTag, tagPath } from '../lib/tags'
import { getPostImageUrl } from '../lib/postImage'
import { formatMonthDayLabel } from '../lib/parkTimeline'
import { PostLightbox } from '../components/PostLightbox'
import './TagPostsPage.css'

export function TagPostsPage() {
  const { tag: rawTag } = useParams<{ tag: string }>()
  const tag = normalizeTag(rawTag ?? '')
  const { client, envError } = getSupabaseClientSafe()
  const postsState = useAllPosts(client)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const navigate = useNavigate()
  // ホームの「いま見頃」と定点詳細のどちらからも来るので、アプリ内の移動なら元の画面へ戻す
  const cameFromApp = useLocation().key !== 'default'

  const posts = useMemo(
    () => (postsState.status === 'loaded' ? filterPostsByTag(postsState.posts, tag) : []),
    [postsState, tag],
  )

  return (
    <section aria-labelledby="tag-posts-heading" className="tag-posts">
      {cameFromApp ? (
        <button type="button" className="tag-posts__back" onClick={() => navigate(-1)}>
          ← 戻る
        </button>
      ) : (
        <Link to="/" className="tag-posts__back">
          ← ホームへ
        </Link>
      )}
      <h1 id="tag-posts-heading" className="tag-posts__title">
        {tag}の写真
      </h1>
      {envError && <p>{envError}</p>}
      {!envError && postsState.status === 'loading' && <p>読み込み中…</p>}
      {!envError && postsState.status === 'error' && (
        <p>投稿を取得できませんでした: {postsState.message}</p>
      )}
      {!envError && postsState.status === 'loaded' && (
        <>
          <p className="tag-posts__summary">
            公園全体で<span className="tabular-nums">{posts.length}</span>件（新しい順）
          </p>
          {posts.length === 0 && <p className="tag-posts__empty">このタグの投稿はまだありません。</p>}
          <ul className="tag-posts__list">
            {posts.map((post, index) => (
              <li key={post.id} className="tag-posts__item">
                <button
                  type="button"
                  className="tag-posts__thumb-button"
                  aria-label={`${index + 1}枚目の写真を拡大表示`}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={getPostImageUrl(client, post.image_path)}
                    alt="投稿画像"
                    className="tag-posts__thumb"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
                <div className="tag-posts__body">
                  <p className="tag-posts__meta">
                    <Link to={`/spots/${post.spot_id}`} className="tag-posts__spot">
                      {post.spots?.name ?? '定点'}
                    </Link>
                    <span className="tag-posts__date tabular-nums">
                      {formatMonthDayLabel(post.created_at)}
                    </span>
                  </p>
                  {post.comment && <p className="tag-posts__comment">{post.comment}</p>}
                  <ul className="tag-posts__tags" aria-label="タグ">
                    {post.tags.map((t) => (
                      <li key={t}>
                        <Link
                          to={tagPath(t)}
                          className="tag-chip"
                          aria-current={normalizeTag(t) === tag ? 'page' : undefined}
                        >
                          {t}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          {lightboxIndex !== null && (
            <PostLightbox
              client={client}
              posts={posts}
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
