import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
type ClientApprovalScreenRouteProp = RouteProp<RootStackParamList, 'ClientApprovalScreen'>;

type Client = {
    id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'non-active';
};

const ClientApprovalScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ClientApprovalScreenRouteProp>();

    // 3. Get client from route.params
    const { client } = route.params as { client: Client };

    const [companyName, setCompanyName] = useState(client.company_name ?? '');
    const [phone, setPhone] = useState(client.phone ?? '');
    const [status, setStatus] = useState(client.status);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://yourdomain.com/update_client.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: client.id,
                    company_name: companyName,
                    phone: phone
                })
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Client updated successfully');
            } else {
                Alert.alert('Error', data.error || 'Failed to update client');
            }
        } catch (error) {
            Alert.alert('Error', 'Server error');
        }
        setLoading(false);
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://yourdomain.com/approve_client.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: client.id
                })
            });

            const data = await response.json();
            if (data.success) {
                setStatus('active');
                Alert.alert('Approved', 'Client is now active');
            } else {
                Alert.alert('Error', data.error || 'Failed to approve client');
            }
        } catch (error) {
            Alert.alert('Error', 'Server error');
        }
        setLoading(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending':
                return styles.status_pending;
            case 'active':
                return styles.status_active;
            case 'rejected':
                return styles.status_rejected;
            case 'approved':
                return styles.status_approved;
            case 'non-active':
                return styles.status_non_active;
            default:
                return {};
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <LinearGradient colors={['#007bff', '#00c6ff']} style={styles.card}>
                <Text style={styles.title}>{client.name}</Text>
                <Text style={styles.label}>Email: {client.email}</Text>
                <Text style={styles.label}>
                    Status: <Text style={getStatusStyle(status)}>{status}</Text>
                </Text>
                <Text style={styles.inputLabel}>Company Name</Text>
                <TextInput
                    value={companyName}
                    onChangeText={setCompanyName}
                    style={styles.input}
                />

                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    keyboardType="phone-pad"
                />

                {loading ? (
                    <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                            <Text style={styles.buttonText}>Update</Text>
                        </TouchableOpacity>

                        {status === 'pending' && (
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745' }]} onPress={handleApprove}>
                                <Text style={styles.buttonText}>Approve Client</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </LinearGradient>
        </ScrollView>
    );
};

export default ClientApprovalScreen;

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
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
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    status_pending: { color: '#ffc107', fontWeight: 'bold' },
    status_active: { color: '#28a745', fontWeight: 'bold' },
    status_rejected: { color: '#dc3545', fontWeight: 'bold' },
    status_approved: { color: '#007bff', fontWeight: 'bold' },
    status_non_active: { color: '#6c757d', fontWeight: 'bold' },
});
