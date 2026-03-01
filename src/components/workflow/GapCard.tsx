import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { GapSlot, formatDuration, timeToSeconds, secondsToTime } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Subtask } from "@/store/slices/workFlow";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitActivity, ActivityPayload } from "@/store/slices/workFlow"
import { date } from 'zod';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';



interface Props {
  gap: GapSlot;
  isExpanded: boolean;
  onToggle: () => void;
  kbRange: [number, number];
  setKbRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  mouseRange: [number, number];
  setMouseRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  subtasks: Subtask[];
  date: string;
}

interface SplitRow {
  num: number;
  start: string;
  end: string;
}

// ─── HH MM SS Input ──────────────────────────────────────────────────────────

interface TimePartInputProps {
  label: string;
  valueSecs: number;         // absolute seconds from midnight
  minSecs: number;
  maxSecs: number;
  otherSecs: number;
  mustBeGreaterThan: boolean;
  onChange: (newSecs: number) => void;
}

const TimePartInput: React.FC<TimePartInputProps> = ({
  label, valueSecs, minSecs, maxSecs, otherSecs, mustBeGreaterThan, onChange,
}) => {
  const toFields = (secs: number) => ({
    hh: String(Math.floor(secs / 3600)).padStart(2, '0'),
    mm: String(Math.floor((secs % 3600) / 60)).padStart(2, '0'),
    ss: String(secs % 60).padStart(2, '0'),
  });

  const [hh, setHh] = useState(toFields(valueSecs).hh);
  const [mm, setMm] = useState(toFields(valueSecs).mm);
  const [ss, setSs] = useState(toFields(valueSecs).ss);
  const [errors, setErrors] = useState<{ hh?: string; mm?: string; ss?: string }>({});

  // Sync state if the parent forces a new value (e.g., when a different gap is clicked)
  useEffect(() => {
    const f = toFields(valueSecs);
    setHh(f.hh); setMm(f.mm); setSs(f.ss);
    setErrors({});
  }, [valueSecs]);

  const validateAndSave = (newHh: string, newMm: string, newSs: string) => {
    const h = parseInt(newHh, 10);
    const m = parseInt(newMm, 10);
    const s = parseInt(newSs, 10);
    const errs: { hh?: string; mm?: string; ss?: string } = {};

    // 1. Basic format validation (always enforced)
    if (isNaN(h) || h < 0 || h > 23) errs.hh = '0-23';
    if (isNaN(m) || m < 0 || m > 59) errs.mm = '0-59';
    if (isNaN(s) || s < 0 || s > 59) errs.ss = '0-59';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const total = h * 3600 + m * 60 + s;

    // 2. Logic Validation (Start < End and Gap Range)
    // IMPORTANT: We do NOT snap back here. We just set the error.
    if (total < minSecs || total > maxSecs) {
      setErrors({ hh: 'out of range' });
      return;
    }

    if (mustBeGreaterThan && total <= otherSecs) {
      setErrors({ mm: '> start' });
      return;
    }

    if (!mustBeGreaterThan && total >= otherSecs) {
      setErrors({ mm: '< end' });
      return;
    }

    // 3. Success: clear errors and tell parent
    setErrors({});
    onChange(total);
  };

  const fieldCls = (err?: string) =>
    cn(
      'w-12 text-center tabular-nums text-sm bg-background border rounded px-1 py-1.5 focus:outline-none focus:ring-2 transition-all',
      err
        ? 'border-destructive ring-destructive/20 text-destructive'
        : 'border-input text-foreground focus:ring-primary/20 focus:border-primary'
    );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/30 border border-transparent">
        <div className="flex flex-col items-center">
          <input
            className={fieldCls(errors.hh)}
            value={hh}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              setHh(val);
              validateAndSave(val, mm, ss); // Try to save as they type
            }}
            onBlur={() => {
              // Pad with zero on blur for cleanliness
              const padded = hh.padStart(2, '0');
              setHh(padded);
              validateAndSave(padded, mm, ss);
            }}
          />
        </div>

        <span className="text-muted-foreground/50 text-xs font-medium">:</span>

        <div className="flex flex-col items-center">
          <input
            className={fieldCls(errors.mm || errors.hh === 'out of range' ? 'err' : undefined)}
            value={mm}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              setMm(val);
              validateAndSave(hh, val, ss);
            }}
            onBlur={() => {
              const padded = mm.padStart(2, '0');
              setMm(padded);
              validateAndSave(hh, padded, ss);
            }}
          />
        </div>

        <span className="text-muted-foreground/50 text-xs font-medium">:</span>

        <div className="flex flex-col items-center">
          <input
            className={fieldCls(errors.ss)}
            value={ss}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              setSs(val);
              validateAndSave(hh, mm, val);
            }}
            onBlur={() => {
              const padded = ss.padStart(2, '0');
              setSs(padded);
              validateAndSave(hh, mm, padded);
            }}
          />
        </div>
      </div>

      {/* Show detailed error message below the inputs */}
      <div className="h-3">
        {Object.values(errors).map((err, i) => (
          <span key={i} className="text-[10px] text-destructive font-medium block leading-none animate-in fade-in slide-in-from-top-1">
            {err === 'out of range' ? `Must be between ${toFields(minSecs).hh}:${toFields(minSecs).mm} and ${toFields(maxSecs).hh}:${toFields(maxSecs).mm}` : err}
          </span>
        ))}
      </div>
    </div>
  );
};
// ─── GapCard ─────────────────────────────────────────────────────────────────

