import { useCredits } from '../lib/credits'
import { ShareButton } from '../components/ShareButton'
import { SHARE_HASHTAG } from '../lib/shareText'
import './SharePage.css'

export function SharePage() {
  const creditsState = useCredits()

  return (
    <section aria-labelledby="share-heading" className="share-page">
      <h1 id="share-heading" className="share-page__title">
        西山公園 定点観測フォトリレー
      </h1>
      <p className="share-page__concept">西山公園の&quot;今日&quot;を、みんなで1年分の絵にする。</p>
      <p className="share-page__description">
        園内のお気に入りの場所で写真を撮って投稿するだけ。同じ場所の写真が季節をまたいでつながり、つつじのピンクから紅葉の赤まで、西山公園の1年が1本のタイムラインになります。
      </p>

      <h2 id="howto-heading" className="share-page__section-heading">使い方</h2>
      <ol className="share-page__howto" aria-labelledby="howto-heading">
        <li>
          <span className="share-page__howto-step" aria-hidden="true">1</span>
          「定点」タブで公園内の定点を選びます。現在地から近い順にも並べ替えられます。
        </li>
        <li>
          <span className="share-page__howto-step" aria-hidden="true">2</span>
          「＋投稿」から写真を撮って、タグとひとことを添えて送ります。ログインは不要です。
        </li>
        <li>
          <span className="share-page__howto-step" aria-hidden="true">3</span>
          お気に入りの場所が無ければ、お題を付けて「みんなの定点」を作れます。あなたの1枚目が、次の誰かにつながります。
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
