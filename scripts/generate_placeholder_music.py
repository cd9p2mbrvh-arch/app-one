"""Generates four PLACEHOLDER ambient music loops (30 s, seamless) as .m4a.

Real music will replace these files later. Needs numpy and ffmpeg.
Usage: python3 scripts/generate_placeholder_music.py
"""
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

SR = 22050
SECONDS = 30
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets/music"
t = np.arange(SR * SECONDS) / SR
rng = np.random.default_rng(7)


def hz(note):
    """MIDI note number to frequency."""
    return 440.0 * 2 ** ((note - 69) / 12)


def pad(notes, start, length, brightness=0.25, vibrato=0.0):
    """Soft chord with slow attack/release, placed at `start` seconds."""
    out = np.zeros_like(t)
    seg = (t >= start) & (t < start + length)
    local = t[seg] - start
    env = np.minimum(1, local / 3) * np.minimum(1, (length - local) / 3)
    for n in notes:
        f = hz(n) * (1 + vibrato * np.sin(2 * np.pi * 5 * local))
        tone = np.sin(2 * np.pi * f * local) + brightness * np.sin(4 * np.pi * f * local)
        out[seg] += tone * env
    return out / max(1, len(notes))


def bell(note, start, decay=2.5):
    out = np.zeros_like(t)
    seg = t >= start
    local = t[seg] - start
    f = hz(note)
    env = np.exp(-local / decay)
    out[seg] = (np.sin(2 * np.pi * f * local) + 0.4 * np.sin(2 * np.pi * f * 2.76 * local)) * env
    return out


def waves():
    noise = rng.standard_normal(len(t))
    # Smooth the noise (crude low-pass) and swell it like waves every ~7.5 s.
    kernel = np.ones(200) / 200
    soft = np.convolve(noise, kernel, mode="same")
    swell = 0.5 + 0.5 * np.sin(2 * np.pi * t / 7.5 - np.pi / 2)
    return soft * swell * 6


def chords(progression, bright=0.25, vib=0.0, overlap=2.0):
    step = SECONDS / len(progression)
    return sum(pad(c, i * step, step + overlap, bright, vib) for i, c in enumerate(progression))


TRACKS = {
    # C major -> A minor -> F -> G, very soft
    "music1": chords([[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bright=0.15),
    # Ocean waves over a low drone
    "music2": waves() * 0.5 + pad([45, 52], 0, SECONDS, 0.1) * 0.6,
    # Warm slow strings with a little vibrato
    "music3": chords([[53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [45, 52, 57, 60]], 0.35, 0.003),
    # Night: sparse bells over a quiet pad
    "music4": pad([50, 57], 0, SECONDS, 0.05) * 0.5
    + sum(bell(n, s) for n, s in [(74, 1), (79, 4.5), (76, 9), (81, 13), (74, 17.5), (78, 21), (83, 25)]) * 0.35,
}


def make_loopable(x, fade=1.5):
    """Crossfades the tail into the head so the file loops without a click."""
    n = int(fade * SR)
    head, tail = x[:n].copy(), x[-n:]
    ramp = np.linspace(0, 1, n)
    x[:n] = head * ramp + tail * (1 - ramp)
    return x[:-n]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, signal in TRACKS.items():
        x = make_loopable(signal.astype(np.float64))
        x = x / np.max(np.abs(x)) * 0.6
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
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "64k", str(out)],
                check=True,
            )
        print(f"wrote {out.name} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
