import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService, claimInstallSubscriptions } from '../services/authService';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import * as Geolocation from 'react-native-geolocation-service';

type AuthContextType = {
    userRole: string | null;
    clientStatus: 'active' | 'barred' | 'inactive' | null;
    login: (email: string, password: string) => Promise<string>;
    logout: () => Promise<void>;
    loading: boolean;
    setUserRoleManual: (role: string | null) => void;
    setClientStatusManual?: (status: 'active' | 'barred' | 'inactive' | null) => Promise<void>;
    captureLocation: () => Promise<void>;
    resetLocationCaptured: () => Promise<void>;
    isLocationCaptured: () => Promise<boolean>;
    getUserLocation: () => Promise<{ latitude: number; longitude: number } | null>;
    getLocationStatus: () => Promise<{
        isCaptured: boolean;
        coordinates: { latitude: number; longitude: number } | null;
        lastUpdated: string | null;
    }>;
    configurePrayerNotification: () => Promise<void>;
    resetPrayerNotification: () => Promise<void>;
    getPrayerNotificationStatus: () => Promise<{
        isConfigured: boolean;
        lastUpdated: string | null;
    }>;
    checkGeolocationStatus: () => Promise<{
        hasPermission: boolean;
        isEnabled: boolean;
        coordinates: { latitude: number; longitude: number } | null;
        lastUpdated: string | null;
    }>;
    debugAsyncStorage: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [clientStatus, setClientStatus] = useState<'active' | 'barred' | 'inactive' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const [token, storedRole, storedUserInfo, storedClientStatus] = await Promise.all([
                    AsyncStorage.getItem('userToken'),
                    AsyncStorage.getItem('userRole'),
                    AsyncStorage.getItem('userInfo'),
                    AsyncStorage.getItem('clientStatus'),
                ]);

                // console.log('LOADING USER:', token, storedRole);

                if (!token || !storedRole) {
                    await AsyncStorage.clear(); // 🔒 Auto logout if data is incomplete
                    setUserRole(null);
                } else {
                    // 🚀 Set user role immediately for fast UI response
                    setUserRole(storedRole);
                    // derive client status from stored value or userInfo
                    try {
                        let status: any = storedClientStatus;
                        if (!status && storedUserInfo) {
                            const info = JSON.parse(storedUserInfo || '{}');
                            status = info?.client_status || info?.status || null;
                        }
                        setClientStatus((status as any) ?? null);
                    } catch {
                        setClientStatus(null);
                    }

                    // 🔄 Background tasks - NON-BLOCKING (fire and forget)
                    setImmediate(async () => {
                        try {
                            // ——— CLAIM INSTALL → background task ———
                            const installId = await AsyncStorage.getItem('install_id');
                            if (installId) {
                                const claimedKey = `install_claimed_${installId}`;
                                const already = await AsyncStorage.getItem(claimedKey);

                                if (already !== '1') {
                                    await claimInstallSubscriptions(token, installId);
                                    await AsyncStorage.setItem(claimedKey, '1');
                                }
                            }
                        } catch (e) {
                            console.warn('Background: Claim install failed at loadUser:', e);
                        }

                        // 🔄 Auto-capture location for existing users (background)
                        try {
                            await autoCaptureAndSaveLocation(token);
                        } catch (e) {
                            console.warn('Background: Auto-location failed during loadUser:', e);
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to load user role:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // Listen for client status changes fired by API client
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('CLIENT_STATUS_CHANGED', async (status: any) => {
            const next = (status as any) ?? null;
            setClientStatus(next);
            if (next) await AsyncStorage.setItem('clientStatus', String(next));
        });
        return () => { sub.remove(); };
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
            try {
                // Try react-native-geolocation-service first
                if (Geolocation && typeof Geolocation.getCurrentPosition === 'function') {
                    console.log('📍 Using react-native-geolocation-service');
                    Geolocation.getCurrentPosition(
                        (pos: any) => {
                            console.log('📍 Geolocation success:', pos.coords);
                            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                        },
                        (error: any) => {
                            console.warn('📍 Geolocation error:', error);
                            resolve(null);
                        },
                        { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 } // Faster timeout, lower accuracy
                    );
                } else {
                    // Fallback to React Native's built-in Geolocation
                    console.log('📍 Falling back to React Native Geolocation');
                    const { Geolocation: RNGeolocation } = require('react-native');
                    if (RNGeolocation && typeof RNGeolocation.getCurrentPosition === 'function') {
                        RNGeolocation.getCurrentPosition(
                            (pos: any) => {
                                console.log('📍 RN Geolocation success:', pos.coords);
                                resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                            },
                            (error: any) => {
                                console.warn('📍 RN Geolocation error:', error);
                                resolve(null);
                            },
                            { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 } // Faster timeout, lower accuracy
                        );
                    } else {
                        console.warn('📍 No Geolocation service available');
                        resolve(null);
                    }
                }
            } catch (error) {
                console.warn('📍 Geolocation exception:', error);
                resolve(null);
            }
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

            console.log('📤 Saving prayer settings with payload:', JSON.stringify(payload, null, 2));

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

            console.log('✅ Prayer settings saved successfully');
        } catch (e: any) {
            console.warn('Failed to save prayer settings:', e?.message || 'Unknown error');
            throw e;
        }
    };

    const autoSavePrayerNotification = async (token: string): Promise<void> => {
        try {
            // Check if prayer notification already configured
            const prayerConfigured = await AsyncStorage.getItem('prayer_notification_configured');
            if (prayerConfigured === '1') {
                console.log('Prayer notification already configured, skipping...');
                return;
            }

            console.log('🕌 Auto-configuring prayer notification settings...');

            // Get current coordinates if available
            let lat = await AsyncStorage.getItem('user_latitude');
            let lng = await AsyncStorage.getItem('user_longitude');

            const payload: { enabled: number; latitude?: number; longitude?: number } = {
                enabled: 1 // Enable prayer notifications by default
            };

            // If no coordinates available, try to capture location first
            if (!lat || !lng) {
                console.log('📍 No coordinates available, attempting to capture location...');
                const hasPermission = await ensureLocationPermission();
                if (hasPermission) {
                    const coords = await getCurrentCoordinates();
                    if (coords) {
                        lat = coords.latitude.toString();
                        lng = coords.longitude.toString();
                        console.log(`📍 Location captured: ${lat}, ${lng}`);
                        
                        // Save coordinates to AsyncStorage
                        await AsyncStorage.setItem('user_latitude', lat);
                        await AsyncStorage.setItem('user_longitude', lng);
                        await AsyncStorage.setItem('location_captured', '1');
                        await AsyncStorage.setItem('location_last_updated', new Date().toISOString());
                    }
                }
            }

            // Add coordinates if available, otherwise use hardcoded fallback
            if (lat && lng) {
                payload.latitude = parseFloat(lat);
                payload.longitude = parseFloat(lng);
                console.log(`📍 Using coordinates: ${lat}, ${lng}`);
            } else {
                // Hardcoded fallback coordinates for Malaysia
                payload.latitude = 3.183376;
                payload.longitude = 101.541964;
                console.log('📍 Using hardcoded fallback coordinates: 3.183376, 101.541964');
            }

            // Save prayer notification settings
            await savePrayerSettings(token, payload);

            // Mark as configured
            await AsyncStorage.setItem('prayer_notification_configured', '1');
            await AsyncStorage.setItem('prayer_notification_last_updated', new Date().toISOString());
            console.log('✅ Prayer notification settings saved successfully');

        } catch (e: any) {
            console.warn('Auto-save prayer notification failed:', e?.message || 'Unknown error');
        }
    };

    const autoCaptureAndSaveLocation = async (token: string): Promise<void> => {
        try {
            // Check if already captured location (but allow force refresh)
            const locationCaptured = await AsyncStorage.getItem('location_captured');
            if (locationCaptured === '1') {
                console.log('Location already captured, skipping auto-location...');
                return;
            }

            console.log('🔄 Auto-capturing location for prayer times...');

            // Request location permission (non-blocking)
            const hasPermission = await ensureLocationPermission();
            if (!hasPermission) {
                console.log('Location permission denied, using hardcoded fallback...');
                // Use hardcoded fallback immediately
                await saveLocationData(token, { latitude: 3.183376, longitude: 101.541964 });
                return;
            }

            // Get current coordinates with shorter timeout
            let coords = null;
            let attempts = 0;
            const maxAttempts = 2; // Reduced from 3 to 2

            while (!coords && attempts < maxAttempts) {
                attempts++;
                console.log(`📍 Attempt ${attempts}/${maxAttempts} to get coordinates...`);
                
                coords = await getCurrentCoordinates();
                
                if (!coords && attempts < maxAttempts) {
                    console.log('Coordinates not available, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
                }
            }

            if (!coords) {
                console.log('Failed to get coordinates, using hardcoded fallback...');
                coords = { latitude: 3.183376, longitude: 101.541964 };
            }

            console.log(`📍 Location captured: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);

            // Save location data
            await saveLocationData(token, coords);

        } catch (e: any) {
            console.warn('Auto-location failed:', e?.message || 'Unknown error');
            // Fallback to hardcoded coordinates
            try {
                await saveLocationData(token, { latitude: 3.183376, longitude: 101.541964 });
            } catch (fallbackError) {
                console.warn('Fallback location save also failed:', fallbackError);
            }
        }
    };

    // Helper function to save location data
    const saveLocationData = async (token: string, coords: { latitude: number; longitude: number }): Promise<void> => {
        // Save to database with prayer notification enabled
        await savePrayerSettings(token, {
            enabled: 1,
            latitude: coords.latitude,
            longitude: coords.longitude
        });

        // Save to AsyncStorage in parallel
        await Promise.all([
            AsyncStorage.setItem('location_captured', '1'),
            AsyncStorage.setItem('location_last_updated', new Date().toISOString()),
            AsyncStorage.setItem('user_latitude', coords.latitude.toString()),
            AsyncStorage.setItem('user_longitude', coords.longitude.toString()),
            AsyncStorage.setItem('prayer_notification_configured', '1'),
            AsyncStorage.setItem('prayer_notification_last_updated', new Date().toISOString())
        ]);

        console.log('✅ Location and prayer settings saved successfully');
    };

    const resetLocationCaptured = async (): Promise<void> => {
        await AsyncStorage.removeItem('location_captured');
        await AsyncStorage.removeItem('user_latitude');
        await AsyncStorage.removeItem('user_longitude');
        await AsyncStorage.removeItem('location_last_updated');
        console.log('Location captured flag and coordinates reset');
    };

    const resetPrayerNotification = async (): Promise<void> => {
        await AsyncStorage.removeItem('prayer_notification_configured');
        await AsyncStorage.removeItem('prayer_notification_last_updated');
        console.log('Prayer notification settings reset');
    };

    const getLocationStatus = async (): Promise<{
        isCaptured: boolean;
        coordinates: { latitude: number; longitude: number } | null;
        lastUpdated: string | null;
    }> => {
        const captured = await AsyncStorage.getItem('location_captured');
        const lat = await AsyncStorage.getItem('user_latitude');
        const lng = await AsyncStorage.getItem('user_longitude');
        const lastUpdated = await AsyncStorage.getItem('location_last_updated');

        return {
            isCaptured: captured === '1',
            coordinates: lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null,
            lastUpdated: lastUpdated
        };
    };

    const getPrayerNotificationStatus = async (): Promise<{
        isConfigured: boolean;
        lastUpdated: string | null;
    }> => {
        const configured = await AsyncStorage.getItem('prayer_notification_configured');
        const lastUpdated = await AsyncStorage.getItem('prayer_notification_last_updated');

        return {
            isConfigured: configured === '1',
            lastUpdated: lastUpdated
        };
    };



    // Debug function to check all AsyncStorage values
    const debugAsyncStorage = async (): Promise<void> => {
        try {
            const keys = [
                'location_captured',
                'user_latitude', 
                'user_longitude',
                'location_last_updated',
                'prayer_notification_configured',
                'prayer_notification_last_updated'
            ];
            
            console.log('🔍 Debug AsyncStorage Values:');
            for (const key of keys) {
                const value = await AsyncStorage.getItem(key);
                console.log(`  - ${key}:`, value || 'null');
            }
        } catch (error) {
            console.warn('Error debugging AsyncStorage:', error);
        }
    };

    const checkGeolocationStatus = async (): Promise<{
        hasPermission: boolean;
        isEnabled: boolean;
        coordinates: { latitude: number; longitude: number } | null;
        lastUpdated: string | null;
    }> => {
        try {
            // Check permission
            const perm = Platform.OS === 'android'
                ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
            
            const permissionStatus = await check(perm);
            const hasPermission = permissionStatus === RESULTS.GRANTED || permissionStatus === RESULTS.LIMITED;

            // Check if location is captured
            const locationCaptured = await AsyncStorage.getItem('location_captured');
            const isEnabled = locationCaptured === '1';

            // Get stored coordinates
            const lat = await AsyncStorage.getItem('user_latitude');
            const lng = await AsyncStorage.getItem('user_longitude');
            const lastUpdated = await AsyncStorage.getItem('location_last_updated');

            const coordinates = lat && lng ? { 
                latitude: parseFloat(lat), 
                longitude: parseFloat(lng) 
            } : null;

            // Debug logging
            console.log('🔍 Geolocation Status Check:');
            console.log('  - Permission:', hasPermission ? 'Granted' : 'Denied');
            console.log('  - Location Captured:', isEnabled ? 'Yes' : 'No');
            console.log('  - Coordinates:', coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : 'None');
            console.log('  - Last Updated:', lastUpdated || 'Never');

            return {
                hasPermission,
                isEnabled,
                coordinates,
                lastUpdated
            };
        } catch (error) {
            console.warn('Error checking geolocation status:', error);
            return {
                hasPermission: false,
                isEnabled: false,
                coordinates: null,
                lastUpdated: null
            };
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const data = await loginService(email, password);
            console.log('response login', data);

            // ✅ Simpan dalam AsyncStorage - CRITICAL PATH (blocking)
            await Promise.all([
                AsyncStorage.setItem('userToken', data.token),
                AsyncStorage.setItem('userRole', data.user.role),
                AsyncStorage.setItem('userInfo', JSON.stringify(data.user)),
                AsyncStorage.setItem('clientStatus', String(data?.user?.client_status || data?.user?.status || 'active'))
            ]);

            // 🚀 Return role immediately for fast navigation
            const userRole = data.user.role;
            const status = (data?.user?.client_status || data?.user?.status || 'active') as any;
            setClientStatus(status);

            // 🔄 Background tasks - NON-BLOCKING (fire and forget)
            setImmediate(async () => {
                try {
                    // Install ID claim (background)
                    const installId = await AsyncStorage.getItem('install_id');
                    if (installId) {
                        const claimedKey = `install_claimed_${installId}`;
                        const already = await AsyncStorage.getItem(claimedKey);
                        
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
                            if (res.ok) {
                                await AsyncStorage.setItem(claimedKey, '1');
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Background: Claim install failed:', e);
                }

                // Auto-location and prayer settings (background)
                try {
                    console.log('🚀 Background: Starting auto-location capture...');
                    await autoCaptureAndSaveLocation(data.token);
                } catch (e) {
                    console.warn('Background: Auto-location failed:', e);
                    // Fallback to prayer notification only
                    try {
                        await autoSavePrayerNotification(data.token);
                    } catch (prayerError) {
                        console.warn('Background: Prayer notification also failed:', prayerError);
                    }
                }
            });

            return userRole; // Return immediately for fast navigation
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.clear();
            setUserRole(null);
            setClientStatus(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                userRole,
                clientStatus,
                login,
                logout,
                loading,
                setUserRoleManual: setUserRole,
                setClientStatusManual: async (s) => {
                    setClientStatus(s);
                    if (s) await AsyncStorage.setItem('clientStatus', s);
                    else await AsyncStorage.removeItem('clientStatus');
                },
                captureLocation: async () => {
                    const token = await AsyncStorage.getItem('userToken');
                    if (token) {
                        // Force refresh by removing the captured flag
                        await AsyncStorage.removeItem('location_captured');
                        await AsyncStorage.removeItem('user_latitude');
                        await AsyncStorage.removeItem('user_longitude');
                        await AsyncStorage.removeItem('location_last_updated');
                        console.log('🔄 Force refreshing location capture...');
                        await autoCaptureAndSaveLocation(token);
                    }
                },
                resetLocationCaptured,
                isLocationCaptured: async () => {
                    const captured = await AsyncStorage.getItem('location_captured');
                    return captured === '1';
                },
                getUserLocation: async () => {
                    const lat = await AsyncStorage.getItem('user_latitude');
                    const lng = await AsyncStorage.getItem('user_longitude');
                    if (lat && lng) {
                        return {
                            latitude: parseFloat(lat),
                            longitude: parseFloat(lng)
                        };
                    }
                    return null;
                },
                getLocationStatus,
                configurePrayerNotification: async () => {
                    const token = await AsyncStorage.getItem('userToken');
                    if (token) {
                        // Force refresh by removing the configured flag
                        await AsyncStorage.removeItem('prayer_notification_configured');
                        await AsyncStorage.removeItem('prayer_notification_last_updated');
                        console.log('🕌 Force refreshing prayer notification configuration...');
                        await autoSavePrayerNotification(token);
                    }
                },
                resetPrayerNotification,
                getPrayerNotificationStatus,
                checkGeolocationStatus,
                debugAsyncStorage,
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
