import {
  LayoutDashboard, Building2, MonitorSmartphone, BrainCircuit,
  Server, Zap, Users, AlertTriangle, FileText, Settings,
  BarChart4, ActivitySquare, CalendarDays, DollarSign,
  PenTool, LineChart, ShieldAlert, Cpu
} from 'lucide-react';

export const adminNavItems = [
  { name: 'Dashboard',             path: '/admin/dashboard',           icon: LayoutDashboard },
  { name: 'Factory Overview',      path: '/admin/factory-overview',    icon: Building2 },
  { name: 'Machine Management',    path: '/admin/machine-management',  icon: MonitorSmartphone },
  { name: 'AI Analytics',          path: '/admin/ai-analytics',        icon: BrainCircuit },
  { name: 'Live Telemetry',        path: '/admin/live-telemetry',      icon: LineChart },
  { name: 'Financial Insights',    path: '/admin/financial-insights',  icon: DollarSign },
  { name: 'Infrastructure Health', path: '/admin/infrastructure-health', icon: Server },
  { name: 'User Management',       path: '/admin/user-management',     icon: Users },
  { name: 'Alerts & Notifications',path: '/admin/alerts',              icon: AlertTriangle },
  { name: 'Reports',               path: '/admin/reports',             icon: FileText },
  { name: 'Settings',              path: '/admin/settings',            icon: Settings }
];

export const managerNavItems = [
  { name: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
  { name: 'Factory Overview', path: '/manager/factory-overview', icon: Building2 },
  { name: 'Production Analytics', path: '/manager/production-analytics', icon: BarChart4 },
  { name: 'Machine Health', path: '/manager/machine-health', icon: ActivitySquare },
  { name: 'Live Telemetry', path: '/manager/live-telemetry', icon: LineChart },
  { name: 'Financial Insights', path: '/manager/financial-insights', icon: DollarSign },
  { name: 'Alerts', path: '/manager/alerts', icon: ShieldAlert },
  { name: 'Reports', path: '/manager/reports', icon: FileText }
];

export const engineerNavItems = [
  { name: 'Dashboard', path: '/engineer/dashboard', icon: LayoutDashboard },
  { name: 'Machine Diagnostics', path: '/engineer/machine-diagnostics', icon: PenTool },
  { name: 'Live Telemetry', path: '/engineer/live-telemetry', icon: LineChart },
  { name: 'AI Predictions', path: '/engineer/ai-predictions', icon: BrainCircuit },
  { name: 'Machine Analytics', path: '/engineer/machine-analytics', icon: BarChart4 },
  { name: 'Alerts', path: '/engineer/alerts', icon: AlertTriangle },
  { name: 'Reports', path: '/engineer/reports', icon: FileText }
];
