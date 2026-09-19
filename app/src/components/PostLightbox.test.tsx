import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PostLightbox } from './PostLightbox'
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

describe('PostLightbox', () => {
  it('shows the photo at the given index with date and comment', () => {
    const posts = [makePost({ id: 'p1', image_path: 'spot-1/a.jpg', comment: 'きれい' })]
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />,
    )
    expect(screen.getByRole('img', { name: '投稿画像' })).toHaveAttribute(
      'src',
      'https://example.test/spot-1/a.jpg',
    )
    expect(screen.getByText('8/1')).toBeInTheDocument()
    expect(screen.getByText('きれい')).toBeInTheDocument()
  })

  it('has dialog semantics', () => {
    const posts = [makePost({})]
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('does not show prev/next buttons with a single post', () => {
    const posts = [makePost({})]
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: '前の写真' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '次の写真' })).not.toBeInTheDocument()
  })

  it('navigates to the next post, wrapping around at the end', () => {
    const posts = [makePost({ id: 'p1' }), makePost({ id: 'p2' })]
    const onNavigate = vi.fn()
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={1} onClose={vi.fn()} onNavigate={onNavigate} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '次の写真' }))
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('navigates to the previous post, wrapping around at the start', () => {
    const posts = [makePost({ id: 'p1' }), makePost({ id: 'p2' })]
    const onNavigate = vi.fn()
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={vi.fn()} onNavigate={onNavigate} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '前の写真' }))
    expect(onNavigate).toHaveBeenCalledWith(1)
  })

  it('navigates with the left/right arrow keys', () => {
    const posts = [makePost({ id: 'p1' }), makePost({ id: 'p2' })]
    const onNavigate = vi.fn()
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={vi.fn()} onNavigate={onNavigate} />,
    )
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onNavigate).toHaveBeenNthCalledWith(1, 1)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(onNavigate).toHaveBeenNthCalledWith(2, 1)
  })

  it('closes on the close button, Escape key, and backdrop click', () => {
    const posts = [makePost({})]
    const onClose = vi.fn()
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={onClose} onNavigate={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('does not close when clicking inside the content', () => {
    const posts = [makePost({})]
    const onClose = vi.fn()
    render(
      <PostLightbox client={createMockClient()} posts={posts} index={0} onClose={onClose} onNavigate={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('img', { name: '投稿画像' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
