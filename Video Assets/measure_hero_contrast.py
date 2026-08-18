"""Measure hero text contrast against the plate, without eyeballing it.

This site publishes contrast ratios, so the backdrop behind the hero type gets
measured rather than looked at. The method is the one recorded in this folder's
README: rebuild the exact composite the browser paints — plate frame, its
`object-fit: cover` crop, `opacity: 0.86` over --bg, then `.hero-plate::after`,
then `#hero::after` — and read the brightest pixel inside each text element's
box.

It runs here rather than in the browser because the preview pane throttles
requestAnimationFrame, so a canvas built from a <video> in the page never gets a
frame to sample. The geometry below is measured in the browser, where
getBoundingClientRect works fine, and pasted in.

Re-run this whenever the plate, its transform, the scrim stops or the hero type
sizes change. The quote byline has the least headroom and will fail first.

Usage:  python3 measure_hero_contrast.py [path/to/plate.mp4]
"""
import os
import subprocess
import sys

SD = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")

# ── Geometry, measured in the browser at 1441x900 ──────────────────────────
# The video's painted box after `transform: scale(1.3) translateY(10%)` on the
# .hero-layer-deep box, in viewport coordinates.
VID_BOX = (-334.09, -41.20, 2109.19, 1317.33)   # x, y, w, h
# .hero-plate's own box: the one the ::after gradient percentages resolve
# against. Not the same box as the video, which is why they are both here.
PLATE_BOX = (-90.73, -20.93, 1622.45, 1013.33)
HERO_BOX = (0.0, 47.40, 1441.0, 900.0)
PLATE_OPACITY = 0.86
BG = (8, 9, 12)

# Text boxes and their computed colours, same measurement pass.
ELEMENTS = [
    # name,               x,     y,      w,      h,     colour,          needs
    ("Name",            660.5, 247.78, 546.21, 127.19, (244, 241, 237), 3.0),
    ("Positioning",     660.5, 389.46, 546.21,  33.62, (224,  82,  82), 3.0),
    ("Quote",           660.5, 460.32, 537.93,  92.84, (244, 241, 237), 3.0),
    ("Quote byline",    660.5, 569.72, 537.93,  17.59, (201, 196, 190), 4.5),
    ("BACKGROUND label",660.5, 616.27,  82.05,  15.82, (201, 196, 190), 4.5),
    ("Background list", 660.5, 632.09, 546.21,  39.31, (244, 241, 237), 4.5),
]

# ── The scrim, transcribed from globals.css ───────────────────────────────
# .hero-plate::after, layer 2 (painted under layer 1): the vertical ramp.
RAMP = [(0.00, 0.92), (0.26, 0.78), (0.48, 0.72), (0.63, 0.78),
        (0.72, 0.58), (0.82, 0.48), (0.94, 0.62), (1.00, 1.00)]
# .hero-plate::after, layer 1: radial ellipse 62% 44% at 50% 40%, 0.42 -> 0.
RADIAL = (0.50, 0.40, 0.62, 0.44, 0.42)
# #hero::after: ellipse 105% 95% at 50% 45%, transparent 42% -> 0.42 at 82%
# -> --bg at 100%.
VIGNETTE = (0.50, 0.45, 1.05, 0.95)

FRAMES = 14


def ramp_alpha(f):
    if f <= RAMP[0][0]:
        return RAMP[0][1]
    for (p0, a0), (p1, a1) in zip(RAMP, RAMP[1:]):
        if f <= p1:
            t = (f - p0) / (p1 - p0)
            return a0 + (a1 - a0) * t
    return RAMP[-1][1]


def read_ppm(path):
    with open(path, "rb") as fh:
        data = fh.read()
    assert data[:2] == b"P6", path
    i = 2
    vals = []
    while len(vals) < 3:
        while data[i] in b" \t\r\n":
            i += 1
        if data[i:i + 1] == b"#":
            while data[i] not in b"\r\n":
                i += 1
            continue
        j = i
        while data[j] not in b" \t\r\n":
            j += 1
        vals.append(int(data[i:j]))
        i = j
    i += 1
    w, h, _ = vals
    return w, h, data[i:i + w * h * 3]


