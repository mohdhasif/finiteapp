import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
    ScrollView, Dimensions, SafeAreaView, Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const MyProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [isModalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [token, setToken] = useState<string>('');

    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');      // YYYY-MM-DD
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [phone, setPhone] = useState('');
    const [avatarUriLocal, setAvatarUriLocal] = useState<{ uri: string; fileName?: string; type?: string } | string | null>(null);
    const [myId, setMyId] = useState<number | null>(null);
    const [me, setMe] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const tk = (await AsyncStorage.getItem('userToken')) || '';
                setToken(tk);
                if (!tk) {
                    Alert.alert('Ralat', 'Token tiada. Sila log masuk semula.');
                    setLoading(false);
                    return;
                }
                
                // Load user info from AsyncStorage for now
                const userInfoRaw = await AsyncStorage.getItem('userInfo');
                const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
                
                console.log(userInfo?.avatar_url);
                
                setMe(userInfo);
                setMyId(userInfo?.id ?? null);
                setProfile(userInfo);
                setName(userInfo?.name || '');
                setDob(userInfo?.dob || '');
                setGender((userInfo?.gender as any) || '');
                setPhone(userInfo?.phone || '');
                setAvatarUriLocal(userInfo?.avatar_url || null);
            } catch (e: any) {
                Alert.alert('Gagal', e?.message || 'Gagal memuat profil');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        if (!token) return;
        try {
            setSaving(true);

            // For now, just update local storage
            const updatedUserInfo = {
                ...me,
                name,
                dob,
                gender,
                phone,
                avatar_url: avatarUriLocal
            };
            
            await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            setProfile(updatedUserInfo);
            setModalVisible(true);
        } catch (e: any) {
            Alert.alert('Gagal', e?.message || 'Tidak berjaya menyimpan profil.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        setModalVisible(false);
        navigation.navigate('ProfileScreen');
    };

    const pickAvatar = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.assets && response.assets.length > 0) {
                const selected = response.assets[0];
                if (selected.uri) {
                    setAvatarUriLocal({ uri: selected.uri }); // pastikan bentuk { uri: '...' }
                }
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>My Profile</Text>

                <View style={styles.avatarContainer}>
                    <Image
                        source={
                            avatarUriLocal
                                ? typeof avatarUriLocal === 'string'
                                    ? { uri: avatarUriLocal }
                                    : avatarUriLocal // { uri: ... }
                                : require('../../assets/user.png')
                        }
                        style={styles.avatar}
                        resizeMode="contain"
                    />

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

                {/* Contact Details */}
                <Text style={styles.sectionTitle}>Contact Details</Text>

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
    container: {
        flex: 1,
        backgroundColor: '#EAEAEA',
    },
    content: {
        padding: 20,
        paddingBottom: 100, // enough space above save button
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0066A0',
        marginBottom: 20,
        alignSelf: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editCircle: {
        width: 20,
        height: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        position: 'absolute',
        bottom: 5,
        right: width / 2 - 105,
        borderWidth: 1,
        borderColor: '#CCC',
    },
    smallHint: { 
        marginTop: 6, 
        fontSize: 12, 
        color: '#666' 
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0066A0',
        marginTop: 20,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#555',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    genderButton: {
        flex: 1,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    disabledGender: {
        backgroundColor: '#E2E2E2',
    },
    activeGender: {
        backgroundColor: '#0072B5',
    },
    disabledText: {
        color: '#999',
        fontWeight: '600',
    },
    activeText: {
        color: '#fff',
        fontWeight: '600',
    },
    bottomWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#EAEAEA',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    saveButton: {
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    // Modal Styles
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#2D71B7',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 48,
        color: '#fff',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalSub: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    modalButtonText: {
        color: '#2D71B7',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default MyProfileScreen;
