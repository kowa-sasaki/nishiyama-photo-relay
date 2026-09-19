import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ReportButton } from './ReportButton'

function createMockClient(options: { insertError?: { message: string } | null } = {}) {
  const insert = vi.fn().mockResolvedValue({ data: null, error: options.insertError ?? null })
  const client = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient
  return { client, insert }
}

describe('ReportButton', () => {
  it('shows a toggle button initially', () => {
    const { client } = createMockClient()
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId="device-1" />)
    expect(screen.getByRole('button', { name: '報告する' })).toBeInTheDocument()
  })

  it('opens the reason form when the toggle is clicked, with a default reason selected', async () => {
    const user = userEvent.setup()
    const { client } = createMockClient()
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId="device-1" />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    expect(screen.getByRole('radio', { name: '不適切な画像・内容' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'スパム・広告' })).not.toBeChecked()
  })

  it('submits the selected reason and shows a confirmation', async () => {
    const user = userEvent.setup()
    const { client, insert } = createMockClient()
    render(<ReportButton client={client} targetType="spot" targetId="spot-1" deviceId="device-1" />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    await user.click(screen.getByRole('radio', { name: 'スパム・広告' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(insert).toHaveBeenCalledWith({
      target_type: 'spot',
      target_id: 'spot-1',
      reason: 'spam',
      device_id: 'device-1',
    })
    expect(await screen.findByText('報告を受け付けました。ご協力ありがとうございます。')).toBeInTheDocument()
  })

  it('shows an error message and keeps the form open for retry when submission fails', async () => {
    const user = userEvent.setup()
    const { client } = createMockClient({ insertError: { message: 'insert failed' } })
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId="device-1" />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(await screen.findByText('送信に失敗しました。時間をおいて再度お試しください。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送信する' })).toBeInTheDocument()
  })

  it('returns to the toggle button when cancel is clicked, without submitting', async () => {
    const user = userEvent.setup()
    const { client, insert } = createMockClient()
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId="device-1" />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.getByRole('button', { name: '報告する' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: '不適切な画像・内容' })).not.toBeInTheDocument()
    expect(insert).not.toHaveBeenCalled()
  })

  it('does not resolve into the done state if cancelled while a submit is in flight', async () => {
    const user = userEvent.setup()
    let resolveInsert: (value: { data: null; error: null }) => void = () => {}
    const insert = vi.fn(() => new Promise((resolve) => { resolveInsert = resolve }))
    const client = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId="device-1" />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    resolveInsert({ data: null, error: null })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.getByRole('button', { name: '報告する' })).toBeInTheDocument()
    expect(screen.queryByText('報告を受け付けました。ご協力ありがとうございます。')).not.toBeInTheDocument()
  })

  it('passes a null device_id through when the reporter is not signed in yet', async () => {
    const user = userEvent.setup()
    const { client, insert } = createMockClient()
    render(<ReportButton client={client} targetType="post" targetId="post-1" deviceId={null} />)
    await user.click(screen.getByRole('button', { name: '報告する' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ device_id: null }))
  })
})
