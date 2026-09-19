import { Link } from 'react-router-dom'
import type { RankingEntry } from '../lib/spotRanking'
import './SpotRanking.css'

export type SpotRankingProps = {
  heading: string
  entries: RankingEntry[]
}

export function SpotRanking({ heading, entries }: SpotRankingProps) {
  if (entries.length === 0) return null

  return (
    <div className="spot-ranking">
      <h3 className="spot-ranking__heading">{heading}</h3>
      <ol className="spot-ranking__list">
        {entries.map((entry, index) => (
          <li key={entry.spotId} className="spot-ranking__item">
            <Link
              to={`/spots/${entry.spotId}`}
              className="spot-ranking__link"
              aria-label={`${index + 1}位 ${entry.spotName} ${entry.displayValue}`}
            >
              <span className="spot-ranking__rank tabular-nums">{index + 1}</span>
              <span className="spot-ranking__name">{entry.spotName}</span>
              <span className="spot-ranking__count tabular-nums">{entry.displayValue}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
