'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Record<string, { events: number, last_behaviour: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await api.get('/api/events/?limit=500'); // Fetch a larger chunk for client side aggregation
        const events = response.data;
        const studentMap: Record<string, { events: number, last_behaviour: string }> = {};

        events.forEach((event: any) => {
          const sid = event.student_id;
          if (!sid) return;

          if (!studentMap[sid]) {
            studentMap[sid] = { events: 0, last_behaviour: 'None' };
          }
          studentMap[sid].events += 1;
          // Assuming events are returned descending by timestamp, the first encountered is the last behaviour
          if (studentMap[sid].last_behaviour === 'None') {
            studentMap[sid].last_behaviour = event.behaviour_type;
          }
        });

        setStudents(studentMap);
      } catch (err) {
        setError('Failed to load student data.');
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Students</h2>
        <p className="text-zinc-400 mt-2">Anonymous student monitoring overview.</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-md flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5" />
        <div className="text-sm">
          <strong>Temporary Workaround:</strong> The backend does not currently provide a dedicated `/api/students/` endpoint. 
          The data below is derived client-side from the most recent 500 events in the event log. 
          If there are more than 500 events, this data may be incomplete and should not be presented as authoritative.
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full bg-zinc-800" />
              </CardContent>
            </Card>
          ))
        ) : Object.keys(students).length === 0 ? (
          <div className="col-span-3 text-zinc-500 text-center py-8">
            No student events have been detected yet.
          </div>
        ) : (
          Object.entries(students).map(([studentId, data]) => (
            <Card key={studentId} className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Student</CardTitle>
                <div className="text-2xl font-bold">{studentId}</div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Events</span>
                    <span className="font-bold">{data.events}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-zinc-400">Last Behaviour</span>
                    <span className="font-bold capitalize">{data.last_behaviour.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
