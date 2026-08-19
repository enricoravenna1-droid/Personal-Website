# Personal Website — Enrico Omri Ravenna

Next.js 16 App Router, five routes, hand-written CSS. React Three Fiber for the
career-arc globe. No CSS framework: every colour in `app/globals.css` carries a
measured contrast ratio in a comment, and a token layer alongside that would mean
two sources of truth for the same decisions.

**Last major change: 2026-08-18.** See "What changed on 2026-08-18" below.

> **Note on the sections further down this file.** Everything from "Images" to
> "What changed in the 2026-08-09 rebuild" was written when this was a single
> `index.html` with no build step. The reasoning in it is still good and worth
> reading; the file paths in it are not. There is no `index.html`, no `serve.js`
> and no `serve.py` any more.

---

## Preview locally

Claude can launch it directly (`.claude/launch.json` → `personal-website`, port 3001).

To do it yourself:

```bash
npm run dev
```

Then open **http://localhost:3001**. Stop with `Control + C`.

```bash
npm run build && npm run typecheck && node tests/arc.test.mjs
```

`tests/arc.test.mjs` is the camera choreography: 18 checks over framing distances,
longitude interpolation, beat windows and the approach. It exists because **the
globe cannot be verified by eye in the Claude preview pane** — the pane throttles
requestAnimationFrame, so WebGL never paints and a screenshot of the arc comes back
black. That is a limitation of the harness, not of the scene, and it is the reason
the framing maths is asserted rather than looked at.

---

## Edit your content

**Every word on the site lives in `lib/content.ts`.** Name, positioning line, quote,
the rotating banner, the three story chapters, all six testimonials, the initiatives,
the capability areas, the numbers, the vision beats, the insights cards, the
accessibility statement. Edit there and it changes everywhere it appears.

That is the point of the file. The old build kept copy inline in a 2,400-line HTML
file, which is fine with one page and is how two pages end up disagreeing about the
same fact once there are five.

Per-page titles and social preview tags are the `metadata` export at the top of each
`app/*/page.tsx`; the site-wide defaults are in `app/layout.tsx`.

---

## Images (read this before adding one)

`Originals/` holds the full-resolution versions of the six photos that were resized on
2026-08-09. Nothing was thrown away; the originals are also still in git history.

The page used to ship **19.2 MB of images and fetch all twelve of them on first load**,
including ones sixteen thousand pixels down the page. The hero portrait alone was
4.6 MB at 2800×4198 to fill a 340px circle. First load is now **586 KB across four
images**, with the rest deferred.

**When you add a photo:**

1. Resize it to roughly twice its display size before dropping it in. A card that
   renders 440px wide needs a 900px file, not a 5712px one.
   `sips --resampleHeightWidthMax 1200 -s formatOptions 82 photo.jpg --out photo.jpg`
2. Put `loading="lazy" decoding="async"` on it unless it is in the hero.
3. Give it `width` and `height` so the browser reserves the box and the section does
   not jump when the file lands.

---

## Deploy

`enricoravenna1-droid/Personal-Website` on GitHub → Vercel project `personal-website`
(team `enrico-personal-projects`) → **enricoravenna.com**.

**Any push to `main` deploys straight to production.** There is no staging step.

A `READY` deployment means the build finished, not that pages serve. Always fetch a real
URL before you consider a deploy done.

`Originals/` is in `.gitignore` — 18 MB of source files the site never requests. The
pre-resize versions are also recoverable from git history, at the commit before the
2026-08-09 image pass.

**OG image:** the domain is live, so previews resolve, but `og:image` still points at the
portrait rather than a purpose-built card. Add a `1200×630` JPEG as `og-image.jpg` and
point `og:image` at it. LinkedIn caches previews, so afterwards run the URL through
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to force a refresh.

---

## What changed on 2026-08-18

Six changes, all from the same note: make the front door look like the work of
someone who is about to run a large-city Federation.

### 1. The hero plate is a river at night, not a desert

The desert plate went through two rounds in one day. It was rebuilt sharper and
faster first — letterbox cropped, 1080p, 1.45×, ten times the bitrate — and that
is exactly what killed it. **Sharpening it is what exposed it.** At 78 kb/s it
was mush and read as texture; at 800 kb/s it was a recognisable photograph of a
place, and the place meant nothing.

