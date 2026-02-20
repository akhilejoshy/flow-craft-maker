import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { GapSlot, formatDuration, timeToMinutes, minutesToTime, mockSubtasks } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  gap: GapSlot;
  isExpanded: boolean;
  onToggle: () => void;
}

interface SplitRow {
  num: number;
  start: string;
  end: string;
}

// ─── HH MM SS Input ──────────────────────────────────────────────────────────

interface TimePartInputProps {
  label: string;
  /** absolute minutes from midnight */
  valueMinutes: number;
  min: number; // absolute minutes
  max: number; // absolute minutes
  onChange: (newMinutes: number) => void;
  otherMinutes: number; // the other bound (for > / < validation)
  mustBeGreaterThan?: boolean; // if true, value must be > otherMinutes
}

const TimePartInput: React.FC<TimePartInputProps> = ({
  label,
  valueMinutes,
  min,
  max,
  onChange,
  otherMinutes,
  mustBeGreaterThan,
}) => {
  const totalSeconds = valueMinutes * 60;
  const [hh, setHh] = useState(String(Math.floor(totalSeconds / 3600)).padStart(2, '0'));
  const [mm, setMm] = useState(String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'));
  const [ss, setSs] = useState(String(totalSeconds % 60).padStart(2, '0'));
  const [errors, setErrors] = useState<{ hh?: string; mm?: string; ss?: string }>({});

  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);
  const ssRef = useRef<HTMLInputElement>(null);

  const commit = (newHh: string, newMm: string, newSs: string) => {
    const h = parseInt(newHh, 10);
    const m = parseInt(newMm, 10);
    const s = parseInt(newSs, 10);
    const errs: { hh?: string; mm?: string; ss?: string } = {};

    if (isNaN(h) || h < 0 || h > 23) errs.hh = '0-23';
    if (isNaN(m) || m < 0 || m > 59) errs.mm = '0-59';
    if (isNaN(s) || s < 0 || s > 59) errs.ss = '0-59';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const totalMins = h * 60 + m; // seconds ignored for minute-level logic
    if (totalMins < min || totalMins > max) {
      // revert
      const orig = valueMinutes * 60;
      setHh(String(Math.floor(orig / 3600)).padStart(2, '0'));
      setMm(String(Math.floor((orig % 3600) / 60)).padStart(2, '0'));
      setSs(String(orig % 60).padStart(2, '0'));
      setErrors({ hh: `${Math.floor(min / 60).toString().padStart(2, '0')}–${Math.floor(max / 60).toString().padStart(2, '0')}` });
      return;
    }
    if (mustBeGreaterThan && totalMins <= otherMinutes) {
      setErrors({ mm: '> start' });
      return;
    }
    if (!mustBeGreaterThan && totalMins >= otherMinutes) {
      setErrors({ mm: '< end' });
      return;
    }

    setHh(String(h).padStart(2, '0'));
    setMm(String(m).padStart(2, '0'));
    setSs(String(s).padStart(2, '0'));
    onChange(totalMins);
  };

  const fieldCls = (err?: string) =>
    cn(
      'w-12 text-center tabular-nums text-sm bg-background border rounded px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
      err ? 'border-destructive text-destructive' : 'border-input text-foreground'
    );

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center gap-0.5">
          <input
            ref={hhRef}
            className={fieldCls(errors.hh)}
            value={hh}
            maxLength={2}
            placeholder="HH"
            onChange={(e) => setHh(e.target.value)}
            onBlur={() => commit(hh, mm, ss)}
            onKeyDown={(e) => { if (e.key === 'Tab' || e.key === ':') { e.preventDefault(); mmRef.current?.focus(); } }}
          />
          {errors.hh && <span className="text-[9px] text-destructive leading-none">{errors.hh}</span>}
        </div>
        <span className="text-muted-foreground font-bold text-xs">:</span>
        <div className="flex flex-col items-center gap-0.5">
          <input
            ref={mmRef}
            className={fieldCls(errors.mm)}
            value={mm}
            maxLength={2}
            placeholder="MM"
            onChange={(e) => setMm(e.target.value)}
            onBlur={() => commit(hh, mm, ss)}
            onKeyDown={(e) => { if (e.key === 'Tab' || e.key === ':') { e.preventDefault(); ssRef.current?.focus(); } }}
          />
          {errors.mm && <span className="text-[9px] text-destructive leading-none">{errors.mm}</span>}
        </div>
        <span className="text-muted-foreground font-bold text-xs">:</span>
        <div className="flex flex-col items-center gap-0.5">
          <input
            ref={ssRef}
            className={fieldCls(errors.ss)}
            value={ss}
            maxLength={2}
            placeholder="SS"
            onChange={(e) => setSs(e.target.value)}
            onBlur={() => commit(hh, mm, ss)}
          />
          {errors.ss && <span className="text-[9px] text-destructive leading-none">{errors.ss}</span>}
        </div>
      </div>
    </div>
  );
};

// ─── GapCard ─────────────────────────────────────────────────────────────────

