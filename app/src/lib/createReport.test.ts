import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createReport } from './createReport'

function createMockClient(options: { insertError?: { message: string } | null } = {}) {
  const insert = vi.fn().mockResolvedValue({ data: null, error: options.insertError ?? null })
  const client = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient
  return { client, insert }
}

describe('createReport', () => {
  it('inserts a reports row with the mapped column names', async () => {
    const { client, insert } = createMockClient()
    await createReport(client, {
      targetType: 'post',
      targetId: 'post-1',
      reason: 'spam',
      deviceId: 'device-1',
    })
    expect(insert).toHaveBeenCalledWith({
      target_type: 'post',
      target_id: 'post-1',
      reason: 'spam',
      device_id: 'device-1',
    })
  })

  it('allows a null device_id when the reporter is not signed in yet', async () => {
    const { client, insert } = createMockClient()
    await createReport(client, {
      targetType: 'spot',
      targetId: 'spot-1',
      reason: 'other',
      deviceId: null,
    })
    expect(insert).toHaveBeenCalledWith({
      target_type: 'spot',
      target_id: 'spot-1',
      reason: 'other',
      device_id: null,
    })
  })

  it('throws when the insert fails', async () => {
    const { client } = createMockClient({ insertError: { message: 'insert failed' } })
    await expect(
      createReport(client, { targetType: 'spot', targetId: 'spot-1', reason: 'other', deviceId: null }),
    ).rejects.toThrow('insert failed')
  })
})