const GapCard: React.FC<Props> = ({ gap, isExpanded, onToggle, kbRange, setKbRange, mouseRange, setMouseRange, subtasks, date }) => {
  const screenshots = window.electronAPI.getScreenshots('screenshots'); // relative to project root
  // ["C:/project/screenshots/shot1.png", ...]
  const gapStartSecs = timeToSeconds(gap.startTime);
  const gapEndSecs = timeToSeconds(gap.endTime);
  const gapTotalSecs = gapEndSecs - gapStartSecs;
  const dispatch = useAppDispatch()
  const [startSecs, setStartSecs] = useState(gapStartSecs);
  const [endSecs, setEndSecs] = useState(gapEndSecs);
  // Inside your component
  const [splitStatuses, setSplitStatuses] = useState<Record<number, 'pending' | 'loading' | 'success' | 'error'>>({});
  const [currentSubmitCount, setCurrentSubmitCount] = useState(0);
  const { activityPeriod, taskActivities } = useAppSelector(
    (state) => state.workFlow
  )
  const handleTimeChange = (newSecs: number, type: 'start' | 'end') => {
    if (type === 'start') {
      // Only block if Start tries to go past the actual End selection
      if (newSecs < endSecs) {
        setStartSecs(newSecs);
      }
    } else {
      // Only block if End tries to go before the Start selection
      if (newSecs > startSecs) {
        setEndSecs(newSecs);
      }
    }
  };
  const [intervalMins, setIntervalMins] = useState<number | "">("")

  useEffect(() => {
    if (activityPeriod !== null && activityPeriod !== undefined) {
      setIntervalMins(Math.floor(activityPeriod / 60))
    }
  }, [activityPeriod])

  const intervalSecs =
    typeof intervalMins === "number" ? intervalMins * 60 : 0;
  const [subtask, setSubtask] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | "">("");

  const selectedDurationSecs = endSecs - startSecs;

  const hours = Math.floor(selectedDurationSecs / 3600);
  const minutes = Math.floor((selectedDurationSecs % 3600) / 60);
  const seconds = selectedDurationSecs % 60;
  const selectedDurationMins = Math.floor(selectedDurationSecs / 60);


  const splits: SplitRow[] = useMemo(() => {
    if (selectedDurationSecs <= 0 || intervalSecs <= 0) return [];
    const rows: SplitRow[] = [];
    let current = startSecs;
    let num = 1;

    // First split: same start and end
    rows.push({ num, start: secondsToTime(startSecs), end: secondsToTime(startSecs) });
    num++;

    while (current < endSecs) {
      const splitEnd = Math.min(current + intervalSecs, endSecs);
      rows.push({ num, start: secondsToTime(current), end: secondsToTime(splitEnd) });
      current = splitEnd;
      num++;
    }
    return rows;
  }, [startSecs, endSecs, intervalSecs]);

  const totalScreenshots = screenshots.length;
  const screenshotMatch = totalScreenshots >= splits.length;

  const canSubmit = selectedSubtaskId && splits.length > 0 && screenshotMatch && selectedDurationSecs > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitResult('success');
    setSubmitting(false);
  };

  const convertToIST = (hhmmss: string, date: string) => {
    // 'date' like '2026-02-20'
    const [h, m, s] = hhmmss.split(":").map(Number);

    // Create a Date object in local time
    const dt = new Date(date);
    dt.setHours(h, m, s, 0); // set milliseconds to 0

    const pad = (n: number) => n.toString().padStart(2, "0");

    // Just format as YYYY-MM-DDTHH:MM:SS+05:30 without changing the time
    const istStr = `${pad(dt.getFullYear())}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}+05:30`;

    return istStr;
  };

  const submitGeneratedActivities = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    setCurrentSubmitCount(0);

    // Initialize all visible splits as pending
    const initialStatuses: Record<number, 'pending' | 'loading' | 'success' | 'error'> = {};
    splits.forEach(s => initialStatuses[s.num] = 'pending');
    setSplitStatuses(initialStatuses);
    let hasError = false;
    try {
      if (!taskActivities?.length) {
        throw new Error("No task activities found");
      }

      // 1️⃣ Find matched task activity
      const matched = taskActivities.find(
        (t) => t.sub_task_id === Number(selectedSubtaskId)
      );

      if (!matched) {
        throw new Error("Selected subtask not found");
      }

      const taskActivityId = matched.id;
      const workDiaryId = matched.work_diary_id;

      // 2️⃣ Helpers
      const toSeconds = (time: string) => {
        const [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      };

      const toHHMMSS = (secs: number) => {
        const h = String(Math.floor(secs / 3600)).padStart(2, "0");
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
      };

      if (!screenshots || screenshots.length < splits.length) {
        throw new Error("Not enough screenshots for generated splits");
      }

      // 4️⃣ Shuffle screenshots
      const shuffledImages = [...screenshots].sort(() => 0.5 - Math.random());

      for (let i = 0; i < splits.length; i++) {
        const split = splits[i];

        // Mark current row as loading
        setSplitStatuses(prev => ({ ...prev, [split.num]: 'loading' }));
        setCurrentSubmitCount(i + 1);

        try {
          const keyboard = Math.floor(Math.random() * (kbRange[1] - kbRange[0] + 1)) + kbRange[0];
          const mouse = Math.floor(Math.random() * (mouseRange[1] - mouseRange[0] + 1)) + mouseRange[0];

          const payload = {
            work_diary_id: workDiaryId,
            task_activity_id: taskActivityId,
            keyboard_action: keyboard,
            mouse_action: mouse,
            start_time: convertToIST(split.start, date),
            end_time: convertToIST(split.end, date)
          };

          const formData = new FormData();
          formData.append("data", JSON.stringify(payload));

          const fileBuffer = window.electronAPI.readFileAsBuffer(shuffledImages[i].fullPath);
          formData.append("image", new Blob([fileBuffer]), shuffledImages[i].name);

          // Dispatch and wait
          await dispatch(submitActivity(formData)).unwrap();

          // Mark as success
          setSplitStatuses(prev => ({ ...prev, [split.num]: 'success' }));
        } catch (err) {
          // Mark as error
          hasError = true;
          setSplitStatuses(prev => ({ ...prev, [split.num]: 'error' }));
          console.error(`Split ${split.num} failed:`, err);
          // If you want to stop the whole process on one error, throw here
        }
      }

      // 4️⃣ Only log success and set state if NO errors occurred
      if (!hasError) {
        setSubmitResult('success');
        console.log("All activities submitted successfully");
        // setTimeout(() => {
        //   window.location.reload();
        // }, 1500);
      } else {
        setSubmitResult('error');
        console.error("Some activities failed to submit.");
      }
    } catch (error: any) {
      setSubmitResult('error');
      console.error("Submission failed:", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-sidebar-border/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/10">
            <Clock className="h-3 w-3 text-warning" />
          </div>
          <div>
            <div className='flex  gap-4'>
              <p className="text-sm font-medium text-foreground">Available Time Slot</p>
              <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {formatDuration(gap.startTime, gap.endTime)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {gap.startTime} → {gap.endTime}
            </p>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-sidebar-border p-4 ">

              {/* Time Selection */}
              <section className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Time Selection
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary tabular-nums">
                      {hours > 0 && `${hours}h `}
                      {minutes}m {seconds}s
                    </span>
                  </div>
                </div>
                <div className="flex justify-center items-start gap-10">
                  <TimePartInput
                    label="Start Time"
                    valueSecs={startSecs}
                    minSecs={gapStartSecs}
                    maxSecs={gapEndSecs - 1}
                    otherSecs={endSecs}
                    mustBeGreaterThan={false}
                    onChange={setStartSecs}
                  />
                  <TimePartInput
                    label="End Time"
                    valueSecs={endSecs}
                    minSecs={gapStartSecs + 1}
                    maxSecs={gapEndSecs}
                    otherSecs={startSecs}
                    mustBeGreaterThan={true}
                    onChange={setEndSecs}
                  />
                </div>
              </section>

              {/* Interval + Subtask */}
              <section className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interval (min)</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={Math.ceil(gapTotalSecs / 60)}
                      value={intervalMins}
                      onChange={(e) => {
                        const value = e.target.value

                        // Allow clearing
                        if (value === "") {
                          setIntervalMins("")
                          return
                        }

                        const parsed = parseInt(value)
                        const max = Math.ceil(gapTotalSecs / 60)

                        // Invalid cases → reset to empty (show Required)
                        if (isNaN(parsed) || parsed < 1 || parsed > max) {
                          setIntervalMins("")
                          return
                        }

                        // Valid number
                        setIntervalMins(parsed)
                      }}
                      className="w-20 h-8 text-sm"
                    />

                    <span className="text-xs text-muted-foreground">{splits.length} splits</span>
                  </div>
                  {intervalMins === "" && (
                    <p className="text-[10px] text-destructive">Required</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtask</h4>
                  <Select value={selectedSubtaskId} onValueChange={setSelectedSubtaskId}>
                    <SelectTrigger className="bg-card h-8 text-sm">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {subtasks.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedSubtaskId && <p className="text-[10px] text-destructive">Required</p>}
                </div>
              </section>

              {/* Activity Ranges */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Ranges</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Keyboard</label>
                      <span className="text-xs font-medium text-foreground tabular-nums">{kbRange[0]} – {kbRange[1]}</span>
                    </div>
                    <Slider min={0} max={5000} step={10} value={kbRange}
                      onValueChange={(v) => setKbRange([v[0], v[1]])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>5000</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Mouse</label>
                      <span className="text-xs font-medium text-foreground tabular-nums">{mouseRange[0]} – {mouseRange[1]}</span>
                    </div>
                    <Slider min={0} max={5000} step={10} value={mouseRange}
                      onValueChange={(v) => setMouseRange([v[0], v[1]])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>5000</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Split Preview */}
              {splits.length > 0 && (
                <section className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split Preview</h4>
                  <div className="max-h-40 overflow-auto no-scrollbar rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-border bg-muted/60 backdrop-blur-md">
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">#</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Start</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">End</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((s) => (
                          <tr key={s.num} className="border-b border-border last:border-0">
                            <td className="px-3 py-1 text-muted-foreground">{s.num}</td>
                            <td className="px-3 py-1 font-medium text-foreground tabular-nums">{s.start}</td>
                            <td className="px-3 py-1 font-medium text-foreground tabular-nums">{s.end}</td>
                            <td className="px-3 py-1 flex justify-center">
                              {splitStatuses[s.num] === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                              {splitStatuses[s.num] === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {splitStatuses[s.num] === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                              {!splitStatuses[s.num] || splitStatuses[s.num] === 'pending' && <div className="h-4 w-4 rounded-full border border-muted" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Screenshot Status */}
              <section>
                <div className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                  screenshotMatch
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                )}>
                  {screenshotMatch ? (
                    <>✓ {totalScreenshots} screenshots · {splits.length} splits</>
                  ) : (
                    <><AlertCircle className="h-3.5 w-3.5 shrink-0" /> {totalScreenshots} available, {splits.length} needed</>
                  )}
                </div>
              </section>

              {/* Submit */}
              <section className="flex items-center gap-3">
                <Button size="sm" onClick={submitGeneratedActivities} disabled={!canSubmit || submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Submitting {currentSubmitCount}/{splits.length}
                    </span>
                  ) : 'Submit Activity'}
                </Button>
                {submitResult === 'success' && <span className="text-xs text-green-500 font-medium">All Activities Submitted!</span>}
                {submitResult === 'error' && <span className="text-xs text-destructive">Failed to submit activities.</span>}
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GapCard;
