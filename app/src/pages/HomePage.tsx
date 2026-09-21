import { useMemo, useState } from 'react'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import { useAllPosts } from '../lib/useAllPosts'
import { useSpots } from '../lib/useSpots'
import { useVisitorsDaily } from '../lib/useVisitorsDaily'
import { buildParkTimeline, timelineMonthDay } from '../lib/parkTimeline'
import { buildSpotRanking } from '../lib/spotRanking'
import { buildSuccessionDaysRanking } from '../lib/successionDays'
import { HeroSlideshow } from '../components/HeroSlideshow'
import { ParkTimeline } from '../components/ParkTimeline'
import { SpotRanking } from '../components/SpotRanking'
import './HomePage.css'

export function HomePage() {
  const { client, envError } = getSupabaseClientSafe()
  const postsState = useAllPosts(client)
  const spotsState = useSpots(client)
  const visitorsState = useVisitorsDaily()
  const [selectedMonthDay, setSelectedMonthDay] = useState<string | null>(null)

  const visitorsDaily = useMemo(
    () => (visitorsState.status === 'loaded' ? visitorsState.data : []),
    [visitorsState],
  )
  const days = useMemo(
    () => (postsState.status === 'loaded' ? buildParkTimeline(postsState.posts, visitorsDaily) : []),
    [postsState, visitorsDaily],
  )
  const popularityRanking = useMemo(
    () => (postsState.status === 'loaded' ? buildSpotRanking(postsState.posts, new Date()) : []),
    [postsState],
  )
  const successionRanking = useMemo(
    () =>
      postsState.status === 'loaded' && spotsState.status === 'loaded'
        ? buildSuccessionDaysRanking(spotsState.spots, postsState.posts, new Date()).map((entry) => ({
            ...entry,
            displayValue: `${entry.days}日目`,
          }))
        : [],
    [postsState, spotsState],
  )
  const todayMonthDay = useMemo(() => timelineMonthDay(new Date().toISOString()), [])
  const selectedDay = days.find((d) => d.monthDay === selectedMonthDay) ?? null

  if (envError) {
    return (
      <section aria-labelledby="home-heading">
        <h1 id="home-heading">ホーム</h1>
        <p>{envError}</p>
      </section>
    )
  }

  if (postsState.status === 'loading') {
    return (
      <section aria-labelledby="home-heading">
        <h1 id="home-heading">ホーム</h1>
        <p>読み込み中…</p>
      </section>
    )
  }

  if (postsState.status === 'error') {
    return (
      <section aria-labelledby="home-heading">
        <h1 id="home-heading">ホーム</h1>
        <p>投稿を取得できませんでした: {postsState.message}</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="home-heading" className="home-page">
      <h1 id="home-heading" className="home-page__title">
        <span className="home-page__title-lead">みんなでつなぐ</span>
        <span className="home-page__title-brand">西山公園フォトリレー</span>
      </h1>
      <HeroSlideshow client={client} recentPosts={postsState.posts} selectedDay={selectedDay} />
      <ParkTimeline
        days={days}
        selectedMonthDay={selectedMonthDay}
        todayMonthDay={todayMonthDay}
        onSelectDay={setSelectedMonthDay}
        onReset={() => setSelectedMonthDay(null)}
      />
      <SpotRanking heading="いま賑わっている定点" entries={popularityRanking} />
      <SpotRanking heading="長くつながっている定点" entries={successionRanking} />
    </section>
  )
}
