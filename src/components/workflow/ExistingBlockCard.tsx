import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { WorkflowBlock, formatDuration } from '@/data/mockData';

interface Props {
  block: WorkflowBlock;
}

const ExistingBlockCard: React.FC<Props> = ({ block }) => {
  return (
    <div className="relative flex items-start gap-4 rounded-xl border border-block-border bg-block p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <CheckCircle2 className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{block.subtask}</h3>
          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {formatDuration(block.startTime, block.endTime)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{block.startTime} → {block.endTime}</span>
        </div>
      </div>
    </div>
  );
};

export default ExistingBlockCard;
