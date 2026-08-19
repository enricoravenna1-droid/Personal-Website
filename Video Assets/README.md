# Video Assets — Personal Website Hero

Generated 2026-08-15 with the Higgsfield MCP connector. **165 credits total.**

## What shipped

Both live in `../public/` and are wired into `components/hero.tsx`.

| File | Size | What it is |
|---|---|---|
| `hero-portrait.mp4` | 47 KB | The studio headshot, animated. 680×680, 2.9s seamless loop. |
| `hero-portrait-poster.jpg` | 20 KB | First-paint and reduced-motion fallback. |
| `hero-plate-river.mp4` | 1.18 MB | A state capital at night on a wide river: a truss bridge spanning the frame, a floodlit dome and downtown towers behind it, a lit riverboat crossing under it. **1920×1080, 8.0s crossfade loop, native speed.** Shipped 2026-08-18, see "Round three". |
| `hero-plate-river-poster.jpg` | 125 KB | First-paint and reduced-motion fallback. |

Total added weight: **1.36 MB**, of which the plate is 1.18 MB. A night city is
genuinely expensive to encode — thousands of small bright points against black
is the opposite of the smooth gradient the desert plate was — and the CRF sweep
below is where that number was set rather than guessed.

The sunrise and desert plates are superseded and live in `Sources/`.

The original static pre-dawn plate (`hero-plate-desert.mp4`, 84 KB) is superseded
and now lives in `Sources/`. It is still a good fallback if the sunrise ever
reads as too much movement.

## Round three: the plate finally has an argument (2026-08-18)

Round two made the desert plate sharper and faster, and that is precisely what
killed it. **Sharpening it is what exposed it.** At 78 kb/s the old plate was
mush and read as texture; at 800 kb/s it became a recognisable photograph of a
place, and the place did not mean anything. A canyon at sunrise could sit behind
any executive coach or any SaaS homepage. It also read as the Colorado Plateau
rather than the Negev, so it was not doing autobiography either. It was the one
picture on the site that was not about him.

**Write this down, because it generalises: a hero plate is not decoration, it is
an argument, and quality only makes a weak argument more legible.** AJ 2054's
plate works because the night aerial *is* the thesis — isolation before it has
been scored. The desert had no equivalent.

The replacement is Enrico's own brief: the Arkansas River at night, the bridges,
downtown, the Capitol dome, a boat under way. It carries three things at once —
his last post, a city rather than a small town, and **bridges**, which is the
exact word Pastor Perry's quote on `/voices` uses about him.

### Generation

**Kling 3.0, `mode: 'pro'`, 16:9, 10s, silent. 25 credits a take, three takes,
75 spent of 882.** Returns a true 1920×1080 with no letterbox, which the
sunrise master did not.

Prompt rules that mattered, all inherited from earlier rounds and all still
true:

- Never name a film artefact. No "35mm", no "anamorphic", no "film grain" — the
  models render them literally. Ask instead for "clean modern digital cinema
  frame, edge to edge, no film border, no sprocket holes, no lettering".
- Ban text explicitly. A riverfront full of restaurants is a frame full of
  signage, and generated lettering is garbled every time. `no text, no
  lettering, no signage, no logos, no watermark`.
- Ban people. At the size this renders on the page they are noise, and models
  render small figures badly.
- Say "no teal cast". Night city prompts drift blue-green by default and this
  site's palette is red, black and grey.

