#!/usr/bin/env python3
"""Fetch real 'before' village photos from Wikimedia Commons with license data.

Each entry targets a genuinely documented quiet/depopulated real place, so the
realPlaceCaption on /futures is truthful. Writes scaled JPGs into
public/villages/ and a CREDITS.md with photographer + source + license.
"""
import json
import os
import time
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "villages")
os.makedirs(OUT, exist_ok=True)

UA = "TheHollowVillages/1.0 (speculative-design student project; contact via site)"

# (slot, search term, human caption for realPlaceCaption)
TARGETS = [
    ("village-01", "Civita di Bagnoregio", "Civita di Bagnoregio, Lazio, Italy"),
    ("village-02", "Calascio Abruzzo", "Calascio, Abruzzo, Italy"),
    ("village-03", "Roscigno Vecchia", "Roscigno Vecchia, Campania, Italy"),
    ("village-04", "Bussana Vecchia", "Bussana Vecchia, Liguria, Italy"),
    ("village-05", "Granadilla Caceres pueblo", "Granadilla, Cáceres, Spain"),
]

API = "https://commons.wikimedia.org/w/api.php"


def get(url, tries=5):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < tries - 1:
                wait = 5 * (attempt + 1)
                print(f"   429, backing off {wait}s...")
                time.sleep(wait)
                continue
            raise


def search_image(term):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": term,
        "gsrnamespace": "6",  # File namespace
        "gsrlimit": "6",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
        "iiurlwidth": "1600",
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    pages = list(data.get("query", {}).get("pages", {}).values())
    # prefer real photos (jpeg), skip svg/maps/coats of arms
    pages = [p for p in pages if p.get("imageinfo")]
    for p in pages:
        ii = p["imageinfo"][0]
        if ii.get("mime", "").startswith("image/jpeg"):
            return p["title"], ii
    if pages:
        return pages[0]["title"], pages[0]["imageinfo"][0]
    return None, None


def meta_val(ext, key):
    v = ext.get(key, {}).get("value", "") if ext else ""
    # strip crude HTML
    import re
    return re.sub("<[^<]+?>", "", v).strip()


credits = ["# Image credits — /public/villages/", "",
           "\"Before\" photos are real places sourced from Wikimedia Commons.",
           "\"After\" slots are placeholders (a copy of the before) until the owner",
           "adds their own revitalisation renders.", ""]

for slot, term, caption in TARGETS:
    time.sleep(3)  # be polite to the Commons API
    title, ii = search_image(term)
    if not ii:
        print(f"!! no result for {term}")
        continue
    thumb = ii.get("thumburl") or ii.get("url")
    ext = ii.get("extmetadata", {})
    artist = meta_val(ext, "Artist") or "Unknown"
    lic = meta_val(ext, "LicenseShortName") or "see source"
    descurl = ii.get("descriptionurl", "")
    img = get(thumb)
    path = os.path.join(OUT, f"{slot}-before.jpg")
    with open(path, "wb") as f:
        f.write(img)
    # placeholder "after" = copy of before (clearly labelled placeholder in UI)
    with open(os.path.join(OUT, f"{slot}-after.jpg"), "wb") as f:
        f.write(img)
    print(f"ok {slot}: {title} ({len(img)//1024} KB) — {lic}")
    credits.append(f"## {slot} — {caption}")
    credits.append(f"- File: {title}")
    credits.append(f"- Photographer / author: {artist}")
    credits.append(f"- License: {lic}")
    credits.append(f"- Source: {descurl}")
    credits.append("")

with open(os.path.join(OUT, "CREDITS.md"), "w") as f:
    f.write("\n".join(credits))
print("wrote CREDITS.md")
