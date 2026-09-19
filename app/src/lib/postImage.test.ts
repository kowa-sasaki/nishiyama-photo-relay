import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPostImageUrl } from './postImage'

function createMockClient(publicUrl: string) {
  const from = vi.fn(() => ({
    getPublicUrl: vi.fn(() => ({ data: { publicUrl } })),
  }))
  const client = { storage: { from } } as unknown as SupabaseClient
  return { client, from }
}

describe('getPostImageUrl', () => {
  it('resolves the public URL for the given image path', () => {
    const { client } = createMockClient(
      'https://example.supabase.co/storage/v1/object/public/posts/spot-1/abc.jpg',
    )
    const url = getPostImageUrl(client, 'spot-1/abc.jpg')
    expect(url).toBe('https://example.supabase.co/storage/v1/object/public/posts/spot-1/abc.jpg')
  })

  it('resolves the URL against the posts bucket', () => {
    const { client, from } = createMockClient('https://example.com/x.jpg')
    getPostImageUrl(client, 'spot-1/abc.jpg')
    expect(from).toHaveBeenCalledWith('posts')
  })
})
