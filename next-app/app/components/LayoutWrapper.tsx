'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { cn } from '@/lib/utils';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useLayoutStore();

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main
        className={cn(
          'flex-1 pb-16 lg:pb-0 transition-all duration-300',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        {children}
      </main>
    </div>
  );
}
