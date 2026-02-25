import { create } from 'zustand';

type Tab = 'create' | 'list';

interface DashboardState {
  activeTab: Tab;
  currentInput: string;
  selectedColor: string;
  successFlash: boolean;
  lastAddedOrder: number | null;
  lastAddedOrderColor: string | null;
  setActiveTab: (tab: Tab) => void;
  appendDigit: (digit: string) => void;
  clearInput: () => void;
  setInput: (input: string) => void;
  setSelectedColor: (color: string) => void;
  showSuccess: (orderNumber?: number, color?: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'create',
  currentInput: '',
  selectedColor: 'Normal',
  successFlash: false,
  lastAddedOrder: null,
  lastAddedOrderColor: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  appendDigit: (digit) =>
    set((state) => {
      if (state.currentInput.length >= 4) return state;
      return { currentInput: state.currentInput + digit };
    }),

  clearInput: () => set({ currentInput: '' }),
  
  setInput: (input) => set({ currentInput: input }),

  setSelectedColor: (color) => set({ selectedColor: color }),

  showSuccess: (orderNumber, color) => {
    set({ 
      successFlash: true, 
      lastAddedOrder: orderNumber || null,
      lastAddedOrderColor: color || null
    });
    setTimeout(() => set({ 
      successFlash: false, 
      lastAddedOrder: null,
      lastAddedOrderColor: null
    }), 1200);
  },
}));
