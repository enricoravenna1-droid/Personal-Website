# Personal Website — Enrico Omri Ravenna

One HTML file. No build step. No dependencies beyond Google Fonts.

**Last major change: 2026-08-09 — full design and motion rebuild.** See "What changed
in the 2026-08-09 rebuild" near the bottom for the reasoning behind each decision.

---

## Preview locally

Claude can launch it directly (`.claude/launch.json` → `personal-website`, port 8080).

To do it yourself:

```bash
node "Projects/Personal Website/serve.js" 8080
```

Then open **http://localhost:8080**. Stop with `Control + C`.

`serve.js` exists because `python3 -m http.server` fails in this workspace: the
sandbox denies `os.getcwd()`, and the stdlib module calls it at import time to build
its `--directory` default, so it dies before it ever binds a port.

---

## Edit your content

Everything you need to change is marked with `EDIT:` in the file.
Search for `EDIT:` in index.html to jump to each spot.

The two main areas:

1. **`<head>`** — page title, SEO description, and social preview tags (OG/Twitter)
2. **`<body>`** — your name, title, quote, bio, stat cards, and links

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

| File | Purpose |
|---|---|
| `index.html` | The entire website |
| `README.md` | This file |
| `serve.js` | Local static server for previewing (not part of the site) |
| `serve.py` | Older Python preview server on port 3400. Works in a normal terminal; fails inside this workspace's sandbox. Kept, not used. |
| `photo*.jpg` | Site images, sized for display |
| `Originals/` | Full-resolution source photos. Not served. |
| `Enrico Ravenna Resume.pdf` | Linked from the CTA and footer |

---

## Still outstanding

- The three **Insights** cards still point at the LinkedIn profile, not at real post
  permalinks. Marked `⚠️ NEEDS REAL POST URL` in the file.
- The **Accessibility Statement** link in the footer is still `href="#"`.
- `og:image` points at `https://enricoravenna.com/photo.jpg`, which resolves, but it is
  the 733×1100 portrait rather than a purpose-built 1200×630 card. Link previews will
  crop it awkwardly. Worth making a real `og-image.jpg`.
- The Dave Elswick spotlight has no link, by design, until there is a real show URL.
