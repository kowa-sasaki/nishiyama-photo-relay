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
})
