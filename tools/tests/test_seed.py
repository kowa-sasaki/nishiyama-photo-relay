import json
from datetime import datetime
from pathlib import Path

from PIL import Image

import seed_manifest
import seed_supabase

TOOLS_DIR = Path(__file__).resolve().parents[1]


def test_manifest_has_14_entries_with_known_spot_names():
    geojson = json.loads((TOOLS_DIR / "spots.geojson").read_text(encoding="utf-8"))
    official_names = {f["properties"]["name"] for f in geojson["features"]}
    assert len(seed_manifest.SEED_IMAGES) == 14
    for entry in seed_manifest.SEED_IMAGES:
        assert entry["spot_name"] in official_names, entry
        # ISO 8601 with offset; raises ValueError if malformed
        datetime.fromisoformat(entry["taken_at"])
        assert entry["comment"].startswith("鯖江市オープンデータ")
        assert "オープンデータ" in entry["tags"]


def test_manifest_files_are_unique():
    files = [e["file"] for e in seed_manifest.SEED_IMAGES]
    assert len(files) == len(set(files))


def test_average_color_hex_of_solid_image():
    im = Image.new("RGB", (40, 20), (255, 128, 0))
    assert seed_supabase.average_color_hex(im) == "#ff8000"


def test_average_color_hex_mixes_halves():
    im = Image.new("RGB", (2, 1))
    im.putpixel((0, 0), (0, 0, 0))
    im.putpixel((1, 0), (200, 100, 50))
    assert seed_supabase.average_color_hex(im) == "#643219"  # (100, 50, 25)


def test_resize_for_upload_caps_long_side_at_1600():
    im = Image.new("RGB", (4000, 2000), (1, 2, 3))
    out = seed_supabase.resize_for_upload(im)
    assert out.size == (1600, 800)


def test_resize_for_upload_keeps_small_images():
    im = Image.new("RGB", (800, 600), (1, 2, 3))
    assert seed_supabase.resize_for_upload(im).size == (800, 600)


def test_encode_jpeg_returns_jpeg_bytes():
    data = seed_supabase.encode_jpeg(Image.new("RGB", (10, 10), (9, 9, 9)))
    assert data[:2] == b"\xff\xd8"


def test_storage_path_is_spot_scoped_and_stable():
    assert seed_supabase.storage_path("abc-123", "tsutsuji/1.jpg") == "abc-123/seed-tsutsuji-1.jpg"


def _jwt_with_role(role: str) -> str:
    import base64, json
    payload = base64.urlsafe_b64encode(json.dumps({"role": role}).encode()).rstrip(b"=").decode()
    return f"eyJhbGciOiJIUzI1NiJ9.{payload}.sig"


def test_key_role_of_service_role_jwt():
    assert seed_supabase.key_role(_jwt_with_role("service_role")) == "service_role"


def test_key_role_of_anon_jwt():
    assert seed_supabase.key_role(_jwt_with_role("anon")) == "anon"


def test_key_role_of_new_style_keys():
    assert seed_supabase.key_role("sb_secret_abc") == "service_role"
    assert seed_supabase.key_role("sb_publishable_abc") == "anon"


def test_key_role_of_garbage_is_unknown():
    assert seed_supabase.key_role("not-a-key") == "unknown"
