import { create } from 'zustand';

interface AppState {
  darkMode: boolean;
  sidebarOpen: boolean;
  currentPage: string;
  setDarkMode: (darkMode: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  darkMode: false,
  sidebarOpen: true,
  currentPage: 'dashboard',

  setDarkMode: (darkMode: boolean) => {
    set({ darkMode });
    // Update document class for dark mode
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  },

  setSidebarOpen: (sidebarOpen: boolean) => {
    set({ sidebarOpen });
  },

  setCurrentPage: (currentPage: string) => {
    set({ currentPage });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    set({ darkMode: newDarkMode });
    // Update document class for dark mode
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newDarkMode);
    }
  },
}));
