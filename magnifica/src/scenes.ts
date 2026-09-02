/**
 * Per-page scene definitions: a soundscape preset (layer levels for the
 * mini sound board) and a hero video-loop spec. The `videoPrompt` is the
 * generation brief for the Higgsfield pipeline (see ASSETS.md) — every scene
 * is deliberately place-based: landscapes, architecture, weather, light.
 * No scene depicts a real person; that is a hard rule of this project.
 *
 * A scene's loop is used when magnifica/public/media/loops/<id>.mp4 exists in
 * the bundle; pages degrade gracefully to the plain masthead without it.
 */

export interface Scene {
  /** 0–1 level per soundscape layer; omitted layers default to 0 */
  sound: Partial<Record<"village" | "drone" | "bells" | "rain" | "temple", number>>;
  /** Higgsfield generation brief for the seamless hero loop (no people) */
  videoPrompt: string;
  /** Accessible description of the loop */
  alt: string;
}

export const HOME_SCENE: Scene = {
  sound: { drone: 0.35, bells: 0.25, temple: 0.15 },
  videoPrompt:
    "Slow aerial drift over St Peter's Basilica dome at dawn, soft golden haze, a murmuration of starlings turning far away, gentle volumetric light, cinematic, calm, seamless 10s loop, no people, no text",
  alt: "St Peter's dome in golden dawn haze, starlings turning in the distance",
};

export const SCENES: Record<string, Scene> = {
  "dalai-lama": {
    sound: { village: 0.65, bells: 0.45, temple: 0.25 },
    videoPrompt:
      "Himalayan valley at first light, strings of colourful prayer flags rippling in a steady wind between poles, snow peaks behind, thin mist rising, crisp air, cinematic, serene, seamless 10s loop, no people, no text",
    alt: "Prayer flags rippling before snow-capped Himalayan peaks",
  },
  sadhguru: {
    sound: { village: 0.35, drone: 0.45, temple: 0.35 },
    videoPrompt:
      "Velliangiri hills of southern India at dusk, low mist flowing slowly through dark green ridges, a single oil lamp flame steady in the foreground, deep blue hour, cinematic, meditative, seamless 10s loop, no people, no text",
    alt: "Mist flowing through the Velliangiri hills at dusk, a lamp flame in the foreground",
  },
  amma: {
    sound: { rain: 0.3, drone: 0.3, bells: 0.2 },
    videoPrompt:
      "Kerala backwaters at dawn, still water reflecting coconut palms, gentle ripples, warm rose light, a few flower petals drifting past, lush and tender, cinematic, seamless 10s loop, no people, no text",
    alt: "Kerala backwaters at dawn, palms reflected in still water",
  },
  "pomnyun-sunim": {
    sound: { rain: 0.55, bells: 0.3, village: 0.2 },
    videoPrompt:
      "Korean mountain temple courtyard in soft rain, wet stone and wooden eaves, a paper lantern swaying slightly, maple leaves trembling, muted green and grey palette, contemplative, cinematic, seamless 10s loop, no people, no text",
    alt: "Rain falling on a Korean temple courtyard",
  },
  "ahmed-el-tayeb": {
    sound: { drone: 0.35, temple: 0.3, village: 0.25 },
    videoPrompt:
      "Al-Azhar mosque courtyard at dusk, warm lantern light on ancient stone arcades, a slow drift past minarets against a deep indigo sky, soft moths of light, reverent, cinematic, seamless 10s loop, no people, no text",
    alt: "Lantern-lit arcades and minarets of Al-Azhar at dusk",
  },
  "ali-al-sistani": {
    sound: { drone: 0.4, temple: 0.25, village: 0.3 },
    videoPrompt:
      "Narrow old street of Najaf at golden hour seen from a rooftop distance, the golden dome of the shrine shimmering in heat haze on the horizon, dust motes in slanting light, austere and still, cinematic, seamless 10s loop, no people, no text",
    alt: "Najaf rooftops with the golden shrine dome shimmering on the horizon",
  },
  "ephraim-mirvis": {
    sound: { bells: 0.2, drone: 0.25, temple: 0.2 },
    videoPrompt:
      "A Shabbat table by a window at dusk: two candle flames burning steadily, braided challah under an embroidered cloth, warm bokeh of a London street beyond the glass, intimate, golden, cinematic, seamless 10s loop, no people, no text",
    alt: "Shabbat candles burning by a window at dusk",
  },
  "aga-khan-v": {
    sound: { village: 0.6, drone: 0.3, bells: 0.15 },
    videoPrompt:
      "Hunza valley in northern Pakistan, terraced fields below vast glaciated peaks, cloud shadows moving slowly across the valley floor, poplar trees swaying, luminous mountain light, majestic, cinematic, seamless 10s loop, no people, no text",
    alt: "Cloud shadows crossing the terraced Hunza valley beneath glaciers",
  },
  "bartholomew-i": {
    sound: { village: 0.4, bells: 0.4, temple: 0.2 },
    videoPrompt:
      "The Bosphorus at dawn from the Phanar shoreline, gulls wheeling slowly over silver water, incense-like morning mist, domes and cypresses in silhouette, Byzantine gold light, cinematic, seamless 10s loop, no people, no text",
    alt: "Gulls over the Bosphorus at dawn, domes in silhouette",
  },
  kirill: {
    sound: { village: 0.45, bells: 0.5, drone: 0.3 },
    videoPrompt:
      "Snow falling steadily on golden onion domes and dark spruce trees at blue hour, candle-lit windows glowing far below, slow drifting flakes, hushed and heavy, cinematic, seamless 10s loop, no people, no text",
    alt: "Snow falling on golden onion domes at blue hour",
  },
  "tawadros-ii": {
    sound: { village: 0.5, temple: 0.3, drone: 0.25 },
    videoPrompt:
      "Desert monastery of Wadi Natrun at dusk, ochre walls and ancient domes under a violet sky, sand hissing gently across the foreground, one lit doorway, vast stillness, cinematic, seamless 10s loop, no people, no text",
    alt: "A desert monastery glowing at dusk in Wadi Natrun",
  },
  "sarah-mullally": {
    sound: { rain: 0.35, bells: 0.35, drone: 0.2 },
    videoPrompt:
      "Interior of Canterbury Cathedral nave, shafts of morning light through stained glass drifting slowly across stone columns, dust motes rising, soft rain on the windows, luminous and quiet, cinematic, seamless 10s loop, no people, no text",
    alt: "Light through stained glass moving across the Canterbury nave",
  },
  "dallin-oaks": {
    sound: { village: 0.45, drone: 0.25, bells: 0.15 },
    videoPrompt:
      "Wasatch mountains above Salt Lake valley at first light, aspen leaves flickering in the foreground, granite peaks catching pink alpenglow, clear high-altitude air, hopeful, cinematic, seamless 10s loop, no people, no text",
    alt: "Alpenglow on the Wasatch range, aspens flickering",
  },
  "enoch-adeboye": {
    sound: { drone: 0.35, temple: 0.35, rain: 0.2 },
    videoPrompt:
      "Vast African night sky over the lights of a great encampment on the Lagos-Ibadan expressway seen from far above, warm sodium glow beneath deep starfield, gentle heat shimmer, expectant, cinematic, seamless 10s loop, no people, no text",
    alt: "A sea of warm lights under an African night sky",
  },
  "universal-house-of-justice": {
    sound: { village: 0.3, bells: 0.25, drone: 0.3 },
    videoPrompt:
      "The terraced gardens of Haifa descending toward the Mediterranean at golden hour, geometric flowerbeds and cypresses, fountains catching light, the sea hazy beyond, ordered and serene, cinematic, seamless 10s loop, no people, no text",
    alt: "Haifa's terraced gardens descending to the sea",
  },
  "kuldeep-singh-gargaj": {
    sound: { temple: 0.35, drone: 0.3, bells: 0.25 },
    videoPrompt:
      "The Golden Temple of Amritsar at night reflected in the still sarovar, warm gold light trembling on dark water, slow ripples, marble walkway edges in shadow, sacred calm, cinematic, seamless 10s loop, no people, no text",
    alt: "The Golden Temple reflected in still night water",
  },
};

