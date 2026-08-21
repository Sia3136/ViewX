'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

export type EventResponse = {
  id: number;
  student_id: string;
  behaviour_type: string;
  confidence: number;
  explanation: string | null;
  timestamp: string;
};

export const columns: ColumnDef<EventResponse>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ row }) => {
      const date = new Date(row.getValue('timestamp'));
      return <div className="font-mono text-xs text-zinc-300">{date.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: 'student_id',
    header: 'Student ID',
    cell: ({ row }) => {
      const studentId = row.getValue('student_id') as string;
      return <div className="font-medium">{studentId || 'Unknown'}</div>;
    },
  },
  {
    accessorKey: 'behaviour_type',
    header: 'Behaviour',
    cell: ({ row }) => {
      const behaviourType = row.getValue('behaviour_type') as string;
      return <div className="capitalize text-zinc-300">{behaviourType.replace(/_/g, ' ')}</div>;
    },
  },
  {
    accessorKey: 'confidence',
    header: 'Severity',
    cell: ({ row }) => {
      const confidence = row.getValue('confidence') as number;
      if (confidence >= 0.85) return <Badge variant="destructive">High</Badge>;
      if (confidence >= 0.70) return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Low</Badge>;
    },
  },
  {
    id: 'confidence_pct',
    accessorFn: (row) => row.confidence,
    header: 'Confidence',
    cell: ({ row }) => {
      const confidence = row.getValue('confidence_pct') as number;
      return <div className="text-zinc-400">{(confidence * 100).toFixed(0)}%</div>;
    },
  },
  {
    accessorKey: 'explanation',
    header: 'Explanation',
    cell: ({ row }) => {
      const explanation = row.getValue('explanation') as string | null;
      return <div className="max-w-xs truncate text-zinc-400" title={explanation || ''}>{explanation || '-'}</div>;
    },
  },
];
