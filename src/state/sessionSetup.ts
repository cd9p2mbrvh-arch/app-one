import { create } from 'zustand';

import {
  DEFAULT_DURATION_MIN,
  firstUnlocked,
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  isUnlocked,
  MUSIC,
  NO_PURCHASES,
  THEMES,
  VOICES,
  type CatalogItem,
  type Theme,
} from '@/content/manifest';

export type SetupStep = 'theme' | 'voice' | 'music' | 'duration';

export const SETUP_STEPS: SetupStep[] = ['theme', 'voice', 'music', 'duration'];

export type SetupSelection = {
  theme: string;
  voice: string;
  music: string;
  duration: number;
};

/**
 * What the setup screen should do when it next comes into view: start the
 * session at once ('begin'), or open a tab whose choice needs attention.
 */
export type SetupRequest = 'begin' | SetupStep;

type SetupStore = SetupSelection & {
  pending: SetupRequest | null;
  choose: <S extends SetupStep>(step: S, value: SetupSelection[S]) => void;
  /** Fills in all choices (e.g. from a past session) and asks the setup screen to act. */
  replay: (selection: SetupSelection, request: SetupRequest) => void;
  /** Returns the pending request once and clears it. */
  takePending: () => SetupRequest | null;
  reset: () => void;
};

/** Starting choices: first theme, first unlocked voice and music, 10 minutes. */
export function defaultSelection(level = 1): SetupSelection {
  return {
    theme: firstUnlocked(THEMES, level).id,
    voice: firstUnlocked(VOICES, level).id,
    music: firstUnlocked(MUSIC, level).id,
    duration: DEFAULT_DURATION_MIN,
  };
}

/** The choices on the session setup tabs. Not persisted (yet). */
export const useSessionSetup = create<SetupStore>((set, get) => ({
  ...defaultSelection(),
  pending: null,
  choose: (step, value) => set({ [step]: value } as Partial<SetupSelection>),
  replay: (selection, request) => set({ ...selection, pending: request }),
  takePending: () => {
    const pending = get().pending;
    if (pending) set({ pending: null });
    return pending;
  },
  reset: () => set({ ...defaultSelection(), pending: null }),
}));

const CATALOG: Record<Exclude<SetupStep, 'duration'>, CatalogItem[]> = {
  theme: THEMES,
  voice: VOICES,
  music: MUSIC,
};

/** Steps a theme can fix (choose automatically). */
export type FixableStep = 'voice' | 'music';

/** The narrator/music the selected theme fixes, if any. */
export function fixedByTheme(
  selection: Pick<SetupSelection, 'theme'>,
  themes: Theme[] = THEMES,
): Partial<Record<FixableStep, string>> {
  return themes.find((t) => t.id === selection.theme)?.fixed ?? {};
}

export function isStepFixed(
  selection: SetupSelection,
  step: SetupStep,
  themes: Theme[] = THEMES,
): boolean {
  return (step === 'voice' || step === 'music') && !!fixedByTheme(selection, themes)[step];
}

/**
 * The choices that will actually be used: the user's own, with anything the
 * selected theme fixes put in their place. The user's own choices are kept in the
 * store, so they come back when a theme without fixed choices is selected.
 */
export function resolveSelection(
  selection: SetupSelection,
  themes: Theme[] = THEMES,
): SetupSelection {
  const fixed = fixedByTheme(selection, themes);
  return {
    theme: selection.theme,
    duration: selection.duration,
    voice: fixed.voice ?? selection.voice,
    music: fixed.music ?? selection.music,
  };
}

/** The catalogue item used for a step, if any (durations have none). */
export function chosenItem(
  selection: SetupSelection,
  step: SetupStep,
  themes: Theme[] = THEMES,
): CatalogItem | undefined {
  if (step === 'duration') return undefined;
  const resolved = resolveSelection(selection, themes);
  const list = step === 'theme' ? themes : CATALOG[step];
  return list.find((item) => item.id === resolved[step]);
}

/**
 * True when the choice for this step is locked at the given level and purchases.
 * Choices fixed by the theme are never locked: they come with the theme.
 */
export function isStepLocked(
  selection: SetupSelection,
  step: SetupStep,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
  themes: Theme[] = THEMES,
): boolean {
  if (isStepFixed(selection, step, themes)) return false;
  const item = chosenItem(selection, step, themes);
  return !!item && !isUnlocked(item, level, owned);
}

/** A session can start only when nothing chosen is locked. */
export function canBegin(
  selection: SetupSelection,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
  themes: Theme[] = THEMES,
): boolean {
  return SETUP_STEPS.every((step) => !isStepLocked(selection, step, level, owned, themes));
}

/** The parts of a past session needed to play it again. */
export type ReplaySource = {
  themeId: string;
  voiceId: string;
  musicId: string;
  plannedMinutes: number;
};

export type ReplayPlan = {
  selection: SetupSelection;
  /** The first choice that is locked now (e.g. purchases not restored), if any. */
  lockedStep: SetupStep | null;
};

/**
 * How to play a past session again: its choices as they are today. Items that no
 * longer exist fall back to the defaults, and the length is kept within today's
 * limits (older sessions could be up to 60 minutes).
 */
export function replayPlan(
  source: ReplaySource,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
  themes: Theme[] = THEMES,
): ReplayPlan {
  const fallback = defaultSelection(level);
  const has = (list: CatalogItem[], id: string) => list.some((item) => item.id === id);
  const selection: SetupSelection = {
    theme: has(themes, source.themeId) ? source.themeId : fallback.theme,
    voice: has(VOICES, source.voiceId) ? source.voiceId : fallback.voice,
    music: has(MUSIC, source.musicId) ? source.musicId : fallback.music,
    duration: Math.min(
      MAX_DURATION_MIN,
      Math.max(MIN_DURATION_MIN, Math.round(source.plannedMinutes) || DEFAULT_DURATION_MIN),
    ),
  };
  const lockedStep =
    SETUP_STEPS.find((step) => isStepLocked(selection, step, level, owned, themes)) ?? null;
  return { selection, lockedStep };
}
