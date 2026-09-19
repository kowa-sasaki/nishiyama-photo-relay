"""
鯖江市CKANオープンデータカタログからリソース（CSV/XLS/画像）を取得し、
tools/raw/ に保存する。取得先URLは datasets.py に確認済みのものを定義してある。

実行:
    python tools/fetch_ckan.py

保存先:
    tools/raw/*.csv, *.xls
    tools/raw/seed_images/{tsutsuji,koyo}/*.jpg

tools/raw/ はビルド成果物ではなく生データの一時置き場のため .gitignore 対象。
"""
from pathlib import Path

import requests

from datasets import DATASETS, IMAGE_DATASETS

RAW_DIR = Path(__file__).parent / "raw"
SEED_IMAGE_DIR = RAW_DIR / "seed_images"


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
    print(f"  saved: {dest.relative_to(RAW_DIR.parent)} ({len(resp.content):,} bytes)")


def fetch_tabular() -> None:
    print("=== CSV/XLS データセット取得 ===")
    for ds in DATASETS:
        print(f"[{ds['key']}] {ds['title']}")
        dest = RAW_DIR / ds["raw_filename"]
        download(ds["resource_url"], dest)
        if ds.get("known_issue"):
            print(f"  !! known_issue: {ds['known_issue']}")


def fetch_images() -> None:
    print("=== 画像データセット取得 ===")
    for ds in IMAGE_DATASETS:
        print(f"[{ds['key']}] {ds['title']}")
        for filename, url in ds["resources"]:
            dest = SEED_IMAGE_DIR / ds["subdir"] / filename
            download(url, dest)


if __name__ == "__main__":
    fetch_tabular()
    fetch_images()
    print("done.")
