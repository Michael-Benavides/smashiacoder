import { create } from 'zustand'

export const useSidebarStore = create((set) => ({
  mobileOpen: false,
  setMobileOpen: (val) => set({ mobileOpen: val }),
  toggle: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}))
