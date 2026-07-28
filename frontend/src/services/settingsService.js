/**
 * Settings Persistence & Complete Portal Backup Management Service
 * Central hub for reading, saving, backing up, and restoring the ENTIRE platform:
 * User settings, user records, factory info, machine records, live telemetry readings, graphs data,
 * diagnostic records, financial analysis, reports metadata, active alerts, theme, and real audit logs.
 */

import { getStoredAuditLogs, logAuditEvent } from './auditLogger';
import { generateMockData } from './mockData';

const SETTINGS_KEY = 'titanminds_platform_settings';
const LAST_BACKUP_KEY = 'titanminds_last_backup_info';
const BACKUP_HISTORY_KEY = 'titanminds_backup_history_list';
const TELEMETRY_BACKUP_KEY = 'titanminds_telemetry_history';
const MACHINE_INVENTORY_KEY = 'titanminds_machine_inventory';
const MASTER_USERS_KEY = 'titanminds_users_master_db_final';

// Default configuration baseline
export const DEFAULT_SETTINGS = {
  // Profile Settings
  fullName: 'Sujal Warke',
  companyName: 'TitanMinds Enterprise Systems',

  // Factory Details Subsection
  factoryId: 'FACT-001',
  factoryName: 'Demo Manufacturing Plant',
  factoryAddress: 'Pune, Maharashtra, India',
  factoryTimezone: 'Asia/Kolkata',
  factoryContact: '+91 98765 43210',
  currency: 'INR',

  // Alert Settings
  alertTone: '1', // 1: Default, 2: Siren, 3: Emergency, 4: Soft, 5: Bell, 6: Critical
  receiveAlerts: true, // FRONTEND ONLY
  tempThreshold: 30, // CONNECTED TO PIPELINE (Default: 30°C)
  soundThreshold: 75, // FRONTEND ONLY
  vibrationThreshold: 70, // FRONTEND ONLY

  // System Settings
  theme: 'dark',
  dbSyncState: true,
  lastDbSyncTime: '2026-07-28 09:15 AM',

  // Security Credentials Hash / Verification Mock
  currentPasswordHash: 'admin123',
};

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (newSettings, auditModule = 'Factory', auditAction = 'Update Settings', auditDesc = 'Updated system configuration') => {
  try {
    const current = getSettings();
    const merged = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));

    // Dispatch global event for instant reactive updates across all components
    window.dispatchEvent(new Event('titanminds_settings_changed'));

    // Record real audit log
    logAuditEvent({
      user: merged.fullName || 'Admin',
      module: auditModule,
      action: auditAction,
      description: auditDesc,
    });

    return merged;
  } catch (err) {
    console.error('Failed to save settings:', err);
    throw new Error('Failed to persist settings');
  }
};

// Database Manual Sync Simulation API
export const triggerDatabaseSync = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      saveSettings({ lastDbSyncTime: timeStr }, 'Database', 'Manual Database Sync', `Triggered manual database synchronization at ${timeStr}`);
      resolve({ status: 'ok', timestamp: timeStr });
    }, 1200);
  });
};

// Password Update Verification
export const updatePassword = async (currentPassword, newPassword, confirmPassword) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error('All password fields are required.');
  }

  if (newPassword.length < 4) {
    throw new Error('New password must be at least 4 characters long.');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('New password and confirmation do not match.');
  }

  const current = getSettings();
  if (currentPassword !== (current.currentPasswordHash || 'admin123')) {
    throw new Error('Current password is incorrect.');
  }

  return saveSettings(
    { currentPasswordHash: newPassword },
    'Security',
    'Change Password',
    'Admin account security password updated successfully'
  );
};

// Helper: Format bytes to human-readable size
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * BACKUP HISTORY LIST MANAGEMENT
 */
export const getBackupHistory = () => {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load backup history:', err);
    return [];
  }
};

export const saveBackupHistoryItem = (item) => {
  try {
    const history = getBackupHistory();
    // Keep max 20 historical backups
    const updated = [item, ...history].slice(0, 20);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save backup history item:', err);
    return [];
  }
};

export const deleteBackupHistoryItem = (id) => {
  try {
    const history = getBackupHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete backup history item:', err);
    return [];
  }
};

/**
 * FULL WEBSITE PORTAL BACKUP GENERATOR
 * Packages everything into a single JSON file:
 * - User Profile & Factory Settings
 * - Master User Accounts List (All user details)
 * - 100 Industrial Machine Inventory Records
 * - Historical Telemetry & Time-Series Graph Data
 * - Financial Analysis Model & Calibration
 * - Active Alerts & System Audit Logs
 */
