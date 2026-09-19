import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post } from '../lib/types'
import { formatMonthDayLabel } from '../lib/parkTimeline'
import { getPostImageUrl } from '../lib/postImage'
import './SpotHeroSlideshow.css'

const AUTOPLAY_INTERVAL_MS = 2800
const AUTOPLAY_POOL_SIZE = 10

export type SpotHeroSlideshowProps = {
  client: SupabaseClient
  posts: Post[]
  onPhotoClick: (index: number) => void
}

export function SpotHeroSlideshow({ client, posts, onPhotoClick }: SpotHeroSlideshowProps) {
  const [subIdx, setSubIdx] = useState(0)
  // postsは新着順のため、先頭からスライスしても各写真のphotos内インデックスは
  // 元のposts配列内のインデックスと一致する。onPhotoClickにはそのままフルのposts配列への
  // インデックスとして渡せる。
  const photos = useMemo(() => posts.slice(0, AUTOPLAY_POOL_SIZE), [posts])

  useEffect(() => {
    setSubIdx(0)
  }, [photos])

  useEffect(() => {
    if (photos.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setSubIdx((i) => (i + 1) % photos.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [photos])

  if (photos.length === 0) {
    return null
  }

  const activeIndex = subIdx % photos.length
  const activePhoto = photos[activeIndex]

  return (
    <div className="spot-hero-slideshow">
      <button
        type="button"
        className="spot-hero-slideshow__frame"
        aria-label="写真を拡大表示"
        onClick={() => onPhotoClick(activeIndex)}
      >
        <img
          src={getPostImageUrl(client, activePhoto.image_path)}
          alt={`${formatMonthDayLabel(activePhoto.created_at)}の投稿写真`}
          className="spot-hero-slideshow__photo"
        />
        <div className="spot-hero-slideshow__scrim" />
        <div className="spot-hero-slideshow__caption">
          <p className="spot-hero-slideshow__meta">{formatMonthDayLabel(activePhoto.created_at)}</p>
          {activePhoto.comment && <p className="spot-hero-slideshow__comment">{activePhoto.comment}</p>}
        </div>
      </button>
      {photos.length > 1 && (
        <span className="spot-hero-slideshow__dots">
          {photos.map((post, i) => (
            <button
              key={post.id}
              type="button"
              className={`spot-hero-slideshow__dot${i === activeIndex ? ' spot-hero-slideshow__dot--active' : ''}`}
              aria-label={`${i + 1}枚目の写真を表示`}
              aria-current={i === activeIndex}
              onClick={() => setSubIdx(i)}
            />
          ))}
        </span>
      )}
    </div>
  )
}
