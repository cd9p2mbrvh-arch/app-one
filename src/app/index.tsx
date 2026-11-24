import { Redirect } from 'expo-router';

import { useProfiles, useProfilesHydrated } from '@/state/profiles';

/** Entry point: sends the user to their last profile, the picker, or first-time setup. */
export default function Entry() {
  const hydrated = useProfilesHydrated();
  const hasActive = useProfiles((s) => s.activeId !== null);
  const hasProfiles = useProfiles((s) => s.profiles.length > 0);

  if (!hydrated) return null;
  if (hasActive) return <Redirect href="/home" />;
  if (hasProfiles) return <Redirect href="/profiles" />;
  return <Redirect href="/profiles/new" />;
}
