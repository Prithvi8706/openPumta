'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubjectTimerStore } from '@/store/useSubjectStore';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { useTimerEngine } from '@/hooks/useTimerEngine';
import ClockCircle from '../components/pomodoro/ClockCircle';
import { ConvertSecsToTimer, pad } from '@/lib/utils';
import { IoIosPause, IoIosPlay, IoIosRefresh, IoIosSkipForward, IoIosArrowBack } from 'react-icons/io';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubjects, useSubjectTimer } from '@/hooks/useSubjects';
import { useAuthStore } from '@/store/useAuthStore';

function PomodoroPage() {
  const { data: Subjects = [], isLoading } = useSubjects();
  const { timerRunningSubjectId } = useSubjectTimerStore();
  const { startTimer, endTimer } = useSubjectTimer();
  const store = usePomodoroStore();
  const { remainingMs, elapsedMs, progress, phase, mode, status } = useTimerEngine();
  const router = useRouter();

  const runningSubject = Subjects.find((subject) => subject.id === timerRunningSubjectId);

  // Sync Timer Engine status with Backend Logging
  const handleToggleTimer = async () => {
    if (status === 'RUNNING') {
      store.pause();
      // If we are in WORK phase, pause() transitions to BREAK automatically and stays RUNNING
      // But we still need to end the subject timer if it was running
      if (timerRunningSubjectId && phase === 'WORK') {
         await endTimer.mutateAsync(timerRunningSubjectId);
      }
    } else {
      if (!timerRunningSubjectId) {
        store.resume();
      } else {
        await startTimer.mutateAsync(timerRunningSubjectId);
        store.resume();
      }
    }
  };

  const handleReset = () => {
    store.reset();
  };

  const handleSkip = () => {
    // Pass progress (0.0 to 1.0) for threshold check
    store.completePhase(progress / 100);
  };

  const handleBack = async () => {
    if (status === 'RUNNING' && timerRunningSubjectId && phase === 'WORK') {
      await endTimer.mutateAsync(timerRunningSubjectId);
    }
    // We don't pause the engine here, just navigate back
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <span className="text-2xl font-semibold">Loading timer...</span>
      </div>
    );
  }

  // Formatting for display
  const displayTime = ConvertSecsToTimer({ workSecs: Math.floor(remainingMs / 1000) });
  
  // Daily Goal Calculation
  let totalWorkedSecs = 0;
  let goalWorkSecs = 0;
  if (runningSubject) {
    const pastLogsDuration = runningSubject.subjectLogs?.reduce((acc, log) => acc + (log.duration || 0), 0) || 0;
    totalWorkedSecs = pastLogsDuration + (phase === 'WORK' ? Math.floor(elapsedMs / 1000) : 0);
    goalWorkSecs = runningSubject.goalWorkSecs || 0;
  }
  const goalProgressPercent = goalWorkSecs ? Math.min(100, (totalWorkedSecs / goalWorkSecs) * 100) : 0;

  // Phase Specifics
  const getPhaseColor = () => {
    if (mode === 'STOPWATCH') return 'var(--primary)';
    switch (phase) {
      case 'WORK': return 'var(--primary)';
      case 'SHORT_BREAK':
      case 'LONG_BREAK': return '#22c55e'; // Green
      default: return 'var(--primary)';
    }
  };

  const getPhaseLabel = () => {
    if (mode === 'STOPWATCH') return 'DEEP WORK';
    switch (phase) {
      case 'WORK': return 'WORK PHASE';
      case 'SHORT_BREAK': return 'SHORT BREAK';
      case 'LONG_BREAK': return 'LONG BREAK';
      default: return 'IDLE';
    }
  };

  return (
    <section className="flex flex-col justify-center items-center h-screen w-screen gap-0 relative">
      <Button 
        onClick={handleBack} 
        variant="ghost" 
        className="absolute top-8 left-8 rounded-full h-12 w-12 p-0"
      >
        <IoIosArrowBack size={24} />
      </Button>

      {runningSubject && <h1 className="text-5xl font-bold mb-4">{runningSubject.name}</h1>}
      
      <ClockCircle percent={progress} size="lg" color={getPhaseColor()}>
        <div className="flex flex-col items-center">
          <div className="text-7xl font-bold text-primary mb-2">
            {pad(displayTime.hours)}:{pad(displayTime.minutes)}:{pad(displayTime.seconds)}
          </div>
          <div className="text-2xl font-semibold text-muted-foreground uppercase tracking-widest">
            {getPhaseLabel()}
          </div>
          <div className="text-lg font-medium text-muted-foreground/60 mt-1">
            {mode === 'POMODORO' ? `Completed: ${store.completedPomodoros}` : `Session: ${pad(Math.floor(elapsedMs / 3600))}:${pad(Math.floor((elapsedMs % 3600000) / 60000))}`}
          </div>
        </div>
      </ClockCircle>

      {runningSubject && store.showProgressBar && (
        <div className="w-1/2 mb-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={goalProgressPercent} className="h-4" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold text-lg">
                Daily Goal: {pad(Math.floor(goalWorkSecs / 3600))}:{pad(Math.floor((goalWorkSecs % 3600) / 60))}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex items-center gap-8">
        {/* Hide Reset in Work phase */}
        {phase !== 'WORK' && (
          <Button onClick={handleReset} variant="outline" className="rounded-full w-14 h-14">
            <IoIosRefresh size={24} />
          </Button>
        )}

        <Button 
          onClick={handleToggleTimer} 
          variant="secondary" 
          className="rounded-full w-24 h-24 shadow-lg hover:scale-105 transition-all"
        >
          {status === 'RUNNING' && phase === 'WORK' ? <IoIosPause size={48} /> : (status === 'RUNNING' ? <IoIosPause size={48} /> : <IoIosPlay size={48} />)}
        </Button>

        {/* Hide Skip in Work phase, or show only in Break */}
        {mode === 'POMODORO' && phase !== 'WORK' && (
          <Button onClick={handleSkip} variant="outline" className="rounded-full w-14 h-14">
            <IoIosSkipForward size={24} />
          </Button>
        )}
      </div>
    </section>
  );
}

export default PomodoroPage;
