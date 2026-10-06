// Shop Management by Nexoryos — Zustand client store
// Holds: session info, current view, language, offline entry queue, toasts.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from './i18n';

export type View =
  | 'intro'
  | 'login'
  | 'owner_today'
  | 'owner_customers'
  | 'owner_khata'
  | 'owner_payments'
  | 'owner_dashboard'
  | 'owner_settings'
  | 'owner_reports'
  | 'owner_customer_detail'
  | 'cust_home'
  | 'cust_khata'
  | 'cust_pay'
  | 'cust_vacation'
  | 'cust_notifications';

interface Session {
  role: 'owner' | 'staff' | 'customer';
  name: string;
  bid: string;
  uid?: string;
  cid?: string;
  phone: string;
}

interface Toast {
  id: string;
  text: string;
  undo?: () => void;
  duration?: number;
}

interface OfflineEntry {
  clientUuid: string;
  customerId: string;
  shift: 'morning' | 'evening';
  qtyLiters: number;
  product: string;
  ratePerUnit?: number;
  date?: string;
  offline: true;
  ts: number;
}

interface AppState {
  // session
  session: Session | null;
  setSession: (s: Session | null) => void;
  clearSession: () => void;

  // view
  view: View;
  setView: (v: View) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedMonth: string | null;
  setSelectedMonth: (m: string | null) => void;

  // language (persisted)
  lang: Lang;
  setLang: (l: Lang) => void;

  // offline queue (persisted to IndexedDB-like via localStorage)
  offlineQueue: OfflineEntry[];
  enqueueEntry: (e: OfflineEntry) => void;
  dequeueEntry: (uuid: string) => void;
  clearQueue: () => void;

  // online status
  online: boolean;
  setOnline: (b: boolean) => void;

  // toasts
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // intro skip flag (per session — intro always shows on cold open)
  introSkippedThisSession: boolean;
  markIntroSkipped: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (s) => set({ session: s }),
      clearSession: () => set({ session: null, view: 'intro', selectedCustomerId: null, selectedMonth: null }),

      view: 'intro',
      setView: (v) => set({ view: v }),
      selectedCustomerId: null,
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      selectedMonth: null,
      setSelectedMonth: (m) => set({ selectedMonth: m }),

      lang: 'gu',
      setLang: (l) => set({ lang: l }),

      offlineQueue: [],
      enqueueEntry: (e) => set((s) => ({ offlineQueue: [...s.offlineQueue, e] })),
      dequeueEntry: (uuid) => set((s) => ({ offlineQueue: s.offlineQueue.filter(q => q.clientUuid !== uuid) })),
      clearQueue: () => set({ offlineQueue: [] }),

      online: true,
      setOnline: (b) => set({ online: b }),

      toasts: [],
      pushToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        const dur = t.duration ?? 5000;
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) }));
        }, dur);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

      introSkippedThisSession: false,
      markIntroSkipped: () => set({ introSkippedThisSession: true }),
    }),
    {
      name: 'shopm-state',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as any))),
      // Don't persist session (auth via cookie) and toasts; persist lang + offline queue + intro flag
      partialize: (s) => ({
        lang: s.lang,
        offlineQueue: s.offlineQueue,
        view: s.session ? s.view : 'intro',
      }),
    }
  )
);
