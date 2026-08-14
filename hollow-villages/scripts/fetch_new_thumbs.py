#!/usr/bin/env python3
"""Fetch real Wikimedia Commons thumbnails for the 9 per-letter case-study
entries added in the v4 oracle rework, and patch research.ts (press-image ->
commons + attribution). Picks a representative place photo for each; tries a
few candidate Wikipedia titles until one yields a lead image.
"""
import os, re, json, time, html, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
RES = os.path.join(ROOT, "public", "research")
os.makedirs(RES, exist_ok=True)
UA = "TheHollowVillages/4.0 (speculative-design project; thumbnails)"

# id -> ordered [(wikipedia_title, depicts)] candidates
CAND = {
    "sardinia-relocation-grant": [
        ("Bosa", "the Sardinian town of Bosa, Italy"),
        ("Castelsardo", "the Sardinian hill town of Castelsardo, Italy"),
        ("Aggius", "the Sardinian village of Aggius, Italy"),
    ],
    "east-tyrol-carsharing": [
        ("Matrei in Osttirol", "Matrei in Osttirol, East Tyrol, Austria"),
        ("Lienz", "Lienz, East Tyrol, Austria"),
        ("Kals am Großglockner", "Kals am Großglockner, East Tyrol, Austria"),
    ],
    "pueblos-remotos-canaries": [
        ("Masca, Tenerife", "the village of Masca, Tenerife, Canary Islands"),
        ("Tejeda, Las Palmas", "the Canary village of Tejeda, Gran Canaria"),
        ("Garachico", "Garachico, Tenerife, Canary Islands"),
    ],
    "galicia-rural-coworking": [
        ("O Cebreiro", "the Galician mountain village of O Cebreiro, Spain"),
        ("Combarro", "the Galician village of Combarro, Spain"),
        ("Allariz", "the Galician town of Allariz, Spain"),
    ],
    "candover-community-store": [
        ("Preston Candover", "Preston Candover, Hampshire, England"),
        ("Brown Candover", "the Candover valley, Hampshire, England"),
        ("New Alresford", "a Hampshire village, England"),
    ],
    "turano-borghi-cluster": [
        ("Castel di Tora", "Castel di Tora on Lake Turano, Lazio, Italy"),
        ("Colle di Tora", "the Turano valley, Lazio, Italy"),
        ("Lake Turano", "Lake Turano, Lazio, Italy"),
    ],
    "idealista-paid-to-live": [
        ("Griegos", "the Aragonese village of Griegos, Teruel, Spain"),
        ("Anento", "the Aragonese village of Anento, Teruel, Spain"),
        ("Albarracín", "a village in Teruel, Aragón, Spain"),
    ],
    "terre-de-liens-saint-dizier": [
        ("Saint-Dizier-en-Diois", "Saint-Dizier-en-Diois, Drôme, France"),
        ("Châtillon-en-Diois", "a village in the Drôme pre-Alps, France"),
        ("Die, Drôme", "the Diois, Drôme, France"),
    ],
    "si4care-calabria-telecare": [
        ("Gerace", "the Calabrian hill town of Gerace, Italy"),
        ("Civita, Calabria", "the Calabrian village of Civita, Italy"),
        ("Stilo", "the Calabrian village of Stilo, Italy"),
    ],
}


def get(url, tries=5):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < tries - 1:
                time.sleep(4 * (i + 1)); continue
            return None
        except Exception:
            if i < tries - 1:
                time.sleep(3); continue
            return None
    return None


def summary(title):
    u = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"))
    b = get(u)
    if not b:
        return None
    try:
        return json.loads(b)
    except Exception:
        return None


def filename_from(url):
    if "/thumb/" in url:
        # .../commons/thumb/a/ab/Name.jpg/800px-Name.jpg -> Name.jpg
        after = url.split("/thumb/", 1)[1].split("/")
        return urllib.parse.unquote(after[2])
    return urllib.parse.unquote(url.split("/")[-1])


def attribution(filename):
    api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo"
           "&iiprop=extmetadata&titles=" + urllib.parse.quote("File:" + filename))
    b = get(api)
    author, lic = "Wikimedia Commons", ""
    if b:
        try:
            pages = json.loads(b)["query"]["pages"]
            page = next(iter(pages.values()))
            ext = page["imageinfo"][0]["extmetadata"]
            if "Artist" in ext:
                raw = re.sub(r"<[^>]+>", "", ext["Artist"]["value"])
                author = html.unescape(raw).strip() or author
            if "LicenseShortName" in ext:
                lic = html.unescape(ext["LicenseShortName"]["value"]).strip()
        except Exception:
            pass
    author = re.sub(r"\s+", " ", author)[:60]
    return author, lic


p = os.path.join(ROOT, "src", "data", "research.ts")
src = open(p).read()
log = []

for rid, cands in CAND.items():
    done = False
    for title, depicts in cands:
        s = summary(title)
        if not s:
            continue
        img = (s.get("originalimage") or {}).get("source") or (s.get("thumbnail") or {}).get("source")
        if not img:
            continue
        fn = filename_from(img)
        data = get("https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fn) + "?width=1000")
        if not data or len(data) < 8000:
            continue
        open(os.path.join(RES, f"{rid}.jpg"), "wb").write(data)
        author, lic = attribution(fn)
        credit = f"Wikimedia Commons — {depicts} · {author}" + (f" · {lic}" if lic else "")
        credit = credit.replace('"', "'")
        pat = re.compile(r'(id: "' + re.escape(rid) + r'",.*?thumbnail: "[^"]+",\s*\n\s*)thumbnailType: "press-image",', re.S)
        new, n = pat.subn(r'\1thumbnailType: "commons",\n    thumbnailCredit: "' + credit + '",', src)
        if n == 1:
            src = new
        log.append(f"ok {rid}: {len(data)//1024}KB <- {title} ({lic or 'lic?'}) patch={n}")
        done = True
        time.sleep(1.5)
        break
    if not done:
        log.append(f"!! FAILED {rid}")

open(p, "w").write(src)
print("\n".join(log))
