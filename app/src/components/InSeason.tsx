import { Link } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InSeasonEntry } from '../lib/tags'
import { tagPath } from '../lib/tags'
import { getPostImageUrl } from '../lib/postImage'
import './InSeason.css'

export type InSeasonProps = {
  client: SupabaseClient
  entry: InSeasonEntry | null
}

function describeSpots(spotNames: string[]): string {
  if (spotNames.length <= 1) return spotNames[0] ?? ''
  return `${spotNames[0]}ほか${spotNames.length - 1}か所`
}

// 直近の投稿タグから季節の見頃を出す。該当する投稿が無い時期は何も表示しない
export function InSeason({ client, entry }: InSeasonProps) {
  if (!entry) return null

  const spots = describeSpots(entry.spotNames)

  return (
    <div className="in-season">
      <h3 className="in-season__heading">いま見頃</h3>
      <Link
        to={tagPath(entry.tag)}
        className="in-season__link"
        aria-label={`${entry.tag} ${spots} 直近7日の投稿${entry.count}件`}
      >
        <img
          src={getPostImageUrl(client, entry.latestImagePath)}
          alt=""
          className="in-season__thumb"
          loading="lazy"
          decoding="async"
        />
        <span className="in-season__body">
          <span className="in-season__tag">{entry.tag}</span>
          <span className="in-season__spots">{spots}</span>
          <span className="in-season__count">
            直近7日の投稿 <span className="tabular-nums">{entry.count}</span>件
          </span>
        </span>
        <span className="in-season__more" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  )
}
