import React from 'react';
import { usePomodoroStore, TimerMode } from '@/store/usePomodoroStore';
import { ConvertSecsToTimer, ConvertTimerToSecs } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

export function TimerSettingsSwitches() {
  const { mode, setMode, showProgressBar, setShowProgressBar } = usePomodoroStore();
  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="switch-focus-mode">Pomodoro Mode</FieldLabel>
          <FieldDescription>
            {mode === 'POMODORO' 
              ? "Cycles between work and breaks." 
              : "Continuous stopwatch tracking."}
          </FieldDescription>
        </FieldContent>
        <Switch
          id="switch-focus-mode"
          checked={mode === 'POMODORO'}
          onCheckedChange={(checked) => setMode(checked ? 'POMODORO' : 'STOPWATCH')}
        />
      </Field>
      
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="switch-progress-bar">Show progress bar</FieldLabel>
          <FieldDescription>
            Display the daily goal progress bar below the timer.
          </FieldDescription>
        </FieldContent>
        <Switch
          id="switch-progress-bar"
          checked={showProgressBar}
          onCheckedChange={(checked) => setShowProgressBar(checked)}
        />
      </Field>
    </div>
  );
}

type Props = { child: React.ReactNode };

const ClockDialogBox = (props: Props) => {
  const { setDurations, workDuration, shortBreakDuration, longBreakDuration } = usePomodoroStore();

  const work = ConvertSecsToTimer({ workSecs: Math.floor(workDuration / 1000) });
  const shortBreak = ConvertSecsToTimer({ workSecs: Math.floor(shortBreakDuration / 1000) });
  const longBreak = ConvertSecsToTimer({ workSecs: Math.floor(longBreakDuration / 1000) });

  return (
    <>
      <Dialog>
        <DialogTrigger>
          <div>{props.child}</div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] lg:px-10 lg:py-14">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const formData = new FormData(e.currentTarget);
              
              const getMs = (prefix: string) => {
                const h = Number(formData.get(`${prefix}Hr`)) || 0;
                const m = Number(formData.get(`${prefix}Min`)) || 0;
                const s = Number(formData.get(`${prefix}Sec`)) || 0;
                return (h * 3600 + m * 60 + s) * 1000;
              };

              const newWork = getMs('work') || workDuration;
              const newShort = getMs('short') || shortBreakDuration;
              const newLong = getMs('long') || longBreakDuration;

              setDurations(newWork, newShort, newLong);
            }}
          >
            <DialogHeader>
              <DialogTitle>
                <h1 className="text-2xl font-bold mb-4">Timer settings</h1>
              </DialogTitle>
              <TimerSettingsSwitches />
            </DialogHeader>
            <div className="grid gap-4 mt-4 max-h-[40vh] overflow-y-auto px-1">
              {/* Work Duration */}
              <div className="grid gap-3">
                <Label>Work Duration</Label>
                <div className="flex items-center gap-2">
                  <Input name="workHr" placeholder="hh" type="number" min={0} defaultValue={work.hours} />
                  <span>:</span>
                  <Input name="workMin" placeholder="mm" type="number" min={0} max={59} defaultValue={work.minutes} />
                  <span>:</span>
                  <Input name="workSec" placeholder="ss" type="number" min={0} max={59} defaultValue={work.seconds} />
                </div>
              </div>
              
              {/* Short Break */}
              <div className="grid gap-3">
                <Label>Short Break</Label>
                <div className="flex items-center gap-2">
                  <Input name="shortHr" placeholder="hh" type="number" min={0} defaultValue={shortBreak.hours} />
                  <span>:</span>
                  <Input name="shortMin" placeholder="mm" type="number" min={0} max={59} defaultValue={shortBreak.minutes} />
                  <span>:</span>
                  <Input name="shortSec" placeholder="ss" type="number" min={0} max={59} defaultValue={shortBreak.seconds} />
                </div>
              </div>

              {/* Long Break */}
              <div className="grid gap-3">
                <Label>Long Break</Label>
                <div className="flex items-center gap-2">
                  <Input name="longHr" placeholder="hh" type="number" min={0} defaultValue={longBreak.hours} />
                  <span>:</span>
                  <Input name="longMin" placeholder="mm" type="number" min={0} max={59} defaultValue={longBreak.minutes} />
                  <span>:</span>
                  <Input name="longSec" placeholder="ss" type="number" min={0} max={59} defaultValue={longBreak.seconds} />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ClockDialogBox;
