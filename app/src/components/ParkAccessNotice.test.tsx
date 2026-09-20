import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoBanner, ParkAccessNotice } from './ParkAccessNotice'

describe('ParkAccessNotice', () => {
  it('shows only a status line while checking', () => {
    render(<ParkAccessNotice access={{ status: 'checking' }} onRetry={vi.fn()} onStartDemo={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('現在地を確認中…')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('explains that posting is for inside the park, and offers re-check and demo when outside', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onStartDemo = vi.fn()
    render(
      <ParkAccessNotice
        access={{ status: 'outside', lat: 35.9, lng: 136.2 }}
        onRetry={onRetry}
        onStartDemo={onStartDemo}
      />,
    )
    expect(screen.getByText('投稿は西山公園の中でできます。公園内で開き直してください。')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '現在地を再確認' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'デモ投稿を試す' }))
    expect(onStartDemo).toHaveBeenCalledTimes(1)
    expect(screen.getByText('デモ投稿は操作を試せますが、保存はされません。')).toBeInTheDocument()
  })

  it('asks to allow location and offers retry and demo when unavailable', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onStartDemo = vi.fn()
    render(
      <ParkAccessNotice
        access={{ status: 'unavailable', message: 'denied' }}
        onRetry={onRetry}
        onStartDemo={onStartDemo}
      />,
    )
    expect(
      screen.getByText('位置情報を確認できませんでした。西山公園の中で、位置情報の利用を許可してください。'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '位置情報を許可して再試行' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'デモ投稿を試す' }))
    expect(onStartDemo).toHaveBeenCalledTimes(1)
  })
})

describe('DemoBanner', () => {
  it('states that nothing is saved', () => {
    render(<DemoBanner />)
    expect(screen.getByRole('status')).toHaveTextContent('デモ：保存されません')
  })
})
