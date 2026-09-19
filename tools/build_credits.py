"""
使用しているオープンデータの出典・ライセンス一覧を app/public/data/credits.json に書き出す。
README のクレジット表記やアプリ内フッターに使う想定（CC-BY表記の必須要件対応）。

実行:
    python tools/build_credits.py
"""
import json
from pathlib import Path

from datasets import DATASETS, IMAGE_DATASETS

OUT_DIR = Path(__file__).parent.parent / "app" / "public" / "data"


def build() -> list[dict]:
    credits = []
    for ds in DATASETS:
        entry = {
            "title": ds["title"],
            "package_name": ds["package_name"],
            "source_url": f"https://ckan.odp.jig.jp/dataset/{ds['package_id']}",
            "format": ds["format"],
            "license": ds["license"],
            "license_title": ds["license_title"],
            "license_url": ds["license_url"],
            "organization": ds["organization"],
        }
        if ds.get("known_issue"):
            entry["known_issue"] = ds["known_issue"]
            entry["used"] = False
        else:
            entry["used"] = True
        credits.append(entry)

    for ds in IMAGE_DATASETS:
        credits.append(
            {
                "title": ds["title"],
                "package_name": ds["package_name"],
                "source_url": f"https://ckan.odp.jig.jp/dataset/{ds['package_id']}",
                "format": "JPEG",
                "license": ds["license"],
                "license_title": ds["license_title"],
                "license_url": ds["license_url"],
                "organization": ds["organization"],
                "used": True,
                "image_count": len(ds["resources"]),
            }
        )
    return credits


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    credits = build()
    out_path = OUT_DIR / "credits.json"
    out_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out_path} ({len(credits)} entries)")
