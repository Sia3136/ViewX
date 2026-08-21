'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await api.get('/api/analytics/summary');
        setSummary(response.data);
      } catch (err) {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const totalEvents = summary?.total_events || 0;
  const behaviours = summary?.behaviour_counts || {};
  const maxCount = Math.max(...Object.values(behaviours as Record<string, number>), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-zinc-400 mt-2">Behavioural monitoring statistics.</p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20 bg-zinc-800" /> : <div className="text-2xl font-bold">{totalEvents}</div>}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-zinc-400 mt-1">Backend Gap: Unique students not provided by API</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-zinc-400 mt-1">Backend Gap: Avg confidence not provided by API</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle>Behaviour Distribution</CardTitle>
          <CardDescription className="text-zinc-400">Frequency of detected behaviours</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-full bg-zinc-800" />
            </div>
          ) : Object.keys(behaviours).length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No data available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(behaviours).map(([type, count]) => {
                const percentage = ((count as number) / maxCount) * 100;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="text-zinc-400">{String(count)}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
