import { useCredits } from '../lib/credits'
import { ShareButton } from '../components/ShareButton'
import { SHARE_HASHTAG } from '../lib/shareText'
import './SharePage.css'

export function SharePage() {
  const creditsState = useCredits()

  return (
    <section aria-labelledby="share-heading" className="share-page">
      <h1 id="share-heading" className="share-page__title">
        西山公園フォトリレー
      </h1>
      <p className="share-page__concept">西山公園の&quot;今日&quot;を、みんなで1年分の絵にする。</p>
      <p className="share-page__description">
        西山公園でお気に入りの場所を決めて、写真を撮るだけ。春のつつじのピンクから秋の紅葉の赤まで、同じ場所の写真が季節をこえてつながっていきます。あなたの1枚が、次の誰かへのバトンになります。
      </p>

      <h2 id="howto-heading" className="share-page__section-heading">使い方</h2>
      <ol className="share-page__howto" aria-labelledby="howto-heading">
        <li>
          <span className="share-page__howto-step" aria-hidden="true">1</span>
          まずは「定点」タブで、撮ってみたい場所を選びましょう。「近い順」にすると、いま居る場所の近くから探せます。
        </li>
        <li>
          <span className="share-page__howto-step" aria-hidden="true">2</span>
          「＋投稿」で写真を撮って、タグとひとことを添えて送信。投稿は西山公園の中から（公園の外ではデモ投稿を試せます）。ログインも登録もいりません。
        </li>
        <li>
          <span className="share-page__howto-step" aria-hidden="true">3</span>
          ぴったりの場所が見つからなければ、お題を付けて「みんなの定点」を作ってみてください。あなたの1枚目が、新しい定点のスタートになります。
        </li>
        <li>
          <span className="share-page__howto-step" aria-hidden="true">4</span>
          ホームでは、みんなの写真の平均色を並べた「色のリボン」と来訪者数のグラフで、公園の1年を眺められます。写真のある日付をタップすると、その日の写真が見られます。
        </li>
      </ol>

      <h2 className="share-page__section-heading">使用データの出典</h2>
      {creditsState.status === 'loading' && <p>読み込み中…</p>}
      {creditsState.status === 'error' && (
        <p>出典情報を取得できませんでした: {creditsState.message}</p>
      )}
      {creditsState.status === 'loaded' && creditsState.credits.length === 0 && (
        <p>出典情報がありません</p>
      )}
      {creditsState.status === 'loaded' && creditsState.credits.length > 0 && (
        <ul className="share-page__credits">
          {creditsState.credits.map((credit) => (
            <li key={credit.package_name} className="share-page__credit">
              <span className="share-page__credit-title">{credit.title}</span>
              <span className="share-page__credit-meta">
                {credit.organization} / {credit.license_title}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ShareButton
        url={window.location.origin}
        text={`西山公園の"今日"を、みんなで記録するアプリ ${SHARE_HASHTAG}`}
      />
    </section>
  )
}