const GapCard: React.FC<Props> = ({ gap, isExpanded, onToggle }) => {
  const gapStartMins = timeToMinutes(gap.startTime);
  const gapEndMins = timeToMinutes(gap.endTime);
  const gapMinutes = gapEndMins - gapStartMins;

  const [startMins, setStartMins] = useState(gapStartMins);
  const [endMins, setEndMins] = useState(gapEndMins);
  const [interval, setInterval] = useState(10);
  const [subtask, setSubtask] = useState('');
  const [kbRange, setKbRange] = useState<[number, number]>([200, 800]);
  const [mouseRange, setMouseRange] = useState<[number, number]>([200, 800]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);

  const selectedDuration = endMins - startMins;

  const splits: SplitRow[] = useMemo(() => {
    if (selectedDuration <= 0 || interval <= 0) return [];
    const rows: SplitRow[] = [];
    const baseMin = startMins;
    const endMin = endMins;
    let current = baseMin;
    let num = 1;

    rows.push({ num, start: minutesToTime(baseMin), end: minutesToTime(baseMin) });
    num++;

    while (current < endMin) {
      const splitEnd = Math.min(current + interval, endMin);
      rows.push({ num, start: minutesToTime(current), end: minutesToTime(splitEnd) });
      current = splitEnd;
      num++;
    }
    return rows;
  }, [startMins, endMins, interval]);

  const totalScreenshots = 12;
  const screenshotMatch = totalScreenshots >= splits.length;
  const canSubmit = subtask && splits.length > 0 && screenshotMatch && selectedDuration > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitResult('success');
    setSubmitting(false);
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
            <p className="text-sm font-medium text-foreground">Available Time Slot</p>
            <p className="text-xs text-muted-foreground">
              {gap.startTime} → {gap.endTime} · {formatDuration(gap.startTime, gap.endTime)}
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
            <div className="space-y-4 border-t border-sidebar-border p-4">

              {/* Row 1: Time Selection */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Selection</h4>
                <div className="flex flex-wrap items-start gap-4">
                  <TimePartInput
                    label="Start Time"
                    valueMinutes={startMins}
                    min={gapStartMins}
                    max={gapEndMins - 1}
                    otherMinutes={endMins}
                    mustBeGreaterThan={false}
                    onChange={(m) => setStartMins(m)}
                  />
                  <TimePartInput
                    label="End Time"
                    valueMinutes={endMins}
                    min={gapStartMins + 1}
                    max={gapEndMins}
                    otherMinutes={startMins}
                    mustBeGreaterThan={true}
                    onChange={(m) => setEndMins(m)}
                  />
                  <div className="flex flex-col justify-end self-end pb-1">
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="text-sm font-semibold text-foreground">{selectedDuration}m</span>
                  </div>
                </div>
              </section>

              {/* Row 2: Interval + Subtask in one row */}
              <section className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interval (min)</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={gapMinutes}
                      value={interval}
                      onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">{splits.length} splits</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtask</h4>
                  <Select value={subtask} onValueChange={setSubtask}>
                    <SelectTrigger className="bg-card h-8 text-sm">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {mockSubtasks.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!subtask && <p className="text-[10px] text-destructive">Required</p>}
                </div>
              </section>

              {/* Row 3: Activity Ranges (0–5000, dual thumb) */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Ranges</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Keyboard</label>
                      <span className="text-xs font-medium text-foreground tabular-nums">{kbRange[0]} – {kbRange[1]}</span>
                    </div>
                    <Slider
                      min={0}
                      max={5000}
                      step={10}
                      value={kbRange}
                      onValueChange={(v) => setKbRange([v[0], v[1]])}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>5000</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Mouse</label>
                      <span className="text-xs font-medium text-foreground tabular-nums">{mouseRange[0]} – {mouseRange[1]}</span>
                    </div>
                    <Slider
                      min={0}
                      max={5000}
                      step={10}
                      value={mouseRange}
                      onValueChange={(v) => setMouseRange([v[0], v[1]])}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>5000</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Row 4: Split Preview */}
              {splits.length > 0 && (
                <section className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split Preview</h4>
                  <div className="max-h-40 overflow-auto rounded-lg border border-border scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 sticky top-0">
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">#</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Start</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">End</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((s) => (
                          <tr key={s.num} className="border-b border-border last:border-0">
                            <td className="px-3 py-1 text-muted-foreground">{s.num}</td>
                            <td className="px-3 py-1 font-medium text-foreground tabular-nums">{s.start}</td>
                            <td className="px-3 py-1 font-medium text-foreground tabular-nums">{s.end}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Row 5: Screenshot Status */}
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

              {/* Row 6: Submit */}
              <section className="flex items-center gap-3">
                <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? 'Submitting...' : 'Submit Activity'}
                </Button>
                {submitResult === 'success' && <span className="text-xs text-success">Submitted!</span>}
                {submitResult === 'error' && <span className="text-xs text-destructive">Failed. Try again.</span>}
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GapCard;
