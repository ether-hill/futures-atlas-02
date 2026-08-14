# Claude Code Prompt: AI Hegemony Investigation Report
## Futures Atlas Look & Feel + AI Rapture Components

## Project Brief
Build an interactive investigation examining how AI systems perpetuate Western hegemony through training data, epistemological bias, and automation bias. Combine Futures Atlas's speculative, foresight-oriented aesthetic with AI Rapture's battle-tested component library (video banners, grid cards, timeline, mosaic hero, pull quotes). Single-screen interactions, low friction, substance over hype.

---

## Content Architecture

### Hero Section
**Mosaic Banner** (AI Rapture component)
- Overlapping image/video tiles showing: training data farms, server clusters, research papers, cultural moments being misrepresented
- Pull quote overlay: "AI systems don't simply inherit bias—they amplify it. The question is whose hegemony gets embedded as 'common sense'?"
- Cite sources inline below quote

### Section 1: The Disparity Map
**Interactive Treemap Visualization**
- US data representation (51% of training URLs) vs rest of world
- Click to reveal: citation panel with source, methodology, confidence tier
- Futures Atlas style: clean, single-interaction mechanic
- No animation bloat—click reveals tier information directly

### Section 2: How Hegemony is Encoded
**Video Banner** (AI Rapture component)
- 15–20 sec explainer: What happens when 90% of training tokens are English + Western-origin?
- Subtitle: "The *malu* problem: When AI reinterprets communal shame as personal embarrassment"
- Below video: Pull quote from research

**News Grid Card** (AI Rapture component)
- Rows of key findings: 
  - "WEIRD Bias: Western, Educated, Industrialized, Rich, Democratic assumptions embedded"
  - "Ontological Erasure: Non-Western philosophical frameworks flattened to Western categories"
  - "Language as Destiny: 90% of training tokens = 90% of reasoning roots"
- Each card clickable: reveals full citation, source tier, methodology

### Section 3: Amplification & Feedback Loop
**Vertical Timeline** (AI Rapture component)
- Left spine: Model release dates (GPT-3, GPT-4, Claude 1, Gemini, etc.)
- Right side events: Published research on Western bias (2023–2026)
- Center annotations: "Bias documented" / "No documented response" / "Regulatory attempt"
- Pull quotes from researchers staggered along timeline

### Section 4: Geopolitical Layering
**Video Grid Cards** (AI Rapture component)
- 3–4 short video explainers:
  1. "Why Paywalls Matter: Western journalism less accessible in training than state media"
  2. "The Six Companies: What OpenAI, Microsoft, Google, Meta, Amazon, Anthropic train on"
  3. "Automation Bias: How 'objective' AI launders subjective Western values"
- Each card has pull quote + citation below

