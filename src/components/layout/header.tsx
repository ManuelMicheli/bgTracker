'use client';

import { useUiStore } from '@/stores/ui-store';

export function Header({ title }: { title?: string }) {
  const { toggleSidebar } = useUiStore();

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {title && <h1 className="text-lg font-semibold">{title}</h1>}
    </header>
  );
}
