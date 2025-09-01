import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService, claimInstallSubscriptions } from '../services/authService';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import * as Geolocation from 'react-native-geolocation-service';

type AuthContextType = {
    userRole: string | null;
    login: (email: string, password: string) => Promise<string>;
    logout: () => Promise<void>;
    loading: boolean;
    setUserRoleManual: (role: string | null) => void;
    captureLocation: () => Promise<void>;
    resetLocationCaptured: () => Promise<void>;
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

                    // 🔄 Auto-capture location for existing users (non-blocking)
                    try {
                        await autoCaptureAndSaveLocation(token);
                    } catch (e) {
                        // Silent fail - don't block app loading
                        console.warn('Auto-location failed during loadUser:', e);
                    }
                }
            } catch (error) {
                console.error('Failed to load user role:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // ===== Auto-Location Functions =====
    const ensureLocationPermission = async (): Promise<boolean> => {
        const perm = Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

        let res = await check(perm);
        if (res === RESULTS.DENIED) res = await request(perm);
        if (res === RESULTS.BLOCKED) {
            Alert.alert(
                'Location Access Required',
                'Please allow location access in Settings to automatically configure prayer times.',
                [
                    { text: 'Open Settings', onPress: () => { openSettings().catch(() => { }); } },
                    { text: 'Skip', style: 'cancel' },
                ]
            );
            return false;
        }
        return res === RESULTS.GRANTED || res === RESULTS.LIMITED;
    };

    const getCurrentCoordinates = (): Promise<{ latitude: number; longitude: number } | null> =>
        new Promise(resolve => {
            Geolocation.getCurrentPosition(
                pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });

    const savePrayerSettings = async (token: string, payload: { enabled?: number; latitude?: number; longitude?: number }): Promise<void> => {
        try {
            let url = API_ENDPOINTS.savePrayerSettings;
            const headers: Record<string, string> = { 
                'Content-Type': 'application/json', 
                Accept: 'application/json',
                Authorization: `Bearer ${token}`
            };

            url += (url.includes('?') ? '&' : '?') + 'me=1';

            const controller = new AbortController();
            const tm = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(tm);

            if (!res.ok) {
                const text = await res.text();
                const ct = res.headers.get('content-type') || '';
                const json = ct.includes('application/json') ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
                throw new Error(json?.error || text || `HTTP ${res.status}`);
            }
        } catch (e: any) {
            console.warn('Failed to save prayer settings:', e?.message || 'Unknown error');
            throw e;
        }
    };

    const autoCaptureAndSaveLocation = async (token: string): Promise<void> => {
        try {
            // Check if already captured location
            const locationCaptured = await AsyncStorage.getItem('location_captured');
            if (locationCaptured === '1') {
                console.log('Location already captured, skipping...');
                return;
            }

            console.log('🔄 Auto-capturing location for prayer times...');

            // Request location permission
            const hasPermission = await ensureLocationPermission();
            if (!hasPermission) {
                console.log('Location permission denied, skipping auto-location');
                return;
            }

            // Get current coordinates
            const coords = await getCurrentCoordinates();
            if (!coords) {
                console.log('Failed to get coordinates, skipping auto-location');
                return;
            }

            console.log(`📍 Location captured: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);

            // Save to database
            await savePrayerSettings(token, {
                enabled: 1,
                latitude: coords.latitude,
                longitude: coords.longitude
            });

            // Mark as captured
            await AsyncStorage.setItem('location_captured', '1');
            console.log('✅ Location saved to database successfully');

        } catch (e: any) {
            // Silent fail - don't interrupt user flow
            console.warn('Auto-location failed:', e?.message || 'Unknown error');
        }
    };

    const resetLocationCaptured = async (): Promise<void> => {
        await AsyncStorage.removeItem('location_captured');
        console.log('Location captured flag reset');
    };

    const login = async (email: string, password: string) => {
        try {
            const data = await loginService(email, password);
            console.log('response login', data);

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

            // 🔄 Auto-capture location for prayer times (non-blocking)
            try {
                await autoCaptureAndSaveLocation(data.token);
            } catch (e) {
                // Silent fail - don't block login
                console.warn('Auto-location failed during login:', e);
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
                captureLocation: async () => {
                    const token = await AsyncStorage.getItem('userToken');
                    if (token) {
                        await autoCaptureAndSaveLocation(token);
                    }
                },
                resetLocationCaptured,
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
