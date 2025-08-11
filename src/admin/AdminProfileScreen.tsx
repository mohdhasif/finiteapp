import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ScrollView, Switch, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/apiConfig';

// location libs
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';

type Coords = { latitude: number; longitude: number } | null;


type SaveSettingsPayload = {
    enabled?: number;
    latitude?: number;
    longitude?: number;
};

type SaveSettingsResponse = {
    success?: boolean;
    [k: string]: any;
};

const AdminProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { logout } = useAuth();

    const [isNotificationOn, setIsNotificationOn] = useState(true);
    const [installId, setInstallId] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);

    const [coords, setCoords] = useState<Coords>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // load token/install_id + prefill setting if ada
        (async () => {
            try {
                const inst = await AsyncStorage.getItem('install_id');
                const token = await AsyncStorage.getItem('userToken');
                setInstallId(inst);
                setUserToken(token);

                // (optional) prefill enabled dari server kalau ada endpoint
                try {
                    const headers: Record<string, string> = { Accept: 'application/json' };
                    let url: string | null = null;
                    if (token) {
                        url = `${API_ENDPOINTS.getPrayerSettings}?me=1`;
                        headers.Authorization = `Bearer ${token}`;
                    } else if (inst) {
                        url = `${API_ENDPOINTS.getPrayerSettings}?install_id=${encodeURIComponent(inst)}`;
                    }
                    if (url) {
                        const r = await fetch(url, { headers });
                        if (r.ok) {
                            const j = await r.json();
                            if (j?.setting?.enabled != null) setIsNotificationOn(!!j.setting.enabled);
                        }
                    }
                } catch { }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        // auto-capture location setiap kali screen buka
        captureAndSaveLocation(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ensureLocationPermission = async (): Promise<boolean> => {
        const perm =
            Platform.OS === 'android'
                ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

        let res = await check(perm);
        if (res === RESULTS.DENIED) {
            res = await request(perm);
        }
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

    const getCurrentCoordinates = (): Promise<Coords> => {
        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    };

    const saveSettings = async (payload: SaveSettingsPayload): Promise<SaveSettingsResponse> => {
        // bina URL + headers
        let url = API_ENDPOINTS.savePrayerSettings; // contoh: http://localhost:9000/save_prayer_settings.php
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        let bodyPayload: any = { ...payload };

        if (userToken) {
            // tambah ?me=1 dengan selamat
            url += url.includes('?') ? '&me=1' : '?me=1';
            headers.Authorization = `Bearer ${userToken}`;
        } else if (installId) {
            bodyPayload.install_id = installId;
        } else {
            throw new Error('install_id tiada. Buka app sekali untuk generate.');
        }

        // timeout (15s) supaya tak tersekat
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        let res: Response;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyPayload),
                signal: controller.signal,
            });
        } catch (err: any) {
            clearTimeout(timeout);
            if (err?.name === 'AbortError') throw new Error('Request timeout. Sila cuba lagi.');
            throw new Error(err?.message || 'Network error');
        } finally {
            clearTimeout(timeout);
        }

        const text = await res.text();
        console.log('SAVE SETTINGS:', text);
        
        const contentType = res.headers.get('content-type') || '';
        let json: any = null;
        if (contentType.includes('application/json')) {
            try { json = JSON.parse(text); } catch { /* ignore */ }
        }

        if (!res.ok) {
            // log untuk debug
            console.log('saveSettings error:', { status: res.status, body: text });
            throw new Error(json?.error || text || `HTTP ${res.status}`);
        }

        return json ?? {};
    };

    const captureAndSaveLocation = async (showToastOnSuccess = false) => {
        try {
            setSaving(true);
            const ok = await ensureLocationPermission();
            if (!ok) {
                // tetap simpan enabled state walaupun tiada lokasi
                await saveSettings({ enabled: isNotificationOn ? 1 : 0 });
                return;
            }
            const c = await getCurrentCoordinates();
            if (c) {
                setCoords(c);
                await saveSettings({
                    enabled: isNotificationOn ? 1 : 0,
                    latitude: c.latitude,
                    longitude: c.longitude,
                });
                if (showToastOnSuccess) {
                    Alert.alert('Lokasi Dikemaskini', `Lat: ${c.latitude.toFixed(5)}, Lng: ${c.longitude.toFixed(5)}`);
                }
            } else {
                await saveSettings({ enabled: isNotificationOn ? 1 : 0 });
            }
        } catch (e: any) {
            Alert.alert('Gagal', e?.message ?? 'Ralat tidak diketahui');
        } finally {
            setSaving(false);
        }
    };

    const onToggleNotification = async (value: boolean) => {
        setIsNotificationOn(value);
        // simpan terus (tak tunggu user tekan apa-apa)
        try {
            setSaving(true);
            await saveSettings({ enabled: value ? 1 : 0, ...(coords ?? {}) });
        } catch (e: any) {
            Alert.alert('Gagal', e?.message ?? 'Tak dapat simpan toggle');
            setIsNotificationOn(!value);
        } finally {
            setSaving(false);
        }
    };

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
                    <Image source={require('../assets/user.png')} style={styles.avatar} />
                    <View>
                        <Text style={styles.name}>Jane Smith</Text>
                        <Text style={styles.email}>janesmith@email.com</Text>
                        <Text style={styles.role}>Viewer</Text>
                    </View>
                </View>

                <View style={styles.menuList}>
                    <MenuItem icon="person-outline" label="My Profile" />
                    <MenuItem icon="lock-closed-outline" label="Change Password" />

                    {/* Notifications toggle */}
                    <View style={styles.menuItem}>
                        <Icon name="notifications-outline" size={22} color="#555" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Notifications</Text>
                        <View style={{ flex: 1 }} />
                        <Switch
                            value={isNotificationOn}
                            onValueChange={onToggleNotification}
                            trackColor={{ false: '#ccc', true: '#0077c2' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Location status + refresh */}
                    <View style={[styles.card, { gap: 8 }]}>
                        <Text style={styles.cardTitle}>Current Location</Text>
                        <Text style={styles.hint}>
                            {coords
                                ? `Lat: ${coords.latitude.toFixed(5)}  Lng: ${coords.longitude.toFixed(5)}`
                                : 'Belum dapat lokasi'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            disabled={saving}
                            onPress={() => captureAndSaveLocation(true)}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Icon name="navigate-outline" size={18} color="#fff" />
                                    <Text style={styles.saveText}>Refresh Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {installId ? <Text style={styles.hint}>Install ID: {installId}</Text> : null}
                    </View>

                    <MenuItem icon="help-circle-outline" label="FAQ" />
                </View>

                <TouchableOpacity style={styles.logoutContainer} onPress={logout}>
                    <Icon name="log-out-outline" size={22} color="#555" style={styles.menuIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label }: { icon: string; label: string }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const handlePress = () => {
        if (label === 'My Profile') {
            navigation.navigate('AdminMyProfileScreen');
        } else if (label === 'Change Password') {
            navigation.navigate('AdminChangePasswordScreen');
        } else if (label === 'FAQ') {
            navigation.navigate('AdminFAQScreen');
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
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#0d4e80', marginBottom: 4 },
    saveBtn: { marginTop: 8, backgroundColor: '#0077c2', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    saveText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
    hint: { marginTop: 4, fontSize: 12, color: '#6b7280' },
});

export default AdminProfileScreen;
