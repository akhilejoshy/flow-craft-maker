import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatDuration } from '@/data/mockData';
import { WorkflowBlock } from '@/store/slices/workFlow';

interface Props {
  block: WorkflowBlock;
}

const ExistingBlockCard: React.FC<Props> = ({ block }) => {
  return (
    <div className="relative flex items-start gap-4 rounded-xl border border-sidebar-border bg-sidebar p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
        <CheckCircle2 className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-sidebar-accent-foreground">{block.subtask}</h3>
          <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            {formatDuration(block.startTime, block.endTime)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <Clock className="h-3 w-3" />
          <span>{block.startTime} → {block.endTime}</span>
        </div>
      </div>
    </div>
  );
};

export default ExistingBlockCard;
