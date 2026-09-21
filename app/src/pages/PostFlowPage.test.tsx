import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PostFlowPage } from './PostFlowPage'
import { LastViewedSpotProvider } from '../lib/LastViewedSpotContext'
import * as useSpotModule from '../lib/useSpot'
import * as useSpotsModule from '../lib/useSpots'
import * as authModule from '../lib/AuthContext'
import * as imageModule from '../lib/image'
import * as createPostModule from '../lib/createPost'
import * as useParkAccessModule from '../lib/useParkAccess'
import { getSupabaseClientSafe } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: vi.fn(), getSupabaseClientSafe: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
})

const sampleSpot = {
  id: 'spot-1',
  name: '大噴水前',
  theme: null,
  lat: 0,
  lng: 0,
  description: null,
  kind: 'official' as const,
  order: 1,
  created_at: '2026-06-01T00:00:00Z',
}

function renderPostFlowPage() {
  return render(
    <LastViewedSpotProvider>
      <MemoryRouter>
        <PostFlowPage />
      </MemoryRouter>
    </LastViewedSpotProvider>,
  )
}

beforeEach(() => {
  vi.mocked(getSupabaseClientSafe).mockReturnValue({
    client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
    envError: null,
  })
  vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'loaded', spots: [sampleSpot] })
  vi.spyOn(useSpotModule, 'useSpot').mockReturnValue({
    status: 'loaded',
    spot: sampleSpot,
    posts: [{ id: 'post-existing', spot_id: 'spot-1', image_path: 'x', comment: null, tags: [], avg_color: null, created_at: '2026-08-01T00:00:00Z', device_id: 'device-1' }],
  })
  vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'signed-in', userId: 'device-1' })
  vi.spyOn(imageModule, 'resizeAndAnalyzeImage').mockResolvedValue({
    blob: new Blob(['resized'], { type: 'image/jpeg' }),
    avgColor: '#f2a6c2',
  })
  vi.spyOn(useParkAccessModule, 'useParkAccess').mockReturnValue({
    access: { status: 'inside', lat: 35.9503, lng: 136.1815 },
    retry: vi.fn(),
  })
})

