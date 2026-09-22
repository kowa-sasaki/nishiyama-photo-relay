import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButton } from './ShareButton'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ShareButton', () => {
  it('calls navigator.share when available', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(share).toHaveBeenCalledWith({ text: '投稿しました', url: 'https://example.com/spots/spot-1' })
  })

  it('falls back to clipboard copy when navigator.share is unavailable', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(writeText).toHaveBeenCalledWith('投稿しました https://example.com/spots/spot-1')
    expect(await screen.findByText('URLをコピーしました')).toBeInTheDocument()
  })

  it('shows nothing when the share sheet is dismissed', async () => {
    const user = userEvent.setup()
    const abortError = new Error('Share canceled')
    abortError.name = 'AbortError'
    const share = vi.fn().mockRejectedValue(abortError)
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText } })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('falls back to clipboard copy when navigator.share fails', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockRejectedValue(new Error('Permission denied'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText } })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(writeText).toHaveBeenCalledWith('投稿しました https://example.com/spots/spot-1')
    expect(await screen.findByText('URLをコピーしました')).toBeInTheDocument()
  })

  it('shows a failure message when the clipboard is unavailable', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: undefined })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(await screen.findByText('コピーできませんでした')).toBeInTheDocument()
  })

  it('shows a failure message when the clipboard write is rejected', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })
    render(<ShareButton url="https://example.com/spots/spot-1" text="投稿しました" />)
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(await screen.findByText('コピーできませんでした')).toBeInTheDocument()
  })
})
