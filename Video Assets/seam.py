"""Measure how well a loop closes: first frame vs last, against a mid-clip pair.

A crossfade loop is only invisible if the endpoints match. This prints both the
endpoint difference and the difference between two genuinely different frames,
because the first number alone means nothing without the second: 0.5/255 is
excellent on a static plate and suspicious on one where the camera translates.
"""
import os, subprocess, struct, zlib, sys
SD = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(SD, "pylibs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")

def grab(src, args, out):
    subprocess.run([FF, "-y", "-loglevel", "error"] + args + ["-i", src,
                    "-frames:v", "1", "-update", "1", out], check=True)

def load(p):
    d = open(p, 'rb').read(); pos = 8; w = h = ct = None; idat = b''
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]
        data = d[pos+8:pos+8+ln]
        if typ == b'IHDR': w, h, _bd, ct = struct.unpack('>IIBB', data[:10])
        elif typ == b'IDAT': idat += data
        elif typ == b'IEND': break
        pos += 12 + ln
    raw = zlib.decompress(idat); ch = {0:1,2:3,4:2,6:4}[ct]
    stride = w*ch; out = bytearray(w*h*ch); prev = bytearray(stride); i = 0
    for y in range(h):
        f = raw[i]; i += 1; line = bytearray(raw[i:i+stride]); i += stride
        for x in range(stride):
            a = line[x-ch] if x >= ch else 0
            b = prev[x]; c = prev[x-ch] if x >= ch else 0
            if f == 1: line[x] = (line[x]+a) & 255
            elif f == 2: line[x] = (line[x]+b) & 255
            elif f == 3: line[x] = (line[x]+((a+b) >> 1)) & 255
            elif f == 4:
                p_ = a+b-c; pa = abs(p_-a); pb = abs(p_-b); pc = abs(p_-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x]+pr) & 255
        out[y*stride:(y+1)*stride] = line; prev = line
    return bytes(out)

def diff(p1, p2):
    a, b = load(p1), load(p2); n = min(len(a), len(b))
    return sum(abs(a[i]-b[i]) for i in range(0, n, 7)) / (n // 7)

src = sys.argv[1]
os.makedirs("/tmp/seam", exist_ok=True)
grab(src, [], "/tmp/seam/first.png")
grab(src, ["-sseof", "-0.05"], "/tmp/seam/last.png")
grab(src, ["-ss", "4"], "/tmp/seam/mid.png")
e = diff("/tmp/seam/first.png", "/tmp/seam/last.png")
m = diff("/tmp/seam/first.png", "/tmp/seam/mid.png")
print(f"endpoints   {e:.2f}/255")
print(f"mid-clip    {m:.2f}/255")
print(f"ratio       {m/e:.1f}x   (higher is a cleaner join)")
