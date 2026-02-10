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
import { getFreelancers } from '../services/freelancerService';
import { BASE_URL } from '../constants/apiConfig';

const { width } = Dimensions.get('window');

type Freelancer = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    skillset: string;
    availability: number;
    avatar: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
};

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'inactive'];

const FreelancerListScreen = () => {
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchFreelancers(setFreelancers, setLoading, setRefreshing);
            // only when screen focused
        }, [selectedFilter])
    );

    const fetchFreelancers = async (
        setFreelancers: (data: any) => void,
        setLoading: (val: boolean) => void,
        setRefreshing: (val: boolean) => void
    ) => {
        try {
            const data = await getFreelancers();
            setFreelancers(data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchFreelancers(setFreelancers, setLoading, setRefreshing);

    }, []);

    const filteredFreelancers =
        selectedFilter === 'all'
            ? freelancers
            : freelancers.filter(f => f.status === selectedFilter);

    const handlePress = (freelancer: Freelancer) => {
        navigation.navigate('FreelancerApprovalScreen', { freelancer });
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Freelancers</Text>
            </View>

            {/* Dropdown Filter */}
            <View style={styles.dropdownContainer}>
                <TouchableOpacity
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                    style={styles.dropdownButton}
                >
                    <Text style={styles.dropdownButtonText}>
                        {selectedFilter === 'all'
                            ? 'All Freelancers'
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
                                        ? 'All Freelancers'
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
                            fetchFreelancers(setFreelancers, setLoading, setRefreshing);

                        }}
                    />
                }
            >
                {filteredFreelancers.map((freelancer, index) => (
                    <TouchableOpacity
                        key={freelancer.id}
                        style={styles.cardWrapper}
                        onPress={() => handlePress(freelancer)}
                    >
                        <LinearGradient
                            colors={['#00bcd4', '#007b8a']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.headerRow}>
                                <Image
                                    source={freelancer.avatar 
                                        ? { uri: BASE_URL.replace(/\/+$/, '') + freelancer.avatar }
                                        : require('../assets/user.png')
                                    }
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />

                                <View style={styles.nameBlock}>
                                    <Text style={styles.cardTitle}>{freelancer.name}</Text>
                                    <Text style={styles.skillText}>{freelancer.skillset || '-'}</Text>
                                </View>

                                <View
                                    style={[
                                        styles.availabilityBadge,
                                        {
                                            backgroundColor: freelancer.status === 'approved' ? '#28a745' : '#dc3545',
                                        },
                                    ]}
                                >
                                    <Text style={{ fontSize: 12, color: '#fff' }}>
                                        {freelancer.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default FreelancerListScreen;

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
        backgroundColor: '#00bcd4',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
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
        color: '#00bcd4',
    },
    nameBlock: {
        flex: 1,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skillText: {
        fontSize: 13,
        color: '#d6f5f8',
    },
    availabilityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    availabilityText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
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
