import type { SupabaseClient } from '@supabase/supabase-js'

export function getPostImageUrl(client: SupabaseClient, imagePath: string): string {
  return client.storage.from('posts').getPublicUrl(imagePath).data.publicUrl
}
