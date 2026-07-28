import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle, ShieldAlert, ArrowRight, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMachineData } from '../hooks/useMachineData';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../services/settingsService';
import { playAlertTonePreview } from '../services/alertTonePlayer';

const AlarmSystem = () => {
  const { machineData, isOnline } = useMachineData();
  const { user } = useAuth();
  const userRole = user?.role || '';
  const navigate = useNavigate();

  // Dynamically track active CPS Temperature Threshold from Settings
  const [cpsTempThreshold, setCpsTempThreshold] = useState(() => {
    const s = getSettings();
    return Number(s?.tempThreshold) || 30;
  });

  useEffect(() => {
    const syncCpsSettings = () => {
      const s = getSettings();
      if (s?.tempThreshold !== undefined) {
        setCpsTempThreshold(Number(s.tempThreshold));
      }
    };

    syncCpsSettings();
    window.addEventListener('titanminds_settings_changed', syncCpsSettings);
    window.addEventListener('storage', syncCpsSettings);

    return () => {
      window.removeEventListener('titanminds_settings_changed', syncCpsSettings);
      window.removeEventListener('storage', syncCpsSettings);
    };
  }, []);

  const getTelemetryPath = () => {
    if (userRole === 'admin') return '/admin/live-telemetry';
    if (userRole === 'manager') return '/manager/live-telemetry';
    return '/engineer/live-telemetry';
  };
  
  const [mergedAlert, setMergedAlert] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callingState, setCallingState] = useState(false);
  
  // Track temperature and timestamp at the moment user clicks Dismiss
  const dismissedTempRef = useRef(null);
  const dismissedTimeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const triggerVoiceCallAlert = async (detailMsg = '') => {
    try {
      setCallingState(true);
      await fetch('https://titanminds-backend.onrender.com/api/exp32/call-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Call From Titanminds, Problem Detected on your C N C zero one machine. ${detailMsg || `Temperature exceeded CPS threshold of ${cpsTempThreshold} degrees C.`}`
        })
      });
      setTimeout(() => setCallingState(false), 4000);
    } catch (err) {
      console.error('Failed to dispatch voice call:', err);
      setCallingState(false);
    }
  };

  // Evaluate thresholds based STRICTLY on CPS Temp Threshold (ignoring hardcoded backend alerts)
  useEffect(() => {
    if (!isOnline || !machineData) {
      setMergedAlert(null);
      dismissedTempRef.current = null;
      return;
    }

    const sensor = machineData.sensor || machineData;
    const temp = Number(sensor.temperature) || 0;

    // Strict 30-Second Silence Lock after Dismissal
    const THIRTY_SECONDS_MS = 30000; // 30 seconds
    if (dismissedTimeRef.current > 0) {
      const timeSinceDismissal = Date.now() - dismissedTimeRef.current;
      
      // If temperature dropped back to safe range (<= cpsTempThreshold°C), reset dismissal lock
      if (temp <= cpsTempThreshold) {
        dismissedTempRef.current = null;
        dismissedTimeRef.current = 0;
      } 
      // Within 30 seconds of dismissal -> strictly suppress ALL new notifications even if temp rises!
      else if (timeSinceDismissal < THIRTY_SECONDS_MS) {
        setMergedAlert(null);
        return;
      } 
      // After 30 seconds -> reset dismissal lock so new alert can trigger
      else {
        dismissedTimeRef.current = 0;
      }
    }

    const problems = [];

    // Trigger alert ONLY if live telemetry temperature exceeds CPS Temp Threshold
    if (temp > cpsTempThreshold) {
      problems.push(`High Temperature (${temp.toFixed(1)} °C) exceeding CPS threshold (${cpsTempThreshold} °C)`);
    }

    // Render EXACTLY 1 single notification at any moment
    if (problems.length > 0) {
      const machineId = machineData.machine_id || 'CNC_01';
      setMergedAlert({
        id: `merged-${machineId}-${sensor.timestamp || Date.now()}`,
        type: 'CRITICAL',
        title: `TEMPERATURE ALARM: ${machineId} High Temp Warning`,
        detail: problems[0],
        problemsCount: 1,
        timestamp: new Date().toLocaleTimeString(),
        currentTemp: temp
      });
    } else {
      setMergedAlert(null);
    }
  }, [machineData, isOnline, cpsTempThreshold]);

  // Audio Chime Synthesizer using Web Audio API
  const shouldPlayAudio = Boolean(mergedAlert) && !isMuted;

  useEffect(() => {
    if (shouldPlayAudio) {
      startSiren();
    } else {
      stopSiren();
    }

    return () => {
      stopSiren();
    };
  }, [shouldPlayAudio]);

  // Auto-dismiss alert banner after 10 seconds
  useEffect(() => {
    if (!mergedAlert) return;

    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 10000); // 10 seconds

    return () => clearTimeout(autoDismissTimer);
  }, [mergedAlert?.id]);

  const startSiren = () => {
    try {
      if (!alarmIntervalRef.current) {
        const playSingleChime = () => {
          try {
            // Dynamically play tone configured in platform settings
            const settings = getSettings();
            const toneId = settings?.alertTone || '1';
            playAlertTonePreview(toneId);
          } catch (err) {
            console.error('Chime play error:', err);
          }
        };

        playSingleChime();
        alarmIntervalRef.current = setInterval(playSingleChime, 1400);
      }
    } catch (e) {
      console.log('Audio Context error:', e);
    }
  };

  const stopSiren = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const handleDismiss = () => {
    // Record dismissal timestamp to enforce strict 30-second silence lock
    dismissedTimeRef.current = Date.now();
    setMergedAlert(null);
  };

  if (!mergedAlert) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 40px)',
        maxWidth: '850px',
        background: 'rgba(220, 38, 38, 0.95)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 24px',
        boxShadow: '0 0 35px rgba(239, 68, 68, 0.9), 0 10px 25px rgba(0, 0, 0, 0.5)',
        border: '2px solid #f87171',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '16px',
        animation: 'pulse 1.5s infinite'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          flexShrink: 0
        }}>
          <ShieldAlert size={32} color="#fff" />
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ 
              fontWeight: '800', 
              fontSize: '0.75rem', 
              letterSpacing: '1px', 
              background: '#000', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              CRITICAL ALARM ({mergedAlert.problemsCount} ISSUES)
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{mergedAlert.timestamp}</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#ffffff' }}>
            {mergedAlert.title}
          </h3>
          <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.95, fontWeight: '600' }}>
            {mergedAlert.detail}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Automated Phone Call Alert */}
        <button
          onClick={() => triggerVoiceCallAlert(mergedAlert.detail)}
          disabled={callingState}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '0.85rem',
            opacity: callingState ? 0.6 : 1
          }}
          title="Dispatch automated Twilio phone call alert"
        >
          <PhoneCall size={18} />
          {callingState ? 'Calling...' : 'Call Alert'}
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '0.85rem'
          }}
          title={isMuted ? 'Unmute Alarm Sound' : 'Mute Alarm Sound'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          {isMuted ? 'Muted' : 'Siren On'}
        </button>

        {/* View Telemetry */}
        <button
          onClick={() => navigate(getTelemetryPath())}
          style={{
            background: '#ffffff',
            color: '#dc2626',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Inspect <ArrowRight size={16} />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle size={18} />
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default AlarmSystem;
