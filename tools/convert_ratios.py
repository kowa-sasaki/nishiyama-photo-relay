"""
西山公園入場者の割合データ（市区町村別）を app/public/data/*.json に変換する。

入力:
    tools/raw/shikuchoson_wariai.csv … 【市区町村別割合】令和7年度 西山公園入場者（人流データ）
                                        CSV, Shift_JIS。休日・平日それぞれ上位8市区町村の割合（%）。
                                        期間は 2025-04-01〜2026-03-31 固定（1レコード=1期間集計、日次ではない）。

出力:
    app/public/data/visitor_ratio_municipality.json

注意（既知の問題）:
    「【都道府県別割合】令和7年度 西山公園入場者（人流データ）」
    (package 18207_nishiyamakoentodohukenbetsuwariai, id d86c43f4-...) は
    CKAN上のタイトル・説明文は「都道府県別割合」だが、実際にダウンロードされる
    リソース（202604__.csv, 422byte）の中身は「出庫台数」という全く別の駐車場データ
    （嚮陽会館駐車場 出庫台数（日別）2026年4月分 = package f2da00a6-... のリソースと
    バイト単位で完全一致）であることを確認した。鯖江市側のCKAN登録ミスと考えられる。
    都道府県別の割合データは現状取得不可能なため、本スクリプトでは変換しない。
    tools/raw/todohuken_wariai.csv として生データは残してあるので、鯖江市側で
    リソースが修正された場合はこのファイルの中身を差し替えて再確認すること。

実行:
    python tools/convert_ratios.py
"""
import json
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent.parent / "app" / "public" / "data"


def convert_municipality_ratio() -> None:
    src = RAW_DIR / "shikuchoson_wariai.csv"
    df = pd.read_csv(src, encoding="shift_jis", skiprows=1)
    df.columns = ["start_date", "end_date", "day_type", "rank", "municipality", "area", "ratio"]

    df = df.dropna(subset=["day_type"]).copy()
    df["ratio_percent"] = df["ratio"].str.rstrip("%").astype(int)
    df["rank"] = df["rank"].astype(int)

    start_raw = str(int(df["start_date"].iloc[0]))
    end_raw = str(int(df["end_date"].iloc[0]))
    period_start = f"{start_raw[0:4]}-{start_raw[4:6]}-{start_raw[6:8]}"
    period_end = f"{end_raw[0:4]}-{end_raw[4:6]}-{end_raw[6:8]}"

    day_type_map = {"休日": "holiday", "平日": "weekday"}

    out = {
        "source": "【市区町村別割合】令和7年度 西山公園入場者（人流データ）",
        "period_start": period_start,
        "period_end": period_end,
        "area": str(df["area"].iloc[0]),
    }
    for jp_label, key in day_type_map.items():
        subset = df[df["day_type"] == jp_label].sort_values("rank")
        out[key] = [
            {
                "rank": int(r.rank),
                "municipality": r.municipality,
                "ratio_percent": int(r.ratio_percent),
            }
            for r in subset.itertuples(index=False)
        ]

    out_path = OUT_DIR / "visitor_ratio_municipality.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"wrote {out_path} "
        f"(holiday={len(out['holiday'])} rows, weekday={len(out['weekday'])} rows, "
        f"period={period_start}..{period_end})"
    )


def warn_prefecture_ratio_unavailable() -> None:
    print(
        "!! SKIP visitor_ratio_prefecture: CKAN上のリソース内容がタイトルと一致しない"
        "（駐車場出庫台数データが誤って紐付いている、鯖江市側の登録ミスと推定）。"
        "詳細はこのファイルのモジュールdocstringを参照。JSON化は行わない。"
    )


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    convert_municipality_ratio()
    warn_prefecture_ratio_unavailable()
