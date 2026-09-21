import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoBanner, ParkAccessNotice } from './ParkAccessNotice'

describe('ParkAccessNotice', () => {
  it('shows a status line while checking, and reveals only the demo entry after a delay', () => {
    vi.useFakeTimers()
    try {
      const onRetry = vi.fn()
      const onStartDemo = vi.fn()
      render(<ParkAccessNotice access={{ status: 'checking' }} onRetry={onRetry} onStartDemo={onStartDemo} />)
      expect(screen.getByRole('status')).toHaveTextContent('現在地を確認中…')
      // 再確認ボタンは結果が出るまで押せない状態で先に置き、結果表示でボタン位置がずれないようにする
      expect(screen.getByRole('button', { name: '現在地を再確認' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'デモ投稿を試す' })).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByRole('status')).toHaveTextContent('現在地を確認中…')
      expect(screen.getByText('デモ投稿は操作を試せますが、保存はされません。')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'デモ投稿を試す' }))
      expect(onStartDemo).toHaveBeenCalledTimes(1)
      expect(onRetry).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
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

describe('ParkAccessNotice transitions', () => {
  it('announces the result through the same status region and keeps the demo entry in place', () => {
    const onRetry = vi.fn()
    const onStartDemo = vi.fn()
    const { rerender } = render(
      <ParkAccessNotice access={{ status: 'checking' }} onRetry={onRetry} onStartDemo={onStartDemo} />,
    )
    const status = screen.getByRole('status')
    rerender(
      <ParkAccessNotice
        access={{ status: 'outside', lat: 35.9, lng: 136.2 }}
        onRetry={onRetry}
        onStartDemo={onStartDemo}
      />,
    )
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('投稿は西山公園の中でできます。公園内で開き直してください。')
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    expect(buttons).toEqual(['現在地を再確認', 'デモ投稿を試す'])
    expect(screen.getByRole('button', { name: '現在地を再確認' })).toBeEnabled()
  })

  it('uses spot-creation wording when purpose is spot', () => {
    render(
      <ParkAccessNotice
        access={{ status: 'outside', lat: 35.9, lng: 136.2 }}
        onRetry={vi.fn()}
        onStartDemo={vi.fn()}
        purpose="spot"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('新しい定点は西山公園の中でつくれます。公園内で開き直してください。')
    expect(screen.getByRole('button', { name: 'デモで定点をつくってみる' })).toBeInTheDocument()
  })
})

describe('DemoBanner', () => {
  it('states that nothing is saved', () => {
    render(<DemoBanner />)
    expect(screen.getByRole('status')).toHaveTextContent('デモ：保存されません')
  })
})
