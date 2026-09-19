# 公式定点 座標 確認チェックリスト

5箇所すべてユーザーが現地確認済み（2026-08-15）。大噴水前・上段の庭・愛の鐘展望台はWeb調査の
近似値から現地確認の結果へ座標を修正した（`tools/build_spots.py` の各エントリの `# 出典:` コメント参照）。
つつじ園と西山動物園前は元の座標のまま修正不要と判断された。

以下は確認時点の記録。座標を再修正した場合は `tools/build_spots.py` の該当 `lat` / `lng` を修正し、
`python tools/build_spots.py` を再実行して `tools/spots.geojson` を更新すること。

参考写真は鯖江市公式ページ「西山公園 施設のご案内」掲載のもの。

- [x] 大噴水前 (35.950000, 136.182041) — https://www.google.com/maps?q=35.950000,136.182041 （現地確認により旧値(35.950583, 136.182278)から修正済み）
  参考写真: https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu4.jpg
- [x] つつじ園（結びの広場） (35.9503, 136.1815) — https://www.google.com/maps?q=35.9503,136.1815 （現地確認済み、修正不要）
  参考写真: https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu12.JPG
- [x] 上段の庭（もみじ） (35.951110, 136.184471) — https://www.google.com/maps?q=35.951110,136.184471 （現地確認により旧値(35.9511, 136.1826)から修正済み）
  参考写真: https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu6.jpg
- [x] 愛の鐘・展望台 (35.952414, 136.181033) — https://www.google.com/maps?q=35.952414,136.181033 （現地確認により旧値(35.9518, 136.1836)から修正済み）
  参考写真: https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu9.jpg （愛の鐘） / https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu10.jpg （展望台）
- [x] 西山動物園前（道の駅側） (35.948694, 136.180694) — https://www.google.com/maps?q=35.948694,136.180694 （道の駅西山公園のWikipedia記載座標と一致。確認済み）
  参考写真: https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/shisetsu1.jpg （道の駅） / https://www.city.sabae.fukui.jp/kurashi_tetsuduki/doro_kasen_koen/koen/nishiyama/Nishiyama-Shisetsu.images/panda.jpg （動物園）
