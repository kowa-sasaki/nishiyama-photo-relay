import { describe, it, expect } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LastViewedSpotProvider, useLastViewedSpot } from './LastViewedSpotContext'

function SpotIdDisplay() {
  const { lastViewedSpotId, setLastViewedSpotId } = useLastViewedSpot()
  return (
    <div>
      <p>current: {lastViewedSpotId ?? 'none'}</p>
      <button type="button" onClick={() => setLastViewedSpotId('spot-1')}>
        set
      </button>
    </div>
  )
}

describe('useLastViewedSpot', () => {
  it('throws when called outside LastViewedSpotProvider', () => {
    expect(() => renderHook(() => useLastViewedSpot())).toThrow(
      'useLastViewedSpot は LastViewedSpotProvider の内側でのみ使用できる',
    )
  })
})

describe('LastViewedSpotProvider', () => {
  it('starts with null and updates when setLastViewedSpotId is called', async () => {
    const user = userEvent.setup()
    render(
      <LastViewedSpotProvider>
        <SpotIdDisplay />
      </LastViewedSpotProvider>,
    )
    expect(screen.getByText('current: none')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'set' }))
    expect(screen.getByText('current: spot-1')).toBeInTheDocument()
  })
})
