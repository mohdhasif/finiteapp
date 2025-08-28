import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService, claimInstallSubscriptions } from '../services/authService';

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
                const [token, storedRole] = await Promise.all([
                    AsyncStorage.getItem('userToken'),
                    AsyncStorage.getItem('userRole'),
                ]);

                // console.log('LOADING USER:', token, storedRole);

                if (!token || !storedRole) {
                    await AsyncStorage.clear(); // 🔒 Auto logout if data is incomplete
                    setUserRole(null);
                } else {
                    setUserRole(storedRole);

                    // ——— CLAIM INSTALL → letak kat sini ———
                    try {
                        const installId = await AsyncStorage.getItem('install_id');
                        if (installId) {
                            const claimedKey = `install_claimed_${installId}`;
                            const already = await AsyncStorage.getItem(claimedKey);
                            // console.log('Already claimed?', already);

                            if (already !== '1') {
                                await claimInstallSubscriptions(token, installId);
                                await AsyncStorage.setItem(claimedKey, '1');
                                // console.log('Install ID claimed successfully at loadUser()');
                            }
                        }
                    } catch (e) {
                        console.warn('Claim install failed at loadUser():', e);
                    }
                    // ————————————————————————————————
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
            const data = await loginService(email, password);

            // ✅ Simpan dalam AsyncStorage
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userRole', data.user.role);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

            try {
                const installId = await AsyncStorage.getItem('install_id');
                if (installId) {
                    const claimedKey = `install_claimed_${installId}`;
                    const already = await AsyncStorage.getItem(claimedKey);
                    // console.log('Already claimed?', already);

                    if (already !== '1') {
                        const res = await fetch(API_ENDPOINTS.claimInstallSubscriptions, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${data.token}`,
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify({ install_id: installId }),
                        });
                        if (!res.ok) {
                            const t = await res.text();
                            throw new Error(t || `HTTP ${res.status}`);
                        }
                        await AsyncStorage.setItem(claimedKey, '1');
                        // console.log('Install ID claimed successfully at loadUser()');
                    }
                }
            } catch (e) {
                console.warn('Claim install failed at loadUser():', e);
            }

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
