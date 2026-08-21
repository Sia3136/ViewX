'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Local state for the settings form
  const [modelType, setModelType] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState('');
  const [enableAlerts, setEnableAlerts] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.get('/api/settings/');
        setSettings(response.data);
        setModelType(response.data.model_type || 'yolov8n');
        setConfidenceThreshold(String(response.data.confidence_threshold || 0.65));
        setEnableAlerts(response.data.enable_alerts ?? true);
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.patch('/api/settings/', {
        model_type: modelType,
        confidence_threshold: parseFloat(confidenceThreshold),
        enable_alerts: enableAlerts
      });
      setSuccessMessage('Settings saved successfully.');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to modify settings (Admin role required).');
      } else {
        setError('Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-zinc-400 mt-2">Manage system configuration and behaviour parameters.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-md">
          {successMessage}
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription className="text-zinc-400">
            Backend settings retrieved from /api/settings/.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Model Type</Label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-white"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  disabled={!isAdmin}
                >
                  <option value="yolov8n">YOLOv8 Nano (Fast)</option>
                  <option value="yolov8s">YOLOv8 Small (Balanced)</option>
                  <option value="yolov8m">YOLOv8 Medium (Accurate)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold ({confidenceThreshold})</Label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="space-y-0.5">
                  <Label>Enable Behaviour Alerts</Label>
                  <div className="text-xs text-zinc-400">Generate alerts when anomalies are detected</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                  disabled={!isAdmin}
                  className="h-4 w-4"
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t border-zinc-800 pt-6">
          <Button onClick={handleSave} disabled={loading || saving || !isAdmin}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {!isAdmin && <span className="ml-4 text-xs text-zinc-500">Admin privileges required to save.</span>}
        </CardFooter>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-white opacity-60">
        <CardHeader>
          <CardTitle>Unsupported Legacy Settings</CardTitle>
          <CardDescription className="text-zinc-400">
            The following settings existed in the Streamlit UI but are not currently supported by the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Dark Mode / Appearance</Label>
            <span className="text-xs text-zinc-500">Managed by Next.js theme</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Privacy Mode</Label>
            <span className="text-xs text-zinc-500">Not in API</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Pose Tracking</Label>
            <span className="text-xs text-zinc-500">Not in API</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Video Source (Camera/MP4)</Label>
            <span className="text-xs text-zinc-500">Not in API</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
