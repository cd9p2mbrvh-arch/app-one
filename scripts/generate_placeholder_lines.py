"""Generates PLACEHOLDER affirmation lines (English) for every theme.

Real, recorded lines will replace these files later. Each theme gets
100 shared lines (read by every voice) and 30 lines per voice.

Usage: python3 scripts/generate_placeholder_lines.py
"""
import itertools
import json
import pathlib

VOICES = [f"voice{i}" for i in range(1, 10)]
OUT = pathlib.Path(__file__).resolve().parent.parent / "src/content/lines/en"

# Each theme: (shared stems, shared endings, voice stems, voice endings).
# Shared: 10 x 10 = 100 lines. Voice: 12 x 15 = 180 = 6 voices x 30 lines.
GUIDANCE = ["Breathe in slowly.", "Let your shoulders soften.", "Close your eyes for a moment.",
            "Feel your feet on the ground.", "Breathe out gently.", "Rest here for a while.",
            "Notice the rise of your chest.", "Let your jaw relax.", "Take a deep breath.",
            "Feel the air around you.", "Let your hands rest.", "Stay with this breath.",
            "Soften your forehead.", "Let your breath slow down.", "Notice this quiet moment.",
            "Relax your belly.", "Breathe in through your nose.", "Let your eyes rest."]

# Each theme: (shared stems, shared endings, voice affirmations).
# Shared: 10 x 10 = 100 lines. Voice: 18 guidance x 15 affirmations = 270 = 9 voices x 30.
THEMES = {
    "abundance": (
        ["I am open to", "I welcome", "I gently attract", "Today I receive", "I make room for",
         "I am worthy of", "I allow myself", "I trust the flow of", "I say yes to", "I am surrounded by"],
        ["abundance in every form.", "new opportunities.", "prosperity and ease.", "all the good that is coming.",
         "wealth that flows freely.", "a life of plenty.", "unexpected blessings.", "generous possibilities.",
         "success that feels natural.", "everything I need and more."],
        ["Abundance flows to me easily.", "I have more than enough.", "Good things come to me every day.",
         "I am a magnet for opportunity.", "My life is rich in every way.", "I deserve to prosper.",
         "Money comes to me with ease.", "I receive with an open heart.", "There is plenty for everyone.",
         "My efforts are rewarded.", "I am grateful for all I have.", "New doors open for me.",
         "I feel wealthy and supported.", "Success is natural for me.", "The universe provides for me."],
    ),
    "peace": (
        ["I am calm and", "My mind is", "With each breath I become", "Right now I feel", "I choose to be",
         "My body is", "In this moment I am", "I allow myself to be", "My heart is", "I return to being"],
        ["still.", "quiet and clear.", "at ease.", "safe and grounded.", "gentle with myself.", "relaxed and open.",
         "free of worry.", "soft and steady.", "patient and kind.", "deeply at peace."],
        ["I let go of what I cannot control.", "My thoughts drift away like clouds.", "I am safe right now.",
         "Peace begins with my breath.", "Nothing needs to be solved this moment.", "I release the tension of the day.",
         "My mind becomes quiet.", "I am exactly where I need to be.", "Calm spreads through my body.",
         "I welcome stillness.", "I move through life with ease.", "I am gentle with my thoughts.",
         "Silence feels comforting.", "Every exhale brings more calm.", "I rest in this quiet moment."],
    ),
    "health": (
        ["My body is", "Every cell in me is", "Today I feel", "I am becoming", "Day by day I am",
         "With each breath I grow", "My energy is", "I know my body is", "I am grateful my body is", "I choose to feel"],
        ["strong and capable.", "healing and renewing.", "vibrant and alive.", "full of energy.", "balanced and well.",
         "rested and restored.", "light and free.", "nourished and cared for.", "resilient.", "healthy and whole."],
        ["My body knows how to heal.", "I breathe in fresh energy.", "My heart beats strong and steady.",
         "I listen to what my body needs.", "I sleep deeply and wake rested.", "I nourish myself with care.",
         "Strength grows in me every day.", "I am kind to my body.", "My immune system protects me.",
         "Every breath restores me.", "I enjoy moving my body.", "I feel light and energised.",
         "Healing light flows through me.", "I choose habits that support me.", "I am thankful for my health."],
    ),
    "gratitude": (
        ["I am thankful for", "Today I appreciate", "My heart is full of thanks for", "I notice and cherish",
         "I am grateful for", "I celebrate", "I give thanks for", "I warmly remember", "I treasure",
         "I smile when I think of"],
        ["the people I love.", "this very breath.", "small everyday joys.", "the lessons I have learned.",
         "a safe place to rest.", "the beauty around me.", "the kindness of others.", "my body and mind.",
         "the gift of today.", "everything that brought me here."],
        ["Gratitude fills my heart.", "I see beauty in simple things.", "I am thankful for this moment.",
         "My life is full of small gifts.", "I appreciate the people around me.", "Every day offers something good.",
         "I am grateful for how far I have come.", "Thank you for this breath.", "I notice the good in my life.",
         "My heart is open and thankful.", "I cherish the love I share.", "I find joy in ordinary moments.",
         "I am thankful for my journey.", "Kindness surrounds me.", "I welcome today with thanks."],
    ),
}


def combos(stems, endings):
    return [f"{s} {e}" for s, e in itertools.product(stems, endings)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for theme, (s_stems, s_ends, affirmations) in THEMES.items():
        shared = combos(s_stems, s_ends)
        voice_pool = combos(GUIDANCE, affirmations)
        assert len(shared) == 100 and len(voice_pool) == 270, theme
        data = {
            "placeholder": True,
            "theme": theme,
            "language": "en",
            "shared": [{"id": f"s{i + 1:03d}", "text": t} for i, t in enumerate(shared)],
            "voices": {
                voice: [
                    {"id": f"v{i + 1:03d}", "text": t}
                    # Interleave so each voice gets a mix of guidance phrases.
                    for i, t in enumerate(voice_pool[n::len(VOICES)])
                ]
                for n, voice in enumerate(VOICES)
            },
        }
        path = OUT / f"{theme}.json"
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(OUT.parent.parent.parent.parent)}")


if __name__ == "__main__":
    main()
