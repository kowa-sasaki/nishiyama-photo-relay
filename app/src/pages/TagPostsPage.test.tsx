import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { TagPostsPage } from './TagPostsPage'
import * as useAllPostsModule from '../lib/useAllPosts'
import * as postImageModule from '../lib/postImage'
import { getSupabaseClientSafe } from '../lib/supabaseClient'
import type { PostWithSpot } from '../lib/types'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

const posts: PostWithSpot[] = [
  {
    id: 'a',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: '真っ赤',
    tags: ['もみじ', '夕日'],
    avg_color: null,
    created_at: '2026-11-10T00:00:00Z',
    device_id: 'd',
    spots: { name: '上段の庭（もみじ）' },
  },
  {
    id: 'b',
    spot_id: 'spot-2',
    image_path: 'spot-2/b.jpg',
    comment: null,
    tags: ['紅葉'],
    avg_color: null,
    created_at: '2026-11-08T00:00:00Z',
    device_id: 'd',
    spots: { name: '大噴水前' },
  },
  {
    id: 'c',
    spot_id: 'spot-2',
    image_path: 'spot-2/c.jpg',
    comment: '桜の写真',
    tags: ['桜'],
    avg_color: null,
    created_at: '2026-04-05T00:00:00Z',
    device_id: 'd',
    spots: { name: '大噴水前' },
  },
]

beforeEach(() => {
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
  vi.spyOn(postImageModule, 'getPostImageUrl').mockReturnValue('https://example.test/image.jpg')
  vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loaded', posts })
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tags/:tag" element={<TagPostsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TagPostsPage', () => {
  it('lists posts from every spot whose tags match, including alias spellings', () => {
    renderAt(`/tags/${encodeURIComponent('紅葉')}`)
    expect(screen.getByRole('heading', { name: '紅葉の写真' })).toBeInTheDocument()
    expect(screen.getByText('件（新しい順）', { exact: false })).toHaveTextContent('公園全体で2件（新しい順）')
    expect(screen.getByRole('link', { name: '上段の庭（もみじ）' })).toHaveAttribute('href', '/spots/spot-1')
    expect(screen.getByRole('link', { name: '大噴水前' })).toHaveAttribute('href', '/spots/spot-2')
    expect(screen.queryByText('桜の写真')).not.toBeInTheDocument()
  })

  it('normalizes the tag in the URL', () => {
    renderAt(`/tags/${encodeURIComponent('もみじ')}`)
    expect(screen.getByRole('heading', { name: '紅葉の写真' })).toBeInTheDocument()
  })

  it('marks the current tag and links other tags to their own lists', () => {
    renderAt(`/tags/${encodeURIComponent('紅葉')}`)
    const tagLists = screen.getAllByRole('list', { name: 'タグ' })
    const first = within(tagLists[0])
    expect(first.getByRole('link', { name: 'もみじ' })).toHaveAttribute('aria-current', 'page')
    expect(first.getByRole('link', { name: '夕日' })).toHaveAttribute('href', `/tags/${encodeURIComponent('夕日')}`)
  })

  it('opens the lightbox for a photo', async () => {
    const user = userEvent.setup()
    renderAt(`/tags/${encodeURIComponent('紅葉')}`)
    await user.click(screen.getByRole('button', { name: '1枚目の写真を拡大表示' }))
    expect(screen.getByRole('dialog', { name: '投稿写真の拡大表示' })).toBeInTheDocument()
  })

  it('says so when no post has the tag', () => {
    renderAt(`/tags/${encodeURIComponent('雪')}`)
    expect(screen.getByText('このタグの投稿はまだありません。')).toBeInTheDocument()
  })

  it('links back to home when opened directly, and goes back when reached from inside the app', async () => {
    const user = userEvent.setup()
    renderAt(`/tags/${encodeURIComponent('紅葉')}`)
    expect(screen.getByRole('link', { name: '← ホームへ' })).toHaveAttribute('href', '/')

    render(
      <MemoryRouter initialEntries={['/spots/spot-1']}>
        <Routes>
          <Route path="/spots/:spotId" element={<Link to={`/tags/${encodeURIComponent('紅葉')}`}>紅葉へ</Link>} />
          <Route path="/tags/:tag" element={<TagPostsPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('link', { name: '紅葉へ' }))
    await user.click(screen.getByRole('button', { name: '← 戻る' }))
    expect(screen.getByRole('link', { name: '紅葉へ' })).toBeInTheDocument()
  })

  it('shows a loading message', () => {
    vi.spyOn(useAllPostsModule, 'useAllPosts').mockReturnValue({ status: 'loading' })
    renderAt(`/tags/${encodeURIComponent('紅葉')}`)
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
  })
})
