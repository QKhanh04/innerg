import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export type Role = 'mentee' | 'mentor' | 'hr' | 'admin';

interface User {
  userId: string | null;
  name: string;
  position: string;
  avatar: string;
}

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: User;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [role, setRole] = useState<Role>('mentee');

  useEffect(() => {
    const primaryRole = authUser?.uiRoles?.[0] as Role | undefined;
    if (primaryRole) {
      setRole(primaryRole);
    }
  }, [authUser]);

  const user = useMemo(() => {
    const primaryAppRole = authUser?.appRoles?.[0] || 'Mentee';

    return {
      userId: authUser?.userId || null,
      name: authUser?.fullName || authUser?.email || 'InnerG User',
      position: primaryAppRole,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(authUser?.email || authUser?.fullName || 'innerg-user')}`,
    };
  }, [authUser]);

  return (
    <RoleContext.Provider value={{ role, setRole, user }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
