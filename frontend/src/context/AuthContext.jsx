import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const MASTER_USERS_KEY = 'titanminds_users_master_db_final';
const CURRENT_USER_KEY = 'titanminds_user';
const BROADCAST_CHANNEL = 'titanmind_auth_sync';
const HEARTBEAT_KEY = 'titanminds_online_heartbeats'; // { [userId]: lastSeenTimestamp }

// Default seed users
const INITIAL_USERS = [
  { id: 'usr-1', name: 'Admin User',    email: 'admin@mail.com',   password: '1234', role: 'admin',    status: 'approved', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'usr-2', name: 'Plant Manager', email: 'manager@mail.com', password: '1234', role: 'manager',  status: 'approved', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'usr-3', name: 'Lead Engineer', email: 'engg@mail.com',    password: '1234', role: 'engineer', status: 'approved', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// ── Read the master user list directly from localStorage ──────────────────────
const readUsersFromStorage = () => {
  try {
    const raw = localStorage.getItem(MASTER_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
};

// ── One-time startup: seed the master key if it doesn't exist yet ─────────────
const bootstrapUsers = () => {
  const existing = readUsersFromStorage();
  if (existing) return existing;

  // First-ever load: migrate from any old keys + add seed users
  let recovered = [];
  ['titanmind_users_master_db', 'titanmind_users_db_v3', 'titanmind_users_db_v2', 'titanmind_users_db_v1'].forEach(k => {
    try {
      const leg = localStorage.getItem(k);
      if (!leg) return;
      const parsed = JSON.parse(leg);
      if (!Array.isArray(parsed)) return;
      parsed.forEach(u => {
        if (u?.email && !recovered.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
          recovered.push(u);
        }
      });
    } catch {}
  });

  INITIAL_USERS.forEach(seed => {
    if (!recovered.some(m => m.email.toLowerCase() === seed.email.toLowerCase())) {
      recovered.push(seed);
    }
  });

  try { localStorage.setItem(MASTER_USERS_KEY, JSON.stringify(recovered)); } catch {}
  return recovered;
};

// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(bootstrapUsers);
  const channelRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // ── Heartbeat: mark this user as online every 20s ───────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const ping = () => {
      try {
        const raw = localStorage.getItem(HEARTBEAT_KEY);
        const beats = raw ? JSON.parse(raw) : {};
        beats[user.id] = Date.now();
        localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(beats));
      } catch {}
    };

    ping(); // immediate first ping
    const hb = setInterval(ping, 20000); // every 20 seconds

    const clearBeat = () => {
      try {
        const raw = localStorage.getItem(HEARTBEAT_KEY);
        const beats = raw ? JSON.parse(raw) : {};
        delete beats[user.id];
        localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(beats));
      } catch {}
    };

    window.addEventListener('beforeunload', clearBeat);
    return () => {
      clearInterval(hb);
      clearBeat();
      window.removeEventListener('beforeunload', clearBeat);
    };
  }, [user?.id]);

  // ── Pull the latest users from localStorage into React state ────────────────
  const syncFromStorage = useCallback(() => {
    const fresh = readUsersFromStorage();
    if (fresh) setUsers(fresh);
  }, []);

  // ── Persist users + broadcast to ALL windows (BroadcastChannel) ────────────
  const saveUsers = useCallback((newList) => {
    try {
      localStorage.setItem(MASTER_USERS_KEY, JSON.stringify(newList));
    } catch {}
    setUsers(newList);

    // BroadcastChannel: fires in EVERY other window/tab on the same origin
    try {
      channelRef.current?.postMessage({ type: 'USERS_UPDATED' });
    } catch {}

    // Also trigger storage event for same-window listeners (belt + suspenders)
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: MASTER_USERS_KEY,
        newValue: JSON.stringify(newList),
        storageArea: localStorage,
      }));
    } catch {}
  }, []);

  // ── Lifecycle: Set up BroadcastChannel + storage event + 800ms poller ───────
  useEffect(() => {
    // 1. BroadcastChannel — most reliable cross-window method
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.onmessage = (evt) => {
        if (evt.data?.type === 'USERS_UPDATED') syncFromStorage();
      };
      channelRef.current = bc;
    } catch {
      channelRef.current = null; // BroadcastChannel not supported (very rare)
    }

    // 2. Native storage event — fires when ANOTHER window writes localStorage
    window.addEventListener('storage', syncFromStorage);

    // 3. Polling fallback — catches everything else (same-window, Safari, etc.)
    const poll = setInterval(syncFromStorage, 800);

    return () => {
      channelRef.current?.close();
      window.removeEventListener('storage', syncFromStorage);
      clearInterval(poll);
    };
  }, [syncFromStorage]);

  // ── Kick logged-in user out if their status/role changed ────────────────────
  useEffect(() => {
    if (!user) return;
    const inDb = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (!inDb) return;
    if (inDb.status !== 'approved') {
      logout();
    } else if (inDb.role !== user.role) {
      const updated = { ...user, role: inDb.role, name: inDb.name };
      setUser(updated);
      try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated)); } catch {}
    }
  }, [users]);

  /* ─── Auth Methods ───────────────────────────────────────────────────────── */

  const login = (email, password) => {
    const clean = email.trim().toLowerCase();
    // Always read directly from storage so we never miss a just-registered user
    const list = readUsersFromStorage() ?? users;
    const found = list.find(u => u.email.toLowerCase() === clean);

    if (!found)                      return { success: false, message: 'Operator ID not found in system.' };
    if (found.password !== password) return { success: false, message: 'Invalid Security Key.' };
    if (found.status === 'pending')  return { success: false, isPending: true, message: 'Account pending Admin approval.' };
    if (found.status === 'rejected') return { success: false, message: 'Registration rejected by Admin.' };

    const path = found.role === 'manager' ? '/manager' : found.role === 'engineer' ? '/engineer' : '/admin';
    const userData = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(userData);
    try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData)); } catch {}
    return { success: true, redirectPath: path };
  };

  const register = (name, email, password) => {
    const clean = email.trim().toLowerCase();
    // Read directly from storage for the freshest list
    const list = readUsersFromStorage() ?? users;

    if (list.some(u => u.email.toLowerCase() === clean)) {
      return { success: false, message: 'Email already registered in the system.' };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: clean,
      password,
      role: 'engineer',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    saveUsers([newUser, ...list]);
    return { success: true, message: 'Registration request submitted! Waiting for Admin approval.' };
  };

  const approveUser = (userId, assignedRole) => {
    const list = readUsersFromStorage() ?? users;
    saveUsers(list.map(u => u.id === userId ? { ...u, status: 'approved', role: assignedRole || u.role } : u));
  };

  const rejectUser = (userId) => {
    const list = readUsersFromStorage() ?? users;
    saveUsers(list.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
  };

  const updateUserRole = (userId, newRole) => {
    const list = readUsersFromStorage() ?? users;
    saveUsers(list.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const deleteUser = (userId) => {
    const list = readUsersFromStorage() ?? users;
    saveUsers(list.filter(u => u.id !== userId));
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(CURRENT_USER_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, users, login, register, approveUser, rejectUser, updateUserRole, deleteUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
