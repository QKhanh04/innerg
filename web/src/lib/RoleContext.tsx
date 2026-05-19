import React, { createContext, useContext, useState } from 'react';

export type Role = 'mentee' | 'mentor' | 'hr' | 'admin';

interface User {
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
  const [role, setRole] = useState<Role>('mentee');

  const user = {
    name: 'Nguyen Van A',
    position: 'Product Designer',
    avatar: 'https://i.pravatar.cc/150?u=a',
  };

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
