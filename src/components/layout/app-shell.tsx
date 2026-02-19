'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

const AUTH_ROUTES = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, isMobile, setMobile, setSidebarOpen } = useUiStore();
  const pathname = usePathname();

  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      const mobile = e.matches;
      setMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    }

    handleChange(mq);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [setMobile, setSidebarOpen]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        {children}
      </main>

      {isMobile && <MobileNav />}
    </div>
  );
}
