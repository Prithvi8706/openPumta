import React from 'react';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { ConvertSecsToTimer, ConvertTimerToSecs } from '@/lib/utils';
import ClockCircle from '../pomodoro/ClockCircle';
import ClockTime from '../pomodoro/ClockTime';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClockDialogBox from '../ClockDialogBox';

function Clock() {
  const { pomodoroTimer } = usePomodoroStore();

  const {
    hours: workHours,
    minutes: workMinutes,
    seconds: workSeconds,
  } = ConvertSecsToTimer({ workSecs: pomodoroTimer, goalWorkSecs: pomodoroTimer });

  return (
    <section className="flex justify-center items-center">
      <ClockDialogBox
        child={
          <div className="relative flex justify-center items-center">
            <ClockCircle percent={100} size={'sm'} />
            <div className="absolute">
              <ClockTime
                hours={workHours}
                minutes={workMinutes}
                seconds={workSeconds}
                color={'#fff'}
              />
            </div>
          </div>
        }
      />
    </section>
  );
}

export default Clock;
