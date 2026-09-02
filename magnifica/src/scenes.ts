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

/**
 * The procedural family a layer falls back to when its loop file is missing:
 * wind (filtered noise, breathing), drone (low detuned tones), bells (sparse
 * struck tones), rain (bright shimmering noise), hum (a low room tone).
 */
export type SoundFamily = "wind" | "drone" | "bells" | "rain" | "hum";

/**
 * One layer of a leader's soundscape. The loop lives at
 * public/media/sfx/<scene id>/<layer id>.mp3 and is generated from `prompt`
 * by magnifica/scripts/sfx.mjs (ElevenLabs sound generation, looped, ~20 s).
 * Each set is particular to the leader's place and tradition — the
 * Bosphorus and a semantron for the Phanar, monsoon and a temple bell for
 * Velliangiri — never a generic "temple" bed. No voices, no chant: that is
 * the same line the portraits and the narrator keep.
 */
export interface SoundLayer {
  id: string;
  label: string;
  /** default level, 0–1 */
  level: number;
  family: SoundFamily;
  prompt: string;
}

export interface Scene {
  id: string;
  layers: SoundLayer[];
  /** Higgsfield generation brief for the seamless hero loop (no people) */
  videoPrompt: string;
  /** Accessible description of the loop */
  alt: string;
}

