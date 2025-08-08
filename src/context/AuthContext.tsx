import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/apiConfig';

type AuthContextType = {
    userRole: string | null;
    login: (email: string, password: string) => Promise<string>;
    logout: () => Promise<void>;
    loading: boolean;
    setUserRoleManual: (role: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const storedRole = await AsyncStorage.getItem('userRole');

                if (!token || !storedRole) {
                    await AsyncStorage.clear(); // 🔒 Auto logout if data is incomplete
                    setUserRole(null);
                } else {
                    setUserRole(storedRole);
                }
            } catch (error) {
                console.error('Failed to load user role:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            // 🔍 Log untuk debug
            const clonedResponse = response.clone();
            const rawText = await clonedResponse.text();
            console.log('RESPONSE TEXT:', rawText);

            // ✅ Cuba parse JSON
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // ✅ Simpan dalam AsyncStorage
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userRole', data.user.role);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

            return data.user.role; // Biarkan caller handle navigation
        } catch (error) {
            console.error('Login error:', error);
            throw error;
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
        <AuthContext.Provider
            value={{
                userRole,
                login,
                logout,
                loading,
                setUserRoleManual: setUserRole,
            }}
        >
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
