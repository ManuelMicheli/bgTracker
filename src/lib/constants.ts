export const APP_NAME = 'BgTracking';

export const CURRENCY = {
  code: 'EUR',
  locale: 'it-IT',
  symbol: '€',
} as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Spesa', icon: '🛒', color: '#22c55e' },
  { name: 'Trasporti', icon: '🚗', color: '#3b82f6' },
  { name: 'Abbonamenti', icon: '📱', color: '#a855f7' },
  { name: 'Ristoranti', icon: '🍽️', color: '#f97316' },
  { name: 'Salute', icon: '💊', color: '#ef4444' },
  { name: 'Casa', icon: '🏠', color: '#eab308' },
  { name: 'Intrattenimento', icon: '🎬', color: '#ec4899' },
  { name: 'Stipendio', icon: '💰', color: '#10b981' },
  { name: 'Altro', icon: '📦', color: '#6b7280' },
] as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Transazioni', href: '/transactions', icon: 'ArrowLeftRight' },
  { label: 'Budget', href: '/budget', icon: 'Wallet' },
  { label: 'Insights', href: '/insights', icon: 'Lightbulb' },
  { label: 'Impostazioni', href: '/settings', icon: 'Settings' },
] as const;
