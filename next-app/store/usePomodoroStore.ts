import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TimerMode = 'POMODORO' | 'STOPWATCH';
export type PomodoroPhase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK' | 'IDLE';
export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

interface PomodoroState {
  // Config
  mode: TimerMode;
  showProgressBar: boolean;
  workDuration: number;       // in ms
  shortBreakDuration: number; // in ms
  longBreakDuration: number;  // in ms
  longBreakInterval: number;  // e.g., 4 pomodoros before long break
  
  // State Machine
  status: TimerStatus;
  phase: PomodoroPhase;
  completedPomodoros: number;
  
  // Timestamp Anchor Points (For drift-free calculation)
  startTimestamp: number | null; 
  accumulatedMs: number;
  
  // Actions
  setMode: (mode: TimerMode) => void;
  setShowProgressBar: (show: boolean) => void;
  setDurations: (work: number, shortBreak: number, longBreak: number) => void;
  
  // Engine Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  completePhase: (progress?: number) => void; // progress from 0 to 1
  setPhase: (phase: PomodoroPhase) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      // Defaults
      mode: 'POMODORO',
      showProgressBar: true,
      workDuration: 25 * 60 * 1000,
      shortBreakDuration: 5 * 60 * 1000,
      longBreakDuration: 15 * 60 * 1000,
      longBreakInterval: 4,
      
      status: 'IDLE',
      phase: 'WORK',
      completedPomodoros: 0,
      
      startTimestamp: null,
      accumulatedMs: 0,

      // Config Modifiers
      setMode: (mode) => set({ mode, status: 'IDLE', accumulatedMs: 0, startTimestamp: null }),
      setShowProgressBar: (showProgressBar) => set({ showProgressBar }),
      setDurations: (work, shortBreak, longBreak) => 
        set({ workDuration: work, shortBreakDuration: shortBreak, longBreakDuration: longBreak }),

      // Engine
      start: () => set({ 
        status: 'RUNNING', 
        startTimestamp: Date.now(), 
        accumulatedMs: 0 
      }),
      
      pause: () => {
        const { startTimestamp, accumulatedMs, phase, mode } = get();
        
        // In Pomodoro mode, pausing WORK phase immediately starts a BREAK
        if (mode === 'POMODORO' && phase === 'WORK') {
          get().completePhase(0); // Pass 0 as it's an interruption, don't increment completed
          return;
        }

        if (startTimestamp) {
          set({
            status: 'PAUSED',
            accumulatedMs: accumulatedMs + (Date.now() - startTimestamp),
            startTimestamp: null
          });
        }
      },
      
      resume: () => set({ 
        status: 'RUNNING', 
        startTimestamp: Date.now() 
      }),
      
      reset: () => set({ 
        status: 'IDLE', 
        startTimestamp: null, 
        accumulatedMs: 0 
      }),

      setPhase: (phase) => set({
        phase,
        status: 'IDLE',
        startTimestamp: null,
        accumulatedMs: 0
      }),

      completePhase: (progress = 1) => {
        const { phase, completedPomodoros, longBreakInterval } = get();
        
        let nextCompleted = completedPomodoros;
        // Only increment if 95% complete
        if (phase === 'WORK' && progress >= 0.95) {
          nextCompleted += 1;
        }

        if (phase === 'WORK') {
          const nextPhase = nextCompleted % longBreakInterval === 0 && nextCompleted !== 0 ? 'LONG_BREAK' : 'SHORT_BREAK';
          set({
            phase: nextPhase,
            completedPomodoros: nextCompleted,
            status: 'RUNNING', // Automatically start the break
            startTimestamp: Date.now(),
            accumulatedMs: 0
          });
        } else {
          set({
            phase: 'WORK',
            status: 'RUNNING', // Automatically start the work
            startTimestamp: Date.now(),
            accumulatedMs: 0
          });
        }
      }
    }),
    {
      name: 'timer-engine-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