### Section 5: Timeline of Resistance & Alternatives
**Vertical Timeline** (AI Rapture component)
- Left spine: Regulatory attempts (EU AI Act timeline, China's disclosure requirements, state resistance)
- Right events: Research on alternative models, decolonial AI, African AI safety agenda
- Futures Atlas tone: speculative—what could resistance look like?

### Section 6: Methodology & Sourcing
**Evidence Grid** (AI Rapture component adapted)
- Structured card layout showing claims taxonomy:
  - **Documented**: Published research + methodology
  - **Reported**: News reporting + follow-ups
  - **Emergent Research**: Recent findings, may be revised
- Each tier has color/icon differentiation
- Click any card: full citation, URL, date, confidence reasoning

---

## Component Reuse from AI Rapture

### Video Banner
- Full-width hero video (15–30 sec)
- Subtitle overlay explaining the visual
- Pull quote below (clickable for full citation)
- No autoplay; user initiates

### Video Grid Cards
- 3–4 responsive grid layout
- Each card: thumbnail, title, 50-word description, pull quote
- Click = open video in modal or expand section
- Citation anchor below each card

### News Grid Cards
- Grid of finding cards (3 columns on desktop, stack on mobile)
- Each card: headline, 2–3 sentence finding, source tier badge, click for citation overlay

### Vertical Timeline
- Left spine (vertical line)
- Offset event bubbles (left/right alternating)
- Event date + title + brief description
- Pull quotes staggered alongside
- Hover/click on event: reveals citation + source tier

### Mosaic Hero Banner
- 4–6 overlapping image/video tiles at different depths (CSS transforms)
- Tile click reveals modal with full image + citation
- Pull quote centered overlay
- Responsive: tiles reflow on mobile (stack vertically with staggered reveals)

### Pull Quotes
- Large, legible typography (48–64px)
- Byline + source link below
- Clickable → full citation panel slides in
- Citation panel: author, publication, date, confidence tier, URL

---

## Information Architecture

```
Hero (Mosaic Banner)
  ↓
The Disparity Map (Interactive Treemap)
  ↓
How Hegemony is Encoded (Video Banner + News Grid Cards)
  ↓
Amplification & Feedback Loop (Vertical Timeline + Pull Quotes)
  ↓
Geopolitical Layering (Video Grid Cards)
  ↓
Resistance & Alternatives (Vertical Timeline)
  ↓
Methodology (Evidence Grid)
```

---

## Design Directives

1. **Futures Atlas Ethos**: Speculative, foresight-oriented. Ask "What could be done?" Not just "What is broken?"
2. **Low Friction**: Single-interaction mechanics. Click to reveal. No scrolljacking, no forced animations.
3. **Substance Over Hype**: If a component doesn't add clarity, cut it. Every visual earns its space.
4. **Cite Everything, Inline**: Pull quotes, statistics, findings—all clickable for citation. Reader never wonders "where's this from?"
5. **AI Rapture Components**: Reuse proven patterns. Don't reinvent.
6. **Mobile First**: All components responsive from ground up; grid cards stack, videos scale, timeline adapts.
7. **Color & Contrast**: Clear confidence tier colors (documented/reported/emergent). High contrast for legibility.

---

## Technical Requirements

### Stack
- **Framework**: Next.js 14+ (TypeScript)
- **Styling**: Tailwind CSS (CSS-first, no bloated animation libraries)
- **Media**: Next.js Image optimization, video embeds/hosted files
- **Interaction**: React hooks, Intersection Observer for scroll reveals
- **Modal/Overlays**: Headless UI or custom (keep it light)

### Component Library (from AI Rapture)
```
/components/video
  VideoBanner.tsx         # Hero video + subtitle + pull quote
  VideoGridCard.tsx       # Grid card: thumbnail, title, description, quote

/components/cards
  NewsGridCard.tsx        # Finding card with source tier badge
  EvidenceCard.tsx        # Structured finding: claim → source → tier
  PullQuote.tsx           # Large quote + byline, clickable citation

/components/layout
  VerticalTimeline.tsx    # Left spine, offset events, pull quotes
  MosaicHeroBanner.tsx    # Overlapping tiles, staggered, responsive

/components/interactive
  TreemapViz.tsx          # Clickable treemap for data distribution
  CitationOverlay.tsx     # Slides in on click: full source, date, tier, URL

/data
  findings.json           # All claims with tier, source, date, URL
  timeline.json           # Events: date, title, description, citations
  videos.json             # Video metadata: URL, duration, subtitle, quote
```

---

## Acceptance Criteria

- [ ] All 6 sections render with AI Rapture components
- [ ] Hero mosaic banner responsive on mobile/tablet/desktop
- [ ] Video banners load efficiently (no autoplay unless user-initiated)
- [ ] Citation overlay working for 50+ findings (click any quote/statistic)
- [ ] Vertical timeline staggered pull quotes readable at all breakpoints
- [ ] News grid & video grid cards responsive (3 col → stack)
- [ ] Source tier colors consistent across all cards
- [ ] Lighthouse score >80 (performance, accessibility)
- [ ] Zero speculative claims without source tier labeling
- [ ] Futures Atlas tone: speculative, foresight-oriented, not alarmist

---

## Tone & Voice

**Futures Atlas + AI Rapture hybrid:**
- Accountability (document what is)
- Speculation (imagine what could be—resistance patterns, alternatives)
- Substance over hype (don't overcomplicate; clarity is the design goal)
- Citation as integrity (every claim traceable, no footnotes, inline reveal)

---

## Success Metrics

This report should:
1. **Educate**: Readers understand how Western bias gets embedded in AI training data & epistemology
2. **Cite fully**: Every finding tied to source; tiered by confidence; updatable with new research
3. **Speculate constructively**: Explore alternatives, resistance patterns, what accountability could look like
4. **Remain durable**: Publishable in 5+ years; visual/interaction design isn't trend-chasing
5. **Serve as design reference**: Demonstrates AI Rapture component reuse + Futures Atlas aesthetic integration
