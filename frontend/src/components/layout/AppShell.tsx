import { Link, NavLink, Outlet } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import {
  CalendarIcon,
  HomeIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from '../ui/icons';

interface Tab {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function desktopTabClass(isActive: boolean) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium',
    isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:text-neutral-900',
  ].join(' ');
}

function mobileTabClass(isActive: boolean) {
  return [
    'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium',
    isActive ? 'text-primary-700' : 'text-neutral-400',
  ].join(' ');
}

export function AppShell() {
  const { user, signOut } = useAuth();

  const tabs: Tab[] = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/search', label: 'Search', icon: SearchIcon },
    { to: '/bookings', label: 'Bookings', icon: CalendarIcon },
    { to: '/profile', label: 'Profile', icon: UserIcon },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/admin', label: 'Admin', icon: ShieldIcon }]
      : []),
  ];

  return (
<div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 hidden border-b border-neutral-200 bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-neutral-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500 text-xs font-bold text-white">
              T
            </span>
            Trust Care
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) => desktopTabClass(isActive)}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <Badge className="bg-primary-100 text-primary-700">
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="font-medium text-neutral-600 hover:text-neutral-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => mobileTabClass(isActive)}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}