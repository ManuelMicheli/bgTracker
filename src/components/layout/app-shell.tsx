'use client';

import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        {children}
      </main>
    </div>
  );
}