describe('PostFlowPage', () => {
  it('shows the target spot bar and file pickers on the select step', () => {
    renderPostFlowPage()
    expect(screen.getByText('対象の定点: 大噴水前')).toBeInTheDocument()
    expect(screen.getByLabelText('カメラで撮る')).toBeInTheDocument()
    expect(screen.getByLabelText('ギャラリーから選ぶ')).toBeInTheDocument()
  })

  it('walks through compose -> confirm -> done and submits a post', async () => {
    const user = userEvent.setup()
    const createPostSpy = vi
      .spyOn(createPostModule, 'createPost')
      .mockResolvedValue({
        id: 'post-new',
        spot_id: 'spot-1',
        image_path: 'spot-1/new.jpg',
        comment: 'きれいでした',
        tags: ['桜'],
        avg_color: '#f2a6c2',
        created_at: '2026-08-16T00:00:00Z',
        device_id: 'device-1',
      })
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    const galleryInput = screen.getByLabelText('ギャラリーから選ぶ')
    await user.upload(galleryInput, file)

    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '桜' }))
    await user.type(screen.getByLabelText('ひとこと（任意）'), 'きれいでした')
    await user.click(screen.getByRole('button', { name: '次へ' }))

    expect(screen.getByText('きれいでした')).toBeInTheDocument()
    expect(screen.getByText('桜')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '送信する' }))

    await waitFor(() => expect(screen.getByText('送信しました！')).toBeInTheDocument())
    expect(createPostSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ spotId: 'spot-1', tags: ['桜'], comment: 'きれいでした', deviceId: 'device-1' }),
    )
    expect(screen.getByText('この定点への投稿 2件目')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'この定点を見る' })).toHaveAttribute('href', '/spots/spot-1')

    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    await user.click(screen.getByRole('button', { name: '共有する' }))
    expect(share).toHaveBeenCalledWith({
      text: '大噴水前に投稿しました #西山公園フォトリレー',
      url: 'http://localhost:3000/spots/spot-1',
    })
  })

  it('shows a retry button and keeps form contents when submission fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(createPostModule, 'createPost').mockRejectedValue(new Error('network error'))
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))

    expect(await screen.findByText('送信に失敗しました: network error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送信する' })).toBeInTheDocument()
  })

  it('shows an error and stays on the select step when image processing fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(imageModule, 'resizeAndAnalyzeImage').mockRejectedValue(new Error('画像を読み込めませんでした'))
    renderPostFlowPage()

    const file = new File(['fake'], 'broken.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)

    expect(await screen.findByText('画像を処理できませんでした: 画像を読み込めませんでした')).toBeInTheDocument()
    // Still on the select step, able to retry.
    expect(screen.getByLabelText('カメラで撮る')).toBeInTheDocument()
    expect(screen.getByLabelText('ギャラリーから選ぶ')).toBeInTheDocument()
    expect(screen.queryByLabelText('ひとこと（任意）')).not.toBeInTheDocument()
  })

  it('shows a friendly message instead of crashing when env vars are missing', () => {
    vi.mocked(getSupabaseClientSafe).mockReturnValue({
      client: {} as ReturnType<typeof getSupabaseClientSafe>['client'],
      envError: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません',
    })
    renderPostFlowPage()
    expect(
      screen.getByText('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません'),
    ).toBeInTheDocument()
  })

  it('shows the spots error message instead of a generic loading state when the spot list fails to load', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({ status: 'error', message: 'network error' })
    renderPostFlowPage()
    expect(screen.getByText('定点一覧を取得できませんでした: network error')).toBeInTheDocument()
  })

  it('shows a "no spot found" message with a link back to /spots when there is no official spot and no last-viewed spot', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      status: 'loaded',
      spots: [{ ...sampleSpot, id: 'spot-user', kind: 'user' }],
    })
    renderPostFlowPage()
    expect(screen.getByText('投稿先の定点が見つかりません')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '定点一覧へ戻る' })).toHaveAttribute('href', '/spots')
  })

  it('shows an auth loading message on the confirm step', async () => {
    const user = userEvent.setup()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '次へ' }))

    expect(screen.getByText('認証準備中…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送信する' })).toBeDisabled()
  })

  it('shows an auth error message on the confirm step', async () => {
    const user = userEvent.setup()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'error', message: '匿名認証に失敗しました' })
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '次へ' }))

    expect(screen.getByText('認証に失敗しました: 匿名認証に失敗しました')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送信する' })).toBeDisabled()
  })

  it('goes back from compose to select via the 戻る button', async () => {
    const user = userEvent.setup()
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: '戻る' }))

    expect(screen.getByLabelText('カメラで撮る')).toBeInTheDocument()
    expect(screen.getByLabelText('ギャラリーから選ぶ')).toBeInTheDocument()
    expect(screen.queryByLabelText('ひとこと（任意）')).not.toBeInTheDocument()
  })

  it('goes back from confirm to compose via the 戻る button, preserving tags and comment', async () => {
    const user = userEvent.setup()
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '桜' }))
    await user.type(screen.getByLabelText('ひとこと（任意）'), 'きれいでした')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(screen.getByText('きれいでした')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '戻る' }))

    const commentInput = screen.getByLabelText('ひとこと（任意）') as HTMLInputElement
    expect(commentInput.value).toBe('きれいでした')
    expect(screen.getByRole('button', { name: '桜' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a processing indicator and disables file inputs while resizing/analyzing the image', async () => {
    const user = userEvent.setup()
    let resolveResize!: (value: { blob: Blob; avgColor: string }) => void
    vi.spyOn(imageModule, 'resizeAndAnalyzeImage').mockReturnValue(
      new Promise((resolve) => {
        resolveResize = resolve
      }),
    )
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)

    expect(await screen.findByText('処理中…')).toBeInTheDocument()
    expect(screen.getByLabelText('カメラで撮る')).toBeDisabled()
    expect(screen.getByLabelText('ギャラリーから選ぶ')).toBeDisabled()

    resolveResize({ blob: new Blob(['resized'], { type: 'image/jpeg' }), avgColor: '#abcdef' })

    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    expect(screen.queryByText('処理中…')).not.toBeInTheDocument()
  })

  it('resets the file input value after a selection (jsdom cannot verify the same-file reselect behavior itself)', async () => {
    const user = userEvent.setup()
    renderPostFlowPage()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    const galleryInput = screen.getByLabelText('ギャラリーから選ぶ') as HTMLInputElement
    await user.upload(galleryInput, file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())

    expect(galleryInput.value).toBe('')
  })
})

