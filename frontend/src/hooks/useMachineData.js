import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const MAX_HISTORY       = 40;
const HTTP_BASE         = 'https://titanminds-backend.onrender.com';
const WS_BASE           = 'wss://titanminds-backend.onrender.com';
const OFFLINE_AFTER_MS  = 6000;

// Module-level singleton to guarantee ONLY 1 WebSocket connection exists per browser tab
let globalWs = null;

const MachineDataContext = createContext(null);

/* ─────────────────────────────────────────────────────────────────────────── */

export const MachineDataProvider = ({ children }) => {
  const [machineData,  setMachineData]  = useState(null);
  const [isOnline,     setIsOnline]     = useState(false);
  const [machineState, setMachineState] = useState('OFFLINE');
  const [streams,      setStreams]      = useState(() => Array.from({ length: 4 }, () => []));

  const lastTimestampRef  = useRef(null);
  const lastValidTempRef  = useRef(28.5);
  const reconnectTimerRef = useRef(null);
  const offlineTimerRef   = useRef(null);
  const offlineCountRef   = useRef(0);

  /* ── Debounced Offline & Online Confirmation ─────────────────────────────
     Filter out single/transient offline packets. Require 3 consecutive confirmed
     offline signals before transitioning the UI to OFFLINE state.
  ── */
  const confirmOffline = (record) => {
    offlineCountRef.current += 1;
    if (offlineCountRef.current >= 3) {
      if (record) setMachineData(record);
      setIsOnline(false);
      setMachineState('OFFLINE');
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    }
  };

  const confirmOnline = (record) => {
    offlineCountRef.current = 0; // Reset offline counter on valid telemetry frame
    setMachineData(record);
    setIsOnline(true);

    const sensor      = record.sensor || record;
    const isVibrating = Boolean(sensor.vibration_detected) || Number(sensor.vibration) > 0;
    setMachineState(isVibrating ? 'RUNNING' : 'IDLE');

    appendToStreams(record);
    armOfflineTimer();
  };

  /* ── Offline sentinel timer ── */
  const armOfflineTimer = () => {
    if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    offlineTimerRef.current = setTimeout(() => {
      // If 6 seconds pass with no telemetry, increment offline counter
      confirmOffline(null);
    }, OFFLINE_AFTER_MS);
  };

  /* ── Stream appender ── */
  const appendToStreams = (record) => {
    const sensor       = record.sensor || record;
    const rawTimestamp = sensor.timestamp || record.timestamp || record.updated_at || record.created_at;

    if (rawTimestamp && rawTimestamp === lastTimestampRef.current) return;
    if (rawTimestamp) lastTimestampRef.current = rawTimestamp;

    const time = rawTimestamp
      ? new Date(rawTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let temp = (sensor.temperature !== undefined && Number(sensor.temperature) > 0)
      ? Number(sensor.temperature)
      : lastValidTempRef.current;

    if (temp >= 70 && temp <= 150) temp = (temp - 32) * (5 / 9);

    if (temp > 45 || temp < 15 || Math.abs(temp - lastValidTempRef.current) > 15) {
      temp = lastValidTempRef.current + (Math.random() * 0.4 - 0.2);
    } else {
      lastValidTempRef.current = temp;
    }
    temp = Number(temp.toFixed(1));

    const vib      = sensor.vibration   !== undefined ? Number(sensor.vibration)   : 0;
    const sound    = sensor.sound       !== undefined ? Number(sensor.sound)       :
                     sensor.raw_sound   !== undefined ? Number(sensor.raw_sound)   : 0;
    const humidity = sensor.humidity    !== undefined ? Number(sensor.humidity)    : 0;

    setStreams(prev => {
      const next = prev.map(s => [...s]);
      const push = (idx, val) => {
        next[idx].push({ time, val });
        if (next[idx].length > MAX_HISTORY) next[idx].shift();
      };
      push(0, temp);
      push(1, vib);
      push(2, sound);
      push(3, humidity);
      return next;
    });
  };

  /* ── Process sensor update ── */
  const processSensorUpdate = (record) => {
    if (!record) return;

    if (record.status === 'offline') {
      confirmOffline(record);
    } else {
      confirmOnline(record);
    }
  };

  /* ── Merge LLM prediction update ── */
  const mergePredictionUpdate = (record) => {
    if (!record?.prediction) return;
    setMachineData(prev => {
      if (!prev) return prev;
      return { ...prev, prediction: { ...(prev.prediction || {}), ...record.prediction } };
    });
  };

  /* ── HTTP bootstrap ── */
  const bootstrapFromHTTP = async () => {
    try {
      const [liveRes, updatesRes] = await Promise.all([
        fetch(`${HTTP_BASE}/api/exp32/live`),
        fetch(`${HTTP_BASE}/api/exp32/allupdates?limit=40`),
      ]);

      if (liveRes.ok) {
        const data = await liveRes.json();
        const live = Array.isArray(data) ? data : (data.live || []);
        if (live.length > 0) processSensorUpdate(live[0]);
      }

      if (updatesRes.ok) {
        const uData = await updatesRes.json();
        const readings = uData.readings || uData;
        if (Array.isArray(readings) && readings.length > 0) {
          const chronReadings = [...readings].reverse();
          const s0 = [], s1 = [], s2 = [], s3 = [];
          chronReadings.forEach(r => {
            const sensor = r.sensor || r;
            const rawTs = sensor.timestamp || r.created_at || r.updated_at;
            const time = rawTs
              ? new Date(rawTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '—';

            let temp = Number(sensor.temperature || 28.5);
            if (temp >= 70 && temp <= 150) temp = (temp - 32) * (5 / 9);
            if (temp > 45 || temp < 15) temp = 28.5;
            temp = Number(temp.toFixed(1));

            const vib = Number(sensor.vibration || 0);
            const sound = Number(sensor.sound ?? sensor.raw_sound ?? 0);
            const hum = Number(sensor.humidity || 0);

            s0.push({ time, val: temp });
            s1.push({ time, val: vib });
            s2.push({ time, val: sound });
            s3.push({ time, val: hum });
          });
          setStreams([s0, s1, s2, s3]);
        }
      }
    } catch (err) {
      console.warn('[TitanMind] Bootstrap HTTP fetch failed:', err.message);
    }
  };

  /* ── WebSocket Singleton Connection ── */
  const connectWebSocket = () => {
    if (globalWs) {
      if (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    try {
      const ws = new WebSocket(WS_BASE);
      globalWs = ws;

      ws.onopen = () => {
        console.log('[TitanMind] Single Shared WebSocket Connected');
        bootstrapFromHTTP();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.event === 'sensor_update' && msg.data) {
            const record = msg.data.record || msg.data;
            processSensorUpdate(record);
          } else if (msg.event === 'prediction_updated' && msg.data) {
            const record = msg.data.record || msg.data;
            mergePredictionUpdate(record);
          }
        } catch (err) {
          console.error('[TitanMind] WS message parse error:', err);
        }
      };

      ws.onclose = () => {
        if (globalWs === ws) globalWs = null;
        console.log('[TitanMind] Single WebSocket closed — reconnecting in 3s…');
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.onclose = null;
        if (globalWs === ws) globalWs = null;
        try { ws.close(); } catch {}
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
      };
    } catch (err) {
      console.warn('[TitanMind] WebSocket init error:', err);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  /* ── Mount / Unmount ── */
  useEffect(() => {
    bootstrapFromHTTP();
    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (offlineTimerRef.current)   clearTimeout(offlineTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return React.createElement(
    MachineDataContext.Provider,
    { value: { machineData, streams, isOnline, machineState } },
    children
  );
};

export const useMachineData = () => {
  const context = useContext(MachineDataContext);
  if (!context) throw new Error('useMachineData must be used within a MachineDataProvider');
  return context;
};
