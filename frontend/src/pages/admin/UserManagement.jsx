import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Users, UserCheck, UserX, Clock, Shield, Check, X, Eye, 
  Search, ChevronDown, ChevronUp, Wrench, Activity, CheckCircle2, AlertCircle
} from 'lucide-react';

const MASTER_KEY = 'titanminds_users_master_db_final';
const HEARTBEAT_KEY = 'titanminds_online_heartbeats';
const ONLINE_THRESHOLD_MS = 60000; // consider online if heartbeat within 60s

// Read users directly from localStorage — no context dependency
const readUsersDirectly = () => {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

// Read which users are online — reads directly from localStorage every call.
// No stale state: component already re-renders every 500ms from the users poll.
const isUserOnline = (userId) => {
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    if (!raw) return false;
    const beats = JSON.parse(raw);
    const ts = beats[userId];
    if (!ts) return false;
    return Date.now() - ts < ONLINE_THRESHOLD_MS;
  } catch {
    return false;
  }
};

/* ─── Color System (Adapts Automatically to Light & Dark Mode) ───────────── */
const C = {
  cyan:      'var(--color-cyan-text)',
  electric:  'var(--color-purple-text)',
  green:     'var(--color-green-text)',
  amber:     'var(--color-amber-text)',
  red:       'var(--color-red-text)',
  navy:      'var(--panel-navy)',
  panel:     'var(--panel-bg)',
  border:    'var(--panel-border)',
  borderHot: 'var(--panel-border-hot)',
};

const STYLES = `
@keyframes scanline {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  70%  { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(2.4); opacity: 0; }
}
`;

