import { useState, useEffect, useCallback } from 'react';
import { usePomodoroStore, PomodoroPhase } from '@/store/usePomodoroStore';

export function useTimerEngine() {
  const store = usePomodoroStore();
  const [elapsedMs, setElapsedMs] = useState(0);

  const getTargetDuration = useCallback(() => {
    switch (store.phase) {
      case 'WORK': return store.workDuration;
      case 'SHORT_BREAK': return store.shortBreakDuration;
      case 'LONG_BREAK': return store.longBreakDuration;
      default: return 0;
    }
  }, [store.phase, store.workDuration, store.shortBreakDuration, store.longBreakDuration]);

  // Update loop for UI
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (store.status === 'RUNNING') {
      // Immediate sync
      const sync = () => {
        const now = Date.now();
        const currentElapsed = store.accumulatedMs + (now - (store.startTimestamp || now));
        setElapsedMs(currentElapsed);

        // Pomodoro Auto-Transition Logic
        if (store.mode === 'POMODORO') {
          const target = getTargetDuration();
          if (currentElapsed >= target) {
            // Auto-transition always counts as 100% progress
            store.completePhase(1);
          }
        }
      };

      sync();
      interval = setInterval(sync, 100); // 100ms for smooth UI, math is deterministic
    } else {
      setElapsedMs(store.accumulatedMs);
    }

    return () => clearInterval(interval);
  }, [
    store.status, 
    store.mode, 
    store.phase, 
    store.startTimestamp, 
    store.accumulatedMs, 
    getTargetDuration, 
    store.completePhase
  ]);

  const progress = store.mode === 'POMODORO' 
    ? (elapsedMs / getTargetDuration()) * 100 
    : 0;

  const remainingMs = store.mode === 'POMODORO' 
    ? Math.max(0, getTargetDuration() - elapsedMs) 
    : elapsedMs; // In stopwatch mode, we show elapsed

  return {
    elapsedMs,
    remainingMs,
    progress,
    status: store.status,
    phase: store.phase,
    mode: store.mode,
    completedPomodoros: store.completedPomodoros
  };
}
