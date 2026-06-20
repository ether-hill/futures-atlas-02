#!/usr/bin/env python3
"""Source v2 images: per-letter 'before' photos + research thumbnails, from
Wikimedia Commons, with license capture. Throttled + retried (429-safe).
"""
import json, os, re, time, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
VILL = os.path.join(ROOT, "villages")
RES = os.path.join(ROOT, "research")
os.makedirs(VILL, exist_ok=True)
os.makedirs(RES, exist_ok=True)
UA = "TheHollowVillages/2.0 (speculative-design project; contact via site)"
API = "https://commons.wikimedia.org/w/api.php"

# letter id -> (search term, real-place caption)
LETTERS = [
    ("anna-8", "Chianale Piedmont", "Chianale, Piedmont, Italy"),
    ("giorgio-72", "Cervara di Roma", "Cervara di Roma, Lazio, Italy"),
    ("mara-34", "Santo Stefano di Sessanio", "Santo Stefano di Sessanio, Abruzzo, Italy"),
    ("tomas-19", "Pentedattilo Calabria", "Pentedattilo, Calabria, Italy"),
    ("yusuf-45", "Craco Basilicata", "Craco, Basilicata, Italy"),
    ("bianca-51", "Castelmezzano", "Castelmezzano, Basilicata, Italy"),
    ("elif-40", "Apricale Liguria", "Apricale, Liguria, Italy"),
    ("rosa-29", "Corippo Ticino", "Corippo, Ticino, Switzerland"),
    ("henrik-58", "Bosco Gurin", "Bosco Gurin, Ticino, Switzerland"),
    ("lucia-16", "Soglio Graubunden", "Soglio, Graubünden, Switzerland"),
]

# research thumbnails pre-resolved by the research agent (id, url, license, author, place)
RESEARCH_IMGS = [
    ("ostana-first-baby", "https://commons.wikimedia.org/wiki/Special:FilePath/Ostana.jpg?width=1200", "CC BY-SA 4.0", "Silvia Pasquetto", "Ostana, Piedmont"),
    ("sambuca-one-euro-houses", "https://commons.wikimedia.org/wiki/Special:FilePath/Sambuca%20di%20Sicilia.jpg?width=1200", "Public domain", "Leop81", "Sambuca di Sicilia"),
    ("riace-refugees-revival", "https://commons.wikimedia.org/wiki/Special:FilePath/Riace%20paese.JPG?width=1200", "CC BY 3.0", "Marcuscalabresus", "Riace, Calabria"),
    ("albinen-newcomer-payments", "https://commons.wikimedia.org/wiki/Special:FilePath/Albinen.jpg?width=1200", "CC BY-SA 3.0", "Xenos", "Albinen, Valais"),
    ("empty-spain-overview", "https://commons.wikimedia.org/wiki/Special:FilePath/Bergosa%20Pueblo%20abandonado%20HU%20Espa%C3%B1a%201.jpg?width=1200", "CC BY-SA 4.0", "Dmolinat2", "Bergosa, Huesca"),
]


def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                w = 5 * (i + 1)
                print(f"   429, backoff {w}s")
                time.sleep(w)
                continue
            raise


def meta_val(ext, key):
    v = ext.get(key, {}).get("value", "") if ext else ""
    return re.sub("<[^<]+?>", "", v).strip()


def search_image(term):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": term, "gsrnamespace": "6", "gsrlimit": "8",
        "prop": "imageinfo", "iiprop": "url|extmetadata|mime", "iiurlwidth": "1400",
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    pages = [p for p in data.get("query", {}).get("pages", {}).values() if p.get("imageinfo")]
    pages.sort(key=lambda p: p.get("index", 99))
    bad = ("coat of arms", "stemma", "map", "mappa", "location", "flag", "logo")
    for p in pages:
        ii = p["imageinfo"][0]
        title = p["title"].lower()
        if ii.get("mime", "").startswith("image/jpeg") and not any(b in title for b in bad):
            return p["title"], ii
    return (pages[0]["title"], pages[0]["imageinfo"][0]) if pages else (None, None)


credits = ["# Image credits — /public/villages/ and /public/research/", "",
           "\"Before\" photos are real places from Wikimedia Commons (license + author below).",
           "\"After\" slots are placeholders (a copy of the before) until the owner adds 2050 renders.",
           "Research thumbnails: specific, on-topic free photos of the real place/scheme.", "",
           "## Village 'before' photos", ""]

for lid, term, caption in LETTERS:
    time.sleep(3)
    title, ii = search_image(term)
    if not ii:
        print(f"!! no result: {lid} ({term})")
        continue
    img = get(ii.get("thumburl") or ii["url"])
    open(os.path.join(VILL, f"{lid}-before.jpg"), "wb").write(img)
    open(os.path.join(VILL, f"{lid}-after.jpg"), "wb").write(img)  # placeholder
    ext = ii.get("extmetadata", {})
    author = meta_val(ext, "Artist") or "Unknown"
    lic = meta_val(ext, "LicenseShortName") or "see source"
    print(f"ok {lid}: {title} ({len(img)//1024} KB) — {lic}")
    credits += [f"### {lid} — {caption}", f"- File: {title}", f"- Author: {author}",
                f"- License: {lic}", f"- Source: {ii.get('descriptionurl','')}", ""]

credits += ["## Research thumbnails", ""]
for rid, url, lic, author, place in RESEARCH_IMGS:
    time.sleep(2)
    try:
        img = get(url)
        open(os.path.join(RES, f"{rid}.jpg"), "wb").write(img)
        print(f"ok research {rid}: ({len(img)//1024} KB) — {lic}")
        credits += [f"### {rid} — {place}", f"- Author: {author}", f"- License: {lic}",
                    f"- Source: Wikimedia Commons", ""]
    except Exception as e:
        print(f"!! research {rid}: {e}")

open(os.path.join(VILL, "CREDITS.md"), "w").write("\n".join(credits))
# remove v1 numbered placeholders
for f in os.listdir(VILL):
    if re.match(r"village-0\d-(before|after)\.jpg", f):
        os.remove(os.path.join(VILL, f))
print("done; wrote CREDITS.md, cleaned v1 files")