describe('PostFlowPage park gate', () => {
  function mockAccess(access: useParkAccessModule.ParkAccessState, retry = vi.fn()) {
    vi.spyOn(useParkAccessModule, 'useParkAccess').mockReturnValue({ access, retry })
    return retry
  }

  it('shows a checking status and no file pickers while the location is being checked', () => {
    mockAccess({ status: 'checking' })
    renderPostFlowPage()
    expect(screen.getByText('現在地を確認中…')).toBeInTheDocument()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
  })

  it('blocks posting outside the park: no file pickers, explanation, and a demo button', () => {
    mockAccess({ status: 'outside', lat: 35.9, lng: 136.2 })
    renderPostFlowPage()
    expect(screen.getByText('対象の定点: 大噴水前')).toBeInTheDocument()
    expect(screen.getByText('投稿は西山公園の中でできます。公園内で開き直してください。')).toBeInTheDocument()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('カメラで撮る')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'デモ投稿を試す' })).toBeInTheDocument()
  })

  it('blocks posting when location is unavailable and retries on request', async () => {
    const user = userEvent.setup()
    const retry = mockAccess({ status: 'unavailable', message: 'denied' })
    renderPostFlowPage()
    expect(screen.queryByLabelText('ギャラリーから選ぶ')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '位置情報を許可して再試行' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('runs the whole flow in demo mode without saving anything', async () => {
    const user = userEvent.setup()
    const createPostSpy = vi.spyOn(createPostModule, 'createPost')
    mockAccess({ status: 'outside', lat: 35.9, lng: 136.2 })
    renderPostFlowPage()

    await user.click(screen.getByRole('button', { name: 'デモ投稿を試す' }))
    expect(screen.getByText('デモ：保存されません')).toBeInTheDocument()

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('ギャラリーから選ぶ'), file)
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.click(screen.getByRole('button', { name: '送信する' }))

    expect(await screen.findByText('デモ投稿が完了しました')).toBeInTheDocument()
    expect(screen.getByText('デモのため保存されていません。')).toBeInTheDocument()
    expect(createPostSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '共有する' })).not.toBeInTheDocument()
    expect(screen.queryByText(/件目/)).not.toBeInTheDocument()
  })

  it('lets demo mode submit even when anonymous auth is not ready', async () => {
    const user = userEvent.setup()
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ status: 'loading' })
    mockAccess({ status: 'unavailable', message: 'denied' })
    renderPostFlowPage()

    await user.click(screen.getByRole('button', { name: 'デモ投稿を試す' }))
    await user.upload(
      screen.getByLabelText('ギャラリーから選ぶ'),
      new File(['fake'], 'photo.jpg', { type: 'image/jpeg' }),
    )
    await waitFor(() => expect(screen.getByLabelText('ひとこと（任意）')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(screen.getByRole('button', { name: '送信する' })).toBeEnabled()
    expect(screen.queryByText('認証準備中…')).not.toBeInTheDocument()
  })
})
