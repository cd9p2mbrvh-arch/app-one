"""Generates short PLACEHOLDER sound effects (.m4a). Needs numpy and ffmpeg.

whoosh: ~0.35 s airy sweep used when moving between tabs.
Usage: python3 scripts/generate_sfx.py
"""
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets/sfx"


def whoosh(seconds=0.35):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    noise = np.random.default_rng(3).standard_normal(n)
    # Simple resonant band-pass whose centre sweeps upward: the "air" moving past.
    centre = 300 + 2200 * (t / seconds) ** 1.5
    out = np.zeros(n)
    y1 = y2 = 0.0
    for i in range(n):
        w = 2 * np.pi * centre[i] / SR
        r = 0.985
        y = noise[i] * (1 - r) + 2 * r * np.cos(w) * y1 - r * r * y2
        out[i], y2, y1 = y, y1, y
    # Swell in, fade out.
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.6
    return out * env


def write(name, x):
    x = x / np.max(np.abs(x)) * 0.7
    pcm = (x * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / f"{name}.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        out = OUT / f"{name}.m4a"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "96k", str(out)],
            check=True,
        )
    print(f"wrote {out.name} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    write("whoosh", whoosh())
