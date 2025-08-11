import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Modal, Portal, Button, Provider as PaperProvider, List } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { updateFreelancer, approveFreelancer } from '../services/freelancerService';
import { API_ENDPOINTS } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type FreelancerApprovalScreenRouteProp = RouteProp<RootStackParamList, 'FreelancerApprovalScreen'>;

type Freelancer = {
    id: number;
    name: string;
    email: string;
    skillset: string;
    avatar: string | null;
    availability: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
};

const availabilityOptions = [true, false];

const FreelancerApprovalScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<FreelancerApprovalScreenRouteProp>();
    const { freelancer } = route.params;

    (freelancer);

    const [status, setStatus] = useState(freelancer.status ?? 'pending');
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const statusOptions = ['pending', 'approved', 'rejected', 'inactive'];

    const [name, setName] = useState(freelancer.name ?? '');
    const [email, setEmail] = useState(freelancer.email ?? '');
    const [skillset, setSkillset] = useState(freelancer.skillset ?? '');

    const [avatarUrl, setAvatarUrl] = useState(freelancer.avatar);

    useEffect(() => {
        if (freelancer.avatar) {
            setAvatarUrl(freelancer.avatar); // string URL
        }
    }, [freelancer]);

    const [availability, setAvailability] = useState(freelancer.availability);
    const [loading, setLoading] = useState(false);
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);

        const formData = new FormData();

        formData.append('freelancer_id', String(freelancer.id));
        formData.append('name', name);
        formData.append('email', email);
        formData.append('skillset', skillset);
        formData.append('availability', availability ? '1' : '0');
        formData.append('status', status);

        if (avatarUrl && typeof avatarUrl === 'object' && avatarUrl.uri) {
            const fileName = avatarUrl.fileName || `avatar_${freelancer.id}.jpg`;
            const fileType = avatarUrl.type || 'image/jpeg';

            formData.append('logo', {
                uri: avatarUrl.uri,
                name: fileName,
                type: fileType,
            } as any); // 👈 TypeScript workaround
        } else if (typeof avatarUrl === 'string') {
            // If using old avatar URL
            formData.append('avatar', avatarUrl);
        }

        try {
            const response = await fetch(API_ENDPOINTS.updateFreelancer, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const text = await response.text();

            try {
                const result = JSON.parse(text);

                if (response.ok && result.success) {
                    Alert.alert('Success', result.message || 'Freelancer updated successfully');
                } else {
                    Alert.alert('Error', result.error || 'Update failed');
                }
            } catch (parseError) {
                Alert.alert('Error', 'Invalid server response');
            }
        } catch (error) {
            console.error('Error updating freelancer:', error);
            Alert.alert('Error', 'Failed to update freelancer');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!freelancer?.id) {
            Alert.alert('Error', 'Freelancer ID is missing.');
            return;
        }

        setLoading(true);

        try {
            const token = (await AsyncStorage.getItem('userToken')) ?? ''; // 🔄 standardize
            const result = await approveFreelancer(token, freelancer.id);

            if (result.success) {
                setAvailability(true);
                Alert.alert('Approved', 'Freelancer is now active.');
            } else {
                Alert.alert('Error', result.error || 'Approval failed.');
            }
        } catch (error) {
            console.error('Approval error:', error);
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const pickAvatar = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.assets && response.assets.length > 0) {
                const selected = response.assets[0];
                if (selected.uri) {
                    setAvatarUrl({ uri: selected.uri }); // pastikan bentuk { uri: '...' }
                }
            }
        });
    };

    return (
        <PaperProvider>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Freelancer Details</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollWrapper}>
                    <LinearGradient colors={['#007bff', '#00c6ff']} style={styles.card}>
                        <Text style={styles.title}>{name}</Text>
                        <Text style={styles.label}>Email: {email}</Text>

                        {avatarUrl &&
                            <Image
                                source={
                                    avatarUrl
                                        ? typeof avatarUrl === 'string'
                                            ? { uri: avatarUrl }
                                            : avatarUrl // { uri: ... }
                                        : require('../assets/user.png')
                                }
                                style={styles.logo}
                                resizeMode="contain"
                            />}
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
                            <Text style={styles.uploadText}>Upload Avatar</Text>
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            editable={true}
                            selectTextOnFocus={false}
                        />

                        <Text style={styles.inputLabel}>Skillset</Text>
                        <TextInput value={skillset} onChangeText={setSkillset} style={styles.input} />

                        <Text style={styles.inputLabel}>Availability</Text>
                        <Button mode="outlined" onPress={() => setAvailabilityModalVisible(true)} style={styles.option}>
                            {availability ? 'AVAILABLE' : 'NOT AVAILABLE'}
                        </Button>

                        <Text style={styles.inputLabel}>Status</Text>
                        <Button mode="outlined" onPress={() => setStatusModalVisible(true)} style={styles.option}>
                            {status?.toUpperCase()}
                        </Button>

                        {loading ? (
                            <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                                    <Text style={styles.buttonText}>Update</Text>
                                </TouchableOpacity>

                                {status === 'pending' && (
                                    <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745' }]} onPress={handleApprove}>
                                        <Text style={styles.buttonText}>Approve Freelancer</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </LinearGradient>
                </ScrollView>

                <Portal>
                    {/* Modal Availability */}
                    <Modal visible={availabilityModalVisible} onDismiss={() => setAvailabilityModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                        {availabilityOptions.map((option) => (
                            <List.Item
                                key={option.toString()}
                                title={option ? 'AVAILABLE' : 'NOT AVAILABLE'}
                                onPress={() => {
                                    setAvailability(option);
                                    setAvailabilityModalVisible(false);
                                }}
                            />
                        ))}
                    </Modal>

                    {/* Modal Status */}
                    <Modal visible={statusModalVisible} onDismiss={() => setStatusModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                        {statusOptions.map((option) => (
                            <List.Item
                                key={option}
                                title={option.toUpperCase()}
                                onPress={() => {
                                    setStatus(option as any);
                                    setStatusModalVisible(false);
                                }}
                            />
                        ))}
                    </Modal>
                </Portal>
            </KeyboardAvoidingView>
        </PaperProvider>
    );
};

export default FreelancerApprovalScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollWrapper: {
        flexGrow: 1,
        padding: 20,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    label: {
        color: '#fff',
        marginBottom: 6,
    },
    inputLabel: {
        marginTop: 15,
        color: '#fff',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 5,
    },
    button: {
        marginTop: 20,
        backgroundColor: '#0052cc',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    uploadBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 10,
        marginBottom: 10,
    },
    uploadText: {
        color: '#007bff',
        fontWeight: 'bold',
    },
    logo: {
        width: 100,
        height: 100,
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    option: {
        backgroundColor: '#fff',
        borderRadius: 10,
    }
});