The replacement is a state capital at night on a wide river: a truss bridge
spanning the frame, a floodlit dome and downtown towers behind it, a lit
riverboat crossing under it. It is his last post, it is a city rather than a
small town, and **bridges** is the exact word Pastor Perry's quote on `/voices`
uses about him. 1920×1080, 8.0s crossfade loop, native speed, 1.18 MB.

The lesson worth keeping: **a hero plate is an argument, not decoration, and
quality only makes a weak argument more legible.**

Two things in `globals.css` had to change shape with it, because a night city is
the inverse composition of a sunrise. The plate transform dropped from
`scale(1.3) translateY(10%)` to `scale(1.12)` with no push, and the scrim's
weight moved from the top of the frame to the band where the bridge and skyline
sit. Details, the CRF sweep, the generation prompts and the two takes that lost
are all in `Video Assets/README.md`.

Two hero text colours moved from `--muted` to `--muted-light` on the way through,
back when the sharpened desert pushed the 10px byline to 4.61:1 against a 4.5
floor. The river plate does not need the help — the byline measures 9.35:1 on it,
because the small text sits over still water rather than over a horizon glow —
but the colours are better anyway and they stay. Re-runnable with
`python3 "Video Assets/measure_hero_contrast.py"`.

### 2. The JFAR role line is gone from the hero

`Executive Director, Jewish Federation of Arkansas · 2025–2026` is still in the
BACKGROUND list a few lines below it and is chapter three of `/story`. On the one
screen that has to land in two seconds it was a third mention, and it argued for
the past.

### 3. The hero and the globe now share a screen

This was the real work. The two used to be butted together: the hero scrolled away,
the runway's sticky stage arrived already pinned, and beat one was fully framed on
its first painted pixel. A cut, not a transition.

Now **the runway is pulled up under the hero by exactly one viewport**
(`APPROACH_VH` in `lib/arc.ts`, applied as an inline `margin-top` so the constant
and the layout cannot disagree). Across that overlap:

- the camera flies in from 9.2 sphere radii to beat one's 3.05 — a marble at 12.5%
  of frame height growing to a planet at 82% — eased twice so it hangs distant for
  most of the move and closes fast at the end;
- the hero dissolves, its plate receding 4% as it goes, driven by a single
  `--hero-exit` custom property that the cinematic's scroll handler writes;
- the globe's brightness, its clouds and its markers ramp with it, so nothing pops
  in behind a half-faded hero;
- a **dawn band** sits at the screen height the plate's horizon occupies and cools
  from ember toward `#3f85f6`, the exact colour of the atmosphere shell, as the
  planet's own limb arrives to take the job over.

One measurement drives all of it. The camera and the dissolve cannot disagree about
how far through the handoff they are.

The scene's mount trigger changed with it. It used to be an IntersectionObserver on
the runway; the runway now starts at the top of the hero, so that would have put
three megabytes of earth texture in the landing page's critical path. It now mounts
on the first idle moment after `load`, or on a scroll past a tenth of a viewport,
whichever comes first.

### 4. Community voice cards: rack focus instead of a permanent panel

`Voices → Voices From the Community` laid the whole quote on a glass panel over the
photograph. On Dr. Dorsch's 55-word quote that covered two thirds of the frame — the
two people in the room were behind the text about them.

The card now has two complete states. At rest it is the photograph, with an
attribution and one pulled line. On hover, focus or tap a quote rises and **the
photograph pulls back, dims and goes soft behind it**: a lens cannot hold the
foreground and the background at once, and neither can a reader.

- The cards break out to 1180px, wider than the 900px prose measure, and are square
  — the sources are 4:3 group shots, so a square crops 12% off each side and nothing
  off the top or bottom.
- Two-up down to 820px, one column below that, and **stacked (photo above, caption
  below, no overlay at all) below 600px**. Both breakpoints are measured against the
  longest quote in the set, not chosen; the numbers are in `app/globals.css`.
- The full quote is in the markup in both states, the control is a real button with
  `aria-expanded`, Escape closes it, and reduced motion gets it open and static.

`lib/content.ts` gained a `pull` field per voice. It is the only line most visitors
will read, so it has to work as a standalone claim.

### 5. Section marks

Six line-art emblems above the sections that are only words — "Where I add value",
"What I'm thinking about", "People, not just programs", "Let's Connect", "From My
Team", "Where to next". Same vocabulary as `components/area-icon.tsx`: 24px viewBox,
one stroke weight, the accent red, with the rotating conic "lit edge" the hero
avatar already uses.

