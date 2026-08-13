/**
 * Official portraits — REAL photographs under REAL licences, never generated.
 *
 * magnifica/ASSETS.md sets the hard rule this file exists to keep: no
 * real-person likenesses are generated for this project. The reason is in the
 * content itself — these documents record leaders condemning deepfakes of
 * themselves — so every face here is a real photograph, sourced from Wikimedia
 * Commons under a free licence, with its author and licence recorded.
 *
 * Everything in an entry is load-bearing: `credit`, `licence` and `licenceUrl`
 * are rendered on screen wherever the portrait appears, because these licences
 * require attribution to be visible. Removing the caption is a licence breach,
 * not a design choice. Every file is cropped to one common 4:5 frame so the
 * grid reads as a set, and cropping is an adaptation — hence "cropped" in the
 * credit, which satisfies the indicate-changes term.
 *
 * Two entries are not faces, on purpose: the Universal House of Justice is an
 * institution rather than a person, so it carries its Seat at Haifa. `leo-xiv`
 * is the encyclical's author, used by the banner and the About section rather
 * than by a voice card.
 *
 * Leaders without an entry fall back to a monogram tile.
 */

export interface Portrait {
  /** file under /magnifica/media/portraits/ */
  file: string;
  alt: string;
  /** author + any modification, shown on screen */
  credit: string;
  licence: string;
  licenceUrl: string;
  sourceUrl: string;
}

export const PORTRAITS: Record<string, Portrait> = {
  "dallin-oaks": {
    file: "dallin-oaks.jpg",
    alt: "Dallin H. Oaks, President of The Church of Jesus Christ of Latter-day Saints",
    credit: "Scott G. Winterton for Deseret News — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dallin_Harris_Oaks_(cropped3x4).jpg",
  },
  "enoch-adeboye": {
    file: "enoch-adeboye.jpg",
    alt: "Pastor Enoch Adejare Adeboye, General Overseer of the Redeemed Christian Church of God",
    credit: "Abolajiadeola — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Eaa1.jpg",
  },
  "universal-house-of-justice": {
    file: "universal-house-of-justice.jpg",
    alt: "The Seat of the Universal House of Justice on Mount Carmel, Haifa",
    credit: "Nafisto at English Wikipedia — cropped",
    licence: "Public domain",
    licenceUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:CarmelArc.jpg",
  },
  "kuldeep-singh-gargaj": {
    file: "kuldeep-singh-gargaj.jpg",
    alt: "Giani Kuldeep Singh Gargaj, Acting Jathedar of Sri Akal Takht Sahib",
    credit: "Gurjeetsinghazad — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Giani_Kuldeep_Singh_Gargaj.jpg",
  },
  "bartholomew-i": {
    file: "bartholomew-i.jpg",
    alt: "Ecumenical Patriarch Bartholomew I of Constantinople",
    credit: "Υπουργείο Εξωτερικών — cropped",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:%D0%9F%D0%B0%D1%82%D1%80%D0%B8%D0%B0%D1%80%D1%85_%D0%92%D0%B0%D1%80%D1%84%D0%BE%D0%BB%D0%BE%D0%BC%D0%B5%D0%B9_(cropped).jpg",
  },
  "kirill": {
    file: "kirill.jpg",
    alt: "Patriarch Kirill of Moscow and All Rus'",
    credit: "Press Service of the President of the Republic of Azerbaijan — cropped",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Patriarch_Kirill_in_Baku_2025.jpg",
  },
  "tawadros-ii": {
    file: "tawadros-ii.jpg",
    alt: "Pope Tawadros II of Alexandria",
    credit: "OSCE Parliamentary Assembly — cropped",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tawadros_II.jpg",
  },
  "sarah-mullally": {
    file: "sarah-mullally.jpg",
    alt: "Sarah Mullally, Archbishop of Canterbury",
    credit: "Roger Harris — cropped",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Official_portrait_of_The_Lord_Bishop_of_London_(3x4_cropped).jpg",
  },
  "ahmed-el-tayeb": {
    file: "ahmed-el-tayeb.jpg",
    alt: "Sheikh Ahmed el-Tayeb, Grand Imam of Al-Azhar",
    credit: "channel1eg — cropped",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ahmed_el-Tayeb_(3x4_cropped).jpg",
  },
  "ali-al-sistani": {
    file: "ali-al-sistani.jpg",
    alt: "Grand Ayatollah Ali al-Sistani",
    credit: "IsaKazimi ( talk ) — cropped",
    licence: "Public domain",
    licenceUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ali_Sistani_edit1.jpg",
  },
  "ephraim-mirvis": {
    file: "ephraim-mirvis.jpg",
    alt: "Chief Rabbi Sir Ephraim Mirvis",
    credit: "Brian Minkoff- London Pixels — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Chiefrabbi2015.jpg",
  },
  "aga-khan-v": {
    file: "aga-khan-v.jpg",
    alt: "Prince Rahim Aga Khan V",
    credit: "Pamir Times — cropped",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aga_Khan_Key_(crop2).png",
  },
  "dalai-lama": {
    file: "dalai-lama.jpg",
    alt: "The 14th Dalai Lama photographed in 2012",
    credit: "Christopher Michel — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Dalai_Lama_in_2012.jpg",
  },
  "sadhguru": {
    file: "sadhguru.jpg",
    alt: "Sadhguru Jaggi Vasudev, founder of the Isha Foundation",
    credit: "Isha Foundation — cropped",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sadhguru-Jaggi-Vasudev.jpg",
  },
  "amma": {
    file: "amma.jpg",
    alt: "Sri Mata Amritanandamayi Devi (Amma)",
    credit: "JLA974, Audebaud Jean louis from casablanca — cropped",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mata_Amritanandamayi_(cropped).jpg",
  },
  "pomnyun-sunim": {
    file: "pomnyun-sunim.jpg",
    alt: "Ven. Pomnyun Sunim, founder of the Jungto Society",
    credit: "Taeyeun — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:PomnyunSunim.jpg",
  },
  "leo-xiv": {
    file: "leo-xiv.jpg",
    alt: "Pope Leo XIV",
    credit: "Edgar Beltrán , The Pillar — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Pope_Leo_XIV_3_(3x4_cropped).png",
  },
};

export const portraitOf = (id: string): Portrait | undefined => PORTRAITS[id];

/** Initials for the fallback tile: first letters of the first two words. */
export function monogram(name: string): string {
  return name
    .replace(/^(His|Her)\s+\w+\s+/i, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
