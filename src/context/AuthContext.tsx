import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
    userRole: string | null;
    login: (role: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedRole = await AsyncStorage.getItem('userRole');
                if (storedRole) {
                    setUserRole(storedRole);
                } else {
                    setUserRole(null);
                }
            } catch (error) {
                console.error('Failed to load user role:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (role: string) => {
        try {
            await AsyncStorage.setItem('userRole', role);
            await AsyncStorage.setItem('userToken', 'dummy_token');
            setUserRole(role);
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.clear();
            setUserRole(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ userRole, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
