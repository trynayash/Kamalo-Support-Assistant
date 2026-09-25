import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setRequestHeadersGetter } from '@workspace/api-client-react';

export type UserRole = 'customer' | 'super_admin' | 'admin' | 'editor' | 'human_reviewer';

export interface UserAccount {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorUsername: string;
  actorRole: UserRole;
  details: string;
  target?: string;
  timestamp: string;
}

interface AuthContextValue {
  currentUser: UserAccount | null;
  role: UserRole;
  isStaff: boolean;
  isSuperAdmin: boolean;
  users: UserAccount[];
  auditLogs: AuditLogEntry[];
  signIn: (username: string, password: string) => { success: boolean; error?: string };
  signUp: (username: string, password: string, name: string, email: string, role?: UserRole, autoSignIn?: boolean) => { success: boolean; error?: string };
  signOut: () => void;
  setRole: (role: UserRole) => void;
  updateUserRole: (username: string, newRole: UserRole) => void;
  deleteUser: (username: string) => boolean;
  logActivity: (action: string, details: string, target?: string) => void;
  clearAuditLogs: () => void;
}

const USERS_STORAGE_KEY = '@kamalo_registered_users_v2';
const ACTIVE_USER_STORAGE_KEY = '@kamalo_active_user_v2';
const AUDIT_STORAGE_KEY = '@kamalo_audit_logs_v2';

const SEED_USERS: UserAccount[] = [
  {
    username: 'yash',
    password: 'kamalo123',
    name: 'Yash (Owner)',
    email: 'yash@kamalo.in',
    role: 'super_admin',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    username: 'admin',
    password: 'admin123',
    name: 'Operations Admin',
    email: 'admin@kamalo.in',
    role: 'admin',
    createdAt: '2026-09-05T12:00:00.000Z',
  },
  {
    username: 'editor',
    password: 'editor123',
    name: 'Content Editor',
    email: 'editor@kamalo.in',
    role: 'editor',
    createdAt: '2026-09-10T14:30:00.000Z',
  },
  {
    username: 'reviewer',
    password: 'reviewer123',
    name: 'L1 Reviewer',
    email: 'ops@kamalo.in',
    role: 'human_reviewer',
    createdAt: '2026-09-12T09:15:00.000Z',
  },
  {
    username: 'customer',
    password: 'user123',
    name: 'Demo Customer',
    email: 'customer@example.com',
    role: 'customer',
    createdAt: '2026-09-15T16:45:00.000Z',
  },
];

