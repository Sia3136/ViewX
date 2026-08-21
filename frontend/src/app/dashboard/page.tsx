'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ShieldAlert, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoStatus, setVideoStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const videoUrl = process.env.NEXT_PUBLIC_VIDEO_STREAM_URL || 'http://localhost:5000/video_feed';

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await api.get('/api/analytics/summary');
        setSummary(response.data);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold">{summary?.total_events || 0}</div>
            )}
            <p className="text-xs text-zinc-500 mt-1">Recorded in the system</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold text-amber-500">
                {Object.keys(summary?.behaviour_counts || {}).length}
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">Unique behaviour types</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Active</div>
            <p className="text-xs text-zinc-500 mt-1">System is online</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-white min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Live Surveillance Feed</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-0 overflow-hidden relative min-h-[400px]">
            {videoStatus === 'connecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/50 z-10">
                <Skeleton className="h-12 w-12 rounded-full mb-4 bg-zinc-800" />
                <h3 className="text-lg font-medium text-zinc-300">Connecting to stream...</h3>
              </div>
            )}
            {videoStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-10 p-6 text-center border-2 border-dashed border-zinc-700">
                <ShieldAlert className="h-12 w-12 text-zinc-500 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300">Video Stream Unavailable</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  The ML Worker is currently unreachable or not running. Please ensure the worker is started.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setVideoStatus('connecting')}>
                  Retry Connection
                </Button>
              </div>
            )}
            
            {videoStatus !== 'error' && (
              <img 
                src={videoUrl} 
                alt="Live CCTV Feed"
                className={`w-full h-full object-contain ${videoStatus === 'live' ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setVideoStatus('live')}
                onError={() => setVideoStatus('error')}
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Event Logger</span>
                <span className="text-sm font-medium text-emerald-500">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Behaviour Engine</span>
                <span className="text-sm font-medium text-emerald-500">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Privacy Layer</span>
                <span className="text-sm font-medium text-emerald-500">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Live Video Engine</span>
                <span className={`text-sm font-medium ${videoStatus === 'live' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {videoStatus === 'live' ? 'Operational' : (videoStatus === 'connecting' ? 'Connecting' : 'Offline')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
