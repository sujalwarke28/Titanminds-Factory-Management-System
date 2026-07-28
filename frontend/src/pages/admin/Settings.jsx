import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, Building, Sliders, ShieldCheck, Database, Download, 
  Upload, Volume2, Bell, Sun, Moon, RefreshCw, Key, History, 
  CheckCircle2, AlertTriangle, Info, Clock, Save, Play, Layers,
  ChevronLeft, ChevronRight, Search, Filter, AlertOctagon, Trash2, FileText
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { getStoredAuditLogs, logAuditEvent } from '../../services/auditLogger';
import { playAlertTonePreview } from '../../services/alertTonePlayer';
import { 
  getSettings, saveSettings, triggerDatabaseSync, 
  updatePassword, generateSystemBackup, getLastBackupInfo, 
  restoreSystemBackup, getBackupHistory, deleteBackupHistoryItem
} from '../../services/settingsService';

/* ─── Color System (Matches Factory Overview & Theme Standard) ───────────── */
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
.settings-tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  background: transparent;
  color: var(--panel-text-muted);
}
.settings-tab-btn:hover {
  color: var(--panel-text-primary);
  background: var(--panel-subcard-bg, rgba(255,255,255,0.03));
}
.settings-tab-btn.active {
  color: var(--color-cyan-text);
  background: var(--panel-subcard-bg, rgba(0,229,255,0.06));
  border-color: rgba(0,229,255,0.3);
  box-shadow: 0 0 20px rgba(0,229,255,0.1);
}
.form-label {
  font-size: 0.72rem;
  font-family: monospace;
  font-weight: 800;
  color: var(--panel-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  display: block;
}
.form-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--panel-subcard-bg, rgba(255,255,255,0.03));
  border: 1px solid var(--panel-border, rgba(255,255,255,0.1));
  border-radius: 8px;
  color: var(--panel-text-primary);
  font-family: monospace;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  border-color: var(--color-cyan-text);
  box-shadow: 0 0 15px rgba(0,229,255,0.15);
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(0,229,255,0.2) 0%, rgba(124,58,237,0.2) 100%);
  border: 1px solid var(--color-cyan-text);
  color: var(--color-cyan-text);
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-primary:hover {
  background: linear-gradient(135deg, rgba(0,229,255,0.35) 0%, rgba(124,58,237,0.35) 100%);
  box-shadow: 0 0 25px rgba(0,229,255,0.25);
  transform: translateY(-1px);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--panel-subcard-bg, rgba(255,255,255,0.04));
  border: 1px solid var(--panel-border, rgba(255,255,255,0.12));
  color: var(--panel-text-primary);
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-secondary:hover {
  border-color: var(--panel-border-hot);
  background: var(--panel-subcard-bg, rgba(255,255,255,0.08));
}
`;

/* ─── Shared Visual Elements ─────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-settings5" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-settings5)" />
  </svg>
);

const ScanLine = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}88, transparent)`, animation: 'scanline 4s linear infinite', pointerEvents: 'none', zIndex: 2 }} />
);

