import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SpotHeroSlideshow } from './SpotHeroSlideshow'
import type { Post } from '../lib/types'

function createMockClient(): SupabaseClient {
  return {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }),
      }),
    },
  } as unknown as SupabaseClient
}

function makePost(overrides: Partial<Post>): Post {
  return {
    id: 'post-1',
    spot_id: 'spot-1',
    image_path: 'spot-1/a.jpg',
    comment: 'きれいでした',
    tags: [],
    avg_color: '#4c7a32',
    created_at: '2026-08-01T00:00:00Z',
    device_id: 'device-1',
    ...overrides,
  }
}

describe('SpotHeroSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there are no posts', () => {
    const { container } = render(
      <SpotHeroSlideshow client={createMockClient()} posts={[]} onPhotoClick={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the first post initially', () => {
    const posts = [makePost({ id: 'p1', comment: '1枚目' })]
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={vi.fn()} />)
    expect(screen.getByText('1枚目')).toBeInTheDocument()
    expect(screen.getByText('8/1')).toBeInTheDocument()
  })

  it('cycles through posts on an interval', () => {
    const posts = [
      makePost({ id: 'p1', comment: '1枚目' }),
      makePost({ id: 'p2', comment: '2枚目' }),
    ]
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={vi.fn()} />)
    expect(screen.getByText('1枚目')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByText('2枚目')).toBeInTheDocument()
  })

  it('calls onPhotoClick with the active index when the photo is clicked', () => {
    const posts = [
      makePost({ id: 'p1', comment: '1枚目' }),
      makePost({ id: 'p2', comment: '2枚目' }),
    ]
    const onPhotoClick = vi.fn()
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={onPhotoClick} />)
    fireEvent.click(screen.getByRole('button', { name: '写真を拡大表示' }))
    expect(onPhotoClick).toHaveBeenCalledWith(0)
  })

  it('switches the active photo when a dot is clicked, without calling onPhotoClick', () => {
    const posts = [
      makePost({ id: 'p1', comment: '1枚目' }),
      makePost({ id: 'p2', comment: '2枚目' }),
    ]
    const onPhotoClick = vi.fn()
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={onPhotoClick} />)
    const dots = document.querySelectorAll('.spot-hero-slideshow__dot')
    expect(dots).toHaveLength(2)
    fireEvent.click(dots[1])
    expect(screen.getByText('2枚目')).toBeInTheDocument()
    expect(onPhotoClick).not.toHaveBeenCalled()
  })

  it('does not show dots with a single post', () => {
    const posts = [makePost({ id: 'p1' })]
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={vi.fn()} />)
    expect(document.querySelectorAll('.spot-hero-slideshow__dot')).toHaveLength(0)
  })

  it('does not autoplay when prefers-reduced-motion is enabled', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const posts = [
      makePost({ id: 'p1', comment: '1枚目' }),
      makePost({ id: 'p2', comment: '2枚目' }),
    ]
    render(<SpotHeroSlideshow client={createMockClient()} posts={posts} onPhotoClick={vi.fn()} />)
    expect(screen.getByText('1枚目')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByText('1枚目')).toBeInTheDocument()
    expect(screen.queryByText('2枚目')).not.toBeInTheDocument()
  })
})
