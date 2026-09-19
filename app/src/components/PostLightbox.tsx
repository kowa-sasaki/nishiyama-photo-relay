import { useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post } from '../lib/types'
import { formatMonthDayLabel } from '../lib/parkTimeline'
import { getPostImageUrl } from '../lib/postImage'
import './PostLightbox.css'

export type PostLightboxProps = {
  client: SupabaseClient
  posts: Post[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function PostLightbox({ client, posts, index, onClose, onNavigate }: PostLightboxProps) {
  const post = posts[index]
  const goToPrevious = () => onNavigate((index - 1 + posts.length) % posts.length)
  const goToNext = () => onNavigate((index + 1) % posts.length)

  // 依存配列を省略: index/posts/onNavigate/onCloseの最新値を常に捉える必要があるため、毎レンダーで張り直す
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="post-lightbox" role="dialog" aria-modal="true" aria-label="投稿写真の拡大表示" onClick={onClose}>
      <div className="post-lightbox__content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="post-lightbox__close" aria-label="閉じる" onClick={onClose}>
          ×
        </button>
        <div className="post-lightbox__stage">
          {posts.length > 1 && (
            <button
              type="button"
              className="post-lightbox__nav post-lightbox__nav--prev"
              aria-label="前の写真"
              onClick={goToPrevious}
            >
              ‹
            </button>
          )}
          <img src={getPostImageUrl(client, post.image_path)} alt="投稿画像" className="post-lightbox__photo" />
          {posts.length > 1 && (
            <button
              type="button"
              className="post-lightbox__nav post-lightbox__nav--next"
              aria-label="次の写真"
              onClick={goToNext}
            >
              ›
            </button>
          )}
        </div>
        <div className="post-lightbox__caption">
          <p className="post-lightbox__meta">{formatMonthDayLabel(post.created_at)}</p>
          {post.comment && <p className="post-lightbox__comment">{post.comment}</p>}
        </div>
      </div>
    </div>
  )
}
