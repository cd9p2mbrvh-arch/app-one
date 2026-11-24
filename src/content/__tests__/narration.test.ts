import { linesFor } from '../lines';
import { THEMES, VOICES } from '../manifest';
import { narrationSource } from '../narration';
import type { ThemeNarration } from '../narration.generated';

describe('narration clips', () => {
  it.each(THEMES.map((t) => t.id))(
    'exist for every line of theme "%s", for every narrator',
    (theme) => {
      for (const voice of VOICES) {
        for (const line of linesFor(theme, voice.id)) {
          expect(narrationSource(theme, voice.id, line.id)).toBeDefined();
        }
      }
    },
  );

  it("prefers a narrator's own recording of a shared line over the placeholder", () => {
    const narration: Record<string, ThemeNarration> = {
      peace: { shared: { s001: 1 }, voices: { voice2: { s001: 2, v001: 3 } } },
    };
    expect(narrationSource('peace', 'voice2', 's001', narration)).toBe(2);
    expect(narrationSource('peace', 'voice1', 's001', narration)).toBe(1);
    expect(narrationSource('peace', 'voice2', 'voice2-v001', narration)).toBe(3);
    expect(narrationSource('peace', 'voice1', 'voice1-v001', narration)).toBeUndefined();
    expect(narrationSource('nope', 'voice1', 's001', narration)).toBeUndefined();
  });
});
