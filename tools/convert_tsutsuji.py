"""
西山公園のツツジ種類・株数データを app/public/data/tsutsuji.json に変換する。

入力:
    tools/raw/tsutsuji_shurui_kabusu.xls … 西山公園のツツジ種類・株数 XLS
        1シート("Sheet1")、14行×2列。
        行0: タイトル、行1: ヘッダ、行2-12: 11品種、行13: 合計行。欠損なし。
        1列目は "品種名（咲いている場所）" が全角/半角括弧混在で1セルに入っている
        （例: "ヒラドツツジ（公園全体）" / "ミナヤマツツジ(パンダらんど)"）。

出力:
    app/public/data/tsutsuji.json

実行:
    python tools/convert_tsutsuji.py
"""
import json
import re
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent.parent / "app" / "public" / "data"

# 全角（）と半角()の両方に対応
LOCATION_PATTERN = re.compile(r"^(?P<variety>.+?)[（(](?P<location>.+?)[)）]$")


def convert() -> None:
    src = RAW_DIR / "tsutsuji_shurui_kabusu.xls"
    df = pd.read_excel(src, header=None)

    assert df.iloc[0, 0] == "西山公園のツツジの種類と株数"
    assert df.iloc[1, 0] == "ツツジの種類（場所）" and df.iloc[1, 1] == "株数"

    data_rows = df.iloc[2:13]  # 11品種
    total_row = df.iloc[13]
    assert str(total_row[0]).strip() == "合計", f"想定外の合計行ラベル: {total_row[0]!r}"

    varieties = []
    for row in data_rows.itertuples(index=False):
        raw_label = str(row._0).strip()
        count = int(row._1)
        m = LOCATION_PATTERN.match(raw_label)
        if m:
            variety = m.group("variety").strip()
            location = m.group("location").strip()
        else:
            variety = raw_label
            location = None
        varieties.append(
            {
                "variety": variety,
                "location": location,
                "count": count,
                "raw_label": raw_label,
            }
        )

    out = {
        "source": "西山公園のツツジ種類・株数",
        "unit": "株",
        "varieties": varieties,
        "total_count": int(total_row[1]),
    }

    assert sum(v["count"] for v in varieties) == out["total_count"], "合計が一致しない"

    out_path = OUT_DIR / "tsutsuji.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_path} ({len(varieties)} varieties, total={out['total_count']}株)")


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    convert()