/** Every scene's soundscape, four layers each — see SoundLayer. */
export const LAYERS: Record<string, SoundLayer[]> = {
  "home": [
    { id: "bells", label: "Basilica bells", level: 0.3, family: "bells",
      prompt: "distant slow church bells of a great basilica at dawn, single deep strokes with long silences between, soft air, seamless loop, no voices" },
    { id: "starlings", label: "Starlings", level: 0.35, family: "wind",
      prompt: "a murmuration of starlings turning far overhead, thousands of soft wingbeats and faint chatter rising and falling, open air, seamless loop, no voices" },
    { id: "fountain", label: "Square fountains", level: 0.25, family: "rain",
      prompt: "two large stone fountains in a wide piazza, steady falling water heard from a distance, seamless loop, no voices" },
    { id: "city", label: "Rome at dawn", level: 0.2, family: "hum",
      prompt: "the hush of a large old city just before dawn, faraway traffic and a scooter, air moving between stone buildings, seamless loop, no voices" },
  ],
  "dalai-lama": [
    { id: "wind", label: "Himalayan wind", level: 0.6, family: "wind",
      prompt: "steady high-altitude wind over a Himalayan pass, thin cold air, slow gusts, seamless loop, no voices, no music" },
    { id: "flags", label: "Prayer flags", level: 0.45, family: "wind",
      prompt: "strings of cotton prayer flags snapping and fluttering in a steady mountain wind, ropes creaking, seamless loop, no voices" },
    { id: "bowl", label: "Singing bowl", level: 0.4, family: "bells",
      prompt: "a Tibetan singing bowl struck once and left to ring out, long shimmering decay, sparse with silence between strikes, seamless loop, no voices" },
    { id: "horn", label: "Dungchen", level: 0.25, family: "drone",
      prompt: "Tibetan long horns heard far across a valley, very low sustained tones swelling and fading, no melody, seamless loop, no voices" },
  ],
  "sadhguru": [
    { id: "monsoon", label: "Monsoon rain", level: 0.5, family: "rain",
      prompt: "heavy monsoon rain falling on coconut palms and red earth in southern India, steady with distant thunder, seamless loop, no voices" },
    { id: "bell", label: "Temple bell", level: 0.35, family: "bells",
      prompt: "a South Indian brass temple bell struck slowly, bright rings with long decay and long silences, seamless loop, no voices" },
    { id: "night", label: "Night forest", level: 0.4, family: "wind",
      prompt: "night in the Western Ghats foothills, dense crickets and frogs, a breeze in wet leaves, seamless loop, no voices" },
    { id: "tanpura", label: "Tanpura", level: 0.3, family: "drone",
      prompt: "a tanpura drone, four strings plucked in slow cycle, warm sustained resonance, no melody, seamless loop, no voices" },
  ],
  "amma": [
    { id: "water", label: "Backwaters", level: 0.5, family: "rain",
      prompt: "calm Kerala backwater at dawn, water lapping gently against a wooden boat, a paddle dipping now and then, seamless loop, no voices" },
    { id: "birds", label: "Dawn birds", level: 0.35, family: "wind",
      prompt: "kingfishers, crows and mynas at dawn over still water and palms, spacious and soft, seamless loop, no voices" },
    { id: "conch", label: "Conch and bell", level: 0.25, family: "bells",
      prompt: "a temple conch blown once far away and a small brass bell, sparse with long silence between, seamless loop, no voices" },
    { id: "palms", label: "Coconut palms", level: 0.35, family: "wind",
      prompt: "coconut palm fronds moving in a warm breeze, dry rustle and creak, seamless loop, no voices" },
  ],
  "pomnyun-sunim": [
    { id: "rain", label: "Rain on eaves", level: 0.55, family: "rain",
      prompt: "soft rain falling on the tiled eaves and stone courtyard of a Korean mountain temple, drips from the roof edge, seamless loop, no voices" },
    { id: "moktak", label: "Moktak", level: 0.3, family: "bells",
      prompt: "a Korean moktak wooden fish block struck in a slow steady rhythm, hollow wooden knocks, sparse, seamless loop, no voices" },
    { id: "chime", label: "Eave wind-bell", level: 0.3, family: "bells",
      prompt: "a bronze temple eave wind-bell with a fish clapper stirring in light wind, occasional soft rings, seamless loop, no voices" },
    { id: "stream", label: "Mountain stream", level: 0.3, family: "rain",
      prompt: "a small mountain stream over rocks below a temple, steady clear water, seamless loop, no voices" },
  ],
  "ahmed-el-tayeb": [
    { id: "fountain", label: "Courtyard fountain", level: 0.4, family: "rain",
      prompt: "a stone ablution fountain in a mosque courtyard, steady trickling water echoing off stone arcades, seamless loop, no voices" },
    { id: "doves", label: "Doves", level: 0.35, family: "wind",
      prompt: "doves cooing and wings flapping in old stone arcades, warm evening air, seamless loop, no voices" },
    { id: "city", label: "Cairo at dusk", level: 0.3, family: "hum",
      prompt: "the far hum of Cairo at dusk, distant traffic and car horns softened by distance, warm air, seamless loop, no voices, no call to prayer" },
    { id: "ney", label: "Ney", level: 0.2, family: "drone",
      prompt: "a ney reed flute heard far away, long breathy sustained tones with silence between, no melody, seamless loop, no voices" },
  ],
  "ali-al-sistani": [
    { id: "wind", label: "Desert wind", level: 0.45, family: "wind",
      prompt: "dry desert wind across low buildings and open ground in southern Iraq, sand hiss, seamless loop, no voices" },
    { id: "courtyard", label: "Shrine courtyard", level: 0.35, family: "hum",
      prompt: "a vast marble shrine courtyard at night, footsteps far away, pigeons, quiet echo, seamless loop, no voices" },
    { id: "palms", label: "Date palms", level: 0.3, family: "wind",
      prompt: "date palm fronds rustling in a hot wind, dry and rhythmic, seamless loop, no voices" },
    { id: "insects", label: "Evening insects", level: 0.25, family: "wind",
      prompt: "evening insects in a dry garden, faint and steady, warm air, seamless loop, no voices" },
  ],
  "ephraim-mirvis": [
    { id: "rain", label: "London rain", level: 0.35, family: "rain",
      prompt: "light rain on a north London pavement and parked cars, gutters running, seamless loop, no voices" },
    { id: "street", label: "Friday dusk", level: 0.3, family: "hum",
      prompt: "a quiet residential London street at dusk, distant traffic, a door closing, footsteps, seamless loop, no voices" },
    { id: "shofar", label: "Shofar", level: 0.2, family: "bells",
      prompt: "a shofar blown once far away, a single long raw note, then long silence, sparse, seamless loop, no voices" },
    { id: "candles", label: "Candle-lit room", level: 0.3, family: "hum",
      prompt: "a warm quiet room, candle flames flickering faintly, a clock ticking, seamless loop, no voices" },
  ],
  "aga-khan-v": [
    { id: "stream", label: "Glacial stream", level: 0.5, family: "rain",
      prompt: "a fast cold glacial stream over stones in a high northern Pakistani valley, seamless loop, no voices" },
    { id: "wind", label: "Karakoram wind", level: 0.4, family: "wind",
      prompt: "wind moving down a high Karakoram valley, cold and steady with slow gusts, seamless loop, no voices" },
    { id: "orchard", label: "Apricot orchard", level: 0.3, family: "wind",
      prompt: "an apricot orchard in early summer, leaves stirring, bees, a bird now and then, seamless loop, no voices" },
    { id: "rubab", label: "Rubab", level: 0.2, family: "bells",
      prompt: "a rubab plucked softly far away, single notes with long silences, no melody, seamless loop, no voices" },
  ],
  "bartholomew-i": [
    { id: "semantron", label: "Semantron", level: 0.35, family: "bells",
      prompt: "a wooden semantron struck with a mallet in a slow measured rhythm, hollow wooden knocks echoing off stone, sparse, seamless loop, no voices" },
    { id: "bosphorus", label: "Bosphorus", level: 0.45, family: "rain",
      prompt: "the Bosphorus shore, water against a stone quay, gulls, a ferry horn far off, seamless loop, no voices" },
    { id: "censer", label: "Censer", level: 0.25, family: "bells",
      prompt: "the small bells and chains of a swinging incense censer, soft jingling with pauses, seamless loop, no voices" },
    { id: "bell", label: "Church bell", level: 0.3, family: "bells",
      prompt: "a single Byzantine church bell rung slowly and far away, deep strokes with long silence, seamless loop, no voices" },
  ],
  "kirill": [
    { id: "zvon", label: "Russian bells", level: 0.45, family: "bells",
      prompt: "a Russian Orthodox bell peal heard far across snow, layered bells in a slow rolling pattern, distant and soft, seamless loop, no voices" },
    { id: "wind", label: "Winter wind", level: 0.4, family: "wind",
      prompt: "cold winter wind over snow and bare birch trees, dry and steady, seamless loop, no voices" },
    { id: "nave", label: "Candle-lit nave", level: 0.3, family: "hum",
      prompt: "a vast stone church interior, faint candle crackle, footsteps on stone far away, deep quiet reverb, seamless loop, no voices" },
    { id: "rooks", label: "Rooks", level: 0.25, family: "wind",
      prompt: "rooks calling over a snowy field, far and few, seamless loop, no voices" },
  ],
  "tawadros-ii": [
    { id: "wind", label: "Desert monastery wind", level: 0.45, family: "wind",
      prompt: "wind over the flat desert around a walled monastery in Wadi Natrun, sand and stone, seamless loop, no voices" },
    { id: "cymbals", label: "Cymbals and triangle", level: 0.3, family: "bells",
      prompt: "small Coptic hand cymbals and a triangle struck in a slow liturgical rhythm, sparse with pauses, seamless loop, no voices" },
    { id: "nile", label: "Nile", level: 0.3, family: "rain",
      prompt: "the Nile moving slowly past reeds, water and a light breeze, a felucca rope creaking, seamless loop, no voices" },
    { id: "bell", label: "Monastery bell", level: 0.25, family: "bells",
      prompt: "a monastery bell rung a few times far away then silence, seamless loop, no voices" },
  ],
  "sarah-mullally": [
    { id: "ringing", label: "Change ringing", level: 0.4, family: "bells",
      prompt: "English cathedral bells change-ringing, heard from across a close, rolling and distant, seamless loop, no voices" },
    { id: "rain", label: "Rain on stone", level: 0.35, family: "rain",
      prompt: "rain on the flagstones of a cathedral cloister, drips from gothic arches, seamless loop, no voices" },
    { id: "organ", label: "Organ pedal", level: 0.25, family: "drone",
      prompt: "a cathedral organ holding a single very low pedal note, soft and sustained, no melody, seamless loop, no voices" },
    { id: "close", label: "Cathedral close", level: 0.25, family: "wind",
      prompt: "a cathedral close in the morning, rooks, gravel underfoot, a breeze in yew trees, seamless loop, no voices" },
  ],
  "dallin-oaks": [
    { id: "wind", label: "High desert wind", level: 0.4, family: "wind",
      prompt: "dry wind off the Wasatch mountains across a wide valley, steady and clean, seamless loop, no voices" },
    { id: "organ", label: "Tabernacle organ", level: 0.3, family: "drone",
      prompt: "a great pipe organ holding one soft sustained chord in a large hall, no melody, seamless loop, no voices" },
    { id: "creek", label: "Mountain creek", level: 0.3, family: "rain",
      prompt: "a mountain creek over stones in a canyon, clear and steady, seamless loop, no voices" },
    { id: "chapel", label: "Quiet chapel", level: 0.2, family: "hum",
      prompt: "a quiet carpeted chapel, room tone, a page turning, a bench creaking, seamless loop, no voices" },
  ],
  "enoch-adeboye": [
    { id: "rain", label: "Rain on tin", level: 0.45, family: "rain",
      prompt: "tropical rain drumming on a corrugated tin roof, heavy and steady, seamless loop, no voices" },
    { id: "night", label: "Lagos night", level: 0.35, family: "wind",
      prompt: "night outside Lagos, dense crickets, a generator humming far away, warm still air, seamless loop, no voices" },
    { id: "drum", label: "Talking drum", level: 0.3, family: "bells",
      prompt: "a talking drum played softly far away, a few phrases then silence, sparse, seamless loop, no voices" },
    { id: "dawn", label: "Camp at dawn", level: 0.25, family: "hum",
      prompt: "a large open camp at dawn, birds, sweeping brooms on concrete, distance, seamless loop, no voices" },
  ],
  "universal-house-of-justice": [
    { id: "fountains", label: "Terrace fountains", level: 0.45, family: "rain",
      prompt: "fountains and water channels on terraced gardens above a bay, steady falling water, seamless loop, no voices" },
    { id: "cicadas", label: "Cicadas", level: 0.35, family: "wind",
      prompt: "Mediterranean cicadas in cypress and pine on a hot afternoon, dense and steady, seamless loop, no voices" },
    { id: "breeze", label: "Sea breeze", level: 0.3, family: "wind",
      prompt: "a sea breeze moving through tall cypress trees on a hillside, soft continuous rush, seamless loop, no voices" },
    { id: "doves", label: "Doves", level: 0.25, family: "wind",
      prompt: "doves cooing in a formal garden, occasional wingbeats, seamless loop, no voices" },
  ],
  "kuldeep-singh-gargaj": [
    { id: "sarovar", label: "Sarovar", level: 0.45, family: "rain",
      prompt: "a wide temple pool at dawn, water lapping marble steps, fish surfacing, seamless loop, no voices" },
    { id: "harmonium", label: "Harmonium drone", level: 0.3, family: "drone",
      prompt: "a harmonium holding a soft sustained drone chord, bellows breathing, no melody, seamless loop, no voices" },
    { id: "langar", label: "Langar kitchen", level: 0.25, family: "hum",
      prompt: "a vast community kitchen heard from outside, steel plates and ladles far away, water running, seamless loop, no voices" },
    { id: "birds", label: "Morning birds", level: 0.3, family: "wind",
      prompt: "mynas, pigeons and sparrows around white marble at sunrise, seamless loop, no voices" },
  ],
};

