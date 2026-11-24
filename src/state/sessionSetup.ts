import { create } from 'zustand';

import {
  DEFAULT_DURATION_MIN,
  firstUnlocked,
  isUnlocked,
  MUSIC,
  NO_PURCHASES,
  THEMES,
  VOICES,
  type CatalogItem,
} from '@/content/manifest';

export type SetupStep = 'theme' | 'voice' | 'music' | 'duration';

export const SETUP_STEPS: SetupStep[] = ['theme', 'voice', 'music', 'duration'];

export type SetupSelection = {
  theme: string;
  voice: string;
  music: string;
  duration: number;
};

type SetupStore = SetupSelection & {
  choose: <S extends SetupStep>(step: S, value: SetupSelection[S]) => void;
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
export const useSessionSetup = create<SetupStore>((set) => ({
  ...defaultSelection(),
  choose: (step, value) => set({ [step]: value } as Partial<SetupSelection>),
  reset: () => set(defaultSelection()),
}));

const CATALOG: Record<Exclude<SetupStep, 'duration'>, CatalogItem[]> = {
  theme: THEMES,
  voice: VOICES,
  music: MUSIC,
};

/** The catalogue item chosen for a step, if any (durations have none). */
export function chosenItem(selection: SetupSelection, step: SetupStep): CatalogItem | undefined {
  if (step === 'duration') return undefined;
  return CATALOG[step].find((item) => item.id === selection[step]);
}

/** True when the choice for this step is locked at the given level and purchases. */
export function isStepLocked(
  selection: SetupSelection,
  step: SetupStep,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
): boolean {
  const item = chosenItem(selection, step);
  return !!item && !isUnlocked(item, level, owned);
}

/** A session can start only when nothing chosen is locked. */
export function canBegin(
  selection: SetupSelection,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
): boolean {
  return SETUP_STEPS.every((step) => !isStepLocked(selection, step, level, owned));
}
