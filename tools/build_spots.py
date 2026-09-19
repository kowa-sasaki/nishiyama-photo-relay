"""
公式定点5箇所を tools/spots.geojson に書き出す。

座標について:
    5箇所すべて tools/spots_coordinates_todo.md のチェックリストでユーザーが
    現地確認済み（2026-08-15）。大噴水前・上段の庭・愛の鐘展望台はWeb調査の
    近似値から現地確認の結果に修正されている。各エントリの # 出典: コメントに
    詳細を記載。

出力:
    tools/spots.geojson

実行:
    python tools/build_spots.py
"""
import json
from pathlib import Path

OUT_PATH = Path(__file__).parent / "spots.geojson"

# 鯖江市西山公園のおおよその境界（緯度経度の誤入力・桁間違いを検知するための範囲チェック）
LAT_MIN, LAT_MAX = 35.94, 35.96
LNG_MIN, LNG_MAX = 136.17, 136.19

SPOTS: list[dict] = [
    {
        "name": "大噴水前",
        "description": "西山公園のシンボル。桜の季節は夜桜と噴水の組み合わせが名物で、ライトアップにより夜の表情も変わる。",
        "lat": 35.950000,
        "lng": 136.182041,
        "order": 1,
        # 出典: ユーザーによる現地確認（2026-08-15）で修正済み。
        # 旧値(35.950583, 136.182278)はWikipedia「西山公園」記事の座標（公園全体の代表点）で、
        # 噴水そのものの位置とはずれていたため修正した。
    },
    {
        "name": "つつじ園（結びの広場）",
        "description": "約5万株のツツジが咲く西山公園の春の主役。5月につつじまつりが開催される。",
        "lat": 35.9503,
        "lng": 136.1815,
        "order": 2,
        # 出典: Web調査による近似値。ユーザーが現地確認済み（2026-08-15、修正不要と判断）
    },
    {
        "name": "上段の庭（もみじ）",
        "description": "和風庭園。秋の紅葉の名所で、11月にもみじまつりが開催される。",
        "lat": 35.951110,
        "lng": 136.184471,
        "order": 3,
        # 出典: ユーザーによる現地確認（2026-08-15）で修正済み。
        # 旧値(35.9511, 136.1826)はWeb調査による近似値だった。
    },
    {
        "name": "愛の鐘・展望台",
        "description": "西山山頂の展望広場。鯖江市街を一望でき、雪景色や夕景の変化を捉えやすい。",
        "lat": 35.952414,
        "lng": 136.181033,
        "order": 4,
        # 出典: ユーザーによる現地確認（2026-08-15）で修正済み。
        # 旧値(35.9518, 136.1836)はWeb調査による近似値だった。
    },
    {
        "name": "西山動物園前（道の駅側）",
        "description": "レッサーパンダで知られる西山動物園の入口。道の駅西山公園に近い東側の入口で、人流データ「東側来訪者数」の計測範囲と地理的に対応づけられる。",
        "lat": 35.948694,
        "lng": 136.180694,
        "order": 5,
        # 出典: Wikipedia「道の駅西山公園」記事の座標（確認済み）
    },
]


def build_feature(spot: dict) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [spot["lng"], spot["lat"]]},
        "properties": {
            "name": spot["name"],
            "theme": None,
            "description": spot["description"],
            "kind": "official",
            "order": spot["order"],
        },
    }


def validate(spots: list[dict]) -> None:
    assert len(spots) == 5, f"公式定点は5箇所である必要がある（実際: {len(spots)}）"

    orders = sorted(s["order"] for s in spots)
    assert orders == [1, 2, 3, 4, 5], f"orderは1〜5の重複なしである必要がある（実際: {orders}）"

    names = [s["name"] for s in spots]
    assert len(set(names)) == len(names), f"定点名が重複している: {names}"

    for spot in spots:
        assert spot["name"].strip(), "nameが空の定点がある"
        assert spot["description"].strip(), f"{spot['name']}: descriptionが空"
        assert LAT_MIN <= spot["lat"] <= LAT_MAX, (
            f"{spot['name']}: 緯度が西山公園の想定範囲外 ({spot['lat']})"
        )
        assert LNG_MIN <= spot["lng"] <= LNG_MAX, (
            f"{spot['name']}: 経度が西山公園の想定範囲外 ({spot['lng']})"
        )


def warn_coordinates_unverified() -> None:
    todo_path = Path(__file__).parent / "spots_coordinates_todo.md"
    if not todo_path.exists():
        return

    content = todo_path.read_text(encoding="utf-8")
    unchecked_count = content.count("- [ ]")

    if unchecked_count > 0:
        print(
            f"!! 座標{unchecked_count}件は未確認の近似値。tools/spots_coordinates_todo.md を参照 — "
            "W6のシード投入前に目視確認すること"
        )


def build() -> None:
    validate(SPOTS)

    geojson = {
        "type": "FeatureCollection",
        "features": [build_feature(s) for s in SPOTS],
    }

    OUT_PATH.write_text(json.dumps(geojson, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_PATH} ({len(SPOTS)} spots)")
    warn_coordinates_unverified()


if __name__ == "__main__":
    build()
