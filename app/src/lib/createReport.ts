import type { SupabaseClient } from '@supabase/supabase-js'

export type ReportTargetType = 'spot' | 'post'

export type CreateReportInput = {
  targetType: ReportTargetType
  targetId: string
  reason: string
  deviceId: string | null
}

export async function createReport(client: SupabaseClient, input: CreateReportInput): Promise<void> {
  const { error } = await client.from('reports').insert({
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    device_id: input.deviceId,
  })

  if (error) {
    throw new Error(error.message)
  }
}
