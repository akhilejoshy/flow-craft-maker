import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { buildTimeline, getTotalWorkTime } from '@/data/mockData';
import ExistingBlockCard from '@/components/workflow/ExistingBlockCard';
import GapCard from '@/components/workflow/GapCard';
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDailyWorkflow, fetchActivityPeriod, fetchWorkDiaryDates } from "@/store/slices/workFlow"



const Dashboard: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const dispatch = useAppDispatch()



  const { workflow, subtasks, totalWorkTime, diaryDates } = useAppSelector((state) => state.workFlow);
  const timeline = buildTimeline(workflow);

  // const timeline = useMemo(() => buildTimeline(mockWorkflowBlocks), [date]);
  const totalWork = useMemo(() => getTotalWorkTime(workflow), [workflow]);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(date);
  const highlightedDates = diaryDates.map((d) => new Date(d));

  console.log(diaryDates)
  console.log(highlightedDates)


  const [kbRange, setKbRange] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("kbRange")
    return saved ? JSON.parse(saved) : [200, 800]
  })

  const [mouseRange, setMouseRange] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("mouseRange")
    return saved ? JSON.parse(saved) : [200, 800]
  })

  useEffect(() => {
    localStorage.setItem("kbRange", JSON.stringify(kbRange))
  }, [kbRange])

  useEffect(() => {
    localStorage.setItem("mouseRange", JSON.stringify(mouseRange))
  }, [mouseRange])

  useEffect(() => {
    const formattedDate = format(date, "yyyy-MM-dd");
    dispatch(fetchDailyWorkflow(formattedDate))
      .unwrap()
      .catch((err) => console.error(err));
    dispatch(fetchWorkDiaryDates())
      .unwrap()
      .catch((err) => console.error(err));
    dispatch(fetchActivityPeriod(formattedDate))
      .unwrap()
      .catch((err) => console.error(err));
  }, [dispatch, date]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
      {/* Compact toolbar */}
      <div className="mb-5 flex items-center justify-between gap-4 flex-nowrap">
        {/* Date Picker */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-auto justify-start text-left font-normal border-border bg-card text-foreground',
                'hover:bg-accent/10 transition-colors'
              )}
              onClick={() => setDatePopoverOpen(true)}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">{format(date, 'EEE, MMM d yyyy')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
            <Calendar
              mode="single"
              selected={date}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  setVisibleMonth(d);
                  setExpandedGap(null);
                  setDatePopoverOpen(false);
                }
              }}
              modifiers={{
                hasEntry: (day) => {
                  const formatted = format(day, "yyyy-MM-dd");
                  return diaryDates.includes(formatted);
                },
              }}
              modifiersClassNames={{
                hasEntry: "rdp-day_hasEntry",
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Total Work Time pill */}
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 self-start sm:self-auto">
          <Clock className="h-4 w-4 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">Total Work</span>
            <span className="text-sm font-semibold text-primary">{totalWorkTime}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {timeline.map((item) =>
          item.type === 'existing' ? (
            <ExistingBlockCard key={item.id} block={item} />
          ) : (
            <GapCard
              key={item.id}
              gap={item}
              isExpanded={expandedGap === item.id}
              onToggle={() => setExpandedGap(expandedGap === item.id ? null : item.id)}
              kbRange={kbRange}
              setKbRange={setKbRange}
              mouseRange={mouseRange}
              setMouseRange={setMouseRange}
              subtasks={subtasks}
              date={format(date, "yyyy-MM-dd")}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
