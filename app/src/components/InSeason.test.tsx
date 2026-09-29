import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InSeason } from './InSeason'
import * as postImageModule from '../lib/postImage'

const client = {} as Parameters<typeof InSeason>[0]['client']

beforeEach(() => {
  vi.spyOn(postImageModule, 'getPostImageUrl').mockReturnValue('https://example.test/image.jpg')
})

describe('InSeason', () => {
  it('renders nothing when nothing is in season', () => {
    const { container } = render(
      <MemoryRouter>
        <InSeason client={client} entry={null} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('links the tag to its photo list and summarizes the spots', () => {
    render(
      <MemoryRouter>
        <InSeason
          client={client}
          entry={{ tag: '紅葉', count: 5, spotNames: ['上段の庭（もみじ）', '大噴水前', '愛の鐘・展望台'], latestImagePath: 'a.jpg' }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'いま見頃' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '紅葉 上段の庭（もみじ）ほか2か所 直近7日の投稿5件' }),
    ).toHaveAttribute('href', `/tags/${encodeURIComponent('紅葉')}`)
  })
})