const Panel = ({ children, style = {}, glow, hot, ...rest }) => (
  <div 
    style={{
      background: C.panel,
      border: `1px solid ${hot ? C.borderHot : C.border}`,
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      boxShadow: glow ? `0 0 30px ${C.cyan}18, inset 0 1px 0 rgba(0,229,255,0.1)` : 'inset 0 1px 0 rgba(0,229,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

const Sect = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1.5rem 0 1rem', userSelect: 'none' }}>
    {Icon && <Icon size={16} color={C.cyan} />}
    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cyan }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
/*                         MAIN ADMIN SETTINGS PAGE                             */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function Settings() {
  const { updateUserProfileName } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettingsData] = useState(getSettings());
  const [lastBackup, setLastBackup] = useState(getLastBackupInfo());
  const [backupHistory, setBackupHistory] = useState(getBackupHistory());

  // Form States
  const [profileForm, setProfileForm] = useState({
    fullName: settings.fullName,
    companyName: settings.companyName,
    factoryId: settings.factoryId,
    factoryName: settings.factoryName,
    factoryAddress: settings.factoryAddress,
    factoryTimezone: settings.factoryTimezone,
    factoryContact: settings.factoryContact,
    currency: settings.currency || 'INR',
  });

  const [alertForm, setAlertForm] = useState({
    alertTone: settings.alertTone,
    receiveAlerts: settings.receiveAlerts,
    tempThreshold: settings.tempThreshold,
    soundThreshold: settings.soundThreshold,
    vibrationThreshold: settings.vibrationThreshold,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI Action Loading States
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(getStoredAuditLogs());
  const [logSearch, setLogSearch] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('ALL');
  const [logSortOrder, setLogSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Refresh settings & backup history when mounted or tab changes
  useEffect(() => {
    const fresh = getSettings();
    setSettingsData(fresh);
    setAuditLogs(getStoredAuditLogs());
    setLastBackup(getLastBackupInfo());
    setBackupHistory(getBackupHistory());
  }, [activeTab]);

  /* ── SECTION 1: Profile & Factory Details Submit ── */
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!profileForm.fullName || !profileForm.factoryName || !profileForm.factoryId) {
      toast.error('Please fill in all required profile and factory fields.');
      return;
    }

    try {
      const updated = saveSettings(
        profileForm,
        'Profile',
        'Update Profile & Currency Details',
        `Updated factory details for ${profileForm.factoryName} (${profileForm.factoryId}) with currency ${profileForm.currency}`
      );
      setSettingsData(updated);

      // Instantly reflect updated name across entire portal header & sidebar!
      if (updateUserProfileName) {
        updateUserProfileName(profileForm.fullName);
      }

      // Dispatch currency change event to trigger live conversion across financial metrics
      window.dispatchEvent(new Event('titanminds_currency_changed'));

      toast.success(`Profile updated! Currency set to ${profileForm.currency} across entire portal.`);
    } catch (err) {
      toast.error('Failed to update profile settings.');
    }
  };

  /* ── SECTION 2: Alert Settings Submit ── */
  const handleAlertSettingsSubmit = (e) => {
    e.preventDefault();
    try {
      const updated = saveSettings(
        alertForm,
        'Thresholds',
        'Update Alert Configuration',
        `Updated temp threshold to ${alertForm.tempThreshold}°C and alert tone to #${alertForm.alertTone}`
      );
      setSettingsData(updated);
      toast.success('Alert settings & temperature threshold persisted to pipeline!');
    } catch (err) {
      toast.error('Failed to save alert settings.');
    }
  };

  /* ── SECTION 3: System Settings & Theme Toggle ── */
  const handleThemeChange = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const updated = saveSettings({ theme: newTheme }, 'Theme', 'Theme Change', `Switched interface theme to ${newTheme.toUpperCase()}`);
    setSettingsData(updated);
    toast.success(`Theme updated to ${newTheme.toUpperCase()}`);
  };

  const handleDbSyncToggle = (e) => {
    const newState = e.target.checked;
    const updated = saveSettings({ dbSyncState: newState }, 'Database', 'Toggle DB Sync', `Database auto-sync set to ${newState ? 'ON' : 'OFF'}`);
    setSettingsData(updated);
    toast.success(`Database Sync ${newState ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleManualDbSync = async () => {
    setIsSyncingDb(true);
    try {
      const result = await triggerDatabaseSync();
      setIsSyncingDb(false);
      setSettingsData(getSettings());
      toast.success('Database synchronized successfully.');
    } catch (err) {
      setIsSyncingDb(false);
      toast.error('Database synchronization failed.');
    }
  };

  /* ── SECTION 4: Security - Change Password ── */
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Security password updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Password change failed.');
    }
  };

  /* ── SECTION 5: Full Portal Backup Settings & History ── */
  const handleDownloadBackup = () => {
    try {
      const { blob, filename, meta } = generateSystemBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLastBackup(meta);
      setBackupHistory(getBackupHistory());
      setAuditLogs(getStoredAuditLogs());
      toast.success('Full website portal backup generated & downloaded successfully.');
    } catch (err) {
      toast.error('Failed to generate system backup archive.');
    }
  };

  const handleRedownloadBackup = (item) => {
    try {
      const jsonString = JSON.stringify(item.package || {}, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Redownloaded ${item.name}`);
    } catch (err) {
      toast.error('Failed to redownload backup.');
    }
  };

  const handleDeleteBackupHistory = (id) => {
    const updated = deleteBackupHistoryItem(id);
    setBackupHistory(updated);
    toast.success('Backup history record removed.');
  };

  const handleFileSelectForRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedRestoreFile(file);
    setShowRestoreModal(true);
  };

  const confirmRestoreBackup = () => {
    if (!selectedRestoreFile) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const restored = restoreSystemBackup(parsed);
        setSettingsData(restored);
        setProfileForm({
          fullName: restored.fullName,
          companyName: restored.companyName,
          factoryId: restored.factoryId,
          factoryName: restored.factoryName,
          factoryAddress: restored.factoryAddress,
          factoryTimezone: restored.factoryTimezone,
          factoryContact: restored.factoryContact,
          currency: restored.currency || 'INR',
        });
        setAlertForm({
          alertTone: restored.alertTone,
          receiveAlerts: restored.receiveAlerts,
          tempThreshold: restored.tempThreshold,
          soundThreshold: restored.soundThreshold,
          vibrationThreshold: restored.vibrationThreshold,
        });

        if (updateUserProfileName) {
          updateUserProfileName(restored.fullName);
        }

        window.dispatchEvent(new Event('titanminds_currency_changed'));

        setShowRestoreModal(false);
        setSelectedRestoreFile(null);
        setAuditLogs(getStoredAuditLogs());
        toast.success('Full portal backup restored successfully.');
      } catch (err) {
        toast.error('Failed to restore backup. Invalid file format.');
        setShowRestoreModal(false);
      }
    };
    reader.readAsText(selectedRestoreFile);
  };

  /* ── Audit Logs Filter & Pagination Logic ── */
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(logSearch.toLowerCase());
    
    const matchesModule = logModuleFilter === 'ALL' || log.module.toUpperCase() === logModuleFilter.toUpperCase();

    return matchesSearch && matchesModule;
  }).sort((a, b) => logSortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const alertTonesList = [
    { id: '1', title: 'Current Alert Tone (Default)', desc: 'Standard 750Hz dual-tone industrial pulse.' },
    { id: '2', title: 'Industrial Siren', desc: 'High-pitch sweeping emergency siren audio profile.' },
    { id: '3', title: 'Emergency Alarm', desc: 'Rapid staccato 950Hz high-frequency tap sound.' },
    { id: '4', title: 'Soft Notification', desc: 'Warm melodic triadic chord sequence.' },
    { id: '5', title: 'Bell Alert', desc: 'Resonant acoustic bell harmonic tone.' },
    { id: '6', title: 'Critical Warning Tone', desc: 'Sawtooth heavy pulse low-frequency warning.' },
  ];

  return (
    <div style={{ minHeight: '100vh', color: 'var(--panel-text-primary)', paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{STYLES}</style>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <Panel style={{ padding: '1.4rem 2rem', marginBottom: '1.25rem' }} glow>
        <ScanLine />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 4, height: 30, background: `linear-gradient(180deg, ${C.electric}, ${C.cyan})`, borderRadius: 2 }} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.cyan} 60%, ${C.electric} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Central Platform Settings
              </h1>
            </div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', letterSpacing: '0.12em', paddingLeft: 16 }}>
              CENTRAL CONFIGURATION HUB · PROFILE · FACTORY · ALERTS · SYSTEM · SECURITY · BACKUP HISTORY MANAGEMENT
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: `1px solid ${C.cyan}44`, borderRadius: 8, background: 'rgba(0,229,255,0.06)' }}>
              <ShieldCheck size={15} color={C.cyan} />
              <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, letterSpacing: '0.08em' }}>
                ADMIN PORTAL SECURE
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* ══ TAB NAVIGATION BAR ══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={15} /> 1. Profile Settings
        </button>
        <button className={`settings-tab-btn ${activeTab === 'factory' ? 'active' : ''}`} onClick={() => setActiveTab('factory')}>
          <Building size={15} /> 2. Factory Settings
        </button>
        <button className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <Sliders size={15} /> 3. System Settings
        </button>
        <button className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          <ShieldCheck size={15} /> 4. Security & Audit Logs
        </button>
        <button className={`settings-tab-btn ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
          <Download size={15} /> 5. Backup & History
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: PROFILE & FACTORY SETTINGS                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit}>
          <Sect icon={User}>PROFILE CONFIGURATION</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.fullName} 
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.64rem', fontFamily: 'monospace', color: C.cyan, marginTop: 4, display: 'block' }}>
                  ✓ Changing name instantly updates the profile badge across the entire portal.
                </span>
              </div>

              <div>
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.companyName} 
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  required
                />
              </div>
            </div>
          </Panel>

          <Sect icon={Building}>FACTORY DETAILS SUBSECTION</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Factory ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.factoryId} 
                  onChange={(e) => setProfileForm({ ...profileForm, factoryId: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4, display: 'block' }}>
                  Example: FACT-001
                </span>
              </div>

              <div>
                <label className="form-label">Factory Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.factoryName} 
                  onChange={(e) => setProfileForm({ ...profileForm, factoryName: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4, display: 'block' }}>
                  Example: Demo Manufacturing Plant
                </span>
              </div>

              <div>
                <label className="form-label">Factory Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.factoryAddress} 
                  onChange={(e) => setProfileForm({ ...profileForm, factoryAddress: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4, display: 'block' }}>
                  Example: Pune, Maharashtra, India
                </span>
              </div>

              <div>
                <label className="form-label">Factory Timezone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.factoryTimezone} 
                  onChange={(e) => setProfileForm({ ...profileForm, factoryTimezone: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4, display: 'block' }}>
                  Example: Asia/Kolkata
                </span>
              </div>

              <div>
                <label className="form-label">Factory Contact Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.factoryContact} 
                  onChange={(e) => setProfileForm({ ...profileForm, factoryContact: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4, display: 'block' }}>
                  Example: +91 98765 43210
                </span>
              </div>

              <div>
                <label className="form-label">Currency (Multi-Currency Conversion)</label>
                <select 
                  className="form-input" 
                  style={{ cursor: 'pointer' }}
                  value={profileForm.currency} 
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  required
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="JPY">JPY (¥ - Japanese Yen)</option>
                  <option value="CNY">CNY (¥ - Chinese Yuan)</option>
                </select>
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: C.cyan, marginTop: 4, display: 'block' }}>
                  ✓ Converts all financial metrics, ROI formulas, and graphs across the portal in real time.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary">
                <Save size={15} /> Save Profile & Factory Details
              </button>
            </div>
          </Panel>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: FACTORY SETTINGS (ALERTS & THRESHOLDS)                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'factory' && (
        <form onSubmit={handleAlertSettingsSubmit}>
          <Sect icon={Bell}>A. ALERT SOUND SETTINGS</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginBottom: '1.25rem' }}>
              Select an industrial audio tone configuration. Click the preview button next to any tone to test its audio profile live.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {alertTonesList.map((tone) => {
                const isSelected = alertForm.alertTone === tone.id;
                return (
                  <div 
                    key={tone.id}
                    onClick={() => setAlertForm({ ...alertForm, alertTone: tone.id })}
                    style={{
                      padding: '1rem 1.15rem',
                      background: isSelected ? 'var(--panel-subcard-bg, rgba(0,229,255,0.06))' : 'var(--panel-subcard-bg, rgba(255,255,255,0.02))',
                      border: `1.5px solid ${isSelected ? C.cyan : 'var(--panel-subcard-border, rgba(255,255,255,0.08))'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 20px ${C.cyan}20` : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, color: isSelected ? C.cyan : 'var(--panel-text-primary)', marginBottom: 3 }}>
                        {tone.id}. {tone.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)' }}>
                        {tone.desc}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAlertTonePreview(tone.id);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.68rem' }}
                    >
                      <Play size={12} color={C.cyan} /> Preview
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Sect icon={AlertOctagon}>B. ALERT TOGGLE (FRONTEND DEMO ONLY)</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: `4px solid ${C.amber}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--panel-text-primary)', fontFamily: 'monospace' }}>
                  Receive Alerts Toggle
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: C.amber, marginTop: 4 }}>
                  ⚠️ This setting is currently available for demonstration purposes only.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: alertForm.receiveAlerts ? C.green : 'var(--panel-text-muted)' }}>
                  {alertForm.receiveAlerts ? 'ON' : 'OFF'}
                </span>
                <input 
                  type="checkbox" 
                  checked={alertForm.receiveAlerts}
                  onChange={(e) => setAlertForm({ ...alertForm, receiveAlerts: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: C.cyan }}
                />
              </div>
            </div>
          </Panel>

          <Sect icon={Sliders}>C. ALERT THRESHOLDS CONFIGURATION</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              
              {/* Temperature Threshold - CONNECTED */}
              <div style={{ padding: '1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: `1.5px solid ${C.green}44`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ color: C.green, margin: 0 }}>
                    Temperature Threshold (°C)
                  </label>
                  <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: `${C.green}20`, color: C.green, border: `1px solid ${C.green}44` }}>
                    CONNECTED
                  </span>
                </div>
                <input 
                  type="number" 
                  className="form-input" 
                  value={alertForm.tempThreshold}
                  onChange={(e) => setAlertForm({ ...alertForm, tempThreshold: Number(e.target.value) })}
                  required
                />
                <div style={{ fontSize: '0.64rem', fontFamily: 'monospace', color: C.green, marginTop: 6 }}>
                  ✓ Connected to live AI alert pipeline. Triggers machine alerts when exceeded.
                </div>
              </div>

              {/* Sound Threshold - FRONTEND ONLY */}
              <div style={{ padding: '1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: `1.5px solid ${C.amber}44`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ color: C.amber, margin: 0 }}>
                    Sound Threshold (dB)
                  </label>
                  <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: `${C.amber}20`, color: C.amber, border: `1px solid ${C.amber}44` }}>
                    DEMO ONLY
                  </span>
                </div>
                <input 
                  type="number" 
                  className="form-input" 
                  value={alertForm.soundThreshold}
                  onChange={(e) => setAlertForm({ ...alertForm, soundThreshold: Number(e.target.value) })}
                />
                <div style={{ fontSize: '0.64rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 6 }}>
                  FRONTEND ONLY — No backend connection.
                </div>
              </div>

              {/* Vibration Threshold - FRONTEND ONLY */}
              <div style={{ padding: '1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: `1.5px solid ${C.amber}44`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ color: C.amber, margin: 0 }}>
                    Vibration Threshold (%)
                  </label>
                  <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: `${C.amber}20`, color: C.amber, border: `1px solid ${C.amber}44` }}>
                    DEMO ONLY
                  </span>
                </div>
                <input 
                  type="number" 
                  className="form-input" 
                  value={alertForm.vibrationThreshold}
                  onChange={(e) => setAlertForm({ ...alertForm, vibrationThreshold: Number(e.target.value) })}
                />
                <div style={{ fontSize: '0.64rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 6 }}>
                  FRONTEND ONLY — No backend connection.
                </div>
              </div>

            </div>

            <div style={{ padding: '0.85rem 1.15rem', background: 'rgba(0,229,255,0.04)', border: `1px solid ${C.cyan}33`, borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.75rem', fontFamily: 'monospace', color: C.cyan }}>
              ℹ️ Only Temperature Threshold is currently connected to the live alert pipeline.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary">
                <Save size={15} /> Save Factory & Threshold Settings
              </button>
            </div>
          </Panel>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: SYSTEM SETTINGS (THEME & DATABASE SYNC)                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'system' && (
        <div>
          <Sect icon={Sun}>A. THEME SETTINGS</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginBottom: '1rem' }}>
              Select system theme mode. Changes are applied instantly across the entire Admin Portal.
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleThemeChange('dark')}
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: 10,
                  border: `1.5px solid ${settings.theme === 'dark' ? C.cyan : 'var(--panel-border)'}`,
                  background: settings.theme === 'dark' ? 'rgba(0,229,255,0.08)' : 'var(--panel-subcard-bg)',
                  color: settings.theme === 'dark' ? C.cyan : 'var(--panel-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Moon size={18} color={settings.theme === 'dark' ? C.cyan : 'var(--panel-text-muted)'} /> Dark Theme {settings.theme === 'dark' && '✓'}
              </button>

              <button 
                onClick={() => handleThemeChange('light')}
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: 10,
                  border: `1.5px solid ${settings.theme === 'light' ? C.cyan : 'var(--panel-border)'}`,
                  background: settings.theme === 'light' ? 'rgba(0,229,255,0.08)' : 'var(--panel-subcard-bg)',
                  color: settings.theme === 'light' ? C.cyan : 'var(--panel-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Sun size={18} color={settings.theme === 'light' ? C.cyan : 'var(--panel-text-muted)'} /> Light Theme {settings.theme === 'light' && '✓'}
              </button>
            </div>
          </Panel>

          <Sect icon={Database}>B. DATABASE SETTINGS & SYNCHRONIZATION</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${C.border}`, marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--panel-text-primary)', fontFamily: 'monospace' }}>
                  Database Sync Toggle
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4 }}>
                  Automatic synchronization between Edge cache and central MongoStore database.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: settings.dbSyncState ? C.green : 'var(--panel-text-muted)' }}>
                  {settings.dbSyncState ? 'ACTIVE' : 'DISABLED'}
                </span>
                <input 
                  type="checkbox" 
                  checked={settings.dbSyncState}
                  onChange={handleDbSyncToggle}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: C.cyan }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-primary)' }}>
                  Last Database Sync Timestamp:
                </div>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: C.cyan, fontWeight: 900, marginTop: 2 }}>
                  {settings.lastDbSyncTime || '2026-07-28 09:15 AM'}
                </div>
              </div>

              <button 
                onClick={handleManualDbSync} 
                className="btn-primary"
                disabled={isSyncingDb}
              >
                <RefreshCw size={15} className={isSyncingDb ? 'animate-spin' : ''} />
                {isSyncingDb ? 'Synchronizing...' : 'Sync Database'}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SECURITY SETTINGS & REAL AUDIT LOGS                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div>
          <Sect icon={Key}>A. CHANGE SECURITY PASSWORD</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handlePasswordChangeSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Current Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter current password..."
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Min 4 characters..."
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Confirm new password..."
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <ShieldCheck size={15} /> Update Account Password
                </button>
              </div>
            </form>
          </Panel>

          <Sect icon={History}>B. REAL SYSTEM AUDIT LOGS</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginBottom: '1.25rem' }}>
              Complete chronological audit trail recording all genuine application events across the project lifetime (Onboarding, Approvals, Alerts, Permissions, Reports & Backups).
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                <div style={{ position: 'relative', minWidth: 240 }}>
                  <Search size={14} color="var(--panel-text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search logs..." 
                    style={{ paddingLeft: 34 }}
                    value={logSearch}
                    onChange={(e) => { setLogSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <select 
                  className="form-input" 
                  style={{ width: 180, cursor: 'pointer' }}
                  value={logModuleFilter}
                  onChange={(e) => { setLogModuleFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Modules</option>
                  <option value="Auth">Auth & Users</option>
                  <option value="Alerts">Alerts & Alarms</option>
                  <option value="Security">Security & Permissions</option>
                  <option value="Profile">Profile</option>
                  <option value="Factory">Factory</option>
                  <option value="Thresholds">Thresholds</option>
                  <option value="Database">Database</option>
                  <option value="Reports">Reports</option>
                  <option value="Backup">Backup</option>
                  <option value="System">System</option>
                </select>
              </div>

              <button 
                onClick={() => setLogSortOrder(logSortOrder === 'desc' ? 'asc' : 'desc')} 
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.72rem' }}
              >
                Sort: {logSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>

            {/* Audit Logs Table or Empty State */}
            {currentLogs.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.cyan}44`, color: C.cyan, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                      <th style={{ padding: '10px 12px' }}>User</th>
                      <th style={{ padding: '10px 12px' }}>Module</th>
                      <th style={{ padding: '10px 12px' }}>Action</th>
                      <th style={{ padding: '10px 12px' }}>Description / Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--panel-border, rgba(255,255,255,0.06))' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--panel-text-secondary)', whiteSpace: 'nowrap' }}>{log.date}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--panel-text-muted)', whiteSpace: 'nowrap' }}>{log.time}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--panel-text-primary)' }}>{log.user}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,229,255,0.08)', color: C.cyan, border: `1px solid ${C.cyan}33` }}>
                            {log.module}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: C.electric }}>{log.action}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--panel-text-secondary)' }}>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--panel-text-muted)' }}>
                    Showing {(currentPage - 1) * logsPerPage + 1}–{Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.cyan }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.4 : 1 }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem 1.5rem', textTransform: 'uppercase', textAlign: 'center', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', borderRadius: 10, border: '1px dashed var(--panel-border)' }}>
                <Info size={32} color={C.cyan} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--panel-text-primary)', letterSpacing: '0.08em' }}>
                  No Audit Logs Available.
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--panel-text-muted)', marginTop: 4 }}>
                  No genuine application event records match the selected search or filter criteria.
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: FULL WEBSITE PORTAL BACKUP, HISTORY & RESTORATION          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'backup' && (
        <div>
          <Sect icon={Download}>A. DOWNLOAD FULL WEBSITE PORTAL BACKUP</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--panel-text-primary)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  Generate & Download Full Portal Archive
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: C.cyan, marginTop: 4, lineHeight: 1.4 }}>
                  📦 COMPLETE PORTAL BACKUP PAYLOAD: All Users Details, Factory Details, 100 Industrial Machines, Live Telemetry Graph Readings, Financial Analysis (154% ROI), Report Logs, Active Alerts & Real Audit Logs.
                </div>
              </div>

              <button onClick={handleDownloadBackup} className="btn-primary">
                <Download size={15} /> Download Full Portal Backup
              </button>
            </div>
          </Panel>

          <Sect icon={History}>B. SYSTEM BACKUP HISTORY</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginBottom: '1.25rem' }}>
              Historical archive of all generated system backups with date, time, file size, status, and redownload capability.
            </div>

            {backupHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.cyan}44`, color: C.cyan, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                      <th style={{ padding: '10px 12px' }}>Backup Archive Name</th>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                      <th style={{ padding: '10px 12px' }}>Archive Size</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--panel-border, rgba(255,255,255,0.06))' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--panel-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={15} color={C.cyan} />
                          {item.name}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--panel-text-secondary)', whiteSpace: 'nowrap' }}>{item.date}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--panel-text-muted)', whiteSpace: 'nowrap' }}>{item.time}</td>
                        <td style={{ padding: '10px 12px', color: C.electric, fontWeight: 800 }}>{item.size}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${C.green}20`, color: C.green, border: `1px solid ${C.green}44` }}>
                            ✓ {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button 
                              onClick={() => handleRedownloadBackup(item)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.65rem' }}
                            >
                              <Download size={12} color={C.cyan} /> Redownload
                            </button>
                            <button 
                              onClick={() => handleDeleteBackupHistory(item.id)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.65rem', borderColor: 'rgba(239,68,68,0.3)', color: C.red }}
                            >
                              <Trash2 size={12} color={C.red} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', borderRadius: 10, border: '1px dashed var(--panel-border)' }}>
                <History size={32} color={C.amber} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--panel-text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  No Backup History Available.
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--panel-text-muted)', marginTop: 4 }}>
                  No historical system backups have been generated yet.
                </div>
              </div>
            )}
          </Panel>

          <Sect icon={Upload}>C. RESTORE FULL WEBSITE PORTAL BACKUP</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--panel-text-primary)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  Upload & Restore Full Portal Archive
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 4 }}>
                  Restores complete portal configurations, user details, machine inventory, historical telemetry graph readings, reports, and logs from a valid TitanMinds backup file.
                </div>
              </div>

              <label className="btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                <Upload size={15} color={C.cyan} /> Restore Backup
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileSelectForRestore}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </Panel>

          <Sect icon={Clock}>D. LAST BACKUP INFORMATION</Sect>
          <Panel style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            {lastBackup ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem 1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: '1px solid var(--panel-border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', textTransform: 'uppercase' }}>
                    Last Backup Date
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: C.cyan, fontFamily: 'monospace', marginTop: 4 }}>
                    {lastBackup.date}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: '1px solid var(--panel-border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', textTransform: 'uppercase' }}>
                    Backup Time
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: C.cyan, fontFamily: 'monospace', marginTop: 4 }}>
                    {lastBackup.time}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: '1px solid var(--panel-border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', textTransform: 'uppercase' }}>
                    Archive Size
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: C.electric, fontFamily: 'monospace', marginTop: 4 }}>
                    {lastBackup.size}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: '1px solid var(--panel-border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', textTransform: 'uppercase' }}>
                    Backup Status
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: C.green, fontFamily: 'monospace', marginTop: 4 }}>
                    ✓ {lastBackup.status}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', borderRadius: 10, border: '1px dashed var(--panel-border)' }}>
                <Clock size={32} color={C.amber} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--panel-text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  No Backups Available.
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--panel-text-muted)', marginTop: 4 }}>
                  No full portal backup archive has been generated yet. Click "Download Full Portal Backup" above to create your first complete snapshot.
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ══ RESTORE CONFIRMATION MODAL ═══════════════════════════════════════ */}
      {showRestoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <Panel style={{ width: '100%', maxWidth: 500, padding: '1.5rem', border: `1.5px solid ${C.amber}`, boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 30px ${C.amber}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <AlertTriangle size={24} color={C.amber} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--panel-text-primary)', fontFamily: 'monospace' }}>
                Confirm Full Portal Restoration
              </h3>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--panel-text-secondary)', fontFamily: 'monospace', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Restoring a backup will overwrite current factory settings, user records, alert configurations, machine telemetry, time-series graph readings, and system preferences. Continue?
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowRestoreModal(false); setSelectedRestoreFile(null); }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRestoreBackup} 
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.3) 0%, rgba(220,38,38,0.3) 100%)', borderColor: C.amber, color: C.amber }}
              >
                Confirm Restore
              </button>
            </div>
          </Panel>
        </div>
      )}

    </div>
  );
}
