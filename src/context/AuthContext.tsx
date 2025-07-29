import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            const response = await fetch('https://fd9315becb7e.ngrok-free.app/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            // 🔍 Logkan versi text (untuk debug) tanpa ganggu json parsing
            const clonedResponse = response.clone();
            const rawText = await clonedResponse.text();
            console.log('RESPONSE TEXT:', rawText);

            // ✅ Parse JSON rasmi
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Login failed');

            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userRole', data.user.role);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

            // setUserRole(data.user.role); // ✅ trigger navigasi ikut role
            return data.user.role; // ✅ return role tapi JANGAN terus setUserRole

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
