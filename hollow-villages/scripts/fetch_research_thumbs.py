#!/usr/bin/env python3
"""Download verified Wikimedia Commons thumbnails for the 14 research entries
that lacked a real image, and patch research.ts (thumbnailType -> commons +
attribution). All images are CC/PD; attribution is kept in the card credit.
"""
import os, re, time, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
RES = os.path.join(ROOT, "public", "research")
os.makedirs(RES, exist_ok=True)
UA = "TheHollowVillages/3.0 (speculative-design project)"

# (id, thumbUrl, license, author, depicts)
IMGS = [
    ("oecd-shrinking-smartly", "https://commons.wikimedia.org/wiki/Special:FilePath/Ch%C3%A2teau%20de%20la%20Muette%2C%20Paris%2019%20March%202019%20001.jpg?width=1200", "CC BY 2.0", "MySociety", "OECD headquarters, Château de la Muette, Paris"),
    ("eurostat-rural-demographics", "https://commons.wikimedia.org/wiki/Special:FilePath/EP%20-%20Kirchberg%20from%20the%20skies%202025%20%281%29.jpg?width=1200", "EP free licence", "Simon Schmitt / European Parliament", "EU institutions, Kirchberg, Luxembourg"),
    ("italy-births-record-low", "https://commons.wikimedia.org/wiki/Special:FilePath/Civita%20%28Bagnoregio%29%20-%20Panorama.jpg?width=1200", "CC BY-SA 4.0", "Orlando Paride", "the dwindling hill village of Civita di Bagnoregio"),
    ("lacaixa-immigration-rural-spain", "https://commons.wikimedia.org/wiki/Special:FilePath/A%C3%ADnsa%20-%20Mirador%2001.jpg?width=1200", "CC BY-SA 4.0", "Basotxerri", "the inland Aragonese village of Aínsa, Huesca"),
    ("plunkett-more-than-a-pub", "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Falcon%2C%20Arncliffe%2C%20exterior%20-%20geograph.org.uk%20-%207798216.jpg?width=1200", "CC BY-SA 2.0", "Stephen Craven", "the English village pub The Falcon Inn, Arncliffe"),
    ("agrafa-rural-telehealth", "https://commons.wikimedia.org/wiki/Special:FilePath/Agrafa%20mountains.jpg?width=1200", "CC BY-SA 4.0", "Petros Ziogas", "the remote Agrafa mountains, Greece"),
    ("extremadura-digital-nomad-grants", "https://commons.wikimedia.org/wiki/Special:FilePath/Vista%20de%20Herv%C3%A1s%2C%20Extremadura%20%28Espa%C3%B1a%29.jpg?width=1200", "CC BY-SA 4.0", "MaGrc", "the Extremaduran town of Hervás, Spain"),
    ("pnrr-borghi-fund", "https://commons.wikimedia.org/wiki/Special:FilePath/Borgo%20Santo%20Stefano%20di%20Sessanio.jpg?width=1200", "CC BY-SA 4.0", "Gabriella Pesce", "the restored borgo of Santo Stefano di Sessanio, Abruzzo"),
    ("espana-vaciada-movement", "https://commons.wikimedia.org/wiki/Special:FilePath/Albarrac%C3%ADn%2C%20Teruel%2C%20Espa%C3%B1a%2C%202014-01-10%2C%20DD%20022-025%20PAN.JPG?width=1200", "CC BY-SA 3.0", "Diego Delso", "Albarracín, Teruel province, Spain"),
    ("bistrot-de-pays-network", "https://commons.wikimedia.org/wiki/Special:FilePath/Bistrot%20de%20Pays.JPG?width=1200", "Public domain", "Véronique Pagnier", "a French village Bistrot de Pays café"),
    ("uwe-rural-demand-responsive-transport", "https://commons.wikimedia.org/wiki/Special:FilePath/Sharrington%20Community%20Bus%20-%20geograph.org.uk%20-%20121408.jpg?width=1200", "CC BY-SA 2.0", "Martin Addison", "a rural community minibus, Sharrington, England"),
    ("eu-young-farmers-land-access", "https://commons.wikimedia.org/wiki/Special:FilePath/Tractors%20in%20Potato%20Field.jpg?width=1200", "CC BY 2.0", "NightThree", "tractors working farmland"),
    ("euronews-digital-nomad-villages", "https://commons.wikimedia.org/wiki/Special:FilePath/Coworking%20Space%20in%20Berlin.jpg?width=1200", "CC BY-SA 3.0", "Deskmag", "people working in a co-working space"),
    ("tarpino-spaesati", "https://commons.wikimedia.org/wiki/Special:FilePath/Craco%20il%20paese%20fantasma.jpg?width=1200", "CC BY-SA 4.0", "Maurizio Moro5153", "the abandoned ghost village of Craco, Basilicata"),
]


def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                time.sleep(5 * (i + 1)); continue
            raise


p = os.path.join(ROOT, "src", "data", "research.ts")
src = open(p).read()
credits = ["", "## Research thumbnails (added round 3) — Wikimedia Commons", ""]

for rid, url, lic, author, depicts in IMGS:
    time.sleep(2)
    img = get(url)
    open(os.path.join(RES, f"{rid}.jpg"), "wb").write(img)
    credit = f"Wikimedia Commons — {depicts} · {author} · {lic}"
    # within this entry's block, replace the screengrab type with commons + credit
    pat = re.compile(r'(id: "' + re.escape(rid) + r'",.*?thumbnail: "[^"]+",\s*\n\s*)thumbnailType: "screengrab",', re.S)
    new, n = pat.subn(r'\1thumbnailType: "commons",\n    thumbnailCredit: "' + credit.replace('"', "'") + '",', src)
    if n != 1:
        print(f"!! patch failed for {rid} (n={n})")
    else:
        src = new
        print(f"ok {rid}: {len(img)//1024} KB — {lic}")
    credits += [f"- {rid}: {depicts} — {author}, {lic}"]

# the 5 already-imaged entries are also Commons: relabel unsplash -> commons
src = src.replace('thumbnailType: "unsplash",', 'thumbnailType: "commons",')

open(p, "w").write(src)
open(os.path.join(ROOT, "public", "villages", "CREDITS.md"), "a").write("\n".join(credits) + "\n")
print("patched research.ts; remaining screengrab types:", src.count('"screengrab"'))
