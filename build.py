#!/usr/bin/env python3
"""
build.py — scans images/destinations/*.webp and updates the posts array in index.html.
Title: derived from filename (title-cased, underscores/hyphens become spaces).
Date:  EXIF DateTimeOriginal if present, otherwise file modification time.
Run:   python3 build.py
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Pillow not installed — falling back to file mtime for all dates.")

DEST_DIR = Path(__file__).parent / "images" / "destinations"
INDEX_HTML = Path(__file__).parent / "index.html"

SL_MONTHS = [
    "", "januar", "februar", "marec", "april", "maj", "junij",
    "julij", "avgust", "september", "oktober", "november", "december"
]

def get_exif_date(path: Path) -> datetime | None:
    if not HAS_PIL:
        return None
    try:
        img = Image.open(path)
        exif = img._getexif()
        if not exif:
            return None
        for tag_id, val in exif.items():
            tag = TAGS.get(tag_id, "")
            if tag in ("DateTimeOriginal", "DateTime", "DateTimeDigitized"):
                return datetime.strptime(val, "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None

def format_date_sl(dt: datetime) -> str:
    return f"{dt.day}. {SL_MONTHS[dt.month]} {dt.year}"

def filename_to_title(stem: str) -> str:
    return stem.replace("_", " ").replace("-", " ").title()

def build_posts() -> list[dict]:
    posts = []
    for img in sorted(DEST_DIR.glob("*.webp"), key=lambda p: p.stat().st_mtime, reverse=True):
        dt = get_exif_date(img) or datetime.fromtimestamp(img.stat().st_mtime)
        posts.append({
            "title": filename_to_title(img.stem),
            "date": format_date_sl(dt),
            "image": f"images/destinations/{img.name}",
            "link": f"{img.stem}.html",
        })
    return posts

def update_index(posts: list[dict]) -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")

    js_lines = ["let posts = ["]
    for i, p in enumerate(posts):
        comma = "," if i < len(posts) - 1 else ""
        js_lines.append(
            f'{{ title:{json.dumps(p["title"], ensure_ascii=False)}, '
            f'date:{json.dumps(p["date"], ensure_ascii=False)}, '
            f'image:{json.dumps(p["image"])}, '
            f'link:{json.dumps(p["link"])} }}{comma}'
        )
    js_lines.append("];")
    new_block = "\n".join(js_lines)

    # Replace existing posts array (from "let posts = [" to the closing "];")
    pattern = r"let posts = \[[\s\S]*?\];"
    updated = re.sub(pattern, new_block, html)

    if updated == html:
        print("WARNING: could not find posts array in index.html — no changes made.")
        return

    INDEX_HTML.write_text(updated, encoding="utf-8")
    print(f"Updated index.html with {len(posts)} post(s):")
    for p in posts:
        print(f"  {p['title']} | {p['date']} | {p['image']}")

if __name__ == "__main__":
    posts = build_posts()
    if not posts:
        print(f"No .webp files found in {DEST_DIR}")
    else:
        update_index(posts)
