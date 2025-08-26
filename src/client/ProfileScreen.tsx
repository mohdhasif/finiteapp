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

const ProfileScreen = () => {
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
            const loadUserData = async () => {
                const userInfoRaw = await AsyncStorage.getItem('userInfo');
                const parsedUserInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
                setUserInfo(parsedUserInfo);
            };
            loadUserData();
        }, [])
    );

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
                Alert.alert('Gagal', 'Tidak dapat mendapatkan lokasi semasa.');
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
            Alert.alert('Ralat', 'Latitude tidak sah (-90 hingga 90).');
            return;
        }
        if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
            Alert.alert('Ralat', 'Longitude tidak sah (-180 hingga 180).');
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

    const handleToggleAzan = async (next: boolean) => {
        // Optimistic UI
        setPrayerEnabled(next);

        // Sediakan payload — hantar enabled sahaja pun cukup
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
            await saveSettings(payload);
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
        userInfo?.avatar_url && /^https?:\/\//.test(userInfo.avatar_url)
            ? { uri: userInfo.avatar_url }
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
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Profile</Text>

                <View style={styles.profileSection}>
                    <Image
                        source={logoSource}
                        style={styles.avatar}
                    />

                    <View>
                        <Text style={styles.name}>{userInfo?.name || 'Jane Smith'}</Text>
                        <Text style={styles.email}>{userInfo?.email || 'janesmith@email.com'}</Text>
                        <Text style={styles.role}>{userInfo?.role || 'Client'}</Text>
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
            </ScrollView>

            {/* Bottom Navigation - Client Version */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProjectListScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label, onLogout }: { icon: string; label: string; onLogout?: () => void }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    
    const handlePress = () => {
        if (label === 'My Profile') {
            navigation.navigate('MyProfileScreen');
        } else if (label === 'Change Password') {
            navigation.navigate('ChangePasswordScreen');
        } else if (label === 'FAQ') {
            navigation.navigate('FAQScreen');
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

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#d4d4d4',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#d4d4d4',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0077c2',
        alignSelf: 'center',
        marginBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 15,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0077c2',
    },
    email: {
        fontSize: 14,
        color: '#999',
    },
    role: {
        fontSize: 14,
        color: '#777',
    },
    menuList: {
        gap: 20,
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
    },
    menuIcon: {
        width: 30,
    },
    menuText: {
        fontSize: 16,
        color: '#0077c2',
        fontWeight: '500',
    },
    logoutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: 20,
    },
    logoutText: {
        fontSize: 16,
        color: '#0077c2',
        fontWeight: '500',
    },

    // Prayer Settings Styles
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 2 
    },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#0d4e80' 
    },
    dropdownHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    hint: { 
        marginTop: 6, 
        fontSize: 12, 
        color: '#6b7280' 
    },
    label: { 
        fontSize: 14, 
        color: '#0d4e80', 
        marginBottom: 6, 
        fontWeight: '600' 
    },
    input: {
        backgroundColor: '#f5f7fb', 
        borderRadius: 10, 
        paddingHorizontal: 12, 
        paddingVertical: 10,
        borderWidth: 1, 
        borderColor: '#e3e8f0', 
        fontSize: 14, 
        color: '#0f172a',
    },
    btn: { 
        backgroundColor: '#0077c2', 
        borderRadius: 12, 
        paddingVertical: 12, 
        alignItems: 'center', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        gap: 8, 
        paddingHorizontal: 12 
    },
    btnSecondary: { 
        backgroundColor: '#e6f1fb', 
        borderRadius: 12, 
        paddingVertical: 12, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: 12 
    },
    btnText: { 
        color: '#fff', 
        fontWeight: '600', 
        marginLeft: 6 
    },
    rowBetween: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },

    // Bottom Navigation - Client Version
    bottomNav: {
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 70, 
        backgroundColor: '#007baf',
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        flexDirection: 'row',
        justifyContent: 'space-around', 
        alignItems: 'center', 
        paddingBottom: 10,
    },
    navItem: { 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
});

export default ProfileScreen;
