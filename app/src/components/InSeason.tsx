import { Link } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InSeasonEntry } from '../lib/tags'
import { tagPath } from '../lib/tags'
import { getPostImageUrl } from '../lib/postImage'
import './InSeason.css'

export type InSeasonProps = {
  client: SupabaseClient
  entries: InSeasonEntry[]
}

function describeSpots(spotNames: string[]): string {
  if (spotNames.length <= 1) return spotNames[0] ?? ''
  return `${spotNames[0]}ほか${spotNames.length - 1}か所`
}

// 直近の投稿タグから季節の見頃を出す。該当する投稿が無い時期は何も表示しない
export function InSeason({ client, entries }: InSeasonProps) {
  if (entries.length === 0) return null

  return (
    <div className="in-season">
      <h3 className="in-season__heading">いま見頃</h3>
      <p className="in-season__note">直近7日の投稿タグから</p>
      <ul className="in-season__list">
        {entries.map((entry) => (
          <li key={entry.tag}>
            <Link
              to={tagPath(entry.tag)}
              className="in-season__link"
              aria-label={`${entry.tag} ${entry.count}件 ${describeSpots(entry.spotNames)}`}
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
                <span className="in-season__spots">{describeSpots(entry.spotNames)}</span>
              </span>
              <span className="in-season__count tabular-nums">{entry.count}件</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
