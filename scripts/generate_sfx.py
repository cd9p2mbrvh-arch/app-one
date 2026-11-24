"""Generates short PLACEHOLDER tab-transition sounds (.m4a). Needs numpy and ffmpeg.

Four candidates, all short and dry (no resonant filters):
  tab_swish  ~0.14 s  crisp airy swipe (default)
  tab_pop    ~0.09 s  soft bubble pop
  tab_tick   ~0.06 s  small wooden click
  tab_chime  ~0.30 s  tiny soft bell

Usage: python3 scripts/generate_sfx.py
"""
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets/sfx"
rng = np.random.default_rng(11)


def timeline(seconds):
    return np.arange(int(SR * seconds)) / SR


def one_pole_lowpass(x, cutoff):
    """Gentle 6 dB/oct low-pass; `cutoff` may vary per sample."""
    a = np.exp(-2 * np.pi * np.asarray(cutoff) / SR) * np.ones_like(x)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def swish(seconds=0.14):
    t = timeline(seconds)
    noise = rng.standard_normal(len(t))
    # Brightness falls quickly: air moving past, no ringing.
    cutoff = 9000 * np.exp(-t / 0.05) + 1500
    bright = noise - one_pole_lowpass(noise, 700)  # remove rumble
    shaped = one_pole_lowpass(bright, cutoff)
    env = np.minimum(1, t / 0.012) * np.exp(-np.maximum(0, t - 0.012) / 0.035)
    return shaped * env


def pop(seconds=0.09):
    t = timeline(seconds)
    freq = 260 + 520 * np.exp(-t / 0.012)  # fast downward pitch blip
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.minimum(1, t / 0.002) * np.exp(-t / 0.022)
    return np.sin(phase) * env


def tick(seconds=0.06):
    t = timeline(seconds)
    body = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.008)
    body += 0.6 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.005)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.0015) * 0.5
    return (body + click) * np.minimum(1, t / 0.0005)


def chime(seconds=0.3):
    t = timeline(seconds)
    f = 1568.0  # G6
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.05)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.09)
    return tone * env


def write(name, x, peak):
    fade = int(0.004 * SR)  # avoid a click at the very end
    x = x.copy()
    x[-fade:] *= np.linspace(1, 0, fade)
    x = x / np.max(np.abs(x)) * peak
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
    write("tab_swish", swish(), 0.6)
    write("tab_pop", pop(), 0.55)
    write("tab_tick", tick(), 0.45)
    write("tab_chime", chime(), 0.4)
