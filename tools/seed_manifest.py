"""
公式定点シード画像のマニフェスト。

出典: 鯖江市オープンデータ「西山公園ツツジ画像」「西山公園の紅葉画像」（CC-BY 2.1）。
taken_at は JPEG の EXIF DateTimeOriginal（JST）から書き起こした。EXIF が無い3枚は
つつじの見頃の代表日 2024-05-01 12:00 を割り当て、コメントで推定であることを明記する。
公園全体タイムラインは年を無視して月日で重ねるため、撮影年（2016/2023/2024）は
表示上の位置に影響しない。

投入先の公式定点は tools/spots.geojson の name と完全一致させること
（seed_supabase.py が名前で id を引く）。
"""

# 運営（シード投入）用の固定 device_id。posts.device_id は NOT NULL のため必要。
# 匿名認証ユーザーの auth.uid() と衝突しない全ゼロ UUID を使う。
SEED_DEVICE_ID = "00000000-0000-0000-0000-000000000000"

_TSUTSUJI_SPOT = "つつじ園（結びの広場）"
_KOYO_SPOT = "上段の庭（もみじ）"
_TSUTSUJI_COMMENT = "鯖江市オープンデータ「西山公園ツツジ画像」より（CC-BY 2.1）"
_TSUTSUJI_COMMENT_EST = _TSUTSUJI_COMMENT + "。撮影日は推定"
_KOYO_COMMENT = "鯖江市オープンデータ「西山公園の紅葉画像」より（CC-BY 2.1）"
_TSUTSUJI_TAGS = ["つつじ", "オープンデータ"]
_KOYO_TAGS = ["紅葉", "オープンデータ"]

SEED_IMAGES = [
    {"file": "tsutsuji/1.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-05-01T12:00:00+09:00", "comment": _TSUTSUJI_COMMENT_EST, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/2.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-05-01T12:00:00+09:00", "comment": _TSUTSUJI_COMMENT_EST, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/3.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-05-07T12:54:54+09:00", "comment": _TSUTSUJI_COMMENT, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/4.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-05-01T12:00:00+09:00", "comment": _TSUTSUJI_COMMENT_EST, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/5.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-04-28T11:28:08+09:00", "comment": _TSUTSUJI_COMMENT, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/6.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2024-04-28T11:32:33+09:00", "comment": _TSUTSUJI_COMMENT, "tags": _TSUTSUJI_TAGS},
    {"file": "tsutsuji/7.jpg", "spot_name": _TSUTSUJI_SPOT, "taken_at": "2023-05-03T14:53:18+09:00", "comment": _TSUTSUJI_COMMENT, "tags": _TSUTSUJI_TAGS},
    {"file": "koyo/1.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-15T10:50:00+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/2.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-15T10:50:25+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/3.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-15T10:52:28+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/4.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-15T10:53:24+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/5.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-18T12:00:14+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/6.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-19T10:07:43+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
    {"file": "koyo/7.jpg", "spot_name": _KOYO_SPOT, "taken_at": "2016-11-19T10:44:23+09:00", "comment": _KOYO_COMMENT, "tags": _KOYO_TAGS},
]
