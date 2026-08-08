import { createContext } from 'react';
import type { Role } from '../types';

export interface AuthUser {
  uid: string;
  role: Role;
  onboardingCompleted: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  syncError: boolean;
  sync: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
