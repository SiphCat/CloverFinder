#!/usr/bin/env python3
"""Remove cream/white logo backdrop (transparent — header shows through)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "cloverfinder-logo.png"


def is_background(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    # cream / off-white backdrop only (keep pale green swirls in the artwork)
    if r > 228 and g > 222 and b > 205 and abs(int(r) - int(g)) < 22:
        return True
    return False


def main() -> None:
    src = ROOT / "public" / "cloverfinder-logo.png"
    asset = (
        Path.home()
        / ".cursor"
        / "projects"
        / "Users-oksana-Documents-clover-finder"
        / "assets"
        / "ChatGPT_Image_May_24__2026__02_42_30_PM-8f370e24-f753-4e7b-b342-316930dbf208.png"
    )
    if asset.exists():
        import shutil

        shutil.copy(asset, src)

    if not src.exists():
        print(f"Missing logo at {src}", file=sys.stderr)
        sys.exit(1)

    img = Image.open(src).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_background(r, g, b, a):
                px[x, y] = (r, g, b, 0)
    img.save(OUT, format="PNG", optimize=True)
    print(f"Wrote transparent logo: {OUT}")


if __name__ == "__main__":
    main()
