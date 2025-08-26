import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { API_ENDPOINTS } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiConfig';

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
    avatar_url?: string | null;
};

type ProjectSummary = {
    project_id: number;
    project_title: string;
    client_name: string;
    due_date: string | null;
    total_tasks: number;
    completed_tasks: number;
    progress_percent: number;
    freelancer_count: number;
    freelancer_avatars: string[];
    extra_freelancers: number;
};

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'active', 'non-active'] as const;

const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
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
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // ---- state (letak SEMUA hooks sebelum sebarang return)
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<(typeof statusOptions)[number]>('all');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // Optional: projek ringkas (kalau tak guna, boleh buang block ni)
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [err, setErr] = useState<string | null>(null);

    // --- fetchers
    const fetchClients = useCallback(async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const response = await fetch(API_ENDPOINTS.getClients);
            const text = await response.text();

            let data: Client[] = [];
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                return;
            }
            setClients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refresh bila screen fokus
    useFocusEffect(
        useCallback(() => {
            fetchClients();
            return () => { };
        }, [fetchClients, selectedFilter])
    );

    // Refresh bila filter berubah (jika backend support filter server-side boleh tambah query)
    useEffect(() => {
        setLoading(true);
        fetchClients();
    }, [fetchClients, selectedFilter]);

    // Optional: load project summaries (debug/log)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
                if (!token) return;

                const res = await fetch(API_ENDPOINTS.projectSummaries, {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                });

                const text = await res.text();
                let json: any;
                try { json = JSON.parse(text); } catch { json = []; }

                if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
                if (!alive) return;

                setProjects(Array.isArray(json) ? json : (json ? [json] : []));
            } catch (e) {
                if (!alive) return;
                setProjects([]);
                setErr((e as Error)?.message ?? 'Failed to load projects');
            }
        })();
        return () => { alive = false; };
    }, []);

    // ----- derived
    const filteredClients =
        selectedFilter === 'all'
            ? clients
            : clients.filter(c => (c.client_status || '').toLowerCase() === selectedFilter.toLowerCase());

    const handlePress = (client: Client) => {
        navigation.navigate('ClientApprovalScreen', { client });
    };

    // ---- early return AFTER all hooks
    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clients</Text>
            </View>

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
                            fetchClients(true);
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
                            <View style={styles.headerRow}>
                                <Image
                                    source={item.avatar_url
                                        ? { uri: BASE_URL.replace(/\/+$/, '') + item.avatar_url }
                                        : require('../assets/user.png')
                                    }
                                    style={styles.avatarImage}
                                    resizeMode="contain"
                                />

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
                                        {(item.client_status || '').toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* (Optional) progress – uncomment kalau nak */}
                            {/* {typeof item.progress === 'number' && (
                <>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${item.progress}%`,
                          backgroundColor: getProgressColor(item.progress),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{item.progress}%</Text>
                </>
              )} */}
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
