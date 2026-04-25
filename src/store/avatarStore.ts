import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AvatarStore {
  selectedIndex: number;
  selectAvatar: (index: number) => void;
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      selectedIndex: 0,
      selectAvatar: (index) => set({ selectedIndex: index }),
    }),
    {
      name: 'fitcounter-avatar',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
