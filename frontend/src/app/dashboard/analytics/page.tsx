'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await api.get('/api/analytics/summary');
        setSummary(response.data);
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const totalEvents = summary?.total_events || 0;
  
  // Transform the object into an array for Recharts, excluding 'total_events'
  const chartData = summary 
    ? Object.entries(summary)
        .filter(([key]) => key !== 'total_events')
        .map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          count: value
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-zinc-400 mt-2">Behavioural monitoring statistics.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20 bg-zinc-800" /> : <div className="text-2xl font-bold">{totalEvents}</div>}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Unique Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Unavailable</div>
            <p className="text-xs text-zinc-500 mt-1">Backend Limitation: Metric not provided by API</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Unavailable</div>
            <p className="text-xs text-zinc-500 mt-1">Backend Limitation: Metric not provided by API</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle>Behaviour Distribution</CardTitle>
          <CardDescription className="text-zinc-400">Frequency of detected behaviours across all students</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full bg-zinc-800" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">No behaviour data available.</p>
          ) : (
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    width={150} 
                    className="capitalize"
                  />
                  <Tooltip 
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} events`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
