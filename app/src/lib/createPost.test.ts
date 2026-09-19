import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createPost } from './createPost'
import type { Post } from './types'

const samplePost: Post = {
  id: 'post-1',
  spot_id: 'spot-1',
  image_path: 'spot-1/generated.jpg',
  comment: 'きれいでした',
  tags: ['桜'],
  avg_color: '#f2a6c2',
  created_at: '2026-08-01T00:00:00Z',
  device_id: 'device-1',
}

function createMockClient(options: {
  uploadError?: { message: string } | null
  insertError?: { message: string } | null
  removeError?: { message: string } | null
}) {
  const remove = vi.fn().mockResolvedValue({ data: null, error: options.removeError ?? null })
  const upload = vi.fn().mockResolvedValue({
    data: options.uploadError ? null : { path: 'spot-1/generated.jpg' },
    error: options.uploadError ?? null,
  })
  const single = vi.fn().mockResolvedValue({
    data: options.insertError ? null : samplePost,
    error: options.insertError ?? null,
  })
  const insertBuilder = { select: vi.fn(() => insertBuilder), single }
  const client = {
    storage: { from: vi.fn(() => ({ upload, remove })) },
    from: vi.fn(() => ({ insert: vi.fn(() => insertBuilder) })),
  } as unknown as SupabaseClient
  return { client, upload, remove, single }
}

const input = {
  spotId: 'spot-1',
  blob: new Blob(['fake-image'], { type: 'image/jpeg' }),
  avgColor: '#f2a6c2',
  tags: ['桜'],
  comment: 'きれいでした',
  deviceId: 'device-1',
}

describe('createPost', () => {
  it('uploads the image then inserts a posts row', async () => {
    const { client, upload } = createMockClient({})
    const result = await createPost(client, input)
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toMatch(/^spot-1\/.+\.jpg$/)
    expect(result).toEqual(samplePost)
  })

  it('throws when the upload fails, without attempting an insert', async () => {
    const { client, single } = createMockClient({ uploadError: { message: 'upload failed' } })
    await expect(createPost(client, input)).rejects.toThrow('upload failed')
    expect(single).not.toHaveBeenCalled()
  })

  it('removes the uploaded object when the insert fails', async () => {
    const { client, remove } = createMockClient({ insertError: { message: 'insert failed' } })
    await expect(createPost(client, input)).rejects.toThrow('insert failed')
    expect(remove).toHaveBeenCalledWith(['spot-1/generated.jpg'])
  })

  it('still surfaces the original insert error, not a new one, when the rollback itself fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { client, remove } = createMockClient({
      insertError: { message: 'insert failed' },
      removeError: { message: 'no delete policy' },
    })
    await expect(createPost(client, input)).rejects.toThrow('insert failed')
    expect(remove).toHaveBeenCalledWith(['spot-1/generated.jpg'])
    warnSpy.mockRestore()
  })
})
