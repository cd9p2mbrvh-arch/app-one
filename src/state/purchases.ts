import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Purchased content, shared by all profiles on the device (store purchases
 * belong to the device's Apple/Google account, not to an app profile).
 *
 * MOCKUP: `buy` marks a product as owned immediately and charges nothing.
 * It will be replaced by real in-app purchases (StoreKit / Google Play Billing).
 */
export const PURCHASES_STORAGE_KEY = 'app-one/purchases';

type PurchasesStore = {
  owned: string[];
  buy: (productId: string) => void;
  /**
   * Restores earlier purchases. MOCKUP: purchases are only kept on this device,
   * so this reports what is unlocked. With real store purchases it will ask
   * Apple / Google for everything bought with the user's store account.
   */
  restore: () => Promise<{ restored: number }>;
  /** Demo helper to try the purchase flow again. */
  resetDemo: () => void;
};

export function sanitizeOwned(raw: unknown): string[] {
  const owned = (raw as { owned?: unknown } | null)?.owned;
  if (!Array.isArray(owned)) return [];
  return [...new Set(owned.filter((id): id is string => typeof id === 'string' && id.length > 0))];
}

export const usePurchases = create<PurchasesStore>()(
  persist(
    (set, get) => ({
      owned: [],
      buy: (productId) => {
        if (!get().owned.includes(productId)) set({ owned: [...get().owned, productId] });
      },
      restore: async () => ({ restored: get().owned.length }),
      resetDemo: () => set({ owned: [] }),
    }),
    {
      name: PURCHASES_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ owned }) => ({ owned }),
      migrate: (persisted) => ({ owned: sanitizeOwned(persisted) }),
      merge: (persisted, current) => ({ ...current, owned: sanitizeOwned(persisted) }),
    },
  ),
);

/** The set of owned product ids. */
export function useOwned(): ReadonlySet<string> {
  const owned = usePurchases((s) => s.owned);
  return useMemo(() => new Set(owned), [owned]);
}
