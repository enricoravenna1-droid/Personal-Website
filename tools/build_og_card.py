#!/usr/bin/env python3
"""
Regenerate public/og.jpg — the 1200x630 link-preview card.

This is the image Instagram, LinkedIn, WhatsApp, Facebook, iMessage and X pull
when the site is shared. It used to be public/photo.jpg, a 733x1100 portrait,
which those platforms center-crop to a landscape band; the crop cut Enrico's
head off in the LinkedIn feed. This builds a purpose-made landscape card.

    python3 tools/build_og_card.py

Edit tools/og-card.html for copy and layout, then re-run. The two things worth
knowing before editing:

  - Fonts are fetched from Google and inlined as base64 before rendering, so
    the headless screenshot cannot race a font load and silently fall back to
    Georgia. This needs network on the machine running the script.
  - It renders at 2x and downsamples with Lanczos. Rendering straight at 1200
    leaves the serif looking thin and slightly ragged.
"""

import base64
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "og-card.html"
PORTRAIT = ROOT / "public" / "photo.jpg"
OUT = ROOT / "public" / "og.jpg"
WORK = ROOT / "tools" / ".build"

# Fraunces for the name and the quote, Manrope for everything else — the same
# pair app/layout.tsx loads through next/font.
FONT_CSS = (
    "https://fonts.googleapis.com/css2"
    "?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700"
    "&family=Manrope:wght@400;500;600;700&display=swap"
)
UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H, SCALE = 1200, 630, 2


def fetch(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()


def inlined_font_css() -> str:
    """Google's CSS with every woff2 URL swapped for a data: URI.

    Rewriting the URLs rather than hand-picking the latin subset keeps the
    unicode-range rules intact, so the quote's curly punctuation still resolves.
    """
    css = fetch(FONT_CSS).decode()
    for url in sorted(set(re.findall(r"https://[^)]*\.woff2", css))):
        css = css.replace(url, f"data:font/woff2;base64,{base64.b64encode(fetch(url)).decode()}")
    return css


def main() -> int:
    if not shutil.which(CHROME) and not pathlib.Path(CHROME).exists():
        sys.exit(f"Google Chrome not found at {CHROME} — needed to render the card.")

    WORK.mkdir(exist_ok=True)
    html = TEMPLATE.read_text()
    html = html.replace("__FONTS__", inlined_font_css())
    html = html.replace("__PHOTO__", base64.b64encode(PORTRAIT.read_bytes()).decode())
    page = WORK / "card.html"
    page.write_text(html)

    shot = WORK / "card@2x.png"
    subprocess.run(
        [
            CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
            f"--force-device-scale-factor={SCALE}",
            f"--window-size={W},{H}",
            "--virtual-time-budget=8000",
            f"--screenshot={shot}",
            page.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    if not shot.exists():
        sys.exit("Chrome produced no screenshot.")

    # quality=92 with no chroma subsampling: the card is mostly near-black
    # gradient, which is exactly where JPEG banding shows up first.
    Image.open(shot).convert("RGB").resize((W, H), Image.LANCZOS).save(
        OUT, "JPEG", quality=92, optimize=True, progressive=True, subsampling=0
    )
    print(f"wrote {OUT.relative_to(ROOT)} — {W}x{H}, {OUT.stat().st_size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
