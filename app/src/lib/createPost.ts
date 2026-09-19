import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post } from './types'
import { randomId } from './id'

export type CreatePostInput = {
  spotId: string
  blob: Blob
  avgColor: string
  tags: string[]
  comment: string
  deviceId: string
}

export async function createPost(client: SupabaseClient, input: CreatePostInput): Promise<Post> {
  const imagePath = `${input.spotId}/${randomId()}.jpg`

  const { data: uploadData, error: uploadError } = await client.storage
    .from('posts')
    .upload(imagePath, input.blob, { contentType: 'image/jpeg' })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const uploadedPath = uploadData.path

  const { data, error: insertError } = await client
    .from('posts')
    .insert({
      spot_id: input.spotId,
      image_path: uploadedPath,
      comment: input.comment.trim() || null,
      tags: input.tags,
      avg_color: input.avgColor,
      device_id: input.deviceId,
    })
    .select()
    .single()

  if (insertError) {
    // Best-effort cleanup of the orphaned upload. As of the current deployed
    // schema, storage.objects has no DELETE policy for any role, so this
    // call is expected to fail in production — it's kept in case the policy
    // is added later, and the failure is surfaced via console.warn (rather
    // than thrown) so it doesn't mask the original insert error below.
    const { error: rollbackError } = await client.storage.from('posts').remove([uploadedPath])
    if (rollbackError) {
      console.warn('投稿のロールバックに失敗しました（アップロード済みファイルが残る可能性があります）', {
        insertError,
        rollbackError,
      })
    }
    throw new Error(insertError.message)
  }

  return data as Post
}
