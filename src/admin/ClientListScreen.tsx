import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type AdminTaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'AdminTaskDetailsScreen'>;

const { width } = Dimensions.get('window');

type Client = {
    client_id: string;
    name: string;
    email: string;
    phone: string;
    client_type: string;
    company_name: string | null;
    client_status: string;
    selected_services: string | null;
    approved_at: string | null;
    progress?: number;
    logo_url?: string | null;
};

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'active', 'non-active'];

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'approved': return '#28a745';
        case 'pending': return '#ffc107';
        case 'rejected': return '#dc3545';
        case 'active': return '#17a2b8';
        case 'non-active': return '#6c757d';
        default: return '#999';
    }
};

const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#28a745';
    if (progress >= 40) return '#ffc107';
    return '#dc3545';
};

const ClientListScreen = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<AdminTaskDetailsScreenRouteProp>();
    
    const fetchClients = async () => {
        try {
            const response = await fetch('https://fd9315becb7e.ngrok-free.app/get_clients.php');
            const text = await response.text();
            const data = JSON.parse(text);
            setClients(data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchClients();
    }, [selectedFilter]);

    const filteredClients =
        selectedFilter === 'all'
            ? clients
            : clients.filter(c => c.client_status.toLowerCase() === selectedFilter.toLowerCase());

    const handlePress = (client: Client) => {
        console.log('Client pressed:', client.name);
        navigation.navigate('ClientApprovalScreen', { client: client });
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Dropdown Filter */}
            <View style={styles.dropdownContainer}>
                <TouchableOpacity
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                    style={styles.dropdownButton}
                >
                    <Text style={styles.dropdownButtonText}>
                        {selectedFilter === 'all'
                            ? 'All Clients'
                            : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
                    </Text>
                    <Icon
                        name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#999"
                        style={{ marginLeft: 6 }}
                    />
                </TouchableOpacity>

                {dropdownVisible && (
                    <View style={styles.dropdownList}>
                        {statusOptions.map((status, index) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => {
                                    setSelectedFilter(status);
                                    setDropdownVisible(false);
                                }}
                                style={[
                                    styles.dropdownItem,
                                    index === 0 && styles.dropdownFirstItem,
                                    index === statusOptions.length - 1 && styles.dropdownLastItem,
                                    selectedFilter === status && styles.dropdownActiveItem,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        selectedFilter === status && styles.dropdownItemTextActive,
                                    ]}
                                >
                                    {status === 'all'
                                        ? 'All Clients'
                                        : status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchClients();
                        }}
                    />
                }
            >
                {filteredClients.map((item, index) => (
                    <TouchableOpacity
                        key={item.client_id ?? index.toString()}
                        style={styles.cardWrapper}
                        onPress={() => handlePress(item)}
                    >
                        <LinearGradient
                            colors={['#007bff', '#003f7f']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* Header */}
                            <View style={styles.headerRow}>
                                {item.logo_url ? (
                                    <Image
                                        source={{ uri: item.logo_url }}
                                        style={styles.avatarImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarInitial}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.nameStatusBlock}>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.companyText}>
                                        {item.company_name || '-'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(item.client_status) },
                                    ]}
                                >
                                    <Text style={styles.statusText}>
                                        {item.client_status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Progress */}
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${item.progress || 0}%`,
                                            backgroundColor: getProgressColor(item.progress || 0),
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {item.progress ? `${item.progress}%` : '0%'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default ClientListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef4fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        width: width - 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
    },
    nameStatusBlock: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 10,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    companyText: {
        fontSize: 13,
        color: '#cde1ff',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#ccc',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: 6,
    },
    progressText: {
        marginTop: 4,
        color: '#fff',
        fontSize: 12,
        alignSelf: 'flex-end',
    },


    dropdownContainer: {
        position: 'relative',
        zIndex: 10,
        alignItems: 'flex-end',
        padding: 16,
        marginTop: 8,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#999',
    },
    dropdownList: {
        position: 'absolute',
        top: 40,
        right: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        paddingVertical: 4,
        width: 160,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownFirstItem: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },
    dropdownLastItem: {
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#007bff',
    },
    dropdownItemTextActive: {
        fontWeight: 'bold',
        color: '#fff',
    },
    dropdownActiveItem: {
        backgroundColor: '#007bff',
    },
});
