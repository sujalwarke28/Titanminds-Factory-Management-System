import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle, ShieldAlert, ArrowRight, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMachineData } from '../hooks/useMachineData';
import { useAuth } from '../context/AuthContext';

const AlarmSystem = () => {
  const { machineData, isOnline } = useMachineData();
  const { user } = useAuth();
  const userRole = user?.role || '';
  const navigate = useNavigate();

  // Alerts should ONLY be visible on Engineer and Manager portals, NOT Admin
  if (userRole === 'admin') return null;
  
  const [mergedAlert, setMergedAlert] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callingState, setCallingState] = useState(false);
  
  // Track temperature and timestamp at the moment user clicks Dismiss
  const dismissedTempRef = useRef(null);
  const dismissedTimeRef = useRef(0);
  const lastCallTimeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const triggerVoiceCallAlert = async (detailMsg = '') => {
    try {
      setCallingState(true);
      await fetch('https://titanminds-backend.onrender.com/api/exp32/call-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Call From Titanminds, Problem Detected on your C N C zero one machine. ${detailMsg}`
        })
      });
      setTimeout(() => setCallingState(false), 4000);
    } catch (err) {
      console.error('Failed to dispatch voice call:', err);
      setCallingState(false);
    }
  };

  // Evaluate thresholds & merged issues
  useEffect(() => {
    if (!isOnline || !machineData) {
      setMergedAlert(null);
      dismissedTempRef.current = null;
      return;
    }

    const sensor = machineData.sensor || machineData;
    const prediction = machineData.prediction || {};
    // Ignore any vibration alerts from backend/analog sensor noise completely
    const backendAlerts = (machineData.alerts || []).filter(a => 
      !a.code?.toLowerCase().includes('vibration') && 
      !a.title?.toLowerCase().includes('vibration') &&
      !a.message?.toLowerCase().includes('vibration') &&
      !a.issue?.toLowerCase().includes('vibration')
    );

    const temp = Number(sensor.temperature) || 0;
    const sound = Number(sensor.sound || sensor.raw_sound) || 0;

    // Strict 10-Minute (600,000 ms) Alert Silence Lock
    if (dismissedTimeRef.current > 0) {
      const timeSinceDismissal = Date.now() - dismissedTimeRef.current;
      const TEN_MINUTES_MS = 600000; // 10 minutes
      
      // If temp dropped back to normal (<= 30°C), reset dismissal lock
      if (temp <= 30.0) {
        dismissedTempRef.current = null;
        dismissedTimeRef.current = 0;
      } 
      // If temperature rose by at least 1.5°C since dismissal, allow emergency alert
      else if (dismissedTempRef.current !== null && temp >= dismissedTempRef.current + 1.5) {
        dismissedTempRef.current = null;
        dismissedTimeRef.current = 0;
      } 
      // Within 10 minutes of an alert dismissal -> strictly suppress any new alerts
      else if (timeSinceDismissal < TEN_MINUTES_MS) {
        setMergedAlert(null);
        return;
      }
    }

    const problems = [];

    // Collect active issues into 1 single notification (Vibration explicitly excluded for analog sensor)
    if (temp > 30.0) {
      problems.push(`High Temp (${temp.toFixed(1)} °C)`);
    }

    if (sound > 75) {
      problems.push(`Sound Hazard (${sound.toFixed(0)} dB)`);
    }

    if (backendAlerts.length > 0) {
      problems.push(backendAlerts[0].title || prediction.llm_summary || 'AI Model Warning');
    }

    if (problems.length > 0) {
      const machineId = machineData.machine_id || 'CNC_01';
      setMergedAlert({
        id: `merged-${machineId}-${sensor.timestamp || Date.now()}`,
        type: 'CRITICAL',
        title: `CRITICAL ALARM: ${machineId} Needs Attention`,
        detail: problems.join(' • '),
        problemsCount: problems.length,
        timestamp: new Date().toLocaleTimeString(),
        currentTemp: temp
      });
    } else {
      setMergedAlert(null);
    }
  }, [machineData, isOnline]);

  // Audio Siren Synthesizer using Web Audio API
  useEffect(() => {
    if (mergedAlert && !isMuted) {
      startSiren();
    } else {
      stopSiren();
    }

    return () => {
      stopSiren();
    };
  }, [mergedAlert, isMuted]);

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
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      if (!alarmIntervalRef.current && audioCtxRef.current) {
        const playJailKlaxon = () => {
          try {
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            
            // Dual Oscillators for a heavy, loud industrial prison klaxon
            const osc1 = ctx.createOscillator(); // Main Siren Horn
            const osc2 = ctx.createOscillator(); // Deep Bass Sub-Horn
            const gain = ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'square';

            // Jail Warning Pitch Sweep (420Hz -> 920Hz -> 420Hz "WAAAH-WAAAH")
            osc1.frequency.setValueAtTime(420, now);
            osc1.frequency.exponentialRampToValueAtTime(920, now + 0.35);
            osc1.frequency.exponentialRampToValueAtTime(420, now + 0.65);

            osc2.frequency.setValueAtTime(210, now);
            osc2.frequency.exponentialRampToValueAtTime(460, now + 0.35);
            osc2.frequency.exponentialRampToValueAtTime(210, now + 0.65);

            // Loud Gain Volume
            gain.gain.setValueAtTime(0.55, now);
            gain.gain.setValueAtTime(0.55, now + 0.55);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.68);
            osc2.stop(now + 0.68);
          } catch (err) {
            console.error('Jail Siren play error:', err);
          }
        };

        playJailKlaxon();
        alarmIntervalRef.current = setInterval(playJailKlaxon, 720);
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
    if (mergedAlert) {
      // Record current temp & timestamp at dismissal time to enforce 3-minute cooldown / +1.5°C rise rule
      dismissedTempRef.current = mergedAlert.currentTemp;
      dismissedTimeRef.current = Date.now();
      setMergedAlert(null);
    }
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
        justifyContent: 'space-between',
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
          justifyContent: 'center',
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
          onClick={() => navigate('/engineer/live-telemetry')}
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

        {/* Dismiss with 1.5°C Hysteresis */}
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
