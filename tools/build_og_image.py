"""
OGP 用の画像 app/public/og.jpg（1200x630）を生成する。

構成: つつじのシード写真（tools/raw/seed_images/tsutsuji/5.jpg、鯖江市 CC-BY 2.1）を
中央クロップで敷き、下端に14枚のシード画像の平均色を並べた「色のリボン」、
左下にアプリ名を載せる。アプリの核心ビジュアル（色のリボン）を共有カードでも見せる。
JPEG（品質85）で保存し、ファイルサイズを300KB以下に抑える。

実行: cd tools && source .venv/bin/activate && python build_og_image.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import seed_manifest
from seed_supabase import SEED_IMAGE_DIR, average_color_hex, resize_for_upload

OUT_PATH = Path(__file__).resolve().parent.parent / "app" / "public" / "og.jpg"
W, H = 1200, 630
RIBBON_H = 48
HERO_FILE = "tsutsuji/5.jpg"
TITLE = "西山公園フォトリレー"
SUBTITLE = "みんなでつなぐ、西山公園の1年"
FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-mincho.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("日本語フォントが見つかりません。FONT_CANDIDATES にパスを追加してください")


def cover_crop(im: Image.Image, w: int, h: int) -> Image.Image:
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    left = (im.width - w) // 2
    top = (im.height - h) // 2
    return im.crop((left, top, left + w, top + h))


def ribbon_colors() -> list[str]:
    # タイムライン順（撮影日順）に並べる
    entries = sorted(seed_manifest.SEED_IMAGES, key=lambda e: e["taken_at"][5:10])  # MM-DD
    colors = []
    for e in entries:
        with Image.open(SEED_IMAGE_DIR / e["file"]) as im:
            colors.append(average_color_hex(resize_for_upload(im, 400)))
    return colors


def build() -> None:
    with Image.open(SEED_IMAGE_DIR / HERO_FILE) as src:
        canvas = cover_crop(resize_for_upload(src, 2400), W, H)

    # 下半分を暗くして文字を読ませる
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(H // 2, H):
        alpha = int(170 * (y - H // 2) / (H // 2))
        od.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    draw = ImageDraw.Draw(canvas)
    colors = ribbon_colors()
    cell = W / len(colors)
    for i, c in enumerate(colors):
        draw.rectangle([round(i * cell), H - RIBBON_H, round((i + 1) * cell), H], fill=c)

    draw.text((56, H - RIBBON_H - 150), TITLE, font=load_font(64), fill="white")
    draw.text((58, H - RIBBON_H - 72), SUBTITLE, font=load_font(30), fill=(235, 235, 235))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT_PATH, format="JPEG", quality=85, optimize=True, progressive=True)
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    build()
