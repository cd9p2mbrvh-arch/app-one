import * as Speech from 'expo-speech';

import { VOICES } from '@/content/manifest';

import { rankEnglishVoices, resetVoiceCache, speakAs, systemVoiceFor } from '../narratorVoice';

const voice = (
  identifier: string,
  language: string,
  quality: Speech.VoiceQuality,
  name = identifier,
) => ({
  identifier,
  language,
  quality,
  name,
});

describe('rankEnglishVoices', () => {
  it('keeps English voices, enhanced first, then by name', () => {
    const ranked = rankEnglishVoices([
      voice('fr', 'fr-FR', Speech.VoiceQuality.Enhanced),
      voice('b', 'en-GB', Speech.VoiceQuality.Default, 'Bea'),
      voice('a', 'en-US', Speech.VoiceQuality.Default, 'Al'),
      voice('z', 'en-AU', Speech.VoiceQuality.Enhanced, 'Zed'),
    ]);
    expect(ranked).toEqual(['z', 'a', 'b']);
  });
});

describe('systemVoiceFor', () => {
  it('cycles through available voices and falls back to the default', () => {
    expect(systemVoiceFor(0, ['x', 'y'])).toBe('x');
    expect(systemVoiceFor(3, ['x', 'y'])).toBe('y');
    expect(systemVoiceFor(2, [])).toBeUndefined();
  });
});

describe('speakAs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetVoiceCache();
  });

  it("speaks with the narrator's pitch, rate and system voice", async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValueOnce([
      voice('v1', 'en-US', Speech.VoiceQuality.Default, 'A'),
      voice('v2', 'en-US', Speech.VoiceQuality.Default, 'B'),
    ]);
    await speakAs(VOICES[1], 1, 'Hello');

    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'v2', pitch: 0.85, rate: 0.85, language: 'en' }),
    );
  });
});
