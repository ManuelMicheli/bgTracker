'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { useUiStore } from '@/stores/ui-store';

const icons: Record<string, string> = {
  LayoutDashboard: '📊',
  ArrowLeftRight: '💸',
  Wallet: '👛',
  Lightbulb: '💡',
  Settings: '⚙️',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, isMobile, setSidebarOpen } = useUiStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        isMobile
          ? cn('w-64', sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          : cn(sidebarOpen ? 'w-64' : 'w-16'),
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <span className="text-xl font-bold">
          {isMobile || sidebarOpen ? APP_NAME : 'BT'}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) setSidebarOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="text-lg">{icons[item.icon]}</span>
              {(isMobile || sidebarOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
