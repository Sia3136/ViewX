'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';

const settingsSchema = z.object({
  model_type: z.string(),
  confidence_threshold: z.number().min(0.1).max(1.0),
  enable_alerts: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      model_type: 'yolov8n',
      confidence_threshold: 0.65,
      enable_alerts: true,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.get('/api/settings/');
        const data = response.data;
        
        // Form populate parsing API string values back to their types
        form.reset({
          model_type: data.model_type || 'yolov8n',
          confidence_threshold: data.confidence_threshold ? parseFloat(data.confidence_threshold) : 0.65,
          enable_alerts: data.enable_alerts ? data.enable_alerts === 'true' : true,
        });
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [form]);

  const onSubmit = async (values: SettingsFormValues) => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      // API expects List[{key, value}] where value is string
      const payload = [
        { key: 'model_type', value: values.model_type },
        { key: 'confidence_threshold', value: values.confidence_threshold.toString() },
        { key: 'enable_alerts', value: values.enable_alerts.toString() },
      ];
      
      await api.patch('/api/settings/', payload);
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
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="model_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Model Type</FormLabel>
                      <Select 
                        disabled={!isAdmin || saving} 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                            <SelectValue placeholder="Select a model type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectItem value="yolov8n">YOLOv8 Nano (Fast)</SelectItem>
                          <SelectItem value="yolov8s">YOLOv8 Small (Balanced)</SelectItem>
                          <SelectItem value="yolov8m">YOLOv8 Medium (Accurate)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-zinc-500">
                        The object detection model loaded by the ML Worker.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confidence_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex justify-between">
                        <span>Confidence Threshold</span>
                        <span>{field.value.toFixed(2)}</span>
                      </FormLabel>
                      <FormControl>
                        <Slider
                          disabled={!isAdmin || saving}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="pt-2"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Minimum confidence required for an anomaly to be logged.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enable_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white text-base">
                          Enable Behaviour Alerts
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Generate WebSocket alerts when anomalies are detected.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          disabled={!isAdmin || saving}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="border-t border-zinc-800 pt-6">
                  <Button type="submit" disabled={!isAdmin || saving || !form.formState.isDirty}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  {!isAdmin && <span className="ml-4 text-xs text-zinc-500">Admin privileges required to save.</span>}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
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
            <span className="text-xs text-zinc-500">Not in API schema</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Pose Tracking</Label>
            <span className="text-xs text-zinc-500">Not in API schema</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Video Source (Camera/MP4)</Label>
            <span className="text-xs text-zinc-500">Not in API schema</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
