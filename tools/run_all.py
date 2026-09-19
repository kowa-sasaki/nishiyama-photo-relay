"""
CKANからの取得〜JSON変換を一括実行する。

実行:
    python tools/run_all.py
"""
import fetch_ckan
import convert_visitors
import convert_ratios
import convert_tsutsuji
import build_spots
import build_credits

if __name__ == "__main__":
    fetch_ckan.fetch_tabular()
    fetch_ckan.fetch_images()

    convert_visitors.OUT_DIR.mkdir(parents=True, exist_ok=True)
    convert_visitors.convert_daily()
    convert_visitors.convert_monthly()
    convert_ratios.convert_municipality_ratio()
    convert_ratios.warn_prefecture_ratio_unavailable()
    convert_tsutsuji.convert()
    build_spots.build()

    import json

    credits = build_credits.build()
    (build_credits.OUT_DIR / "credits.json").write_text(
        json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {build_credits.OUT_DIR / 'credits.json'} ({len(credits)} entries)")
    print("all done.")
