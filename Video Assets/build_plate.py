"""Turn a raw model render into a shipping hero plate.

This is `build_plate_sharp.py` generalised. That script was written for one
clip and hardcoded to it, which was fine until the plate changed twice. The
steps are the same every time and the reasoning behind each one is in this
folder's README:

  crop     kill any letterbox the model baked in, before anything is scaled
  scale    lanczos to 1080-class, because the hero upscales whatever it gets
  grade    colour only; the CSS scrim does the darkening
  sharpen  light, high radius; anything stronger prints halos on a smooth sky
  speed    setpts, then a hard fps cap so the saved frames are not re-spent
  loop     dissolve the tail into the head, because these clips translate and
           reversing them plays the camera backwards
  encode   CRF in the mid-20s, not the low 30s. Near-black gradients are the
           first thing x264 throws away and the artefact is banding, not
           softness, so this is where "it looks mushy" is actually decided.

Usage:
  python3 build_plate.py SOURCE OUT [--crop W:H:X:Y] [--speed 1.45]
                                    [--xfade 1.8] [--size 1920x816]
                                    [--grade EQ] [--crf 26] [--detect-crop]

Examples:
  python3 build_plate.py Sources/sunrise-a.mp4 hero-plate-sunrise.mp4 \
      --crop 1280:544:0:88 --speed 1.45 --size 1920x816
  python3 build_plate.py Sources/river-a.mp4 hero-plate-river.mp4 \
      --detect-crop --speed 1.2 --size 1920x1080
"""
import argparse
import os
import re
import subprocess
import sys

SD = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")

DEFAULT_GRADE = "eq=brightness=-0.02:saturation=0.80:contrast=1.06"
# luma_amount above ~1.0 on a smooth sky prints halos around every hard edge,
# which reads as a cheap sharpen filter rather than as a sharp plate.
SHARPEN = "unsharp=5:5:0.75:5:5:0.0"


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def probe(path):
    err = run([FF, "-i", path]).stderr
    dur = None
    size = None
    for line in err.splitlines():
        if "Duration:" in line and dur is None:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = int(h) * 3600 + int(m) * 60 + float(s)
        m2 = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", line)
        if m2 and size is None:
            size = (int(m2.group(1)), int(m2.group(2)))
    if dur is None:
        raise SystemExit(f"could not read a duration from {path}")
    return dur, size


def detect_crop(path):
    """Find baked-in letterbox bars.

    limit=0.10 rather than the default, because these are graded near-black
    plates: at the default threshold the picture's own shadows read as bars
    and cropdetect happily eats the foreground.
    """
    err = run([FF, "-i", path, "-vf",
               "cropdetect=limit=0.10:round=2:reset=0", "-f", "null", "-"]).stderr
    found = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", err)
    if not found:
        return None
    w, h, x, y = (int(v) for v in found[-1])
    return f"{w}:{h}:{x}:{y}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("out")
    ap.add_argument("--crop", default=None, help="W:H:X:Y, ffmpeg order")
    ap.add_argument("--detect-crop", action="store_true")
    ap.add_argument("--speed", type=float, default=1.45)
    ap.add_argument("--xfade", type=float, default=1.8)
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--grade", default=DEFAULT_GRADE)
    ap.add_argument("--crf", type=int, default=26)
    ap.add_argument("--fps", type=int, default=24)
    a = ap.parse_args()

    src = a.source if os.path.isabs(a.source) else os.path.join(SD, a.source)
    out = a.out if os.path.isabs(a.out) else os.path.join(SD, a.out)
    dur, size = probe(src)

    crop = a.crop
    if a.detect_crop and not crop:
        crop = detect_crop(src)
        if crop and size and crop == f"{size[0]}:{size[1]}:0:0":
            crop = None
        print(f"cropdetect: {crop or 'no bars found'}")

    w, h = (int(v) for v in a.size.lower().split("x"))
    fast = dur / a.speed
    body = fast - a.xfade
    if body <= a.xfade:
        raise SystemExit(
            f"clip is too short: {fast:.2f}s at {a.speed}x leaves {body:.2f}s "
            f"of body for a {a.xfade}s dissolve")

    chain = ",".join(filter(None, [
        f"crop={crop}" if crop else None,
        f"scale={w}:{h}:flags=lanczos",
        a.grade,
        SHARPEN,
        f"setpts={1 / a.speed:.6f}*PTS",
        f"fps={a.fps}",
    ]))
    vf = (
        f"[0:v]{chain},split=3[s1][s2][s3];"
        f"[s1]trim={body}:{fast},setpts=PTS-STARTPTS[tail];"
        f"[s2]trim=0:{a.xfade},setpts=PTS-STARTPTS[head];"
        f"[s3]trim={a.xfade}:{body},setpts=PTS-STARTPTS[rest];"
        f"[tail][head]blend=all_expr='A*(1-T/{a.xfade})+B*(T/{a.xfade})'[mix];"
        f"[mix][rest]concat=n=2:v=1[v]"
    )

    r = run([
        FF, "-y", "-i", src, "-filter_complex", vf, "-map", "[v]", "-an",
        "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", str(a.crf), "-preset", "veryslow",
        "-x264-params", "deblock=-1,-1:aq-mode=3:aq-strength=1.1",
        "-movflags", "+faststart", out,
    ])
    if r.returncode:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit("encode failed")

    poster = os.path.splitext(out)[0] + "-poster.jpg"
    run([FF, "-y", "-i", out, "-frames:v", "1", "-q:v", "3", poster])

    od, osize = probe(out)
    print(f"source  {dur:.2f}s {size[0]}x{size[1]}")
    print(f"output  {od:.2f}s {osize[0]}x{osize[1]}  "
          f"{os.path.getsize(out) / 1024:.0f} KB  (crf {a.crf}, {a.speed}x)")
    print(f"poster  {os.path.getsize(poster) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