/**
 * Generation briefs for the v2 section stills (public/media/stills/<name>.jpg),
 * 16:9, encoded to 1920px wide — see ASSETS.md §3. Same hard rule as the
 * loops: place, weather, architecture, light; no people, no text. The first
 * four sit behind a leader's excerpt slides, the last two behind the reading
 * chapters (EXPERIENCES[id].stills / chapterStills in experience.ts).
 */
export const STILL_BRIEFS: Record<string, string> = {
  // Sadhguru — the Velliangiri foothills, the Isha yoga centre's forms and
  // materials, and the southern Indian monsoon.
  "sg-velliangiri":
    "Velliangiri hills of Tamil Nadu at dawn, layered dark green ridges receding into blue haze, low cloud caught in the folds, first warm light on the far peak, cinematic, still, no people, no text",
  "sg-lamp":
    "A single brass oil lamp burning on dark granite in a dim stone hall, small steady flame, soft warm glow on polished black stone, deep shadow all round, close and quiet, no people, no text",
  "sg-dhyanalinga":
    "Interior of a vast domed brick meditation hall in southern India, elliptical dome of unplastered red brick, a few oil lamps, warm dust-laden shafts of light, silence made visible, no people, no text",
  "sg-monsoon":
    "Monsoon rain sweeping across coconut groves and wet red earth in Tamil Nadu, grey-green light, rain visible as diagonal veils, a flooded track reflecting the sky, cinematic, no people, no text",
  "sg-workshop":
    "An open-sided workshop of dark timber and rough stone in the hills, tools hung on the wall, a lathe under a single bulb, evening blue outside, warm inside, honest materials, no people, no text",
  "sg-fields":
    "Terraced fields on the lower slopes of the Velliangiri hills after rain, standing water mirroring an overcast sky, a line of tall trees on the ridge, soft grey light, wide and calm, no people, no text",
};
