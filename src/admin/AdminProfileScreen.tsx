import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ScrollView, Switch, SafeAreaView, ActivityIndicator, Alert,
    TextInput, Platform, UIManager, LayoutAnimation
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/apiConfig';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { getMyProfile, type MyProfile } from '../services/adminService'; // contoh path

type Coords = { latitude: number; longitude: number } | null;

type SaveSettingsPayload = {
    enabled?: number;
    latitude?: number;
    longitude?: number;
};
type SaveSettingsResponse = { success?: boolean;[k: string]: any };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { logout } = useAuth();

    // Toggle umum app (project/task dsb)
    const [isNotificationOn, setIsNotificationOn] = useState(true);

    // Auth/storage
    const [installId, setInstallId] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);

    // Prayer dropdown states
    const [prayerExpanded, setPrayerExpanded] = useState(false);
    const [prayerEnabled, setPrayerEnabled] = useState(true);
    const [latInput, setLatInput] = useState<string>('');
    const [lngInput, setLngInput] = useState<string>('');

    // UI
    const [coords, setCoords] = useState<Coords>(null);
    const [loading, setLoading] = useState(true);
    const [savingPrayer, setSavingPrayer] = useState(false);

    // throttle autosave on focus
    const lastAutoRunRef = useRef<number>(0);

    const [userInfo, setUserInfo] = useState<any>(null);

    const [profile, setProfile] = useState<MyProfile | null>(null);

    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                let inst = await AsyncStorage.getItem('install_id');
                const token = await AsyncStorage.getItem('userToken');

                // kalau tak jumpa, generate sekali
                if (!inst) {
                    inst = `inst_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
                    await AsyncStorage.setItem('install_id', inst);
                }

                setInstallId(inst);
                setUserToken(token);

                // Prefill dari server (guna inst yang confirm wujud)
                await loadPrayerSettings(token, inst);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                let inst = installId ?? (await AsyncStorage.getItem('install_id'));
                if (!inst) {
                    inst = `inst_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
                    await AsyncStorage.setItem('install_id', inst);
                    setInstallId(inst);
                }
            })();
        }, [installId])
    );

    useFocusEffect(
        useCallback(() => {
            if (loading || (!userToken && !installId)) return;

            const now = Date.now();
            if (now - lastAutoRunRef.current < 30000) return; // throttle 30s
            lastAutoRunRef.current = now;

            // auto save senyap (tanpa alert)
        }, [loading, userToken, installId])
    );

    useFocusEffect(
        useCallback(() => {
            const loadUserData = async () => {
                const userInfoRaw = await AsyncStorage.getItem('userInfo');
                const parsedUserInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

                setUserInfo(parsedUserInfo);
            };
            loadUserData();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const run = async () => {
                try {
                    const now = Date.now();
                    if (now - lastAutoRunRef.current < 30_000) {
                        // console.log('[PROFILE] throttled');
                        return;
                    }
                    lastAutoRunRef.current = now;

                    const tokenRaw = await AsyncStorage.getItem('userToken'); // string | null
                    if (!tokenRaw) {
                        // console.log('[PROFILE] token tiada, skip');
                        return;
                    }

                    const me = await getMyProfile(tokenRaw); // tokenRaw confirmed string
                    if (!isActive) return;

                    // console.log(me);
                    setProfile(me);
                    setUserInfo(me);
                } catch (err: any) {
                    if (!isActive) return;
                    // console.log('[PROFILE][ERR]', err?.message || err);
                }
            };

            run();
            return () => { isActive = false; };
        }, [])
    );

    // useFocusEffect(
    //     useCallback(() => {
    //         if (loading || (!userToken && !installId)) return;

    //         const now = Date.now();
    //         if (now - lastAutoRunRef.current < 30000) return; // throttle 30s
    //         lastAutoRunRef.current = now;

    //         // auto save senyap (tanpa alert)
    //         captureAndSaveLocation({ toast: false, quiet: true });
    //     }, [loading, userToken, installId, captureAndSaveLocation])
    // );

    const saveSettings = async (payload: SaveSettingsPayload): Promise<SaveSettingsResponse> => {
        let url = API_ENDPOINTS.savePrayerSettings;
        const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
        const bodyPayload: any = { ...payload };

        // Prefer state; fallback ke storage
        const token = userToken ?? (await AsyncStorage.getItem('userToken'));
        const inst = installId ?? (await AsyncStorage.getItem('install_id'));

        if (token) {
            url += (url.includes('?') ? '&' : '?') + 'me=1';
            headers.Authorization = `Bearer ${token}`;
        } else if (inst) {
            bodyPayload.install_id = inst;
        } else {
            throw new Error('install_id tiada. Buka app sekali untuk generate.');
        }

        const controller = new AbortController();
        const tm = setTimeout(() => controller.abort(), 15000);

        let res: Response;
        try {
            res = await fetch(url,
                {
                    method: 'POST',
                    headers, body: JSON.stringify(bodyPayload),
                    signal: controller.signal
                });
        } catch (err: any) {
            clearTimeout(tm);
            if (err?.name === 'AbortError') throw new Error('Request timeout. Sila cuba lagi.');
            throw new Error(err?.message || 'Network error');
        } finally {
            clearTimeout(tm);
        }

        const text = await res.text();
        const ct = res.headers.get('content-type') || '';
        const json = ct.includes('application/json') ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
        if (!res.ok) {
            // console.log('saveSettings error:', { status: res.status, body: text });
            throw new Error(json?.error || text || `HTTP ${res.status}`);
        }
        return json ?? {};
    };

    async function loadPrayerSettings(token: string | null, inst: string | null) {
        try {
            const headers: Record<string, string> = { Accept: 'application/json' };
            let url = API_ENDPOINTS.getPrayerSettings;
            if (token) {
                url += (url.includes('?') ? '&' : '?') + 'me=1';
                headers.Authorization = `Bearer ${token}`;
            } else if (inst) {
                url += (url.includes('?') ? '&' : '?') + `install_id=${encodeURIComponent(inst)}`;
            } else return;

            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 15000);
            const r = await fetch(url, { headers, signal: ctrl.signal });
            clearTimeout(to);
            if (!r.ok) return;
            const j = (await r.json()) ?? {};
            if (!j?.setting) return;

            if (typeof j.setting.enabled !== 'undefined') {
                setPrayerEnabled(!!j.setting.enabled);
            }
            if (j.setting.latitude != null && j.setting.longitude != null) {
                const lat = Number(j.setting.latitude);
                const lng = Number(j.setting.longitude);
                setCoords({ latitude: lat, longitude: lng });
                setLatInput(String(lat));
                setLngInput(String(lng));
            }
        } catch { }
    }

    // ===== Helpers =====
    const ensureLocationPermission = async (): Promise<boolean> => {
        const perm = Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

        let res = await check(perm);
        if (res === RESULTS.DENIED) res = await request(perm);
        if (res === RESULTS.BLOCKED) {
            Alert.alert(
                'Location Disabled',
                'Sila benarkan lokasi dalam Settings untuk kemaskini waktu solat.',
                [
                    { text: 'Buka Settings', onPress: () => { openSettings().catch(() => { }); } },
                    { text: 'Batal', style: 'cancel' },
                ]
            );
            return false;
        }
        return res === RESULTS.GRANTED || res === RESULTS.LIMITED;
    };

    const getCurrentCoordinates = (): Promise<Coords> =>
        new Promise(resolve => {
            Geolocation.getCurrentPosition(
                pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });

    // ===== Prayer dropdown actions =====
    const togglePrayerSection = () => {
        LayoutAnimation.easeInEaseOut();
        setPrayerExpanded(prev => !prev);
    };

    const onUseCurrentLocation = async () => {
        try {
            setSavingPrayer(true);
            const ok = await ensureLocationPermission();
            if (!ok) return;
            const c = await getCurrentCoordinates();
            if (!c) {
                Alert.alert('Failed', 'Cannot get current location.');
                return;
            }
            setCoords(c);
            setLatInput(String(c.latitude));
            setLngInput(String(c.longitude));
        } finally {
            setSavingPrayer(false);
        }
    };

    const onSavePrayerSettings = async () => {
        const lat = latInput.trim() === '' ? undefined : Number(latInput);
        const lng = lngInput.trim() === '' ? undefined : Number(lngInput);

        if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
            Alert.alert('Error', 'Invalid latitude (-90 to 90).');
            return;
        }
        if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
            Alert.alert('Error', 'Invalid longitude (-180 to 180).');
            return;
        }

        try {
            setSavingPrayer(true);
            const payload: SaveSettingsPayload = { enabled: prayerEnabled ? 1 : 0 };
            if (lat !== undefined && lng !== undefined) {
                payload.latitude = lat;
                payload.longitude = lng;
            }
            await saveSettings(payload);
            if (lat !== undefined && lng !== undefined) setCoords({ latitude: lat, longitude: lng });
            Alert.alert('Berjaya', 'Prayer settings disimpan.');
        } catch (e: any) {
            Alert.alert('Gagal', e?.message ?? 'Tidak dapat simpan settings.');
        } finally {
            setSavingPrayer(false);
        }
    };

    // ===== Auto-save lokasi setiap kali screen difokus =====
    // const captureAndSaveLocation = useCallback(async (opts: { toast?: boolean; quiet?: boolean } = {}) => {
    //     const { toast = false, quiet = true } = opts;
    //     try {
    //         const ok = await ensureLocationPermission();
    //         if (!ok) {
    //             await saveSettings({ enabled: prayerEnabled ? 1 : 0 });
    //             return;
    //         }
    //         const c = await getCurrentCoordinates();
    //         if (c) {
    //             // kalau tak banyak berubah (<50m), boleh skip — jimat request
    //             if (coords) {
    //                 const dist = distanceMeters(coords, c);
    //                 if (dist < 50) return;
    //             }
    //             setCoords(c);
    //             setLatInput(String(c.latitude));
    //             setLngInput(String(c.longitude));
    //             await saveSettings({ enabled: prayerEnabled ? 1 : 0, latitude: c.latitude, longitude: c.longitude });
    //             if (toast) {
    //                 Alert.alert('Lokasi Dikemaskini', `Lat: ${c.latitude.toFixed(5)}, Lng: ${c.longitude.toFixed(5)}`);
    //             }
    //         } else {
    //             await saveSettings({ enabled: prayerEnabled ? 1 : 0 });
    //             if (!quiet) Alert.alert('Gagal', 'Tidak dapat mendapatkan lokasi semasa.');
    //         }
    //     } catch (e: any) {
    //         if (!quiet) Alert.alert('Gagal', e?.message ?? 'Ralat tidak diketahui');
    //     }
    // }, [coords, prayerEnabled, userToken, installId]);

    const handleToggleAzan = async (next: boolean) => {
        // Optimistic UI
        setPrayerEnabled(next);

        // Sediakan payload — hantar enabled sahaja pun cukup
        // (optional) kalau nak hantar lat/lng sekali bila wujud & sah
        const lat = latInput.trim() === '' ? undefined : Number(latInput);
        const lng = lngInput.trim() === '' ? undefined : Number(lngInput);
        const payload: SaveSettingsPayload = { enabled: next ? 1 : 0 };

        if (
            lat !== undefined && !isNaN(lat) && lat >= -90 && lat <= 90 &&
            lng !== undefined && !isNaN(lng) && lng >= -180 && lng <= 180
        ) {
            payload.latitude = lat;
            payload.longitude = lng;
        }

        try {
            setSavingPrayer(true);
            await saveSettings(payload); // <-- terus update DB
            // (optional) boleh tambah toast/snackbar ringan jika perlu
        } catch (e: any) {
            // Revert bila gagal
            setPrayerEnabled(!next);
            Alert.alert('Gagal', e?.message ?? 'Tidak dapat kemaskini tetapan azan.');
        } finally {
            setSavingPrayer(false);
        }
    };

    // Sumber avatar default
    const avatarSrc = require('../assets/user.png');

    // Sumber logo client (dari profile), fallback ke avatar default
    const logoSource =
        profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url)
            ? { uri: profile.avatar_url }
            : avatarSrc;

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0077c2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>

            {/* Quick Add dropdown */}
            {showDropdown && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AdminCreateProjectScreen'); }}>
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AddTaskScreen'); }}>
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Profile</Text>

                <View style={styles.profileSection}>
                    <Image
                        source={logoSource}
                        style={styles.avatar}
                    />

                    <View>
                        <Text style={styles.name}>{userInfo.name}</Text>
                        <Text style={styles.email}>{userInfo.email}</Text>
                        <Text style={styles.role}>{userInfo.role}</Text>
                    </View>
                </View>

                <View style={styles.menuList}>
                    <MenuItem icon="person-outline" label="My Profile" />
                    <MenuItem icon="lock-closed-outline" label="Change Password" />

                    {/* Toggle umum app notifications */}
                    <View style={styles.menuItem}>
                        <Icon name="notifications-outline" size={22} color="#555" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Notifications</Text>
                        <View style={{ flex: 1 }} />
                        <Switch
                            value={isNotificationOn}
                            onValueChange={setIsNotificationOn}
                            trackColor={{ false: '#ccc', true: '#0077c2' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Prayer Settings dropdown */}
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.dropdownHeader} onPress={togglePrayerSection}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="volume-high-outline" size={20} color="#0d4e80" />
                                <Text style={[styles.cardTitle, { marginLeft: 8 }]}>Prayer Settings (Azan)</Text>
                            </View>
                            <Icon name={prayerExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#0d4e80" />
                        </TouchableOpacity>

                        {prayerExpanded && (
                            <View style={{ marginTop: 12, gap: 14 }}>
                                {/* Enable Azan */}
                                <View style={styles.rowBetween}>
                                    <Text style={styles.label}>Enable Azan</Text>
                                    <Switch
                                        value={prayerEnabled}
                                        onValueChange={handleToggleAzan}
                                        disabled={savingPrayer}
                                        trackColor={{ false: '#ccc', true: '#0077c2' }}
                                        thumbColor="#fff"
                                    />

                                </View>

                                {/* Lat/Lng inputs */}
                                <View>
                                    <Text style={styles.label}>Latitude</Text>
                                    <TextInput
                                        value={latInput}
                                        onChangeText={setLatInput}
                                        placeholder="e.g. 3.1390"
                                        keyboardType="decimal-pad"
                                        style={styles.input}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.label}>Longitude</Text>
                                    <TextInput
                                        value={lngInput}
                                        onChangeText={setLngInput}
                                        placeholder="e.g. 101.6869"
                                        keyboardType="decimal-pad"
                                        style={styles.input}
                                    />
                                </View>

                                {/* Actions */}
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.btn, { flex: 1 }, savingPrayer && { opacity: 0.6 }]}
                                        onPress={onUseCurrentLocation}
                                        disabled={savingPrayer}
                                    >
                                        {savingPrayer ? <ActivityIndicator color="#fff" /> : (
                                            <>
                                                <Icon name="navigate-outline" size={18} color="#fff" />
                                                <Text style={styles.btnText}>Use Current Location</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.btnSecondary, { flex: 1 }, savingPrayer && { opacity: 0.6 }]}
                                        onPress={onSavePrayerSettings}
                                        disabled={savingPrayer}
                                    >
                                        <Text style={[styles.btnText, { color: '#0d4e80' }]}>Save</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.hint}>
                                    Sistem akan guna lat/long ini untuk ambil waktu solat harian dan hantar notifikasi tepat pada waktunya.
                                </Text>

                                {installId ? <Text style={styles.hint}>Install ID: {installId}</Text> : null}
                                {coords ? <Text style={styles.hint}>Current: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text> : null}
                            </View>
                        )}
                    </View>

                    <MenuItem icon="help-circle-outline" label="FAQ" />
                    <MenuItem icon="log-out-outline" label="Logout" onLogout={logout} />

                </View>

                {/* <TouchableOpacity style={styles.logoutContainer} onPress={logout}>
                    <Icon name="log-out-outline" size={22} color="#555" style={styles.menuIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity> */}
            </ScrollView>

            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminCalendarScreen')}>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => setShowDropdown(v => !v)}>
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminNotificationsScreen')} >
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label, onLogout }: { icon: string; label: string; onLogout?: () => void }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const handlePress = () => {
        if (label === 'My Profile') {
            navigation.navigate('AdminMyProfileScreen');
        } else if (label === 'Change Password') {
            navigation.navigate('AdminChangePasswordScreen');
        } else if (label === 'FAQ') {
            navigation.navigate('AdminFAQScreen');
        } else if (label === 'Logout') {
            onLogout?.();
        }

    };
    return (
        <TouchableOpacity style={styles.menuItem} onPress={handlePress}>
            <Icon name={icon} size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuText}>{label}</Text>
        </TouchableOpacity>
    );
};

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const R = 6371000; // m
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLng = (b.longitude - a.longitude) * Math.PI / 180;
    const la1 = a.latitude * Math.PI / 180;
    const la2 = b.latitude * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}