export const generateSystemBackup = () => {
  const currentSettings = getSettings();
  const now = new Date();
  
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  // 1. Collect Users
  let usersList = [];
  try {
    const rawU = localStorage.getItem(MASTER_USERS_KEY);
    if (rawU) usersList = JSON.parse(rawU);
  } catch {}

  // 2. Collect Machine Inventory (100 machines)
  let machineInventory = [];
  try {
    const rawM = localStorage.getItem(MACHINE_INVENTORY_KEY);
    if (rawM) machineInventory = JSON.parse(rawM);
  } catch {}
  if (machineInventory.length === 0) {
    machineInventory = generateMockData(100);
  }

  // 3. Collect Telemetry Time-Series Graph Data
  let telemetryGraphData = [];
  try {
    const rawT = localStorage.getItem(TELEMETRY_BACKUP_KEY);
    if (rawT) telemetryGraphData = JSON.parse(rawT);
  } catch {}

  // 4. Collect Real Audit Logs
  const auditLogsList = getStoredAuditLogs();

  // Construct complete payload
  const fullPortalPayload = {
    metadata: {
      version: '2.4.0-ENT',
      platform: 'TitanMinds IIoT Enterprise Portal',
      generatedAtDate: dateStr,
      generatedAtTime: timeStr,
      timestampMs: now.getTime(),
      scope: 'FULL_WEBSITE_PORTAL_SCOPE'
    },
    settings: currentSettings,
    users: usersList,
    factory: {
      id: currentSettings.factoryId,
      name: currentSettings.factoryName,
      address: currentSettings.factoryAddress,
      timezone: currentSettings.factoryTimezone,
      contact: currentSettings.factoryContact,
      currency: currentSettings.currency || 'INR'
    },
    machines: {
      totalCount: machineInventory.length,
      inventory: machineInventory
    },
    telemetry: {
      timeSeriesReadings: telemetryGraphData
    },
    financialAnalysis: {
      roiModel: {
        deploymentCostINR: 1200000,
        projectedSavingsINR: 3050000,
        netBenefitINR: 1850000,
        roiPercentage: '154%'
      }
    },
    auditLogs: auditLogsList,
    activeAlertsConfig: {
      receiveAlerts: currentSettings.receiveAlerts,
      alertTone: currentSettings.alertTone,
      tempThreshold: currentSettings.tempThreshold
    }
  };

  const jsonString = JSON.stringify(fullPortalPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const archiveName = `titanminds_full_portal_backup_${currentSettings.factoryId}_${now.toISOString().split('T')[0]}.json`;

  const meta = {
    id: `backup-${now.getTime()}`,
    name: archiveName,
    date: dateStr,
    time: timeStr,
    timestamp: now.getTime(),
    size: formatBytes(blob.size),
    status: 'COMPLETE',
    package: fullPortalPayload
  };

  // Save to history & last backup state
  localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify(meta));
  saveBackupHistoryItem(meta);

  // Log to Audit Logger
  logAuditEvent({
    user: currentSettings.fullName || 'Admin',
    module: 'Backup',
    action: 'Generate System Backup',
    description: `Generated full portal backup payload (${meta.size}) with 100 machine records, telemetry graphs, users, and audit logs.`
  });

  return { blob, filename: archiveName, meta };
};

export const getLastBackupInfo = () => {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load last backup info:', err);
    return null;
  }
};

/**
 * RESTORE FULL WEBSITE PORTAL BACKUP
 */
export const restoreSystemBackup = (backupPayload) => {
  if (!backupPayload || !backupPayload.settings) {
    throw new Error('Invalid backup payload format.');
  }

  const restoredSettings = saveSettings(
    backupPayload.settings,
    'Backup',
    'Restore System Backup',
    `Restored full portal configuration from backup generated at ${backupPayload.metadata?.generatedAtDate || 'previous session'}`
  );

  // Restore Master Users
  if (Array.isArray(backupPayload.users) && backupPayload.users.length > 0) {
    localStorage.setItem(MASTER_USERS_KEY, JSON.stringify(backupPayload.users));
  }

  // Restore Machines Inventory
  if (backupPayload.machines?.inventory && Array.isArray(backupPayload.machines.inventory)) {
    localStorage.setItem(MACHINE_INVENTORY_KEY, JSON.stringify(backupPayload.machines.inventory));
  }

  // Restore Telemetry Data
  if (backupPayload.telemetry?.timeSeriesReadings) {
    localStorage.setItem(TELEMETRY_BACKUP_KEY, JSON.stringify(backupPayload.telemetry.timeSeriesReadings));
  }

  return restoredSettings;
};
