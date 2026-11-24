import { create } from 'zustand';

export type SetupStep = 'theme' | 'voice' | 'music' | 'duration';

export const SETUP_STEPS: SetupStep[] = ['theme', 'voice', 'music', 'duration'];

export type SetupSelection = {
  theme: string | null;
  voice: string | null;
  music: string | null;
  duration: number | null;
};

type SetupStore = SetupSelection & {
  choose: <S extends SetupStep>(step: S, value: NonNullable<SetupSelection[S]>) => void;
  reset: () => void;
};

const EMPTY: SetupSelection = { theme: null, voice: null, music: null, duration: null };

/** The choices made on the session setup tabs. Not persisted (yet). */
export const useSessionSetup = create<SetupStore>((set) => ({
  ...EMPTY,
  choose: (step, value) => set({ [step]: value } as Partial<SetupSelection>),
  reset: () => set(EMPTY),
}));

export function isStepDone(selection: SetupSelection, step: SetupStep): boolean {
  return selection[step] !== null;
}

export function isSetupComplete(selection: SetupSelection): boolean {
  return SETUP_STEPS.every((step) => isStepDone(selection, step));
}

/**
 * Which tab to show after a choice on `current`: the first unfinished step after it
 * (wrapping around), or `current` itself when everything is already chosen.
 */
export function nextStepAfter(selection: SetupSelection, current: SetupStep): SetupStep {
  const start = SETUP_STEPS.indexOf(current);
  for (let i = 1; i < SETUP_STEPS.length; i++) {
    const step = SETUP_STEPS[(start + i) % SETUP_STEPS.length];
    if (!isStepDone(selection, step)) return step;
  }
  return current;
}
