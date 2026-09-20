import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSpots } from '../lib/useSpots'
import { useAllPosts } from '../lib/useAllPosts'
import { useGeolocation } from '../lib/useGeolocation'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { getLatestPostImageBySpot, countAllPostsBySpot, sortSpotsByPopularity } from '../lib/spotRanking'
import { getSuccessionDaysBySpot, sortSpotsBySuccessionDays } from '../lib/successionDays'
import { sortSpotsByDistance, getDistancesBySpot, formatDistanceLabel } from '../lib/distance'
import { getPostImageUrl } from '../lib/postImage'
import { DEFAULT_SPOT_TAB, SPOT_TABS, parseSpotTab, type SpotTab } from '../lib/spotTabs'
import type { Spot } from '../lib/types'
import './SpotsListPage.css'

type SortMode = 'popularity' | 'succession' | 'distance'

export function SpotsListPage() {
  const { client, envError } = getSupabaseClientSafe()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseSpotTab(searchParams.get('tab'))
  const tabConfig = SPOT_TABS.find((item) => item.kind === tab) ?? SPOT_TABS[0]

  function selectTab(next: SpotTab) {
    setSearchParams(next === DEFAULT_SPOT_TAB ? {} : { tab: next }, { replace: true })
  }

  const state = useSpots(client)
  const postsState = useAllPosts(client)
  const [sortMode, setSortMode] = useState<SortMode>('popularity')
  const [fallbackSortMode, setFallbackSortMode] = useState<'popularity' | 'succession'>('popularity')
  const [geoError, setGeoError] = useState(false)
  const { state: geoState } = useGeolocation(sortMode === 'distance')
  const stableSpotsRef = useRef<Spot[]>([])

  useEffect(() => {
    if (sortMode === 'distance' && geoState.status === 'error') {
      setGeoError(true)
      setSortMode(fallbackSortMode)
    }
  }, [sortMode, geoState, fallbackSortMode])

  function selectStandardSortMode(mode: 'popularity' | 'succession') {
    setGeoError(false)
    setFallbackSortMode(mode)
    setSortMode(mode)
  }

  function selectDistanceSortMode() {
    setGeoError(false)
    setSortMode('distance')
  }

  const tabSpots = useMemo(
    () => (state.status === 'loaded' ? state.spots.filter((spot) => spot.kind === tab) : []),
    [state, tab],
  )

  const sortedSpots = useMemo(() => {
    if (state.status !== 'loaded') return []
    const posts = postsState.status === 'loaded' ? postsState.posts : []
    const now = new Date()
    let result: Spot[]
    if (sortMode === 'popularity') {
      result = sortSpotsByPopularity(tabSpots, posts, now)
    } else if (sortMode === 'succession') {
      result = sortSpotsBySuccessionDays(tabSpots, posts, now)
    } else if (geoState.status === 'success') {
      result = sortSpotsByDistance(tabSpots, { lat: geoState.lat, lng: geoState.lng })
    } else {
      return stableSpotsRef.current.filter((spot) => spot.kind === tab)
    }
    stableSpotsRef.current = result
    return result
  }, [state, tabSpots, tab, postsState, sortMode, geoState])

  const distances = useMemo(() => {
    if (state.status !== 'loaded' || geoState.status !== 'success') return new Map<string, number>()
    return getDistancesBySpot(state.spots, { lat: geoState.lat, lng: geoState.lng })
  }, [state, geoState])

  const postCounts = useMemo(() => {
    const posts = postsState.status === 'loaded' ? postsState.posts : []
    return countAllPostsBySpot(posts)
  }, [postsState])

  const latestImages = useMemo(() => {
    const posts = postsState.status === 'loaded' ? postsState.posts : []
    return getLatestPostImageBySpot(posts)
  }, [postsState])

  const successionDays = useMemo(() => {
    if (state.status !== 'loaded') return new Map()
    const posts = postsState.status === 'loaded' ? postsState.posts : []
    return getSuccessionDaysBySpot(state.spots, posts, new Date())
  }, [state, postsState])

  if (envError) {
    return (
      <section aria-labelledby="spots-heading">
        <h1 id="spots-heading">定点一覧</h1>
        <p>{envError}</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="spots-heading">
      <h1 id="spots-heading">定点一覧</h1>
      <Link to="/spots/new" className="spots-list__new-button">
        ＋新しい定点をつくる
      </Link>
      {(state.status === 'loading' || (state.status === 'loaded' && postsState.status === 'loading')) && (
        <p>読み込み中…</p>
      )}
      {state.status === 'error' && <p>定点一覧を取得できませんでした: {state.message}</p>}
      {state.status === 'loaded' && postsState.status !== 'loading' && (
        <>
          <div role="tablist" aria-label="定点の種類" className="spots-list__tabs">
            {SPOT_TABS.map((item) => (
              <button
                key={item.kind}
                type="button"
                role="tab"
                aria-selected={item.kind === tab}
                className="spots-list__tab"
                onClick={() => selectTab(item.kind)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="並び替え" className="spots-list__sort">
            <button
              type="button"
              aria-pressed={sortMode === 'popularity'}
              className="spots-list__sort-button"
              onClick={() => selectStandardSortMode('popularity')}
            >
              人気
            </button>
            <button
              type="button"
              aria-pressed={sortMode === 'succession'}
              className="spots-list__sort-button"
              onClick={() => selectStandardSortMode('succession')}
            >
              継続中
            </button>
            <button
              type="button"
              aria-pressed={sortMode === 'distance'}
              className="spots-list__sort-button"
              onClick={selectDistanceSortMode}
            >
              近い順
            </button>
          </div>
          {sortMode === 'distance' && geoState.status === 'loading' && (
            <p className="spots-list__geo-status" role="status">現在地を取得中…</p>
          )}
          {geoError && (
            <p className="spots-list__geo-status spots-list__geo-status--error" role="alert">
              位置情報を取得できませんでした。設定を確認して再試行してください
            </p>
          )}
          {tabSpots.length === 0 && <p className="spots-list__empty">{tabConfig.emptyMessage}</p>}
          <ul className="spots-list">
            {sortedSpots.map((spot) => {
              const postCount = postCounts.get(spot.id) ?? 0
              const days = successionDays.get(spot.id)?.days
              const distance = distances.get(spot.id)
              return (
                <li key={spot.id}>
                  <Link to={`/spots/${spot.id}`} className="spots-list__card">
                    <div className="spots-list__row">
                      {latestImages.has(spot.id) && (
                        <img
                          src={getPostImageUrl(client, latestImages.get(spot.id)!)}
                          alt="最新の投稿写真"
                          className="spots-list__thumb"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="spots-list__body">
                        <div className="spots-list__header">
                          <span className="spots-list__name">{spot.name}</span>
                          <span className="spots-list__stats tabular-nums">
                            {postCount}件{days !== undefined && ` · ${days}日目`}
                            {distance !== undefined && ` · ${formatDistanceLabel(distance)}`}
                          </span>
                        </div>
                        {spot.theme && <span className="spots-list__theme">{spot.theme}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
