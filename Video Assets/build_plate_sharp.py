"""Rebuild the hero sunrise plate: sharper, faster, same seamless crossfade loop.

Round two on the plate, and the same three problems AJ2054 hit in its own round
two — with one difference. There the fix for "soft" was to regenerate at
`mode: 'pro'` and get a real 1920x1080 master. Here the only sunrise master that
exists is 1280x720 (Kling 3.0 std, 15s), and regenerating costs credits, so the
softness is attacked where it actually lives.

**It was never mostly a resolution problem.** The shipped plate encodes at
78 kb/s — CRF 32 on a frame that is almost entirely a slow gradient, which is
the worst possible case for x264's deadzone. What reached the page was banded
mush, and no amount of CSS was going to sharpen that. Dropping to CRF 23 costs
bytes and returns the detail that was in the master all along.

The upscale to 1080p is the second-order fix and is still worth doing: the hero
is ~900px tall and 16:9, so a 720p plate under `transform: scale(1.3)` is being
stretched roughly 1.9x by the browser's bilinear filter. Doing that resize at
encode time with lanczos plus a light unsharp beats the browser's stretch, even
though no new detail exists to recover.

Faster is `setpts`. A sunrise cannot be sped without limit — compress it too far
and weather turns into timelapse, which is the note in this folder's README —
so 1.45x, not the 2x the word "faster" invites.

Usage:  python3 build_plate_sharp.py
"""
import os
import subprocess
import sys

SD = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")

SRC = os.path.join(SD, "Sources/sunrise-a.mp4")
OUT = os.path.join(SD, "hero-plate-sunrise-sharp.mp4")
POSTER = os.path.join(SD, "hero-plate-sunrise-sharp-poster.jpg")

# 1.45x. See the module docstring for why this is not 2x.
SPEED = 1.45
# Crossfade length, in output seconds.
XFADE = 1.8
# The master is 2.35:1 content letterboxed inside a 720p 16:9 frame: 88px of
# hard black top and bottom, confirmed with cropdetect at limit 0.10. The
# shipped plate never cropped them — `transform: scale(1.3)` in the CSS was
# pushing them off screen, which meant a third of every encoded frame was spent
# on black bars and the visible picture was being blown up 1.9x to hide them.
# Cropping first gives the same framing from more pixels at fewer bits.
CROP = "crop=1280:544:0:88"
W, H = 1920, 816

# Grade. Unchanged in intent from the shipped plate — hold the palette, let the
# scrim do the darkening — but brightness is lifted from -0.06 to -0.02 because
# the CSS scrim was tuned against a mushier, flatter image and a sharper one
# carries more contrast of its own.
GRADE = "eq=brightness=-0.02:saturation=0.80:contrast=1.06"
# Light. luma_amount above ~1.0 on a sky this smooth prints halos around the
# ridgeline, which reads as a cheap sharpen filter rather than as a sharp plate.
SHARPEN = "unsharp=5:5:0.75:5:5:0.0"


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError("no duration for " + path)


def main():
    src_d = duration(SRC)
    fast_d = src_d / SPEED
    body = fast_d - XFADE

    chain = (
        f"{CROP},scale={W}:{H}:flags=lanczos,{GRADE},{SHARPEN},"
        f"setpts={1/SPEED:.6f}*PTS,fps=24"
    )
    vf = (
        f"[0:v]{chain},split=3[s1][s2][s3];"
        f"[s1]trim={body}:{fast_d},setpts=PTS-STARTPTS[tail];"
        f"[s2]trim=0:{XFADE},setpts=PTS-STARTPTS[head];"
        f"[s3]trim={XFADE}:{body},setpts=PTS-STARTPTS[rest];"
        f"[tail][head]blend=all_expr='A*(1-T/{XFADE})+B*(T/{XFADE})'[mix];"
        f"[mix][rest]concat=n=2:v=1[v]"
    )

    subprocess.run([
        FF, "-y", "-i", SRC,
        "-filter_complex", vf, "-map", "[v]", "-an",
        "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        # CRF 26 with tuned deadzones, chosen off a sweep: 23 costs 2.0 MB, 25 costs
        # 1.25 MB, 27 costs 807 KB. A near-black sky is exactly the content
        # x264 throws away first, and the banding in the shipped plate is that
        # decision made at CRF 32.
        "-crf", "26", "-preset", "veryslow",
        "-x264-params", "deblock=-1,-1:aq-mode=3:aq-strength=1.1",
        "-movflags", "+faststart",
        OUT,
    ], check=True, capture_output=True)

    # Poster is the first frame, which after the crossfade is the same image the
    # loop returns to. Anything else and the fallback disagrees with the video.
    subprocess.run([
        FF, "-y", "-i", OUT, "-frames:v", "1", "-q:v", "3", POSTER,
    ], check=True, capture_output=True)

    print(f"source   {src_d:.2f}s 1280x720 (letterboxed 2.35:1)")
    print(f"output   {duration(OUT):.2f}s {W}x{H}  "
          f"{os.path.getsize(OUT)/1024:.0f} KB")
    print(f"poster   {os.path.getsize(POSTER)/1024:.0f} KB")


if __name__ == "__main__":
    sys.exit(main())
