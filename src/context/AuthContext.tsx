import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
    userRole: string | null;
    login: (email: string, password: string) => Promise<void>; // ⬅️ update param
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

    // const login = async (role: string) => {
    //     try {
    //         await AsyncStorage.setItem('userRole', role);
    //         await AsyncStorage.setItem('userToken', 'dummy_token');
    //         setUserRole(role);
    //     } catch (error) {
    //         console.error('Login error:', error);
    //     }
    // };

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('https://f57d73d76263.ngrok-free.app/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const text = await response.text();
            console.log('RESPONSE TEXT:', text); // tengok apa server reply

            const data = JSON.parse(text); // ✅ parse manual sebab ada error sebelum ni

            if (!response.ok) throw new Error(data.error || 'Login failed');

            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userRole', data.user.role);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            // const data = await response.json();

            // if (!response.ok) throw new Error(data.error || 'Login failed');

            // // Simpan info dari backend
            // await AsyncStorage.setItem('userRole', data.user.role);
            // await AsyncStorage.setItem('userToken', data.token);
            // await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            // setUserRole(data.user.role);
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
                setUserRoleManual: setUserRole, // expose setter
            }}>
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
