import { router } from 'expo-router';

import { levelForXp } from '@/domain/progress';
import { tap } from '@/feedback';
import { useActiveProfile } from '@/state/profiles';
import { useProfileProgress } from '@/state/progress';
import { useOwned } from '@/state/purchases';
import { replayPlan, useSessionSetup, type ReplaySource } from '@/state/sessionSetup';

/**
 * "Play again" for a past session: fills in its theme, narrator, music and length
 * and goes back to the setup screen, which starts it with the usual Begin zoom.
 * If one of those choices is locked now, the setup screen opens that tab instead.
 */
export function useReplay() {
  const profile = useActiveProfile();
  const progress = useProfileProgress(profile?.id);
  const owned = useOwned();
  const level = levelForXp(progress.totalXp);

  const planFor = (source: ReplaySource) => replayPlan(source, level, owned);

  const play = (source: ReplaySource) => {
    tap();
    const plan = planFor(source);
    useSessionSetup.getState().replay(plan.selection, plan.lockedStep ?? 'begin');
    router.dismissTo('/home');
  };

  return { planFor, play };
}
