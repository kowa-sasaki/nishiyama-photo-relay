"""
公式定点5箇所と市のCC-BY画像14枚を Supabase に投入する（冪等）。

前提:
  - tools/spots.geojson（python tools/build_spots.py の出力）
  - tools/raw/seed_images/{tsutsuji,koyo}/1..7.jpg（python tools/fetch_ckan.py で取得）
  - 環境変数 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
    （service_role は RLS をバイパスする。kind='official' の insert は
      RLS 上 anon/authenticated には許可されていないため必須。絶対にコミットしない）

実行:
  cd tools && source .venv/bin/activate
  export SUPABASE_URL=https://xxxx.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=...        # Supabase ダッシュボード > Project Settings > API
  python seed_supabase.py --dry-run           # 通信せず投入内容を表示
  python seed_supabase.py                     # 実投入

冪等性:
  - spots: name + kind='official' で既存を検索し、無ければ insert
  - storage: x-upsert: true で上書き
  - posts: image_path で既存を検索し、有ればスキップ

平均色: クライアント（app/src/lib/image.ts）の「1x1 canvas に drawImage」と同等になるよう
BOX リサンプリングで 1x1 に縮小した画素を使う。
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import sys
from pathlib import Path

import requests
from PIL import Image, ImageOps

import seed_manifest

TOOLS_DIR = Path(__file__).resolve().parent
GEOJSON_PATH = TOOLS_DIR / "spots.geojson"
SEED_IMAGE_DIR = TOOLS_DIR / "raw" / "seed_images"
BUCKET = "posts"


# --- 純粋関数 ---------------------------------------------------------------

def average_color_hex(im: Image.Image) -> str:
    r, g, b = im.convert("RGB").resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
    return f"#{r:02x}{g:02x}{b:02x}"


def resize_for_upload(im: Image.Image, max_side: int = 1600) -> Image.Image:
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    if w <= max_side and h <= max_side:
        return im
    scale = max_side / max(w, h)
    return im.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)


def encode_jpeg(im: Image.Image, quality: int = 80) -> bytes:
    buf = io.BytesIO()
    im.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def storage_path(spot_id: str, file: str) -> str:
    stem = file.replace("/", "-").removesuffix(".jpg")
    return f"{spot_id}/seed-{stem}.jpg"


def load_official_spots() -> list[dict]:
    geojson = json.loads(GEOJSON_PATH.read_text(encoding="utf-8"))
    spots = []
    for f in geojson["features"]:
        lng, lat = f["geometry"]["coordinates"]
        p = f["properties"]
        spots.append(
            {
                "name": p["name"],
                "theme": p["theme"],
                "lat": lat,
                "lng": lng,
                "description": p["description"],
                "kind": p["kind"],
                "order": p["order"],
            }
        )
    return spots


# --- Supabase クライアント（requests 直叩き） ------------------------------------

def key_role(key: str) -> str:
    """API キーが持つロールを推定する（service_role / anon / unknown）。

    旧形式は JWT で payload に role が入っている。新形式は sb_secret_ / sb_publishable_ の接頭辞。
    """
    if key.startswith("sb_secret_"):
        return "service_role"
    if key.startswith("sb_publishable_"):
        return "anon"
    parts = key.split(".")
    if len(parts) == 3:
        try:
            payload = parts[1] + "=" * (-len(parts[1]) % 4)
            role = json.loads(base64.urlsafe_b64decode(payload)).get("role")
            if role in ("service_role", "anon"):
                return role
        except (ValueError, AttributeError):
            pass
    return "unknown"


def _raise_with_body(r: requests.Response) -> None:
    if not r.ok:
        raise SystemExit(f"HTTP {r.status_code} {r.request.method} {r.url}\n{r.text[:500]}")


class Supabase:
    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        }

    def select(self, table: str, query: str) -> list[dict]:
        r = requests.get(f"{self.url}/rest/v1/{table}?{query}", headers=self.headers, timeout=30)
        _raise_with_body(r)
        return r.json()

    def insert(self, table: str, row: dict) -> dict:
        r = requests.post(
            f"{self.url}/rest/v1/{table}",
            headers={**self.headers, "Content-Type": "application/json", "Prefer": "return=representation"},
            data=json.dumps(row, ensure_ascii=False).encode("utf-8"),
            timeout=30,
        )
        _raise_with_body(r)
        return r.json()[0]

    def upload(self, bucket: str, path: str, data: bytes) -> None:
        r = requests.post(
            f"{self.url}/storage/v1/object/{bucket}/{path}",
            headers={**self.headers, "Content-Type": "image/jpeg", "x-upsert": "true"},
            data=data,
            timeout=120,
        )
        _raise_with_body(r)


# --- 投入 -----------------------------------------------------------------------

def ensure_official_spots(sb: Supabase | None, spots: list[dict]) -> dict[str, str]:
    """name -> id。dry-run のときは擬似 id を返す。"""
    ids: dict[str, str] = {}
    for spot in spots:
        if sb is None:
            ids[spot["name"]] = f"dry-run-{spot['order']}"
            print(f"[dry-run] spot: {spot['name']} (order={spot['order']})")
            continue
        existing = sb.select("spots", f"select=id,name&kind=eq.official&name=eq.{requests.utils.quote(spot['name'])}")
        if existing:
            ids[spot["name"]] = existing[0]["id"]
            print(f"spot exists: {spot['name']} -> {existing[0]['id']}")
        else:
            created = sb.insert("spots", spot)
            ids[spot["name"]] = created["id"]
            print(f"spot created: {spot['name']} -> {created['id']}")
    return ids


def seed_posts(sb: Supabase | None, spot_ids: dict[str, str]) -> None:
    for entry in seed_manifest.SEED_IMAGES:
        src = SEED_IMAGE_DIR / entry["file"]
        if not src.exists():
            sys.exit(f"missing seed image: {src} (run fetch_ckan.py first)")
        spot_id = spot_ids[entry["spot_name"]]
        path = storage_path(spot_id, entry["file"])
        with Image.open(src) as im:
            resized = resize_for_upload(im)
            avg = average_color_hex(resized)
            jpeg = encode_jpeg(resized)
        row = {
            "spot_id": spot_id,
            "image_path": path,
            "comment": entry["comment"],
            "tags": entry["tags"],
            "avg_color": avg,
            "created_at": entry["taken_at"],
            "device_id": seed_manifest.SEED_DEVICE_ID,
        }
        if sb is None:
            print(f"[dry-run] post: {path} {resized.size} {avg} {len(jpeg)//1024}KB at {entry['taken_at']}")
            continue
        if sb.select("posts", f"select=id&image_path=eq.{requests.utils.quote(path)}"):
            print(f"post exists, skip: {path}")
            continue
        sb.upload(BUCKET, path, jpeg)
        sb.insert("posts", row)
        print(f"post created: {path} {avg}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="通信せずに投入内容を表示する")
    args = parser.parse_args(argv)

    sb: Supabase | None = None
    if not args.dry_run:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            sys.exit("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を環境変数で指定してください（--dry-run なら不要）")
        role = key_role(key)
        if role != "service_role":
            sys.exit(
                f"SUPABASE_SERVICE_ROLE_KEY のロールが '{role}' です。"
                " ダッシュボード > Project Settings > API の service_role（または sb_secret_ で始まる Secret key）を指定してください。"
                " anon / publishable キーでは kind='official' の insert が RLS で拒否されます（HTTP 401）。"
            )
        sb = Supabase(url, key)

    spots = load_official_spots()
    ids = ensure_official_spots(sb, spots)
    seed_posts(sb, ids)
    print("done.")


if __name__ == "__main__":
    main()
