import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NewSpotPage } from './NewSpotPage'
import * as authModule from '../lib/AuthContext'
import * as imageModule from '../lib/image'
import * as geolocationModule from '../lib/useGeolocation'
import * as createUserSpotModule from '../lib/createUserSpot'
import { getSupabaseClientSafe } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderNewSpotPage() {
  return render(
    <MemoryRouter>
      <NewSpotPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
  vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'signed-in', userId: 'device-1' })
  vi.spyOn(imageModule, 'resizeAndAnalyzeImage').mockResolvedValue({
    blob: new Blob(['resized'], { type: 'image/jpeg' }),
    avgColor: '#8fbf6a',
  })
  vi.spyOn(geolocationModule, 'useGeolocation').mockReturnValue({
    state: { status: 'success', lat: 35.9503, lng: 136.1815 },
    retry: vi.fn(),
  })
})

async function fillPhotoAndReachCompose(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
  await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
  await waitFor(() => expect(screen.getByLabelText('定点名')).toBeInTheDocument())
}

describe('NewSpotPage', () => {
  it('shows file pickers on the select step', () => {
    renderNewSpotPage()
    expect(screen.getByRole('heading', { name: '新しい定点をつくる' })).toBeInTheDocument()
    expect(screen.getByLabelText('カメラで撮る')).toBeInTheDocument()
    expect(screen.getByLabelText('ギャラリーから選ぶ')).toBeInTheDocument()
  })

  it('disables the 次へ button until name and theme are both filled in', async () => {
    const user = userEvent.setup()
    renderNewSpotPage()
    await fillPhotoAndReachCompose(user)

    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()

    await user.type(screen.getByLabelText('定点名'), '北口ベンチ')
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()

    await user.type(screen.getByLabelText('お題'), 'ランニング途中によってみた')
    expect(screen.getByRole('button', { name: '次へ' })).toBeEnabled()
  })

  it('walks through compose -> confirm -> done and submits a new spot', async () => {
    const user = userEvent.setup()
    const createUserSpotSpy = vi.spyOn(createUserSpotModule, 'createUserSpot').mockResolvedValue({
      id: 'post-new',
      spot_id: 'spot-new',
      image_path: 'user-spots/new.jpg',
      comment: 'いい眺めでした',
      tags: ['新緑'],
      avg_color: '#8fbf6a',
      created_at: '2026-08-17T00:00:00Z',
      device_id: 'device-1',
    })
    renderNewSpotPage()
    await fillPhotoAndReachCompose(user)

    await user.type(screen.getByLabelText('定点名'), '北口ベンチ')
    await user.type(screen.getByLabelText('お題'), 'ランニング途中によってみた')
    await user.type(screen.getByLabelText('ひとこと（任意）'), 'いい眺めでした')
    await user.click(screen.getByRole('button', { name: '新緑' }))
    await user.click(screen.getByRole('button', { name: '次へ' }))

    expect(screen.getByText('北口ベンチ')).toBeInTheDocument()
    expect(screen.getByText('ランニング途中によってみた')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '送信する' }))

    await waitFor(() => expect(screen.getByText('定点をつくりました！')).toBeInTheDocument())
    expect(createUserSpotSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: '北口ベンチ',
        theme: 'ランニング途中によってみた',
        description: '',
        lat: 35.9503,
        lng: 136.1815,
        tags: ['新緑'],
        comment: 'いい眺めでした',
        avgColor: '#8fbf6a',
      }),
    )
    expect(screen.getByRole('link', { name: 'この定点を見る' })).toHaveAttribute(
      'href',
      '/spots/spot-new',
    )

    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(share).toHaveBeenCalledWith({
      text: '北口ベンチをつくりました #西山公園定点観測',
      url: 'http://localhost:3000/spots/spot-new',
    })
  })

  it('shows a friendly message instead of crashing when env vars are missing', () => {
    vi.mocked(getSupabaseClientSafe).mockReturnValue({
      client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
      envError: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    })
    renderNewSpotPage()
    expect(
      screen.getByText('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません'),
    ).toBeInTheDocument()
  })
})

describe('NewSpotPage park gate', () => {
  function mockLocation(state: geolocationModule.GeolocationState, retry = vi.fn()) {
    vi.spyOn(geolocationModule, 'useGeolocation').mockReturnValue({ state, retry })
    return retry
  }

  it('shows a checking status and no file pickers while the location is being checked', () => {
    mockLocation({ status: 'loading' })
    renderNewSpotPage()
    expect(screen.getByRole('heading', { name: '新しい定点をつくる' })).toBeInTheDocument()
    expect(screen.getByText('現在地を確認中…')).toBeInTheDocument()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
  })

  it('blocks creating a spot outside the park and offers the demo', () => {
    mockLocation({ status: 'success', lat: 35.9, lng: 136.2 })
    renderNewSpotPage()
    expect(screen.getByText('新しい定点は西山公園の中でつくれます。公園内で開き直してください。')).toBeInTheDocument()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'デモで定点をつくってみる' })).toBeInTheDocument()
  })

  it('blocks creating a spot when location is unavailable and retries on request', async () => {
    const user = userEvent.setup()
    const retry = mockLocation({ status: 'error', message: 'denied' })
    renderNewSpotPage()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '位置情報を許可して再試行' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('runs the whole flow in demo mode without saving anything', async () => {
    const user = userEvent.setup()
    const createUserSpotSpy = vi.spyOn(createUserSpotModule, 'createUserSpot')
    mockLocation({ status: 'success', lat: 35.9, lng: 136.2 })
    renderNewSpotPage()

    await user.click(screen.getByRole('button', { name: 'デモで定点をつくってみる' }))
    expect(screen.getByText('デモ：保存されません')).toBeInTheDocument()

    await fillPhotoAndReachCompose(user)
    await user.type(screen.getByLabelText('定点名'), '北口ベンチ')
    await user.type(screen.getByLabelText('お題'), 'ランニング途中によってみた')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))

    expect(await screen.findByText('デモの定点づくりが完了しました')).toBeInTheDocument()
    expect(screen.getByText('デモのため保存されていません。')).toBeInTheDocument()
    expect(createUserSpotSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '共有する' })).not.toBeInTheDocument()
  })

  it('lets demo mode submit even when anonymous auth is not ready', async () => {
    const user = userEvent.setup()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    mockLocation({ status: 'error', message: 'denied' })
    renderNewSpotPage()

    await user.click(screen.getByRole('button', { name: 'デモで定点をつくってみる' }))
    await fillPhotoAndReachCompose(user)
    await user.type(screen.getByLabelText('定点名'), '北口ベンチ')
    await user.type(screen.getByLabelText('お題'), 'ランニング途中によってみた')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(screen.getByRole('button', { name: '送信する' })).toBeEnabled()
    expect(screen.queryByText('認証準備中…')).not.toBeInTheDocument()
  })
})
