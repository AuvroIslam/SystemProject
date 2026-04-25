import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearToken: () => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearToken: () => set({ accessToken: null }),
    }),
    {
      name: 'fitcounter-calendar',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