/* ─── Shared UI Components ─────────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-um" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-um)" />
  </svg>
);

const Pulse = ({ color = C.green, size = 8 }) => (
  <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4, animation: 'pulse-ring 2s ease-out infinite' }} />
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
  </span>
);

const ScanLine = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}88, transparent)`, animation: 'scanline 4s linear infinite', pointerEvents: 'none', zIndex: 2 }} />
);

const Panel = ({ children, style = {}, glow, hot }) => (
  <div style={{
    background: C.panel,
    border: `1px solid ${hot ? C.borderHot : C.border}`,
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: glow
      ? `0 0 30px var(--panel-glow, rgba(0,229,255,0.06)), inset 0 1px 0 var(--panel-inset, rgba(0,229,255,0.08))`
      : `inset 0 1px 0 var(--panel-inset, rgba(0,229,255,0.04))`,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

const Sect = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1.75rem 0 0.9rem', userSelect: 'none' }}>
    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.cyan, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
    {action}
  </div>
);

const relTime = ts => {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

/* ════════════════════════════════════════════════════════════════════════════ */
/*                       USER MANAGEMENT & APPROVAL SYSTEM                      */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function UserManagement() {
  const { approveUser, rejectUser, updateUserRole, deleteUser } = useAuth();

  // ── Own direct localStorage state — 500ms self-refresh, no context needed ──
  const [users, setUsers] = useState(readUsersDirectly);

  const refreshUsers = useCallback(() => {
    const fresh = readUsersDirectly();
    setUsers(fresh);
  }, []);

  useEffect(() => {
    refreshUsers();

    // Poll every 500ms
    const poll = setInterval(refreshUsers, 500);

    // BroadcastChannel for instant cross-window notification
    let bc = null;
    try {
      bc = new BroadcastChannel('titanmind_auth_sync');
      bc.onmessage = (evt) => {
        if (evt.data?.type === 'USERS_UPDATED') refreshUsers();
      };
    } catch {}

    // Native storage event (fires when another window writes)
    window.addEventListener('storage', refreshUsers);

    return () => {
      clearInterval(poll);
      bc?.close();
      window.removeEventListener('storage', refreshUsers);
    };
  }, [refreshUsers]);

  // Collapsible Pending Requests Section state
  const [isPendingCollapsed, setIsPendingCollapsed] = useState(false);
  
  // Active View Tab: 'all' vs 'pending'
  const [activeTab, setActiveTab] = useState('all');

  // Review Modal State
  const [reviewUser, setReviewUser] = useState(null);
  const [assignedRole, setAssignedRole] = useState('engineer');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Derived User Category Lists
  const pendingUsers  = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved'), [users]);


  // Derived KPI Counts — total is approved users only (not pending/rejected)
  const kpis = useMemo(() => {
    const total    = approvedUsers.length;  // ← only APPROVED platform users
    const pending  = pendingUsers.length;
    const admins   = approvedUsers.filter(u => u.role === 'admin').length;
    const managers = approvedUsers.filter(u => u.role === 'manager').length;
    const engineers= approvedUsers.filter(u => u.role === 'engineer').length;
    return { total, pending, admins, managers, engineers };
  }, [users, pendingUsers, approvedUsers]);

  // Filtered Approved Users
  const filteredApproved = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return approvedUsers;
    return approvedUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      u.role.toLowerCase().includes(q)
    );
  }, [approvedUsers, searchQuery]);

  // Action Handlers
  const handleApprove = (userId, role) => {
    approveUser(userId, role);
    toast.success('User Account Approved Successfully!');
    setReviewUser(null);
  };

  const handleReject = (userId) => {
    rejectUser(userId);
    toast.error('User Registration Request Rejected');
    setReviewUser(null);
  };

  const handleRoleChange = (userId, newRole) => {
    updateUserRole(userId, newRole);
    toast.success(`Role Updated to ${newRole.toUpperCase()}`);
  };

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', color: 'var(--panel-text-primary)', position: 'relative', paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{STYLES}</style>

      {/* Hex Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <HexGrid />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(0,229,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 60%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <Panel style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem' }} glow>
          <ScanLine />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 3, height: 28, background: `linear-gradient(180deg, ${C.cyan}, ${C.electric})`, borderRadius: 2 }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.cyan} 60%, ${C.electric} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  CONSOLIDATED USER MANAGEMENT & ACCESS CONTROL
                </h1>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', paddingLeft: 15 }}>
                ADMIN PORTAL · PENDING REGISTRATION REQUEST APPROVALS & ROLE MODIFICATIONS
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab(activeTab === 'all' ? 'pending' : 'all')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                  background: activeTab === 'pending' ? `${C.amber}22` : 'rgba(0,229,255,0.06)',
                  border: `1px solid ${activeTab === 'pending' ? C.amber : C.border}`,
                  borderRadius: 8, color: activeTab === 'pending' ? C.amber : C.cyan,
                  fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Clock size={14} />
                {activeTab === 'pending' ? 'SHOW ALL USERS' : `VIEW PENDING REQUESTS (${pendingUsers.length})`}
              </button>
            </div>
          </div>
        </Panel>

        {/* ══ KPI SUMMARY CARDS ═══════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Registered Users', value: kpis.total,     color: C.cyan,     sub: 'All System Registrations', icon: Users },
            { label: 'Pending Approvals',      value: kpis.pending,   color: kpis.pending > 0 ? C.amber : C.green, sub: 'Requires Admin Authorization', icon: Clock },
            { label: 'Active Admins',          value: kpis.admins,    color: C.red,      sub: 'Full System Control', icon: Shield },
            { label: 'Plant Managers',         value: kpis.managers,  color: C.electric, sub: 'Operations & Production', icon: Activity },
            { label: 'Lead Engineers',         value: kpis.engineers, color: C.green,    sub: 'Diagnostics & Maintenance', icon: Wrench },
          ].map(({ label, value, color, sub, icon: Icon }) => (
            <Panel key={label} style={{ padding: '0.9rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--panel-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{label}</div>
                <Icon size={16} color={color} opacity={0.7} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 18px ${color}44` }}>{value}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--panel-text-faint)', marginTop: 5, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{sub}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
            </Panel>
          ))}
        </div>

        {/* ══ SECTION 1: PENDING REGISTRATION REQUESTS (COLLAPSIBLE) ═══════════ */}
        {activeTab !== 'all' || pendingUsers.length > 0 ? (
          <>
            <Sect 
              action={
                <button
                  onClick={() => setIsPendingCollapsed(!isPendingCollapsed)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                    borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem',
                    fontFamily: 'monospace', cursor: 'pointer'
                  }}
                >
                  {isPendingCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  {isPendingCollapsed ? 'EXPAND PANEL' : 'COLLAPSE PANEL'}
                </button>
              }
            >
              <Clock size={14} color={C.amber} />
              PENDING REGISTRATION REQUESTS ({pendingUsers.length})
            </Sect>

            {!isPendingCollapsed && (
              <Panel style={{ overflowX: 'auto', marginBottom: '1.5rem', border: `1px solid ${pendingUsers.length > 0 ? C.amber + '44' : C.border}` }}>
                {pendingUsers.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <CheckCircle2 size={32} color={C.green} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-secondary)' }}>
                      No Pending Registration Requests.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--panel-text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
                      All user accounts have been reviewed and authorized by Admin.
                    </div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, color: 'var(--panel-thead-color)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {['Operator Name', 'Email Address', 'Requested On', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,179,0,0.02)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--panel-text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Pulse color={C.amber} size={6} />
                              {u.name}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: C.cyan }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--panel-text-muted)', fontFamily: 'monospace' }}>
                            {relTime(u.createdAt)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 800, background: `${C.amber}18`, color: C.amber, border: `1px solid ${C.amber}33`, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={10} /> PENDING APPROVAL
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => { setReviewUser(u); setAssignedRole(u.role || 'engineer'); }}
                                style={{ padding: '4px 10px', background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, borderRadius: 4, color: C.cyan, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <Eye size={12} /> Review
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, u.role || 'engineer')}
                                style={{ padding: '4px 10px', background: `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: 4, color: C.green, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(u.id)}
                                style={{ padding: '4px 10px', background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 4, color: C.red, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            )}
          </>
        ) : null}

        {/* ══ SECTION 2: APPROVED ACTIVE PLATFORM USERS ════════════════════════ */}
        <Sect>
          <UserCheck size={14} color={C.green} />
          APPROVED PLATFORM USERS & ROLE MODIFICATION
        </Sect>
        
        {/* Search Bar */}
        <Panel style={{ padding: '0.85rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search active users by Name, Email, or Role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem', background: 'var(--panel-input-bg)', border: `1px solid ${C.border}`, borderRadius: 8, color: 'var(--panel-text-primary)', fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none' }}
              />
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: C.cyan }} />
            </div>
          </div>
        </Panel>

        <Panel style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: 'var(--panel-thead-color)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {['Operator Name', 'Email Address', 'Assigned Role & Portal Access', 'Status', 'Registered Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApproved.map(u => {
                const roleColor = u.role === 'admin' ? C.red : u.role === 'manager' ? C.electric : C.green;
                const online = isUserOnline(u.id);
                const dotColor = online ? C.green : C.red;
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>

                    {/* Name with online dot */}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--panel-text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Online / Offline dot */}
                        <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8, flexShrink: 0 }}>
                          {online && (
                            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor, opacity: 0.4, animation: 'pulse-ring 2s ease-out infinite' }} />
                          )}
                          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                        </span>
                        {u.name}
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: C.cyan }}>
                      {u.email}
                    </td>

                    {/* Dynamic Role Change Dropdown */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{
                          padding: '4px 10px', background: 'rgba(0,0,0,0.5)',
                          border: `1px solid ${roleColor}66`, borderRadius: 6,
                          color: roleColor, fontSize: '0.72rem', fontFamily: 'monospace',
                          fontWeight: 800, outline: 'none', cursor: 'pointer'
                        }}
                      >
                        <option value="admin" style={{ background: C.navy, color: C.red }}>Admin Portal (/admin)</option>
                        <option value="manager" style={{ background: C.navy, color: C.electric }}>Manager Portal (/manager)</option>
                        <option value="engineer" style={{ background: C.navy, color: C.green }}>Engineer Portal (/engineer)</option>
                      </select>
                    </td>

                    {/* Status — generic approved badge */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 800, background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}33`, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={10} /> ACTIVE & APPROVED
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--panel-text-faint)', fontFamily: 'monospace' }}>
                      {relTime(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.email !== 'admin@mail.com' && (
                        <button
                          onClick={() => handleReject(u.id)}
                          style={{ padding: '3px 8px', background: 'rgba(255,59,59,0.1)', border: `1px solid ${C.red}33`, borderRadius: 4, color: C.red, fontSize: '0.68rem', fontFamily: 'monospace', cursor: 'pointer' }}
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* ══ REVIEW MODAL (FOR PENDING USERS) ════════════════════════════════ */}
        {reviewUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
            <Panel style={{ width: '100%', maxWidth: 480, padding: '1.75rem' }} glow hot>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '0.75rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--panel-text-primary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} color={C.cyan} /> REVIEW USER REGISTRATION
                </div>
                <button onClick={() => setReviewUser(null)} style={{ background: 'none', border: 'none', color: 'var(--panel-text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--panel-text-muted)' }}>FULL NAME:</span> <b style={{ color: 'var(--panel-text-primary)' }}>{reviewUser.name}</b></div>
                <div><span style={{ color: 'var(--panel-text-muted)' }}>EMAIL ADDRESS:</span> <b style={{ color: C.cyan }}>{reviewUser.email}</b></div>
                <div><span style={{ color: 'var(--panel-text-muted)' }}>REQUEST TIMESTAMP:</span> <b style={{ color: 'var(--panel-text-secondary)' }}>{new Date(reviewUser.createdAt).toLocaleString()}</b></div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: '0.7rem', color: C.amber, display: 'block', marginBottom: 6 }}>ASSIGN INITIAL PORTAL ROLE *</label>
                  <select
                    value={assignedRole}
                    onChange={e => setAssignedRole(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--panel-select-bg)', border: `1px solid ${C.border}`, borderRadius: 6, color: 'var(--panel-select-color)', fontSize: '0.82rem', fontFamily: 'monospace', outline: 'none' }}
                  >
                    <option value="engineer">Engineer Portal (/engineer)</option>
                    <option value="manager">Manager Portal (/manager)</option>
                    <option value="admin">Admin Portal (/admin)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleReject(reviewUser.id)}
                  style={{ padding: '8px 16px', background: `${C.red}22`, border: `1px solid ${C.red}`, borderRadius: 6, color: C.red, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <X size={14} /> REJECT REQUEST
                </button>
                <button
                  onClick={() => handleApprove(reviewUser.id, assignedRole)}
                  style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${C.green}44, ${C.cyan}44)`, border: `1px solid ${C.green}`, borderRadius: 6, color: 'var(--panel-text-primary)', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} /> CONFIRM APPROVAL
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderRadius: 8, background: 'rgba(0,229,255,0.03)', border: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--panel-text-faint)', letterSpacing: '0.06em' }}>
            ■ CONSOLIDATED USER CONTROL: MANDATORY ADMIN APPROVAL ENFORCED · ZERO UNCHECKED REGISTRATIONS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--panel-text-faint)' }}>
            <Pulse color={C.cyan} size={5} />
            TITANMIND IIoT · USER MANAGEMENT
          </div>
        </div>

      </div>
    </div>
  );
}
