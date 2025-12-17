'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'user' | 'admin';

interface AuthContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>('admin'); // Default to admin for now

    return (
        <AuthContext.Provider value={{ role, setRole, isAdmin: role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
