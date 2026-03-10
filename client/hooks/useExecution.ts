import { Languages } from "@/generated/prisma/enums";
import { create } from "zustand";

type ExecutionStore = {
  code: string;
  language: string;
  input: string;
  output: string;
  isRunning: boolean;
  setCode: (code: string) => void;
  setLanguage: (language: Languages) => void;
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setIsRunning: (isRunning: boolean) => void;
  clearOutput: () => void;
};

export const useExecution = create<ExecutionStore>((set) => ({
  code: "",
  language: "javascript",
  input: "",
  output: "Your console output will appear here...",
  isRunning: false,
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setInput: (input) => set({ input }),
  setOutput: (output) => set({ output }),
  setIsRunning: (isRunning) => set({ isRunning }),
  clearOutput: () => set({ output: "" }),
}));
