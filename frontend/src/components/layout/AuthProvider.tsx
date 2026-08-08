import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../lib/api';
import { AuthContext, type AuthUser } from '../../lib/auth-context';
import { getAuthInstance } from '../../lib/firebase';
import { syncUserResponseSchema } from '../../schemas/user.schema';

async function syncCurrentFirebaseUser(token: string): Promise<AuthUser> {
  const synced = syncUserResponseSchema.parse(
    await api.post('/auth/sync', undefined, token),
  );
  const authUser: AuthUser = {
    uid: synced.id,
    role: synced.role,
    onboardingCompleted: synced.onboardingCompleted,
  };
  localStorage.setItem('uid', synced.id);
  return authUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  const sync = async (): Promise<boolean> => {
    const auth = getAuthInstance();
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setUser(null);
      setIsLoading(false);
      setSyncError(false);
      return true;
    }
    setIsLoading(true);
    setSyncError(false);
    try {
      const token = await fbUser.getIdToken();
      const next = await syncCurrentFirebaseUser(token);
      setUser(next);
      return true;
    } catch {
      setUser(null);
      setSyncError(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        setSyncError(false);
        localStorage.removeItem('uid');
        return;
      }
      void sync();
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await getAuthInstance().signOut();
    setUser(null);
    setIsLoading(false);
    setSyncError(false);
    localStorage.removeItem('uid');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, syncError, sync, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