Deliberately not organisational marks. The standing rule on this account is that
documents are unbranded and the name is the brand; these are furniture, not a logo.
`components/section-mark.tsx` records which glyphs were rejected and why — the first
"add value" mark was a perfectly good wifi symbol.

### 6. The arc stage stopped showing through the hero

The runway is pulled up under the hero, so the pinned stage sits behind it from
the first frame. Until this pass the only thing hiding it was the plate, by
accident, and the stage's "Skip the sequence" control was faintly legible through
the foot of the hero. `#hero` now carries its own opaque background, and the skip
control is hidden and out of the tab order until the approach is nearly over.

### Also fixed on the way

`heroPara` animated `transform`, and `.hero-inner` is also `.hero-layer-near`, whose
whole job is a `transform` carrying the pointer tilt and Z position. An animation on
`transform` overrides the base value outright, so while that ran — always, it is
`both` on a scroll timeline — the near layer's depth was being discarded and the
"hero in depth" effect was only happening behind the copy. It now animates
`translate` and `scale`, which compose with `transform` instead of replacing it.

---

## What changed in the 2026-08-09 rebuild

### Palette: navy and gold → red, black and gray

The old base was `#0B1120`, a blue navy, with a `#C9A84C` brass gold. That pairing is
the default across the Federation world, which is the same reason navy/gold is banned
from the documents in `CLAUDE.md`. The site was contradicting its own brand rule.

It is now the same **red / black / gray** system as the documents: near-black surfaces
(`#08090C` → `#16181E`), the brand deep red, and warm gray. No blue anywhere.

**The document red cannot be used as-is on a dark ground, and this is the thing to
remember before touching the colours.** `#8B1A1A` is a *paper* red, designed as dark ink
on white. On `#08090C` it measures **2.14:1**, which fails even the 3:1 large-text bar,
so it can never carry text here. The system splits it in two:

| Token | Value | Role |
|---|---|---|
| `--accent` | `#E05252` | all accent **text** — 5.21:1 on the base, 4.65:1 on the lightest card |
| `--accent-hover` | `#EC7A72` | hover and the community-voice names — 7.20:1 |
| `--accent-deep` | `#8B1A1A` | **fills only, never text.** White sits on it at 9.29:1 |

That is why the primary buttons are white-on-deep-red rather than dark-on-red: dark text
on the brand red is 2.14:1 and unreadable.

Four places carry explicit stop values rather than the tokens, because a gradient that
ends on `--accent-deep` would drop below 3:1 mid-sweep: the hero quote shimmer, the stat
numbers, the primary buttons, and the nav CTA. **If you retint anything, re-check those.**

The three Insights cards are red / bone / gray, which is deliberately the same three-tier
signal as the DECIDE / DISCUSS / INFORM labels in the board documents.

**Contrast is computed, not eyeballed.** Every foreground/background pair is noted in the
token block with its measured ratio. A scripted audit of the rendered page — sampling each
text node's own computed colour against its nearest opaque ancestor — returns **zero
failures** against WCAG AA. Interactive borders use `--border-interactive` (`#7A6663`,
3.71:1 on the base and 3.30:1 on the lightest card), which clears WCAG 1.4.11's 3:1
requirement for control boundaries; decorative hairlines are deliberately below it and are
never load-bearing.

An earlier build gave every section its own accent — teal, sage, purple, amber, sky, two
golds. Six accents is not a palette. It is now red, with warm bone in three places.

### Motion: scroll-driven CSS, not scroll listeners

Entrances are driven by `animation-timeline: view()` and the progress bar by
`animation-timeline: scroll(root)`. They scrub with the scroll position, run off the
compositor, and play in both directions instead of firing once at a threshold. The whole
file now registers **one** scroll listener, for the nav pill.

Two things this forced, both worth knowing if you edit the motion:

- **`animation-delay` does nothing on a scroll timeline.** The `.d1`–`.d6` stagger is a
  set of shifted `animation-range` values, not delays.
- **A custom property has to be registered with `@property` before it can animate.** An
  unregistered one is just a string, so a gradient built on it snaps instead of moving.
  That is why `--ang`, `--sheen` and friends are declared at the top of the stylesheet.

Everything falls back to the old IntersectionObserver path where scroll-driven animation
is unsupported; the JS feature-detects and skips its own work when the CSS is handling it.

### Liquid glass

