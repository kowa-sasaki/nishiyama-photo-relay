import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpotRanking } from './SpotRanking'
import type { RankingEntry } from '../lib/spotRanking'

const entries: RankingEntry[] = [
  { spotId: 'spot-1', spotName: '大噴水前', displayValue: '5件', latestPostAt: '2026-08-18T00:00:00Z' },
  { spotId: 'spot-2', spotName: 'つつじ園', displayValue: '3件', latestPostAt: '2026-08-17T00:00:00Z' },
]

describe('SpotRanking', () => {
  it('renders each entry with its rank, name, and display value, linking to the spot', () => {
    render(
      <MemoryRouter>
        <SpotRanking heading="いま賑わっている定点" entries={entries} />
      </MemoryRouter>,
    )
    expect(screen.getByText('いま賑わっている定点')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /大噴水前/ })).toHaveAttribute('href', '/spots/spot-1')
    expect(screen.getByRole('link', { name: /つつじ園/ })).toHaveAttribute('href', '/spots/spot-2')
    expect(screen.getByText('5件')).toBeInTheDocument()
    expect(screen.getByText('3件')).toBeInTheDocument()
  })

  it('renders whatever heading is passed', () => {
    render(
      <MemoryRouter>
        <SpotRanking heading="長くつながっている定点" entries={entries} />
      </MemoryRouter>,
    )
    expect(screen.getByText('長くつながっている定点')).toBeInTheDocument()
  })

  it('renders nothing when entries is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <SpotRanking heading="いま賑わっている定点" entries={[]} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