One take came back as a **preset recommendation instead of a job** ("IN THE
DARK"). Resubmit with `declined_preset_id` set to the offered preset or the
composition gets overridden by someone else's look.

### The three takes

| | What it is | Verdict |
|---|---|---|
| `river-a` | Steel arch bridge, floodlit dome on its own hill, blue hour | Closest runner-up. The most elegant single object of the three, but it is dusk rather than night and its reflections run the full width of the lower half — exactly where the quote and the buttons sit. |
| `river-b` | Wide aerial, three bridges, real tower skyline, riverfront pavilions | The only take with the River Market pavilions. Also the only take that stopped being Arkansas: that skyline reads as a top-ten metro. Busiest frame of the three. |
| **`river-c`** | **Truss bridge spanning the frame, dome and downtown behind, riverboat crossing** | **Shipped.** Genuinely night. The bridge is a horizontal band that sits behind the name and then gets out of the way, and everything below the waterline is still black river. |

### Encode

CRF sweep at 1920×1080: 26 → 1837 KB, 28 → 1329 KB, 30 → 982 KB, 32 → 736 KB.
Settled on **CRF 30**, which at native speed and a 2s dissolve gives 1.18 MB.

The banding check that decided it: crop the sky band from CRF 26, 30 and 32,
push brightness and contrast hard, and compare. **All three were
indistinguishable.** Unlike the desert's smooth gradient sky, a night sky with
cloud detail gives x264 something to hold onto, so the CRF that mattered there
does not matter here.

**Native speed, not sped up.** The desert needed 1.45× because a slow sunrise is
sluggish. Water and a boat at anything above 1× reads as fast-forward.

Loop seam: endpoints differ by **3.33/255** against **9.65** mid-clip, a ratio of
2.9×. Tighter than the desert's 10× because a translating camera never returns
to its own first framing — the same limit AJ 2054 hit at 1.4×. Under the scrim
the step is about one unit of 255 and is not perceptible. `seam.py` in this
folder measures it for any clip.

### The page had to change shape around it

A night city is the **inverse composition** of a sunrise: dark sky, a bright
band of bridge and skyline across the upper middle, still black water under all
of it. Two things in `app/globals.css` were tuned for the opposite picture and
both were wrong for this one.

- **The transform.** The sunrise used `scale(1.3) translateY(10%)` to push its
  ember horizon down into the lower third and out from behind the quote. Applying
  the same 13% push here would have dragged the brightest thing in the frame
  straight onto the quote. Now `scale(1.12)` and no translate: the band lands
  behind the name, which needs 3:1 rather than 4.5:1, and everything below sits
  on water.
- **The scrim.** Was heaviest at the top and lifted below. Now the weight follows
  the light: less over the already-dark sky, most across 32–56%, lifting over the
  water.
- **The handoff band** in `.arc-dawn` moved from 62% to 46%, because that is
  where this plate's brightest line is.

### Contrast, re-measured

Same method, same script, new geometry. **The type reads better on this plate
than on any before it**, because the composition puts the small text over still
water instead of over a horizon glow.

| Element | px | Needs | Desert | River |
|---|---|---|---|---|
| Name | 58 | 3.0 | 14.35 | 12.23 |
| Positioning | 26 | 3.0 | 3.89 | 4.01 |
| Quote | 33 | 3.0 | 11.77 | **14.20** |
| Quote byline | 10 | 4.5 | 7.79 | **9.35** |
| BACKGROUND label | 9 | 4.5 | 8.17 | **9.92** |
| Background list | 16 | 4.5 | 11.52 | **15.21** |

`measure_hero_contrast.py` carries the hero geometry as constants read from the
browser. **They are now the river plate's.** If the plate transform or the hero
layout changes again, re-read them before trusting the output; the script cannot
tell that the page moved underneath it.

### What the frame does not claim

The dome, the towers and the bridge are composed, not surveyed. The real
Arkansas State Capitol sits about a mile inland from the river and would not
appear behind the bridges from any real vantage point. Nothing on the page says
Little Rock, which was the brief: it should read as a state capital at night and
nothing more.

## Round two: sharper, faster, and no letterbox (2026-08-18, superseded)

Same note AJ 2054 got on its own plate, in the same words: too soft, wanted
sharp and fast. Three fixes, and only one of them is the one you would guess.
`build_plate_sharp.py` in this folder rebuilds it end to end.

**Sharp was mostly a bitrate problem, not a resolution problem.** The shipped
plate encoded at **78 kb/s** — CRF 32 on a frame that is almost entirely a slow
gradient, which is the single worst case for x264's deadzone. What reached the
page was banded mush, and no CSS was going to sharpen that. A CRF sweep at
1080p measured 23 → 2.0 MB, 25 → 1.25 MB, 26 → 1.0 MB, 27 → 807 KB.
**CRF 26** with `aq-mode=3` and `deblock=-1,-1`.

AJ's fix was to regenerate at Kling `mode: 'pro'` for a real 1920×1080 master.
That is still the better fix and it is not available here: the only sunrise
master is the 720p `std` 15s take, and regenerating costs credits. So the
upscale to 1080p is second-order — it beats the browser's bilinear stretch of a
720p file across a ~900px hero, and adds no detail that was not there.

**The letterbox was the surprise.** The master is 2.35:1 content inside a 16:9
frame: 88px of hard black top and bottom, confirmed with `cropdetect` at
limit 0.10. The old plate never cropped them — `transform: scale(1.3)` in the
CSS was pushing them off screen. So a third of every encoded frame was spent on
black bars *and* the visible picture was being blown up ~1.9× to hide them.
Cropping first gives the same framing from more pixels at fewer bits: the file
is 836 KB at 1920×816 against 1.0 MB at 1920×1080 for a worse picture.

**Faster is `setpts`, and it has a ceiling.** 1.45×, not 2×. Compress a sunrise
much past this and weather becomes timelapse, which is the whole reason this was
shot at 15s on Kling rather than 8s on Veo. Output is capped at `fps=24`; without
that cap `setpts` leaves the file at 35 fps and spends ~30% more bits on frames
nobody asked for.

Loop seam re-measured: first and last frames differ by **0.56/255** against
**5.67** for two genuinely different frames, a ratio of 10× where the old plate
managed 7×.

| | First plate | Round two |
|---|---|---|
| Resolution | 1280×720 letterboxed | **1920×816, bars cropped** |
| Bitrate | 78 kb/s | **800 kb/s** |
| Loop | 13.0s | 8.5s |
| Speed | 1.0× | **1.45×** |
| Seam Δ/255 vs mid-clip | 0.84 / 5.99 | **0.56 / 5.67** |
| Size | 124 KB | 836 KB |

### The contrast consequence, and where it landed

A sharper, brighter plate carries more contrast of its own, and the hero type
sits on top of it. Re-measured with `measure_hero_contrast.py` (also new, also
in this folder — it rebuilds the browser's composite offline because the
preview pane throttles rAF and a canvas built from a `<video>` in the page
never gets a frame to sample):

| Element | px | Needs | Old plate | New plate | After the fix |
|---|---|---|---|---|---|
| Name | 58 | 3.0 | 16.10 | 14.35 | 14.35 |
| Positioning | 26 | 3.0 | 4.55 | 3.89 | 3.89 |
| Quote | 33 | 3.0 | 12.56 | 11.77 | 11.77 |
| Quote byline | 10 | 4.5 | 4.99 | **4.61** | **7.79** |
| BACKGROUND label | 9 | 4.5 | 5.63 | **4.83** | **8.17** |
| Background list | 16 | 4.5 | 15.73 | 11.52 | 11.52 |

The byline and the label are 10px and 9px sitting directly over the ember
horizon — the one bright band in the frame — and both landed within a tenth of
the 4.5 floor. **The fix was not to deepen the scrim.** That band is exactly
where the horizon glow lives, so darkening it would have paid for legibility by
throwing away the picture the whole exercise was meant to sharpen. Both moved
from `--muted` to `--muted-light` instead. Same plate, same scrim, four points
of headroom.

Note the numbers also moved because the JFAR role line was removed from the
hero on the same day, so every element below it shifted up into a slightly
different band of the scrim.

## The sunrise, and why it loops differently (2026-08-15)

Generated with **Kling 3.0 at 15s** rather than Veo, because Veo caps at 8s and
a sunrise compressed into 8 seconds looks like a timelapse instead of weather.
Kling 15s costs 22.5 credits against Veo's 22 for 8s, so it is nearly double the
runtime for the same money.

**Continuity trick:** the last frame of the approved pre-dawn plate was extracted,
uploaded, and passed as `start_image`. The sunrise therefore happens in the exact
landscape already signed off on, rather than a new roll of the dice.

**The sun is deliberately never visible.** The prompt pins it below the ridge so
only its glow rises. A visible sun disk would be a blown highlight in the middle
of the frame and would destroy the contrast budget below.

**Ping-pong is wrong here.** Reversing a sunrise makes the sun un-rise. The loop
is built by dissolving the tail back into the head over 2s. The script that
does it is `xfade_loop.py`, kept in this folder:

    R(t) = clip(D-X+t)*(1 - t/X) + clip(t)*(t/X)   for t < X
    R(t) = clip(t)                                  for t >= X

Measured: the first and last frames differ by **0.84/255** mean, against **5.99**
for two genuinely different frames from the same clip. The 2s dissolve does show
faint ridge ghosting when viewed at full brightness in isolation; at 86% opacity
under the scrim it is not perceptible on the page, which was verified in the
browser before shipping.

## The two rules that made this work

**1. Cut before the likeness drifts.** Image-to-video holds a real face for
only so long. Measured on this source photo:

- **Kling 2.6** holds the face and the smile to ~1.5s, then the jaw narrows
  and the smile flattens into a different, more severe man.
- **Cinema Studio** loses the smile by ~0.8s.

So the shipped clip is Kling trimmed at 1.5s and **ping-ponged** (forward then
reversed) into a 2.9s loop. It never plays a frame that is not him, and it has
no visible loop cut. See `Sheet Drift.jpg` for the frame-by-frame evidence.

**Redo this test on any new source photo.** The safe window is a property of
the photo, not a constant.

**2. Never say "35mm", "anamorphic", or "film grain" to Veo.** It renders the
artifact literally: the first desert plate came back with a fake film border,
sprocket holes, and Kodak edge lettering baked into the image. Ask for
"clean modern digital cinema frame, edge to edge, no film border, no sprocket
holes, no lettering" instead. Compare `Sheet Plates.jpg` (v1, broken) with
`Sheet Plates V2.jpg` (v2, fixed).

## Plate visibility vs. contrast (revised 2026-08-15)

The plate was turned up from `opacity: 0.50` to `0.86`, and the frame is pushed
down with `transform: scale(1.3) translateY(10%)` so the ember horizon lands in
the lower third instead of behind the quote. The scrim changed from a radial
pool to a vertical ramp.

**This site publishes contrast ratios, so the plate was measured, not eyeballed.**
Method: replicate the exact composite in a canvas (video frame → `globalAlpha
0.86` → the same gradient stops), then read back the brightest pixel inside each
text element's box and compute the ratio against its computed color. Re-measured against the
sunrise plate at 14 points across the 13.0s loop, including its brightest frame.

| Element | px | Needs | Worst across loop |
|---|---|---|---|
| Name | 58 | 3.0 | 16.10 |
| Positioning | 26 | 3.0 | 4.55 |
| Role line | 11.5 | 4.5 | 5.47 |
| Quote | 33 | 3.0 | 12.56 |
| Quote byline | 10 | 4.5 | 4.99 |
| BACKGROUND label | 9 | 4.5 | 5.63 |
| Background list | 16 | 4.5 | 15.73 |

The byline measured **3.66:1 and failed** at the first pass. The fix is the
deliberate alpha bump at the 63% stop in `.hero-plate::after`, which sits above
the horizon glow and so costs nothing visually. **If the plate, its transform,
or the hero type sizes change, re-run this measurement.** The byline has the
least headroom and will fail first.

## Costs measured, not guessed

Use `get_cost: true` to preflight any generation before spending.

| Generation | Credits |
|---|---|
| Kling 2.6 / Cinema Studio, 1:1, 5s, silent | 5 |
| Veo 3.1, 16:9, 8s, `quality: basic`, `variant: fast` | 22 |
| Veo 3.1, 16:9, 8s, `quality: high`, `variant: preview` | 58 |
| Seedance 2.0, 16:9, 5s, 1080p | 45 |
| Kling 3.0, 16:9, 10s, `mode: std`, silent | 15 |
| Kling 3.0, 16:9, 15s, `mode: std`, silent | 22.5 |

Veo `basic` is the right buy for a background plate. `high` costs 2.6× for
detail that a scrimmed, half-opacity backdrop throws away.

## Rejected, and why

Kept in `Sources/` rather than deleted, because the reasons are reusable.

- **`plate-sanctuary.mp4`** — the best-looking render of the batch and
  completely unusable. Veo produced an unmistakable **church**: gothic arches,
  an altar, pews. On the site of a Jewish Federation executive that is a
  self-inflicted wound. Replaced by `plate-hall-v2.mp4`, a plain community room
  with folding chairs, which carries the same meaning with no iconography to
  get wrong. Avoid generating Jewish ritual objects or Hebrew lettering
  entirely: the models render both badly, and this audience notices.
- **`plate-mainstreet.mp4`** — good shot, wrong palette. Bright saturated blue
  sky fights the `#08090C` page. A graded version exists
  (`plate-mainstreet-graded.mp4`, 1.3 MB) but it is 15× the weight of the
  desert plate for a worse palette fit.
- **`portrait-cinema.mp4`** — lost the smile too early. See rule 1.

## Alternates ready to use

`plate-hall.mp4` (744 KB) and `plate-mainstreet-graded.mp4` (1.3 MB) are graded
and loop-ready if a second or third section ever wants a plate. Neither is
currently referenced by the site, so neither ships.

## Rebuilding

`xfade_loop.py` in this folder builds a crossfade loop from any clip:

```bash
python3 xfade_loop.py sunrise-a.mp4 out.mp4 "eq=brightness=-0.06:saturation=0.78:contrast=1.04"
```

For a ping-pong loop instead (correct only when the clip's content does not
progress), it is one ffmpeg call:

```bash
ffmpeg -y -i raw.mp4 -filter_complex "[0:v]trim=0:1.5,setpts=PTS-STARTPTS,scale=680:680:flags=lanczos,split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[v]" -map "[v]" -an -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 30 -preset slow -movflags +faststart out.mp4
```

There is no system ffmpeg on this Mac. Install a contained one with
`pip install --target=./pylibs imageio-ffmpeg`.

## Rebuilding

`build_plate.py` is the general pipeline and the one to use. `build_plate_sharp.py`
is kept because it records the exact numbers behind the sunrise plate, but it is
hardcoded to that one clip.

```bash
# crop, scale, grade, sharpen, speed, crossfade-loop, encode
python3 build_plate.py Sources/river-c.mp4 hero-plate-river.mp4 \
    --speed 1.0 --xfade 2.0 --size 1920x1080 --crf 30 \
    --grade "eq=brightness=-0.02:saturation=0.74:contrast=1.06,colorbalance=rs=0.05:bs=-0.06:rm=0.03:bm=-0.05"

python3 seam.py hero-plate-river.mp4        # how cleanly the loop closes
python3 measure_hero_contrast.py            # hero type over the result
```

`--detect-crop` finds baked-in letterbox bars at a threshold tuned for
near-black plates. The sunrise master had 88px bars top and bottom; the Kling
3.0 `pro` renders have none.

`measure_hero_contrast.py` carries the hero geometry as constants, measured in
the browser at 1441×900. **If the hero layout changes, re-measure those boxes
before trusting its output** — the script has no way to know the page moved.

**Last updated: 2026-08-18** (round three: the desert is retired and the hero
carries the river at night; plate pipeline generalised into `build_plate.py`;
transform, scrim and handoff band recomposed; contrast re-measured)
