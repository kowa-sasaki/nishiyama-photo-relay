import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostWithSpot } from '../lib/types'
import type { TimelineDay } from '../lib/parkTimeline'
import { formatMonthDayLabel } from '../lib/parkTimeline'
import { getPostImageUrl } from '../lib/postImage'
import './HeroSlideshow.css'

const AUTOPLAY_INTERVAL_MS = 2800
const AUTOPLAY_POOL_SIZE = 10

export type HeroSlideshowProps = {
  client: SupabaseClient
  recentPosts: PostWithSpot[]
  selectedDay: TimelineDay | null
}

export function HeroSlideshow({ client, recentPosts, selectedDay }: HeroSlideshowProps) {
  const [subIdx, setSubIdx] = useState(0)
  const autoplayPool = useMemo(() => recentPosts.slice(0, AUTOPLAY_POOL_SIZE), [recentPosts])
  const photos = selectedDay ? selectedDay.posts : autoplayPool

  useEffect(() => {
    setSubIdx(0)
  }, [selectedDay?.monthDay])

  useEffect(() => {
    if (selectedDay !== null || autoplayPool.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setSubIdx((i) => (i + 1) % autoplayPool.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [selectedDay, autoplayPool])

  if (photos.length === 0) {
    return (
      <div className="hero-slideshow hero-slideshow--empty">
        <p>
          まだ投稿がありません。
          <br />
          最初の1枚を投稿してみましょう。
        </p>
        <Link to="/post" className="hero-slideshow__cta">
          ＋ 投稿する
        </Link>
      </div>
    )
  }

  const activeIndex = subIdx % photos.length
  const activePhoto = photos[activeIndex]
  const spotName = activePhoto.spots?.name ?? '定点'

  return (
    <div className="hero-slideshow">
      <Link to={`/spots/${activePhoto.spot_id}`} className="hero-slideshow__frame">
        <img
          src={getPostImageUrl(client, activePhoto.image_path)}
          alt={`${spotName}の投稿写真`}
          className="hero-slideshow__photo"
        />
        <div className="hero-slideshow__scrim" />
        <span className="hero-slideshow__status">
          <span className={`hero-slideshow__live-dot${selectedDay ? '' : ' hero-slideshow__live-dot--auto'}`} />
          {selectedDay ? '選択中' : '自動再生中'}
        </span>
        <div className="hero-slideshow__caption">
          <p className="hero-slideshow__spot">{spotName}</p>
          <p className="hero-slideshow__meta">{formatMonthDayLabel(activePhoto.created_at)}</p>
          {activePhoto.comment && <p className="hero-slideshow__comment">{activePhoto.comment}</p>}
        </div>
      </Link>
      {photos.length > 1 && (
        <span className="hero-slideshow__dots">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className={`hero-slideshow__dot${i === activeIndex ? ' hero-slideshow__dot--active' : ''}`}
              aria-label={`${i + 1}枚目の写真を表示`}
              aria-current={i === activeIndex}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSubIdx(i)
              }}
            />
          ))}
        </span>
      )}
    </div>
  )
}