Applied to the nav pill, the six area cards, the three insight cards and the community-voice
captions. Four things have to be present together or it reads as a translucent box:
blur **and** saturate on what is behind it, a top specular highlight with a bottom shade
(inset shadows), a hairline border that is a *gradient* masked into a 1px ring, and a
highlight that tracks the pointer (`--mx`/`--my`, written by JS).

**Glass over flat black is just a dark box** — there is nothing behind it to refract. The
card grids sit on a soft two-colour field (`#areas .container::before`) so the panels have
something to work on. Remove that field and the glass stops reading as glass.

### Ambient effects: from seven to one

The old build ran, simultaneously: a fixed 780-star canvas with nebulae and shooting stars
over the entire 18,000px page, a cursor particle trail on a canvas at `z-index: 9999`, a
comet-wipe canvas that clip-pathed each section as it entered, a banner sheen, a banner glow
pulse, a beating heart, five stacked glow layers on the avatar, and Ken Burns on every photo.
All of it moving at once, which is why nothing read as deliberate.

Now: one aurora above the fold, built from `@property`-animated conic and radial fields,
plus a sparse 190-star canvas **scoped to the hero** and parked via IntersectionObserver
when the hero scrolls away. The cursor trail and the comet engine are gone. Below the fold
the page is flat, which is what makes the scroll-driven entrances register.

A film-grain overlay sits over everything at 5% opacity. It is the cheapest single thing
that stops large gradients reading as flat CSS.

### Fixes to real defects

- **Buttons wrote directly to `element.style.transform`**, so the magnetic offset, the
  press scale, and the hover lift each silently clobbered the others. Transform is now
  composed from `--tx`/`--ty`/`--s` custom properties.
- **The hero quote animated words while they were still being appended**, so a word could
  be seen sliding in from the wrong position. The words are now wrapped in a fragment
  before anything animates, and the stagger is a per-word `animation-delay` driven by
  `--i` rather than a chain of `setTimeout` calls.
- **The community-voice quotes sat directly on the photographs.** A bottom gradient alone
  left the top of Cathie's long quote over image highlights at roughly 2:1. They are now
  in glass panels that hold white text at about 8:1 regardless of what is behind them.
- **Nothing in the page had a focus ring.** There is now a visible `:focus-visible`
  outline throughout.
- **The mobile hero ordered the text column first**, pushing the headshot below the CTAs
  and off the first screen — the one image the page is built around. Portrait leads now.
- **The area-card icons were colour emoji.** They are 1.4px-stroke SVG line icons.
- Chapter photo tilt moved from the image to its frame, because the image is now carrying
  the scroll-driven parallax on its own transform.

### Reduced motion

Ambient motion stops; nothing that carries meaning disappears. One trap worth recording:
the blanket `animation-duration: 0.001ms !important` that reduced-motion rules normally use
**parks every `fill: both` animation on its end state**. That would have left the progress
bar permanently full and the journey timeline permanently drawn. Both are explicitly
switched to a non-animated state instead, and the progress bar hands over to the JS path.

**This was implemented and reasoned through, but not verified in a browser with the OS
setting actually enabled.** Worth one manual check on a Mac with Reduce Motion on before
you consider it done.

---

## Files in this folder

| Path | Purpose |
|---|---|
| `app/` | The five routes plus `globals.css`, which is the whole stylesheet |
| `components/` | Shared UI; `components/globe/` is the career-arc scene |
| `lib/content.ts` | **Every word on the site.** Copy edits happen here, nowhere else |
| `lib/arc.ts` | Camera choreography — beats, distances, the approach. Pure maths, no React |
| `tests/arc.test.mjs` | 18 assertions over `lib/arc.ts`. `node tests/arc.test.mjs` |
| `public/` | Images, the two hero videos, the earth textures, the resume PDF |
| `Video Assets/` | Video masters, the build scripts, and the reasoning behind both |
| `Originals/` | Full-resolution source photos. Not served, not committed. |

---

## Still outstanding

- The three **Insights** cards still point at the LinkedIn profile, not at real post
  permalinks. Marked `⚠️ NEEDS REAL POST URL` in the file.
- The **Accessibility Statement** link in the footer is still `href="#"`, though
  `/accessibility` exists and is written.
- `og:image` points at `https://enricoravenna.com/photo.jpg`, which resolves, but it is
  the 733×1100 portrait rather than a purpose-built 1200×630 card. Link previews will
  crop it awkwardly. Worth making a real `og-image.jpg`.
- The Dave Elswick spotlight has no link, by design, until there is a real show URL.