def lum(rgb):
    def c(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def composite(px, w, h, sx, sy):
    """Colour the browser paints at viewport point (sx, sy)."""
    vx, vy, vw, vh = VID_BOX
    # object-fit: cover. The source is wider than the box at every viewport
    # this site is used at, so height fills and the sides are cropped.
    scale = vh / h
    if w * scale < vw:
        scale = vw / w
    rw, rh = w * scale, h * scale
    u = (sx - vx + (rw - vw) / 2) / scale
    v = (sy - vy + (rh - vh) / 2) / scale
    u = min(w - 1, max(0, int(u)))
    v = min(h - 1, max(0, int(v)))
    o = (v * w + u) * 3
    col = [px[o] * PLATE_OPACITY + BG[k] * (1 - PLATE_OPACITY)
           for k, o in ((0, o), (1, o + 1), (2, o + 2))]

    px_, py_, pw_, ph_ = PLATE_BOX
    fx, fy = (sx - px_) / pw_, (sy - py_) / ph_

    cx, cy, rx, ry, a0 = RADIAL
    d = (((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2) ** 0.5
    a = a0 * max(0.0, 1.0 - min(1.0, d))
    col = [c * (1 - a) + BG[k] * a for k, c in enumerate(col)]

    a = ramp_alpha(min(1.0, max(0.0, fy)))
    col = [c * (1 - a) + BG[k] * a for k, c in enumerate(col)]

    hx, hy, hw, hh = HERO_BOX
    fx, fy = (sx - hx) / hw, (sy - hy) / hh
    cx, cy, rx, ry = VIGNETTE
    d = (((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2) ** 0.5
    if d <= 0.42:
        a = 0.0
    elif d <= 0.82:
        a = 0.42 * (d - 0.42) / 0.40
    elif d < 1.0:
        a = 0.42 + 0.58 * (d - 0.82) / 0.18
    else:
        a = 1.0
    col = [c * (1 - a) + BG[k] * a for k, c in enumerate(col)]
    return tuple(col)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        SD, "..", "public", "hero-plate-sunrise.mp4")
    src = os.path.abspath(src)
    out = os.path.join(SD, "_frames")
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))

    dur = None
    info = subprocess.run([FF, "-i", src], capture_output=True, text=True).stderr
    for line in info.splitlines():
        if "Duration:" in line:
            hh, mm, ss = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
    subprocess.run([
        FF, "-y", "-loglevel", "error", "-i", src,
        "-vf", f"fps={FRAMES / dur:.6f}", "-frames:v", str(FRAMES),
        os.path.join(out, "f%02d.ppm"),
    ], check=True)

    files = sorted(os.listdir(out))
    print(f"{os.path.basename(src)}  {dur:.2f}s  {len(files)} frames sampled\n")
    print(f"{'Element':<19}{'px':>6}{'needs':>8}{'worst':>9}   ")
    print("-" * 46)

    fails = 0
    for name, x, y, w_, h_, colour, needs in ELEMENTS:
        worst = 999.0
        # A grid rather than the centre: the horizon band is a narrow bright
        # stripe, and a centre sample walks straight past it.
        for fn in files:
            fw, fh, px = read_ppm(os.path.join(out, fn))
            for iy in range(5):
                for ix in range(13):
                    sx = x + w_ * ix / 12
                    sy = y + h_ * iy / 4
                    r = ratio(composite(px, fw, fh, sx, sy), colour)
                    worst = min(worst, r)
        flag = "" if worst >= needs else "   FAIL"
        if worst < needs:
            fails += 1
        px_size = {"Name": 58, "Positioning": 26, "Quote": 33,
                   "Quote byline": 10, "BACKGROUND label": 9,
                   "Background list": 16}[name]
        print(f"{name:<19}{px_size:>6}{needs:>8.1f}{worst:>9.2f}{flag}")

    print()
    print("PASS" if not fails else f"{fails} FAILING")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