const styles = StyleSheet.create({

    dropdown: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 4,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 10,
    },

    option: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0072B5',
    },

    safe: { flex: 1, backgroundColor: '#d4d4d4' },
    container: {
        padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'flex-start',
        backgroundColor: '#d4d4d4', borderTopLeftRadius: 15, borderTopRightRadius: 15,
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#0077c2', alignSelf: 'center', marginBottom: 24 },
    profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 },
    avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 15 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#0077c2' },
    email: { fontSize: 14, color: '#999' },
    role: { fontSize: 14, color: '#777' },
    menuList: { gap: 20, marginTop: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 5 },
    menuIcon: { width: 30 },
    menuText: { fontSize: 16, color: '#0077c2', fontWeight: '500' },
    logoutContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingVertical: 20 },
    logoutText: { fontSize: 16, color: '#0077c2', fontWeight: '500' },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#0d4e80' },
    dropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    hint: { marginTop: 6, fontSize: 12, color: '#6b7280' },

    label: { fontSize: 14, color: '#0d4e80', marginBottom: 6, fontWeight: '600' },
    input: {
        backgroundColor: '#f5f7fb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: '#e3e8f0', fontSize: 14, color: '#0f172a',
    },

    btn: { backgroundColor: '#0077c2', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
    btnSecondary: { backgroundColor: '#e6f1fb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    btnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    // Bottom tab
    bottomTab: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: '#0072B5', height: 60, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10,
    },
    fab: {
        backgroundColor: '#fff', width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center', marginTop: -40,
    },
});

export default AdminProfileScreen;