export const HOME_SCENE: Scene = {
  id: "home",
  layers: LAYERS.home,
  videoPrompt:
    "Slow aerial drift over St Peter's Basilica dome at dawn, soft golden haze, a murmuration of starlings turning far away, gentle volumetric light, cinematic, calm, seamless 10s loop, no people, no text",
  alt: "St Peter's dome in golden dawn haze, starlings turning in the distance",
};

export const SCENES: Record<string, Scene> = {
  "dalai-lama": {
    id: "dalai-lama",
    layers: LAYERS["dalai-lama"],
    videoPrompt:
      "Himalayan valley at first light, strings of colourful prayer flags rippling in a steady wind between poles, snow peaks behind, thin mist rising, crisp air, cinematic, serene, seamless 10s loop, no people, no text",
    alt: "Prayer flags rippling before snow-capped Himalayan peaks",
  },
  sadhguru: {
    id: "sadhguru",
    layers: LAYERS["sadhguru"],
    videoPrompt:
      "Velliangiri hills of southern India at dusk, low mist flowing slowly through dark green ridges, a single oil lamp flame steady in the foreground, deep blue hour, cinematic, meditative, seamless 10s loop, no people, no text",
    alt: "Mist flowing through the Velliangiri hills at dusk, a lamp flame in the foreground",
  },
  amma: {
    id: "amma",
    layers: LAYERS["amma"],
    videoPrompt:
      "Kerala backwaters at dawn, still water reflecting coconut palms, gentle ripples, warm rose light, a few flower petals drifting past, lush and tender, cinematic, seamless 10s loop, no people, no text",
    alt: "Kerala backwaters at dawn, palms reflected in still water",
  },
  "pomnyun-sunim": {
    id: "pomnyun-sunim",
    layers: LAYERS["pomnyun-sunim"],
    videoPrompt:
      "Korean mountain temple courtyard in soft rain, wet stone and wooden eaves, a paper lantern swaying slightly, maple leaves trembling, muted green and grey palette, contemplative, cinematic, seamless 10s loop, no people, no text",
    alt: "Rain falling on a Korean temple courtyard",
  },
  "ahmed-el-tayeb": {
    id: "ahmed-el-tayeb",
    layers: LAYERS["ahmed-el-tayeb"],
    videoPrompt:
      "Al-Azhar mosque courtyard at dusk, warm lantern light on ancient stone arcades, a slow drift past minarets against a deep indigo sky, soft moths of light, reverent, cinematic, seamless 10s loop, no people, no text",
    alt: "Lantern-lit arcades and minarets of Al-Azhar at dusk",
  },
  "ali-al-sistani": {
    id: "ali-al-sistani",
    layers: LAYERS["ali-al-sistani"],
    videoPrompt:
      "Narrow old street of Najaf at golden hour seen from a rooftop distance, the golden dome of the shrine shimmering in heat haze on the horizon, dust motes in slanting light, austere and still, cinematic, seamless 10s loop, no people, no text",
    alt: "Najaf rooftops with the golden shrine dome shimmering on the horizon",
  },
  "ephraim-mirvis": {
    id: "ephraim-mirvis",
    layers: LAYERS["ephraim-mirvis"],
    videoPrompt:
      "A Shabbat table by a window at dusk: two candle flames burning steadily, braided challah under an embroidered cloth, warm bokeh of a London street beyond the glass, intimate, golden, cinematic, seamless 10s loop, no people, no text",
    alt: "Shabbat candles burning by a window at dusk",
  },
  "aga-khan-v": {
    id: "aga-khan-v",
    layers: LAYERS["aga-khan-v"],
    videoPrompt:
      "Hunza valley in northern Pakistan, terraced fields below vast glaciated peaks, cloud shadows moving slowly across the valley floor, poplar trees swaying, luminous mountain light, majestic, cinematic, seamless 10s loop, no people, no text",
    alt: "Cloud shadows crossing the terraced Hunza valley beneath glaciers",
  },
  "bartholomew-i": {
    id: "bartholomew-i",
    layers: LAYERS["bartholomew-i"],
    videoPrompt:
      "The Bosphorus at dawn from the Phanar shoreline, gulls wheeling slowly over silver water, incense-like morning mist, domes and cypresses in silhouette, Byzantine gold light, cinematic, seamless 10s loop, no people, no text",
    alt: "Gulls over the Bosphorus at dawn, domes in silhouette",
  },
  kirill: {
    id: "kirill",
    layers: LAYERS["kirill"],
    videoPrompt:
      "Snow falling steadily on golden onion domes and dark spruce trees at blue hour, candle-lit windows glowing far below, slow drifting flakes, hushed and heavy, cinematic, seamless 10s loop, no people, no text",
    alt: "Snow falling on golden onion domes at blue hour",
  },
  "tawadros-ii": {
    id: "tawadros-ii",
    layers: LAYERS["tawadros-ii"],
    videoPrompt:
      "Desert monastery of Wadi Natrun at dusk, ochre walls and ancient domes under a violet sky, sand hissing gently across the foreground, one lit doorway, vast stillness, cinematic, seamless 10s loop, no people, no text",
    alt: "A desert monastery glowing at dusk in Wadi Natrun",
  },
  "sarah-mullally": {
    id: "sarah-mullally",
    layers: LAYERS["sarah-mullally"],
    videoPrompt:
      "Interior of Canterbury Cathedral nave, shafts of morning light through stained glass drifting slowly across stone columns, dust motes rising, soft rain on the windows, luminous and quiet, cinematic, seamless 10s loop, no people, no text",
    alt: "Light through stained glass moving across the Canterbury nave",
  },
  "dallin-oaks": {
    id: "dallin-oaks",
    layers: LAYERS["dallin-oaks"],
    videoPrompt:
      "Wasatch mountains above Salt Lake valley at first light, aspen leaves flickering in the foreground, granite peaks catching pink alpenglow, clear high-altitude air, hopeful, cinematic, seamless 10s loop, no people, no text",
    alt: "Alpenglow on the Wasatch range, aspens flickering",
  },
  "enoch-adeboye": {
    id: "enoch-adeboye",
    layers: LAYERS["enoch-adeboye"],
    videoPrompt:
      "Vast African night sky over the lights of a great encampment on the Lagos-Ibadan expressway seen from far above, warm sodium glow beneath deep starfield, gentle heat shimmer, expectant, cinematic, seamless 10s loop, no people, no text",
    alt: "A sea of warm lights under an African night sky",
  },
  "universal-house-of-justice": {
    id: "universal-house-of-justice",
    layers: LAYERS["universal-house-of-justice"],
    videoPrompt:
      "The terraced gardens of Haifa descending toward the Mediterranean at golden hour, geometric flowerbeds and cypresses, fountains catching light, the sea hazy beyond, ordered and serene, cinematic, seamless 10s loop, no people, no text",
    alt: "Haifa's terraced gardens descending to the sea",
  },
  "kuldeep-singh-gargaj": {
    id: "kuldeep-singh-gargaj",
    layers: LAYERS["kuldeep-singh-gargaj"],
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
