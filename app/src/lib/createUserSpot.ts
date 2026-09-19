import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post } from './types'
import { randomId } from './id'

export type CreateUserSpotInput = {
  name: string
  theme: string
  description: string
  lat: number
  lng: number
  blob: Blob
  avgColor: string
  tags: string[]
  comment: string
}

export async function createUserSpot(
  client: SupabaseClient,
  input: CreateUserSpotInput,
): Promise<Post> {
  const imagePath = `user-spots/${randomId()}.jpg`

  const { data: uploadData, error: uploadError } = await client.storage
    .from('posts')
    .upload(imagePath, input.blob, { contentType: 'image/jpeg' })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  // create_user_spot RPCはスポット作成+投稿insertをアトミックに行うため、
  // createPost.tsのようなアップロード後のロールバックは不要
  // （storage.objectsにDELETEポリシーが無く、どのみち実行できない）
  const { data, error: rpcError } = await client.rpc('create_user_spot', {
    p_name: input.name,
    p_theme: input.theme,
    p_lat: input.lat,
    p_lng: input.lng,
    p_description: input.description || null,
    p_image_path: uploadData.path,
    p_comment: input.comment.trim() || null,
    p_tags: input.tags,
    p_avg_color: input.avgColor,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  return data as Post
}
