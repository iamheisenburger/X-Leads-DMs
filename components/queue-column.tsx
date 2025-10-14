"use client";

import { CandidateCard } from "./candidate-card";

interface QueueColumnProps {
  title: string;
  candidates: any[];
  emptyMessage?: string;
}

export function QueueColumn({ title, candidates, emptyMessage }: QueueColumnProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>

      {candidates.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate._id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
