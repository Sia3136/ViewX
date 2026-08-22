"use client";

import { useState, useEffect } from "react";
import { CameraCard } from "./CameraCard";
import { Modal } from "@/components/ui/Modal";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { User, Loader2 } from "lucide-react";

export function CameraGrid() {
  const [focused, setFocused] = useState<Camera | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring`);
        if (!res.ok) throw new Error("Failed to fetch cameras");
        const data = await res.json();
        
        // Map backend sources to frontend Camera type
        const mapped: Camera[] = data.map((src: any) => ({
          id: src.id.toString(),
          name: src.name,
          room: "Exam Hall", // Dummy or map if DB has it
          status: src.status === "RUNNING" ? "live" : "offline",
          studentCount: 0, // Should come from websocket/analytics eventually
          alertCount: 0,
          fps: src.status === "RUNNING" ? 30 : 0,
          aiConfidence: 0,
          detections: []
        }));
        setCameras(mapped);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCameras();
    // Poll every 30s to get updated list/status if needed, but for now just fetch once
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-white/50" /></div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4 border border-red-500/20 rounded-xl">{error}</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cameras.map((cam, i) => {
          const videoUrl = cam.status === "live" 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/${cam.id}/stream` 
            : undefined;
          
          return (
            <CameraCard 
              key={cam.id} 
              camera={cam} 
              index={i} 
              videoUrl={videoUrl}
              onClick={() => setFocused(cam)} 
            />
          );
        })}
      </div>

      <Modal open={!!focused} onClose={() => setFocused(null)} title={focused ? `${focused.name} — ${focused.room}` : undefined}>
        {focused && (
          <div>
            <div
              className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-black flex items-center justify-center"
            >
              {focused.status === "offline" && (
                <>
                  <div className="absolute inset-0 scanlines opacity-40 z-10 pointer-events-none" />
                </>
              )}
              {focused.status === "live" ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/${focused.id}/stream`} alt={`Live feed`} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                  <div className="grid grid-cols-7 gap-x-4 gap-y-3 opacity-80">
                    <div className="col-span-7 text-center text-white/50 text-sm">Offline</div>
                  </div>
                </div>
              )}
              {focused.detections.map((d, i) => (
                <DetectionOverlay key={d.id} detection={d} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--text-2)] text-xs">Students</div>
                <div className="font-medium">{focused.studentCount}</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">AI Confidence</div>
                <div className="font-medium">{focused.aiConfidence}%</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">Frame Rate</div>
                <div className="font-medium">{focused.fps} fps</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">Active Alerts</div>
                <div className="font-medium">{focused.alertCount}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
