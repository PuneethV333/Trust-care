import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../ui/Skeleton';

export function FullPageLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-72" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoading />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoading />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user.onboardingCompleted) return <Navigate to="/" replace />;
  return children;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoading />;
  if (user) {
    return <Navigate to={user.onboardingCompleted ? '/' : '/onboarding'} replace />;
  }
  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoading />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}
