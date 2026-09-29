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
  it('renders nothing when there are no entries', () => {
    const { container } = render(
      <MemoryRouter>
        <InSeason client={client} entries={[]} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('links each tag to its photo list and summarizes the spots', () => {
    render(
      <MemoryRouter>
        <InSeason
          client={client}
          entries={[
            { tag: '紅葉', count: 5, spotNames: ['上段の庭（もみじ）', '大噴水前', '愛の鐘・展望台'], latestImagePath: 'a.jpg' },
            { tag: '花', count: 1, spotNames: ['大噴水前'], latestImagePath: 'b.jpg' },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'いま見頃' })).toBeInTheDocument()
    const koyo = screen.getByRole('link', { name: '紅葉 5件 上段の庭（もみじ）ほか2か所' })
    expect(koyo).toHaveAttribute('href', `/tags/${encodeURIComponent('紅葉')}`)
    expect(screen.getByRole('link', { name: '花 1件 大噴水前' })).toBeInTheDocument()
  })
})
