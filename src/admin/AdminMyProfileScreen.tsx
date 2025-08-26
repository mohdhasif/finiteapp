// src/screens/AdminMyProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
    ScrollView, Dimensions, SafeAreaView, Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { getUserDetails, updateUserDetails, type UserDetails } from '../services/authService';
import { BASE_URL, API_ENDPOINTS } from '../constants/apiConfig';


const { width } = Dimensions.get('window');

const AdminMyProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [isModalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [token, setToken] = useState<string>('');

    const [profile, setProfile] = useState<UserDetails | null>(null);
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');      // YYYY-MM-DD
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [phone, setPhone] = useState('');
    const [avatarUriLocal, setAvatarUriLocal] = useState<{ uri: string; fileName?: string; type?: string } | string | null>(null);
    const [myId, setMyId] = useState<number | null>(null);
    const [me, setMe] = useState<UserDetails | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const tk = (await AsyncStorage.getItem('userToken')) || '';
                setToken(tk);
                if (!tk) {
                    Alert.alert('Error', 'Token is missing. Please log in again.');
                    setLoading(false);
                    return;
                }
                
                // Try to fetch user details from API first
                try {
                    const userDetails = await getUserDetails(tk);
                    
                    console.log('userDetails: ', userDetails);
                    
                    setMe(userDetails);
                    setMyId(userDetails.id);
                    setProfile(userDetails);
                    setName(userDetails.name || '');
                    setDob(userDetails.dob || '');
                    setGender(userDetails.gender || '');
                    setPhone(userDetails.phone || '');
                    setAvatarUriLocal(userDetails.avatar_url
                        ? (userDetails.avatar_url.startsWith('http')
                            ? userDetails.avatar_url
                            : `${BASE_URL}${userDetails.avatar_url}`)
                        : null
                    );
                } catch (apiError) {
                    // console.log('API failed, falling back to AsyncStorage:', apiError);
                    
                    // Fallback to AsyncStorage
                    const userInfoRaw = await AsyncStorage.getItem('userInfo');
                    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
                    
                    if (userInfo) {
                        setMe(userInfo);
                        setMyId(userInfo?.id ?? null);
                        setProfile(userInfo);
                        setName(userInfo?.name || '');
                        setDob(userInfo?.dob || '');
                        setGender((userInfo?.gender as any) || '');
                        setPhone(userInfo?.phone || '');
                        setAvatarUriLocal(userInfo?.avatar_url || null);
                    } else {
                        // Set default values if no user info found
                        setMe(null);
                        setMyId(null);
                        setProfile(null);
                        setName('');
                        setDob('');
                        setGender('');
                        setPhone('');
                        setAvatarUriLocal(null);
                    }
                }
            } catch (e: any) {
                Alert.alert('Failed', e?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        if (!token) return;
        try {
            setSaving(true);

            // Create FormData for multipart upload
            const formData = new FormData();
            
            formData.append('name', name);
            formData.append('dob', dob);
            formData.append('gender', gender);
            formData.append('phone', phone);

            // Handle avatar upload
            if (avatarUriLocal && typeof avatarUriLocal === 'object' && avatarUriLocal.uri) {
                const fileName = avatarUriLocal.fileName || `avatar_${myId || 'user'}.jpg`;
                const fileType = avatarUriLocal.type || 'image/jpeg';

                formData.append('avatar', {
                    uri: avatarUriLocal.uri,
                    name: fileName,
                    type: fileType,
                } as any); // TypeScript workaround
            } else if (typeof avatarUriLocal === 'string' && avatarUriLocal) {
                // If using existing avatar URL
                formData.append('avatar_url', avatarUriLocal);
            }

            // Try API first, fallback to AsyncStorage
            try {
                const response = await fetch(API_ENDPOINTS.updateMe, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    body: formData,
                });

                const text = await response.text();
                let result;
                
                try {
                    result = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Invalid server response');
                }

                if (response.ok && result.success) {
                    // Refresh user details from API
                    const updatedUserDetails = await getUserDetails(token);
                    
                    // Update local storage with latest data
                    await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserDetails));
                    
                    setMe(updatedUserDetails);
                    setProfile(updatedUserDetails);
                    setModalVisible(true);
                } else {
                    throw new Error(result.error || result.message || 'Update failed');
                }
            } catch (apiError: any) {
                console.log('API update failed, using AsyncStorage:', apiError);
                
                // Fallback to AsyncStorage
                const updateData = {
                    name,
                    dob,
                    gender,
                    phone,
                    avatar_url: typeof avatarUriLocal === 'string' 
                        ? (avatarUriLocal.startsWith('http') 
                            ? avatarUriLocal.replace(BASE_URL, '') 
                            : avatarUriLocal)
                        : avatarUriLocal?.uri || null
                };
                
                const updatedUserInfo = {
                    ...me,
                    ...updateData,
                    id: me?.id || 0 // Ensure id is always a number
                };
                
                await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                setMe(updatedUserInfo as UserDetails);
                setProfile(updatedUserInfo as UserDetails);
                setModalVisible(true);
            }
        } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        setModalVisible(false);
        navigation.navigate('AdminProfileScreen');
    };

    const pickAvatar = () => {
        launchImageLibrary({ 
            mediaType: 'photo',
            includeBase64: false,
            quality: 0.8,
        }, (response) => {
            if (response.assets && response.assets.length > 0) {
                const selected = response.assets[0];
                if (selected.uri) {
                    setAvatarUriLocal({
                        uri: selected.uri,
                        fileName: selected.fileName || `avatar_${myId || 'user'}.jpg`,
                        type: selected.type || 'image/jpeg',
                    });
                }
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>My Profile</Text>

                <View style={styles.avatarContainer}>
                    {avatarUriLocal &&
                        <Image
                            source={
                                avatarUriLocal
                                    ? typeof avatarUriLocal === 'string'
                                        ? { uri: avatarUriLocal }
                                        : avatarUriLocal // { uri: ... }
                                    : require('../assets/user.png')
                            }
                            style={styles.avatar}
                            resizeMode="contain"
                        />}

                    <TouchableOpacity style={styles.editCircle} onPress={pickAvatar} />
                    <Text style={styles.smallHint}>Tap bulat putih untuk pilih avatar</Text>
                </View>

                {/* Basic Details */}
                <Text style={styles.sectionTitle}>Basic Details</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nama penuh"
                    editable={!loading}
                />

                {/* <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                <TextInput
                    style={styles.input}
                    value={dob}
                    onChangeText={setDob}
                    placeholder="cth. 1995-07-23"
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    editable={!loading}
                /> */}

                {/* <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                    <TouchableOpacity
                        style={[styles.genderButton, gender !== 'male' ? styles.disabledGender : styles.activeGender]}
                        onPress={() => setGender('male')}
                        disabled={loading}
                    >
                        <Text style={gender === 'male' ? styles.activeText : styles.disabledText}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.genderButton, gender !== 'female' ? styles.disabledGender : styles.activeGender]}
                        onPress={() => setGender('female')}
                        disabled={loading}
                    >
                        <Text style={gender === 'female' ? styles.activeText : styles.disabledText}>Female</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Contact Details */}
                <Text style={styles.sectionTitle}>Contact Details</Text>

                {/* <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+60 ..."
                    keyboardType="phone-pad"
                    editable={!loading}
                /> */}

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: '#EEE' }]}
                    value={profile?.email || ''}
                    editable={false}
                />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.bottomWrapper}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => setModalVisible(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.modalTitle}>Successfully Saved!</Text>
                    <Text style={styles.modalSub}>Your profile has been updated.</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={handleNext}>
                        <Text style={styles.modalButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EAEAEA' },
    content: { padding: 20, paddingBottom: 100 },
    header: {
        fontSize: 22, fontWeight: '700', color: '#0066A0', marginBottom: 20, alignSelf: 'center',
    },
    avatarContainer: { alignItems: 'center', marginBottom: 10 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DDD' },
    editCircle: {
        width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10,
        position: 'absolute', bottom: 5, right: width / 2 - 105, borderWidth: 1, borderColor: '#CCC',
    },
    smallHint: { marginTop: 6, fontSize: 12, color: '#666' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0066A0', marginTop: 16, marginBottom: 10 },
    label: { fontSize: 14, marginBottom: 5, color: '#333' },
    input: {
        width: '100%', height: 45, backgroundColor: '#F5F5F5', borderRadius: 8,
        paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', color: '#555',
    },
    genderRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    genderButton: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    disabledGender: { backgroundColor: '#E2E2E2' },
    activeGender: { backgroundColor: '#0072B5' },
    disabledText: { color: '#666', fontWeight: '600' },
    activeText: { color: '#fff', fontWeight: '600' },
    bottomWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#EAEAEA',
        padding: 20, borderTopWidth: 1, borderTopColor: '#ccc',
    },
    saveButton: { backgroundColor: '#0072B5', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
    saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    modal: { justifyContent: 'flex-end', margin: 0 },
    modalContent: { backgroundColor: '#2D71B7', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center' },
    checkmark: { fontSize: 48, color: '#fff', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    modalSub: { fontSize: 14, color: '#fff', marginTop: 5, marginBottom: 20 },
    modalButton: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25 },
    modalButtonText: { color: '#2D71B7', fontWeight: 'bold', fontSize: 16 },
});

export default AdminMyProfileScreen;
