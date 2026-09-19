import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUserSpot } from './createUserSpot'
import type { Post } from './types'

const samplePost: Post = {
  id: 'post-1',
  spot_id: 'spot-new',
  image_path: 'user-spots/generated.jpg',
  comment: 'ランニング途中に見つけました',
  tags: ['新緑'],
  avg_color: '#8fbf6a',
  created_at: '2026-08-17T00:00:00Z',
  device_id: 'device-1',
}

function createMockClient(options: {
  uploadError?: { message: string } | null
  rpcError?: { message: string } | null
}) {
  const upload = vi.fn().mockResolvedValue({
    data: options.uploadError ? null : { path: 'user-spots/generated.jpg' },
    error: options.uploadError ?? null,
  })
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpcError ? null : samplePost,
    error: options.rpcError ?? null,
  })
  const client = {
    storage: { from: vi.fn(() => ({ upload })) },
    rpc,
  } as unknown as SupabaseClient
  return { client, upload, rpc }
}

const input = {
  name: '北口ベンチ',
  theme: 'ランニング途中によってみた',
  description: '',
  lat: 35.9,
  lng: 136.2,
  blob: new Blob(['fake-image'], { type: 'image/jpeg' }),
  avgColor: '#8fbf6a',
  tags: ['新緑'],
  comment: 'ランニング途中に見つけました',
}

describe('createUserSpot', () => {
  it('uploads the image then calls the create_user_spot RPC', async () => {
    const { client, upload, rpc } = createMockClient({})
    const result = await createUserSpot(client, input)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toMatch(/^user-spots\/.+\.jpg$/)
    expect(rpc).toHaveBeenCalledWith('create_user_spot', {
      p_name: '北口ベンチ',
      p_theme: 'ランニング途中によってみた',
      p_lat: 35.9,
      p_lng: 136.2,
      p_description: null,
      p_image_path: 'user-spots/generated.jpg',
      p_comment: 'ランニング途中に見つけました',
      p_tags: ['新緑'],
      p_avg_color: '#8fbf6a',
    })
    expect(result).toEqual(samplePost)
  })

  it('passes a non-empty description through as-is', async () => {
    const { client, rpc } = createMockClient({})
    await createUserSpot(client, { ...input, description: '西口の並木道沿い' })
    expect(rpc).toHaveBeenCalledWith(
      'create_user_spot',
      expect.objectContaining({ p_description: '西口の並木道沿い' }),
    )
  })

  it('trims the comment and stores null when it is empty or whitespace-only', async () => {
    const { client, rpc } = createMockClient({})
    await createUserSpot(client, { ...input, comment: '  いい眺めでした  ' })
    expect(rpc).toHaveBeenCalledWith(
      'create_user_spot',
      expect.objectContaining({ p_comment: 'いい眺めでした' }),
    )

    await createUserSpot(client, { ...input, comment: '   ' })
    expect(rpc).toHaveBeenLastCalledWith(
      'create_user_spot',
      expect.objectContaining({ p_comment: null }),
    )
  })

  it('throws when the upload fails, without calling the RPC', async () => {
    const { client, rpc } = createMockClient({ uploadError: { message: 'upload failed' } })
    await expect(createUserSpot(client, input)).rejects.toThrow('upload failed')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('throws when the RPC fails', async () => {
    const { client } = createMockClient({ rpcError: { message: 'insert failed' } })
    await expect(createUserSpot(client, input)).rejects.toThrow('insert failed')
  })
})
