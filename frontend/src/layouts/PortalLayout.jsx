import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  LogOut, Menu, X, Cpu, Bell, Search, Sun, Moon,
  AlertTriangle, Clock, UserPlus, Thermometer, Zap, Activity, CheckCircle2, ChevronRight
} from 'lucide-react';
import { adminNavItems, managerNavItems, engineerNavItems } from '../config/navigation';
import AlarmSystem from '../components/AlarmSystem';

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const MASTER_KEY = 'titanminds_users_master_db_final';
const ALERTS_API = 'https://titanminds-backend.onrender.com/api/exp32/alerts?limit=20';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const timeAgo = (ts) => {
  if (!ts) return '';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const severityColor = (sev) => {
  if (!sev) return '#00e5ff';
  const s = sev.toLowerCase();
  if (s === 'critical') return '#ff3b3b';
  if (s === 'warning')  return '#ffb300';
  if (s === 'info')     return '#00e5ff';
  return '#00ff88';
};

const severityIcon = (sev) => {
  if (!sev) return Activity;
  const s = sev.toLowerCase();
  if (s === 'critical') return Zap;
  if (s === 'warning')  return AlertTriangle;
  if (s === 'info')     return Thermometer;
  return Activity;
};

/* ─── Notification Bell + Panel ────────────────────────────────────────────── */
const NotificationPanel = ({ userRole }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const buildNotifications = useCallback(async () => {
    setLoading(true);
    const items = [];

    /* 1. Pending registration requests (admin only) */
    if (userRole === 'admin') {
      try {
        const raw = localStorage.getItem(MASTER_KEY);
        if (raw) {
          const users = JSON.parse(raw);
          const pending = users
            .filter(u => u.status === 'pending')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

          pending.forEach(u => {
            items.push({
              id: `reg-${u.id}`,
              type: 'registration',
              title: 'New Registration Request',
              message: `${u.name} (${u.email}) is waiting for approval`,
              ts: u.createdAt,
              color: '#ffb300',
              Icon: UserPlus,
            });
          });
        }
      } catch {}
    }

    /* 2. Recent system alerts from API (exclude vibration) */
    try {
      const res = await fetch(ALERTS_API);
      if (res.ok) {
        const data = await res.json();
        const alerts = (Array.isArray(data) ? data : data.alerts || data.data || [])
          .filter(a => {
            const msg = (a.message || a.type || a.alert || a.code || '').toLowerCase();
            return !msg.includes('vibration') && !msg.includes('sound') && !msg.includes('noise');
          })
          .sort((a, b) => new Date(b.timestamp || b.createdAt || b.time) - new Date(a.timestamp || a.createdAt || a.time))
          .slice(0, 5);

        alerts.forEach(a => {
          const msg = a.message || a.alert || a.type || 'System alert';
          const sev = a.severity || a.level || 'info';
          const ts  = a.timestamp || a.createdAt || a.time;
          items.push({
            id: `alert-${a._id || ts}`,
            type: 'alert',
            title: sev.toUpperCase(),
            message: msg,
            ts,
            color: severityColor(sev),
            Icon: severityIcon(sev),
          });
        });
      }
    } catch {}

    /* Sort all by time desc, keep top 5 */
    items.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    setNotifications(items.slice(0, 5));
    setLoading(false);
  }, [userRole]);

  /* Reload when panel opens + poll every 10s while open */
  useEffect(() => {
    if (!open) return;
    buildNotifications();
    const poll = setInterval(buildNotifications, 10000);
    return () => clearInterval(poll);
  }, [open, buildNotifications]);

  /* Listen for new registrations */
  useEffect(() => {
    if (!open) return;
    const onUpdate = () => buildNotifications();
    window.addEventListener('storage', onUpdate);
    let bc = null;
    try {
      bc = new BroadcastChannel('titanmind_auth_sync');
      bc.onmessage = () => buildNotifications();
    } catch {}
    return () => {
      window.removeEventListener('storage', onUpdate);
      bc?.close();
    };
  }, [open, buildNotifications]);

  /* Click outside to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.length;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'relative', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '6px', color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.2s',
        }}
        title="Notifications"
      >
        <Bell size={22} color={open ? '#00e5ff' : 'var(--text-primary)'} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#ff3b3b', border: '2px solid var(--bg-surface)',
            fontSize: '0.6rem', fontWeight: 900, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace',
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      <div style={{
        position: 'fixed',
        top: '70px',
        right: open ? '0' : '-420px',
        width: '400px',
        height: 'calc(100vh - 70px)',
        background: 'rgba(6,11,28,0.97)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(0,229,255,0.15)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.6)' : 'none',
        zIndex: 9999,
        transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Panel Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,229,255,0.03)',
        }}>
          <div>
            <div style={{
              fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700,
              letterSpacing: '0.2em', color: '#00e5ff', textTransform: 'uppercase', marginBottom: 4,
            }}>
              System Notifications
            </div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
              TOP 5 RECENT EVENTS · LIVE FEED
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.7rem', fontFamily: 'monospace',
            }}
          >
            <X size={14} /> CLOSE
          </button>
        </div>

        {/* Scan line accent */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #00e5ff44, transparent)',
          animation: 'notif-scan 3s linear infinite',
        }} />

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <div style={{ marginBottom: 8, color: '#00e5ff', opacity: 0.6 }}>
                <Activity size={24} />
              </div>
              FETCHING LIVE FEED...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle2 size={32} color="#00ff88" style={{ opacity: 0.4, marginBottom: 12 }} />
              <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                All Systems Nominal
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: '0.68rem', marginTop: 4 }}>
                No recent alerts or requests
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n, i) => {
                const Icon = n.Icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: `rgba(${n.color === '#ff3b3b' ? '255,59,59' : n.color === '#ffb300' ? '255,179,0' : n.color === '#00ff88' ? '0,255,136' : '0,229,255'},0.04)`,
                      border: `1px solid ${n.color}22`,
                      position: 'relative',
                      overflow: 'hidden',
                      animation: `notif-slide-in 0.3s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    {/* Colored left stripe */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px',
                      background: n.color,
                      boxShadow: `0 0 8px ${n.color}88`,
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '6px' }}>
                      {/* Icon */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: `${n.color}18`, border: `1px solid ${n.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={14} color={n.color} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 800,
                          color: n.color, letterSpacing: '0.1em', marginBottom: '4px',
                        }}>
                          {n.title}
                        </div>
                        <div style={{
                          fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)',
                          lineHeight: 1.4, marginBottom: '6px',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {n.message}
                        </div>
                        <div style={{
                          fontSize: '0.62rem', fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.3)',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Clock size={9} />
                          {timeAgo(n.ts)}
                          {n.ts && (
                            <span style={{ opacity: 0.5 }}>
                              · {new Date(n.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(0,229,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)' }}>
            TITANMIND IIoT · LIVE NOTIFICATION FEED
          </div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(0,229,255,0.4)' }}>
            ● LIVE
          </div>
        </div>
      </div>

      <style>{`
        @keyframes notif-scan {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

/* ─── Main Portal Layout ────────────────────────────────────────────────────── */
const PortalLayout = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role || '';
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getNavItems = () => {
    switch (userRole) {
      case 'admin':    return adminNavItems;
      case 'manager':  return managerNavItems;
      case 'engineer': return engineerNavItems;
      default:         return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    toast.success('Secure Session Terminated');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background-color var(--transition-normal)' }}>
      <AlarmSystem />

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '80px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div style={{ padding: 'var(--spacing-6)', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid var(--border-color)' }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Cpu color="var(--color-primary)" size={28} />
              <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>Titan<span style={{ color: 'var(--color-primary)' }}>Minds</span></span>
            </div>
          ) : (
            <Cpu color="var(--color-primary)" size={32} />
          )}
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: 'var(--spacing-4) 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 var(--spacing-4)', marginBottom: 'var(--spacing-2)', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: sidebarOpen ? 'block' : 'none' }}>
            Modules
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-3) var(--spacing-6)',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    textDecoration: 'none', transition: 'all 0.2s',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center'
                  }}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span style={{ fontSize: '0.95rem', fontWeight: isActive ? '600' : '400' }}>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 'bold', fontSize: '1.1rem',
                flexShrink: 0, boxShadow: '0 0 12px rgba(56,189,248,0.3)'
              }}>
                {(user?.name || userRole).charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', textTransform: 'capitalize', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || `${userRole} Portal`}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || ''}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Secure Session Active
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', width: '100%', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span style={{ fontWeight: '600' }}>Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--spacing-8)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 'var(--spacing-2)' }}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', background: 'var(--bg-base)', padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', width: '300px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input type="text" placeholder="Search modules or machines..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <button
              onClick={toggleTheme}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-2)', borderRadius: '50%' }}
            >
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>

            {/* Notification Bell */}
            <NotificationPanel userRole={userRole} />
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: 'var(--spacing-8)', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
