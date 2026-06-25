import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

// ═══════════════════════════════════════
// AUTH STORE
// ═══════════════════════════════════════
export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await authApi.login({ email, password });
        localStorage.setItem('access_token',  res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        set({ user: res.data, token: res.accessToken, isAuthenticated: true });
        return res;
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

// ═══════════════════════════════════════
// UI STORE (sidebar, theme, notifications)
// ═══════════════════════════════════════
export const useUIStore = create((set) => ({
  sidebarOpen:    true,
  currentPage:    'dashboard',
  notifications:  [],

  toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPage:        (page) => set({ currentPage: page }),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications].slice(0, 20) })),
  clearNotifications: () => set({ notifications: [] }),
}));

// ═══════════════════════════════════════
// TICKET STORE
// ═══════════════════════════════════════
export const useTicketStore = create((set) => ({
  tickets:      [],
  activeTicket: null,
  filters:      { status: '', priority: '', search: '' },
  isLoading:    false,
  error:        null,
  meta:         { total: 0, page: 1, pages: 1 },

  setTickets:     (tickets, meta) => set({ tickets, meta }),
  setActive:      (t)  => set({ activeTicket: t }),
  setFilters:     (f)  => set((s) => ({ filters: { ...s.filters, ...f } })),
  setLoading:     (v)  => set({ isLoading: v }),
  setError:       (e)  => set({ error: e }),

  updateTicket: (id, data) => set((s) => ({
    tickets: s.tickets.map((t) => t.id === id ? { ...t, ...data } : t),
    activeTicket: s.activeTicket?.id === id ? { ...s.activeTicket, ...data } : s.activeTicket,
  })),

  addTicket: (ticket) => set((s) => ({
    tickets: [ticket, ...s.tickets],
    meta: { ...s.meta, total: s.meta.total + 1 },
  })),
}));
