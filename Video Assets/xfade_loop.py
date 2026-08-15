"""Build a seamless loop from a clip whose content changes over time.

Ping-pong is wrong for a sunrise: reversing it makes the sun un-rise. Instead
the tail is dissolved back into the head, so the light only ever moves forward
and the reset is hidden inside the dissolve.

For a clip of length D and crossfade X, the output R has length D - X:

    R(t) = clip(D-X+t)*(1 - t/X) + clip(t)*(t/X)   for t < X
    R(t) = clip(t)                                  for t >= X

R(0) = clip(D-X) and R ends approaching clip(D-X), so the join is invisible.
"""
import subprocess, os, sys, json

SD = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")
FP = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError("no duration for " + path)


def build(src, out, grade, X=2.0, crf=32, w=1280, h=720):
    D = duration(os.path.join(SD, src))
    body = D - X
    vf = (
        f"[0:v]scale={w}:{h}:flags=lanczos,{grade},split=3[s1][s2][s3];"
        f"[s1]trim={body}:{D},setpts=PTS-STARTPTS[tail];"
        f"[s2]trim=0:{X},setpts=PTS-STARTPTS[head];"
        f"[s3]trim={X}:{body},setpts=PTS-STARTPTS[rest];"
        f"[tail][head]blend=all_expr='A*(1-T/{X})+B*(T/{X})'[mix];"
        f"[mix][rest]concat=n=2:v=1[v]"
    )
    subprocess.run([
        FF, "-y", "-i", os.path.join(SD, src),
        "-filter_complex", vf, "-map", "[v]", "-an",
        "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
        "-crf", str(crf), "-preset", "slow", "-movflags", "+faststart",
        os.path.join(SD, out)
    ], check=True, capture_output=True)
    kb = os.path.getsize(os.path.join(SD, out)) / 1024
    print(f"{src} ({D:.2f}s) -> {out} ({duration(os.path.join(SD,out)):.2f}s, {kb:.0f} KB)")


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    grade = sys.argv[3] if len(sys.argv) > 3 else "eq=brightness=-0.04:saturation=0.80:contrast=1.03"
    build(src, out, grade)
