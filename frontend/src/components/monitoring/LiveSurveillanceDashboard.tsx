"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, AlertTriangle, Info, Activity } from "lucide-react";
import { BackendEvent, normalizeSeverity, normalizeEvent } from "@/lib/services/events";
import { Alert as AppAlert } from "@/lib/types";

interface CameraData {
  id: string;
  label: string;
  room: string;
  hasAlert: boolean;
  videoUrl: string;
}

export default function LiveSurveillanceDashboard() {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  
  const [fullscreenCam, setFullscreenCam] = useState<CameraData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [selectedAlert, setSelectedAlert] = useState<AppAlert | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real cameras
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    
    const fetchCameras = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring`;
        const res = await fetch(url);
        if (res.ok && mounted) {
          const data = await res.json();
          const mappedCameras = data
            .filter((source: any) => !source.name?.includes("Camera 7") && !source.name?.includes("Camera 8"))
            .map((source: any, index: number) => ({
              id: String(source.id),
              label: source.name || `Camera ${source.id}`,
              room: `Room ${index + 1}`,
              hasAlert: false,
              videoUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring/${source.id}/stream`
            }));
          setCameras(mappedCameras);
        } else if (mounted && retryCount < 10) {
          retryCount++;
          setTimeout(fetchCameras, 2000);
        }
      } catch (e) {
        if (mounted && retryCount < 10) {
          retryCount++;
          setTimeout(fetchCameras, 2000);
        } else {
          console.error("Failed to fetch cameras", e);
        }
      }
    };
    fetchCameras();
    return () => { mounted = false; };
  }, []);

  // Real-time alerts connection
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? `ws://${window.location.hostname}:8080` : "ws://localhost:8080");
      const wsUrl = token
        ? `${baseUrl}/api/ws/alerts?token=${token}`
        : `${baseUrl}/api/ws/alerts`;
        
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const rawData: BackendEvent = JSON.parse(event.data);
          const normalizedAlert = normalizeEvent(rawData);
          // Only show HIGH and CRITICAL in the live feed
          if (normalizedAlert.severity === 'high' || normalizedAlert.severity === 'critical') {
            setAlerts((prev) => {
              const filtered = prev.filter(a => a.id !== normalizedAlert.id);
              return [normalizedAlert, ...filtered].slice(0, 100);
            });
            
            // Briefly pulse camera border
            setCameras(cams => cams.map(c => {
               if (c.id === normalizedAlert.room) { // Note: Backend room logic might need mapping
                 return { ...c, hasAlert: true };
               }
               return c;
            }));
            
            setTimeout(() => {
               setCameras(cams => cams.map(c => ({ ...c, hasAlert: false })));
            }, 3000);
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = (error: any) => {
        if (error && error.message) {
          console.error("WebSocket error in LiveDashboard:", error.message);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const fetchAiExplanation = async (alert: AppAlert) => {
    setIsAiLoading(true);
    setAiError("");
    setAiExplanation("");
    try {
      const response = await fetch("/api/alerts/explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          confidence: alert.confidence,
          studentId: alert.studentId,
          room: alert.room,
          description: alert.description
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || `API error: ${response.status}`);
      
      setAiExplanation(data.explanation || "No explanation provided.");
    } catch (err: any) {
      setAiError(err.message || "Failed to fetch AI explanation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAlertClick = (alert: AppAlert) => {
    setSelectedAlert(alert);
    fetchAiExplanation(alert);
  };

  const FullscreenModal = () => {
    if (!fullscreenCam) return null;
    
    // We portal to body to avoid AppShell z-index stacking context issues
    return createPortal(
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999, // Ensure it's above everything
        backgroundColor: 'var(--bg)',
        display: 'flex'
      }}>
        {/* Main Video Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {fullscreenCam.videoUrl ? (
            <img 
              src={fullscreenCam.videoUrl} 
              alt={`Camera ${fullscreenCam.id}`} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'var(--surface-3)' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
              No video feed available
            </div>
          )}
          
          <div 
            onClick={() => setFullscreenCam(null)}
            style={{ 
              position: 'absolute', top: '20px', right: '20px', color: 'var(--text)', cursor: 'pointer', 
              backgroundColor: 'var(--surface)', borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
            }}
          >
            <X size={20} />
          </div>

          <div style={{
            position: 'absolute', top: '20px', left: '20px', backgroundColor: 'var(--surface)', padding: '8px 16px',
            borderRadius: '6px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{fullscreenCam.id}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{fullscreenCam.room}</div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const GroqModal = () => {
    if (!selectedAlert) return null;
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)',
          width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                backgroundColor: selectedAlert.severity === 'critical' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                color: selectedAlert.severity === 'critical' ? '#dc2626' : '#ea580c',
                padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
              }}>
                {selectedAlert.severity} Alert
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{selectedAlert.type.replace(/_/g, ' ')}</div>
            </div>
            <X size={20} color="var(--text-2)" style={{ cursor: 'pointer' }} onClick={() => setSelectedAlert(null)} />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedAlert.evidence && (
               <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                 <img src={selectedAlert.evidence} alt="Violation Evidence" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#000' }} />
               </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '4px' }}>Student</div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text)' }}>{selectedAlert.studentId}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '4px' }}>Timestamp</div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>{selectedAlert.timestamp}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence</div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>{selectedAlert.confidence}%</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} color="var(--primary)" /> AI Analysis (Groq Llama-3)
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.2)', borderRadius: '6px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text)' }}>
                {isAiLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-2)' }}><Activity size={16} className="animate-spin" /> Analyzing alert...</div>
                ) : aiError ? (
                  <div style={{ color: '#dc2626' }}>{aiError}</div>
                ) : (
                  <div>{aiExplanation}</div>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg)' }}>
            <div>
              {toast && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>{toast}</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setToast("Marked as False Alarm!");
                  setTimeout(() => { setToast(null); setSelectedAlert(null); }, 1000);
                }} 
                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
              >
                Mark as False Alarm
              </button>
              <button 
                onClick={() => {
                  setToast("Confirmed Violation!");
                  setTimeout(() => { setToast(null); setSelectedAlert(null); }, 1000);
                }}
                style={{ padding: '8px 16px', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Violation
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* CCTV Grid (100%) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', alignContent: 'start' }}>
          {cameras.length === 0 && (
             <div style={{ color: 'var(--text-2)', padding: '20px' }}>Loading cameras...</div>
          )}
          {cameras.map(cam => {
            const hasAlert = cam.hasAlert;
            const borderColor = hasAlert ? '#dc2626' : 'var(--border)';
            const borderWidth = hasAlert ? '2px' : '0.5px';

            return (
              <div key={cam.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {cam.label} · {cam.room}
                  </div>
                  <Maximize2 size={12} color="var(--text-2)" style={{ cursor: 'pointer' }} onClick={() => setFullscreenCam(cam)} />
                </div>

                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: '6px',
                  border: `${borderWidth} solid ${borderColor}`,
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cam.videoUrl ? (
                      <img 
                        src={cam.videoUrl} 
                        alt={cam.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           if (e.target && (e.target as any).nextSibling) {
                              ((e.target as any).nextSibling as HTMLElement).style.display = 'flex';
                           }
                        }}
                      />
                    ) : null}
                    
                    <div style={{ 
                      display: cam.videoUrl ? 'none' : 'flex', 
                      width: '100%', height: '100%', backgroundColor: 'var(--surface-3)', 
                      alignItems: 'center', justifyContent: 'center' 
                    }}>
                       <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{cam.label} offline</span>
                    </div>

                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', letterSpacing: '1px' }}>LIVE</span>
                    </div>

                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fff' }}>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FullscreenModal />
      <GroqModal />
    </div>
  );
}
