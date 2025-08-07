import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

type FreelancerApprovalScreenRouteProp = RouteProp<RootStackParamList, 'FreelancerApprovalScreen'>;

type Freelancer = {
    id: number;
    name: string;
    email: string;
    skillset: string;
    avatar: string | null;
    availability: boolean;
};

const availabilityOptions = [true, false];

const FreelancerApprovalScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<FreelancerApprovalScreenRouteProp>();
    const { freelancer } = route.params;

    const [name, setName] = useState(freelancer.name ?? '');
    const [email, setEmail] = useState(freelancer.email ?? '');
    const [skillset, setSkillset] = useState(freelancer.skillset ?? '');
    const [avatarUrl, setAvatarUrl] = useState(freelancer.avatar);
    const [availability, setAvailability] = useState(freelancer.availability);
    const [loading, setLoading] = useState(false);
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        const result = await updateFreelancer({
            freelancer_id: freelancer.id,
            name,
            email,
            skillset,
            avatar: avatarUrl,
            availability,
        });

        if (result.success) {
            Alert.alert('Success', 'Freelancer updated successfully');
        } else {
            Alert.alert('Error', result.error || 'Update failed');
        }

        setLoading(false);
    };

    const handleApprove = async () => {
        setLoading(true);
        const result = await approveFreelancer(freelancer.id);

        if (result.success) {
            setAvailability(true);
            Alert.alert('Approved', 'Freelancer is now active');
        } else {
            Alert.alert('Error', result.error || 'Approval failed');
        }

        setLoading(false);
    };

    const pickAvatar = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.assets && response.assets.length > 0) {
                const selected = response.assets[0];
                setAvatarUrl(selected.uri || null);
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

                        {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.logo} resizeMode="contain" />}
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
                            <Text style={styles.uploadText}>Upload Avatar</Text>
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput value={name} onChangeText={setName} style={styles.input} />

                        <Text style={styles.inputLabel}>Skillset</Text>
                        <TextInput value={skillset} onChangeText={setSkillset} style={styles.input} />

                        <Text style={styles.inputLabel}>Availability</Text>
                        <Button mode="outlined" onPress={() => setAvailabilityModalVisible(true)} style={styles.option}>
                            {availability ? 'AVAILABLE' : 'NOT AVAILABLE'}
                        </Button>

                        {loading ? (
                            <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                                    <Text style={styles.buttonText}>Update</Text>
                                </TouchableOpacity>

                                {!availability && (
                                    <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745' }]} onPress={handleApprove}>
                                        <Text style={styles.buttonText}>Approve Freelancer</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </LinearGradient>
                </ScrollView>

                <Portal>
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
