import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const RoleContext = createContext(undefined);

export function RoleProvider({ children }) {
    const { user: authUser } = useAuth();
    const [role, setRole] = useState('mentee');

    useEffect(() => {
        const primaryRole = authUser?.uiRoles?.[0];
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