const SEED_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    action: 'SYSTEM_INITIALIZED',
    actorUsername: 'yash',
    actorRole: 'super_admin',
    details: 'KAMALO Support Platform initialized with roles & audit logging',
    timestamp: '2026-09-25T08:00:00.000Z',
  },
  {
    id: 'log-seed-2',
    action: 'ROLES_CONFIGURED',
    actorUsername: 'yash',
    actorRole: 'super_admin',
    details: 'Super Admin, Admin, Editor, Reviewer, and Customer permissions configured',
    timestamp: '2026-09-25T08:05:00.000Z',
  },
];

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  role: 'customer',
  isStaff: false,
  isSuperAdmin: false,
  users: SEED_USERS,
  auditLogs: SEED_LOGS,
  signIn: () => ({ success: false }),
  signUp: () => ({ success: false }),
  signOut: () => {},
  setRole: () => {},
  updateUserRole: () => {},
  deleteUser: () => false,
  logActivity: () => {},
  clearAuditLogs: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(SEED_LOGS);

  // Load persisted users, active session, and audit logs
  useEffect(() => {
    async function loadData() {
      try {
        const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed);
          } else {
            await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
          }
        } else {
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
        }

        const storedActive = await AsyncStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (storedActive) {
          const parsedUser = JSON.parse(storedActive);
          setCurrentUser(parsedUser);
        }

        const storedLogs = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          if (Array.isArray(parsedLogs)) {
            setAuditLogs(parsedLogs);
          }
        } else {
          await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(SEED_LOGS));
        }
      } catch {
        // Fallback to memory
      }
    }
    void loadData();
  }, []);

  // Sync active user credentials to API client headers
  useEffect(() => {
    setRequestHeadersGetter(() => ({
      'x-user-id': currentUser?.username || 'customer',
      'x-user-role': currentUser?.role || 'customer',
    }));
  }, [currentUser]);

  const logActivity = useCallback(
    (action: string, details: string, target?: string) => {
      const actorUsername = currentUser?.username || 'guest';
      const actorRole = currentUser?.role || 'customer';

      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        actorUsername,
        actorRole,
        details,
        target,
        timestamp: new Date().toISOString(),
      };

      setAuditLogs((prev) => {
        const updated = [entry, ...prev].slice(0, 100);
        void AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [currentUser]
  );

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
    void AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([])).catch(() => {});
  }, []);

  const signIn = useCallback(
    (username: string, password: string): { success: boolean; error?: string } => {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanUsername) return { success: false, error: 'Please enter your username.' };
      if (!cleanPassword) return { success: false, error: 'Please enter your password.' };

      const found = users.find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      if (!found) {
        return { success: false, error: 'Username not found. Please sign up first.' };
      }

      if (found.password && found.password !== cleanPassword) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      setCurrentUser(found);
      void AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(found)).catch(() => {});

      logActivity('USER_SIGNIN', `${found.name} (@${found.username}) signed in as ${found.role.replace('_', ' ')}`);

      return { success: true };
    },
    [users, logActivity]
  );

  const signUp = useCallback(
    (
      username: string,
      password: string,
      name: string,
      email: string,
      role: UserRole = 'customer',
      autoSignIn: boolean = true
    ): { success: boolean; error?: string } => {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();
      const cleanName = name.trim();
      const cleanEmail = email.trim();

      if (!cleanUsername) return { success: false, error: 'Username is required.' };
      if (cleanUsername.length < 3) return { success: false, error: 'Username must be at least 3 characters.' };
      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
      }

      if (!cleanPassword) return { success: false, error: 'Password is required.' };
      if (cleanPassword.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

      if (!cleanName) return { success: false, error: 'Full name is required.' };

      // Check unique username
      const exists = users.some(
        (u) => u.username.toLowerCase() === cleanUsername
      );
      if (exists) {
        return { success: false, error: 'This username is already taken. Please choose another.' };
      }

      // Public self-registration (autoSignIn === true) is strictly customer role.
      // Only staff accounts created by Super Admin (autoSignIn === false) can have other roles.
      const effectiveRole: UserRole = autoSignIn ? 'customer' : role;

      const newUser: UserAccount = {
        username: cleanUsername,
        password: cleanPassword,
        name: cleanName,
        email: cleanEmail || `${cleanUsername}@kamalo.in`,
        role: effectiveRole,
        createdAt: new Date().toISOString(),
      };

      const nextUsers = [...users, newUser];
      setUsers(nextUsers);
      void AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers)).catch(() => {});

      if (autoSignIn) {
        // Automatically sign in as the newly created user (for self-signup)
        setCurrentUser(newUser);
        void AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(newUser)).catch(() => {});

        logActivity(
          'USER_SIGNUP',
          `New account registered: ${cleanName} (@${cleanUsername}) with role ${effectiveRole.replace('_', ' ')}`
        );
      } else {
        // Staff account created by Super Admin; keep existing admin session active
        logActivity(
          'STAFF_CREATED',
          `Staff account created: ${cleanName} (@${cleanUsername}) assigned role ${effectiveRole.replace('_', ' ').toUpperCase()}`,
          cleanUsername
        );
      }

      return { success: true };
    },
    [users, logActivity]
  );

  const signOut = useCallback(() => {
    if (currentUser) {
      logActivity('USER_SIGNOUT', `${currentUser.name} (@${currentUser.username}) signed out`);
    }
    setCurrentUser(null);
    void AsyncStorage.removeItem(ACTIVE_USER_STORAGE_KEY).catch(() => {});
  }, [currentUser, logActivity]);

  const setRole = useCallback(
    (newRole: UserRole) => {
      // Only authorized Super Admin accounts can preview other role viewpoints
      if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.username !== 'yash')) {
        return;
      }

      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      void AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});

      logActivity('ROLE_SWITCH', `Super Admin switched view mode to ${newRole.replace('_', ' ')}`);
    },
    [currentUser, logActivity]
  );

  const updateUserRole = useCallback(
    (targetUsername: string, newRole: UserRole) => {
      const cleanTarget = targetUsername.toLowerCase().trim();

      setUsers((prev) => {
        const next = prev.map((u) =>
          u.username.toLowerCase() === cleanTarget ? { ...u, role: newRole } : u
        );
        void AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      if (currentUser && currentUser.username.toLowerCase() === cleanTarget) {
        const updated = { ...currentUser, role: newRole };
        setCurrentUser(updated);
        void AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      }

      logActivity(
        'ROLE_CHANGED',
        `User @${cleanTarget} role was modified to ${newRole.replace('_', ' ').toUpperCase()}`,
        cleanTarget
      );
    },
    [currentUser, logActivity]
  );

  const deleteUser = useCallback(
    (targetUsername: string): boolean => {
      const cleanTarget = targetUsername.toLowerCase().trim();
      if (cleanTarget === 'yash') return false; // Cannot delete primary owner

      setUsers((prev) => {
        const next = prev.filter((u) => u.username.toLowerCase() !== cleanTarget);
        void AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      if (currentUser && currentUser.username.toLowerCase() === cleanTarget) {
        signOut();
      }

      logActivity('USER_DELETED', `Staff user @${cleanTarget} was deleted from the system`, cleanTarget);
      return true;
    },
    [currentUser, signOut, logActivity]
  );

  const activeRole: UserRole = currentUser?.role || 'customer';
  const isStaff =
    activeRole === 'super_admin' ||
    activeRole === 'admin' ||
    activeRole === 'editor' ||
    activeRole === 'human_reviewer';
  const isSuperAdmin = activeRole === 'super_admin';

  const value = useMemo(
    () => ({
      currentUser,
      role: activeRole,
      isStaff,
      isSuperAdmin,
      users,
      auditLogs,
      signIn,
      signUp,
      signOut,
      setRole,
      updateUserRole,
      deleteUser,
      logActivity,
      clearAuditLogs,
    }),
    [
      currentUser,
      activeRole,
      isStaff,
      isSuperAdmin,
      users,
      auditLogs,
      signIn,
      signUp,
      signOut,
      setRole,
      updateUserRole,
      deleteUser,
      logActivity,
      clearAuditLogs,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
