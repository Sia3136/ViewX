import React, { useState, useEffect } from "react";
import { Maximize2, X, AlertTriangle, Info, Activity, Camera, Users, Calendar, BarChart2, FileText, Settings, Video, ShieldAlert, Sun, Moon } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";
type ViewState = "overview" | "live-monitoring" | "active-alerts" | "students" | "exam-sessions" | "analytics" | "reports" | "settings";

interface CameraData {
  id: string;
  label: string;
  room: string;
  hasAlert: boolean;
  alertSeverity?: Severity;
  videoUrl: string;
}

interface AlertData {
  id: string;
  cameraId: string;
  roomName: string;
  studentId: string;
  type: string;
  description: string;
  severity: Severity;
  timestamp: string;
  rawData?: any;
  screenshotUrl: string | null;
}

export default function LiveSurveillanceDashboard() {
  const [currentView, setCurrentView] = useState<ViewState>("live-monitoring");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([
    {
       id: '1',
       cameraId: 'CAM-05',
       roomName: 'Room 5',
       studentId: 'source5_student16',
       type: 'unusual_hand_movement',
       description: 'Hand movement exceeded threshold for 4.2s continuously.',
       rawData: 'confidence:0.94, duration:4.2s, frames:127, threshold:0.75',
       severity: 'critical',
       timestamp: '04:10:22',
       screenshotUrl: null
     },
     {
       id: '2',
       cameraId: 'CAM-02',
       roomName: 'Room 2',
       studentId: 'source2_student03',
       type: 'body_rotation',
       description: 'Body rotation detected continuously.',
       rawData: 'confidence:0.88, duration:3.1s, threshold:0.75',
       severity: 'high',
       timestamp: '04:09:15',
       screenshotUrl: null
     },
     {
       id: '3',
       cameraId: 'CAM-04',
       roomName: 'Room 4',
       studentId: 'source4_student08',
       type: 'head_turn',
       description: 'Head turn detected continuously.',
       rawData: 'confidence:0.91, duration:2.5s, threshold:0.75',
       severity: 'critical',
       timestamp: '04:08:50',
       screenshotUrl: null
     },
     {
       id: '4',
       cameraId: 'CAM-01',
       roomName: 'Room 1',
       studentId: 'source1_student12',
       type: 'nonverbal_communication',
       description: 'Nonverbal communication detected continuously.',
       rawData: 'confidence:0.86, duration:5.0s, threshold:0.75',
       severity: 'high',
       timestamp: '04:07:30',
       screenshotUrl: null
     },
     {
       id: '5',
       cameraId: 'CAM-03',
       roomName: 'Room 3',
       studentId: 'source3_student05',
       type: 'unusual_hand_movement',
       description: 'Hand movement exceeded threshold for 3.8s continuously.',
       rawData: 'confidence:0.95, duration:3.8s, threshold:0.75',
       severity: 'critical',
       timestamp: '04:05:10',
       screenshotUrl: null
     },
     {
       id: '6',
       cameraId: 'CAM-06',
       roomName: 'Room 6',
       studentId: 'source6_student02',
       type: 'body_rotation',
       description: 'Body rotation detected continuously.',
       rawData: 'confidence:0.87, duration:2.9s, threshold:0.75',
       severity: 'high',
       timestamp: '04:02:45',
       screenshotUrl: null
     }
  ]);
  
  const [fullscreenCam, setFullscreenCam] = useState<CameraData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mappedCameras = data.map((source: any, index: number) => ({
            id: String(source.id),
            label: source.name || `Camera ${source.id}`,
            room: `Room ${index + 1}`,
            hasAlert: false,
            videoUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring/${source.id}/stream`
          }));
          setCameras(mappedCameras);
        }
      } catch (e) {
        console.error("Failed to fetch cameras", e);
      }
    };
    fetchCameras();
  }, []);

  useEffect(() => {
     const types = [
       'unusual_hand_movement',
       'body_rotation',
       'head_turn',
       'nonverbal_communication'
     ]
     const severities = ['critical', 'high']
     const camIds = [
       'CAM-01','CAM-02','CAM-03',
       'CAM-04','CAM-05','CAM-06'
     ]
     const interval = setInterval(() => {
       const camId = camIds[
         Math.floor(Math.random() * camIds.length)
       ]
       const camNum = camId.replace('CAM-0','')
       const sev = severities[
         Math.floor(Math.random() * 2)
       ] as Severity
       const type = types[
         Math.floor(Math.random() * types.length)
       ]
       const now = new Date()
       const ts = now.toTimeString().slice(0,8)
       setAlerts(prev => [{
         id: Date.now().toString(),
         cameraId: camId,
         roomName: `Room ${camNum}`,
         studentId: `source${camNum}_student${
           Math.floor(Math.random()*20)+1
         }`,
         type,
         description: `${type.replace(/_/g,' ')} detected continuously.`,
         rawData: `confidence:${(0.85 + Math.random()*0.14).toFixed(2)}, duration:${(2+Math.random()*5).toFixed(1)}s, threshold:0.75`,
         severity: sev,
         timestamp: ts,
         screenshotUrl: null
       }, ...prev].slice(0, 50))
     }, 10000)
     return () => clearInterval(interval)
  }, [])

  const fetchAiExplanation = async (alert: AlertData) => {
    setIsAiLoading(true);
    setAiError("");
    setAiExplanation("");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found");
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant analyzing exam surveillance alerts. Be concise and professional."
            },
            {
              role: "user",
              content: `Explain this alert: Type=${alert.type}, Description=${alert.description}, Student=${alert.studentId}, Camera=${alert.cameraId}`
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      setAiExplanation(data.choices[0]?.message?.content || "No explanation provided.");
    } catch (err: any) {
      setAiError(err.message || "Failed to fetch AI explanation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAlertClick = (alert: AlertData) => {
    setSelectedAlert(alert);
    fetchAiExplanation(alert);
  };

  const theme = {
    bg:             'var(--bg)',
    surface:        'var(--surface)',
    border:         'var(--border)',
    text:           'var(--text)',
    muted:          'var(--text-2)',
    camCell:        'var(--surface-2)',
    camPlaceholder: 'var(--surface-3)',
    activeNavBg:    'var(--surface-3)',
    hoverBg:        'var(--surface-2)',
    primary:        'var(--primary)',
  };

  const filteredAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div style={{
      backgroundColor: theme.bg,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* MAIN CONTENT WRAPPER */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: theme.bg,
        display: 'flex'
      }}>
        {/* CENTER CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            width: '100%',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '12px',
            alignContent: 'start'
          }}>
            {cameras.map(cam => {
              const hasAlert = cam.hasAlert;
              const borderColor = hasAlert ? '#dc2626' : theme.border;
              const borderWidth = hasAlert ? '2px' : '0.5px';

              return (
                <div key={cam.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: theme.muted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {cam.id} · {cam.room}
                    </div>
                    <Maximize2 size={12} color={theme.muted} style={{ cursor: 'pointer' }} onClick={() => setFullscreenCam(cam)} />
                  </div>

                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    backgroundColor: theme.camCell,
                    borderRadius: '6px',
                    border: `${borderWidth} solid ${borderColor}`,
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cam.videoUrl ? (
                        <img 
                          src={cam.videoUrl} 
                          alt={`Camera ${cam.id}`} 
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
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: theme.camPlaceholder, 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                         <span style={{ fontSize: '12px', color: theme.muted }}>{cam.label} offline</span>
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
      </div>

      {/* FULLSCREEN OVERLAY */}
      {fullscreenCam && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: theme.bg,
          display: 'flex'
        }}>
          {/* Main Video Area */}
          <div style={{ flex: 1, position: 'relative' }}>
            {fullscreenCam.videoUrl ? (
              <img 
                src={fullscreenCam.videoUrl} 
                alt={`Fullscreen Camera ${fullscreenCam.id}`} 
                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: theme.camPlaceholder }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: theme.camPlaceholder, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
                No video feed available
              </div>
            )}
            
            {/* Top Controls */}
            <div 
              onClick={() => setFullscreenCam(null)}
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                color: theme.text, 
                cursor: 'pointer', 
                backgroundColor: theme.surface, 
                borderRadius: '50%', 
                width: '40px',
                height: '40px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: `1px solid ${theme.border}`
              }}
            >
              <X size={20} />
            </div>

            {/* Camera Info */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              backgroundColor: theme.surface,
              padding: '8px 16px',
              borderRadius: '6px',
              color: theme.text,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              border: `1px solid ${theme.border}`
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{fullscreenCam.id}</div>
              <div style={{ fontSize: '12px', color: theme.muted }}>{fullscreenCam.room}</div>
            </div>
          </div>
          
          {/* Sidebar for Fullscreen */}
          <div style={{
            width: '350px',
            backgroundColor: theme.surface,
            borderLeft: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '24px 20px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: theme.text, borderBottom: `1px solid ${theme.border}` }}>
              Events Feed
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredAlerts.filter(a => a.cameraId === fullscreenCam.id).map(alert => (
                <div key={alert.id} style={{
                  padding: '16px 20px',
                  backgroundColor: alert.severity === 'critical' ? 'rgba(220,38,38,0.06)' : 'rgba(234,88,12,0.05)',
                  borderLeft: `2px solid ${alert.severity === 'critical' ? '#dc2626' : '#ea580c'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: theme.muted }}>{alert.studentId}</span>
                    <span style={{ fontSize: '10px', color: theme.muted }}>{alert.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: alert.severity === 'critical' ? '#dc2626' : '#ea580c' }}>{alert.type}</div>
                  <div style={{ fontSize: '12px', color: theme.muted, lineHeight: 1.5 }}>{alert.description}</div>
                </div>
              ))}
              {filteredAlerts.filter(a => a.cameraId === fullscreenCam.id).length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: '13px', color: theme.muted }}>
                  No active events for this camera.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GROQ AI EXPLANATION MODAL */}
      {selectedAlert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20000,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: theme.surface,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: theme.bg
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  backgroundColor: selectedAlert.severity === 'critical' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                  color: selectedAlert.severity === 'critical' ? '#dc2626' : '#ea580c',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {selectedAlert.severity} Alert
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text }}>{selectedAlert.type}</div>
              </div>
              <X size={20} color={theme.muted} style={{ cursor: 'pointer' }} onClick={() => setSelectedAlert(null)} />
            </div>
            
            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Evidence Area (16:9) */}
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                backgroundColor: theme.camPlaceholder,
                borderRadius: '6px',
                overflow: 'hidden',
                border: `1px solid ${theme.border}`
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cameras.find(c => c.id === selectedAlert.cameraId)?.videoUrl ? (
                     <img 
                      src={cameras.find(c => c.id === selectedAlert.cameraId)?.videoUrl} 
                      alt="Alert Evidence" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                     />
                  ) : (
                    <div style={{ color: theme.muted, fontSize: '14px' }}>Evidence video not available</div>
                  )}
                </div>
              </div>

              {/* Metadata Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                padding: '16px',
                backgroundColor: theme.bg,
                borderRadius: '6px',
                border: `1px solid ${theme.border}`
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: theme.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Camera ID</div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: theme.text }}>{selectedAlert.cameraId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: theme.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Student / Seat</div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', color: theme.text }}>{selectedAlert.studentId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: theme.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Timestamp</div>
                  <div style={{ fontSize: '14px', color: theme.text }}>{selectedAlert.timestamp}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: theme.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Confidence</div>
                  <div style={{ fontSize: '14px', color: theme.text }}>
                    {typeof selectedAlert.rawData === 'string' && selectedAlert.rawData.includes('confidence:')
                      ? Math.round(parseFloat(selectedAlert.rawData.split('confidence:')[1]) * 100) + '%'
                      : selectedAlert.rawData?.confidence ? Math.round(selectedAlert.rawData.confidence * 100) + '%' : 'N/A'}
                  </div>
                </div>
              </div>

              {/* AI Explanation Area */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={14} color={theme.primary} /> AI Analysis (Groq Llama-3-70b)
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(22, 163, 74, 0.05)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: theme.text
                }}>
                  {isAiLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: theme.muted }}>
                      <Activity size={16} className="animate-spin" />
                      Analyzing alert patterns with Groq...
                    </div>
                  ) : aiError ? (
                    <div style={{ color: '#dc2626' }}>{aiError}</div>
                  ) : (
                    <div>{aiExplanation}</div>
                  )}
                </div>
              </div>

              {/* Raw Data Toggle */}
              <div>
                <div 
                  onClick={() => setShowRawData(!showRawData)}
                  style={{ fontSize: '12px', color: theme.primary, cursor: 'pointer', display: 'inline-block', marginBottom: '12px' }}
                >
                  {showRawData ? '- Hide Raw Data' : '+ View Raw Event Data'}
                </div>
                {showRawData && (
                  <pre style={{
                    padding: '16px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: theme.text,
                    overflowX: 'auto',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(selectedAlert.rawData, null, 2)}
                  </pre>
                )}
              </div>
              
            </div>
            
            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: theme.bg
            }}>
              <button 
                onClick={() => setSelectedAlert(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
              <button 
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.primary,
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
