/**
 * AppShell Layout Component
 *
 * Main application layout with responsive sidebar/bottom nav,
 * skip-to-content link, and focus management on route change.
 */

import { type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { loadDemoData } from '../../services/demoMode';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Focus management: move focus to main content on route change
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true" onDoubleClick={loadDemoData} title="Double click for Demo Mode" style={{cursor: 'pointer'}}>🌿</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              EcoGuide AI
            </h1>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 outline-none min-h-[calc(100vh-4rem-3rem)]"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            EcoGuide AI — Your personal carbon coach.
            Built for a sustainable future.
          </p>
        </div>
      </footer>
    </div>
  );
}
