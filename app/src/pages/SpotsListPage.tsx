import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
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

  const tabRefs = useRef(new Map<SpotTab, HTMLButtonElement>())

  // WAI-ARIA のタブの作法どおり、矢印キー・Home・End で選択とフォーカスを移す
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = SPOT_TABS.findIndex((item) => item.kind === tab)
    let nextIndex: number
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % SPOT_TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + SPOT_TABS.length) % SPOT_TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = SPOT_TABS.length - 1
    else return
    event.preventDefault()
    const next = SPOT_TABS[nextIndex].kind
    selectTab(next)
    tabRefs.current.get(next)?.focus()
  }

  const state = useSpots(client)
  const postsState = useAllPosts(client)
  const [sortMode, setSortMode] = useState<SortMode>('popularity')
  const [fallbackSortMode, setFallbackSortMode] = useState<'popularity' | 'succession'>('popularity')
  const [geoError, setGeoError] = useState(false)
  const { state: geoState } = useGeolocation(sortMode === 'distance')

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
    if (sortMode === 'popularity') return sortSpotsByPopularity(tabSpots, posts, now)
    if (sortMode === 'succession') return sortSpotsBySuccessionDays(tabSpots, posts, now)
    if (geoState.status === 'success') {
      return sortSpotsByDistance(tabSpots, { lat: geoState.lat, lng: geoState.lng })
    }
    // 位置情報の取得中は、選択中のタブの定点をDB順のまま出しておく
    return tabSpots
  }, [state, tabSpots, postsState, sortMode, geoState])

  const distances = useMemo(() => {
    if (state.status !== 'loaded' || geoState.status !== 'success') return new Map<string, number>()
    return getDistancesBySpot(tabSpots, { lat: geoState.lat, lng: geoState.lng })
  }, [state, tabSpots, geoState])

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
    return getSuccessionDaysBySpot(tabSpots, posts, new Date())
  }, [state, tabSpots, postsState])

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
                ref={(element) => {
                  if (element) tabRefs.current.set(item.kind, element)
                  else tabRefs.current.delete(item.kind)
                }}
                id={`spots-tab-${item.kind}`}
                type="button"
                role="tab"
                aria-selected={item.kind === tab}
                aria-controls="spots-tabpanel"
                tabIndex={item.kind === tab ? 0 : -1}
                className="spots-list__tab"
                onClick={() => selectTab(item.kind)}
                onKeyDown={handleTabKeyDown}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="spots-tabpanel" aria-labelledby={`spots-tab-${tab}`}>
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
            {sortedSpots.length > 0 && (
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
            )}
          </div>
        </>
      )}
    </section>
  )
}
