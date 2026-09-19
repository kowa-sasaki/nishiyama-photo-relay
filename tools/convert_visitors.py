"""
西山公園の来訪者数データ（日別・月別）を app/public/data/*.json に変換する。

入力:
    tools/raw/higashigawa_raiho.csv     … 【日別】令和7年度 西山公園東側来訪者数（人流データ）
                                           CSV, Shift_JIS, 365行（2025-04-01〜2026-03-31）欠損なし
    tools/raw/nyujoshasu_getsubetsu.xls … 西山公園入場者数(月別) XLS（令和7年度 / 令和6年度比較）

出力:
    app/public/data/visitors_daily.json
    app/public/data/visitors_monthly.json

実行:
    python tools/convert_visitors.py
"""
import json
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent.parent / "app" / "public" / "data"

WAREKI_TO_SEIREKI = {
    "令和7年度": 2025,  # 年度開始年（4月始まり）。5月なら2025、翌1〜3月は2026
    "令和6年度": 2024,
}


def convert_daily() -> None:
    src = RAW_DIR / "higashigawa_raiho.csv"
    # 1行目はタイトル行（"令和７年度 西山公園東側 日別来訪者数,,,,,,"）なのでスキップ
    df = pd.read_csv(src, encoding="shift_jis", skiprows=1)
    df.columns = ["date_raw", "weekday", "area", "visitors", "weather", "temp_max", "temp_min"]

    assert df["date_raw"].notna().all(), "欠損日あり"
    assert len(df) == 365, f"想定365行に対し {len(df)} 行"
    assert not df["date_raw"].duplicated().any(), "日付重複あり"

    records = []
    for row in df.itertuples(index=False):
        date_str = str(row.date_raw)  # 例: 20250401
        iso_date = f"{date_str[0:4]}-{date_str[4:6]}-{date_str[6:8]}"
        records.append(
            {
                "date": iso_date,
                "weekday": row.weekday,
                "area": row.area,
                "visitors": int(row.visitors),
                "weather": row.weather,
                "temp_max_c": int(row.temp_max),
                "temp_min_c": int(row.temp_min),
            }
        )

    records.sort(key=lambda r: r["date"])

    out_path = OUT_DIR / "visitors_daily.json"
    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_path} ({len(records)} records, {records[0]['date']}..{records[-1]['date']})")


def convert_monthly() -> None:
    src = RAW_DIR / "nyujoshasu_getsubetsu.xls"
    xl = pd.ExcelFile(src)
    sheet_name = xl.sheet_names[0]  # "令和7年度 "
    df = xl.parse(sheet_name, header=None)

    # 行0: タイトル, 行1: ヘッダ（NaN, 令和7年度, 令和6年度), 行2-13: 月データ, 行14: 合計
    header_row = df.iloc[1]
    fy_current_label = str(header_row[1]).strip()  # "令和7年度"
    fy_previous_label = str(header_row[2]).strip()  # "令和6年度"

    month_rows = df.iloc[2:14]
    total_row = df.iloc[14]

    assert str(total_row[0]).strip() == "年度入場者数合計", f"想定外の合計行ラベル: {total_row[0]!r}"

    months = []
    for row in month_rows.itertuples(index=False):
        label = str(row._0).strip()  # 例: "4月"
        month_num = int(label.replace("月", ""))
        months.append(
            {
                "month": month_num,
                "label": label,
                "visitors": int(row._1),
                "visitors_prev_year": int(row._2),
            }
        )

    assert len(months) == 12, f"想定12ヶ月に対し {len(months)} 件"

    out = {
        "source": "西山公園入場者数(月別)",
        "fiscal_year_current": fy_current_label,
        "fiscal_year_previous": fy_previous_label,
        "unit": "人",
        "months": months,
        "total": {
            "visitors": int(total_row[1]),
            "visitors_prev_year": int(total_row[2]),
        },
    }

    out_path = OUT_DIR / "visitors_monthly.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_path} ({len(months)} months, total={out['total']['visitors']})")


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    convert_daily()
    convert_monthly()
