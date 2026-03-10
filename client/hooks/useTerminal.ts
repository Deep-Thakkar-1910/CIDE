import { create } from "zustand";

type TerminalStore = {
  terminalOpen: boolean;
  requestedMinSize: number | null;
  toggleTerminal: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  requestMinSize: (size: number) => void;
  clearMinSizeRequest: () => void;
};

export const useTerminal = create<TerminalStore>((set) => ({
  terminalOpen: false,
  requestedMinSize: null,
  toggleTerminal: () =>
    set(({ terminalOpen }) => ({ terminalOpen: !terminalOpen })),
  openTerminal: () => set({ terminalOpen: true }),
  closeTerminal: () => set({ terminalOpen: false }),
  requestMinSize: (size) => set({ requestedMinSize: size, terminalOpen: true }),
  clearMinSizeRequest: () => set({ requestedMinSize: null }),
}));
