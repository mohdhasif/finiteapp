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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type Freelancer = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    skillset: string;
    availability: number;
    avatar_url: string | null;
};

const FreelancerListScreen = () => {
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const fetchFreelancers = async () => {
        try {
            const response = await fetch('https://fd9315becb7e.ngrok-free.app/get_freelancers.php');
            const text = await response.text();
            const data = JSON.parse(text);
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
        fetchFreelancers();
    }, []);

    const handlePress = (freelancer: Freelancer) => {
        // navigation.navigate('FreelancerDetailsScreen', { freelancer });
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

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchFreelancers();
                        }}
                    />
                }
            >
                {freelancers.map((freelancer, index) => (
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
                                {freelancer.avatar_url ? (
                                    <Image
                                        source={{ uri: freelancer.avatar_url }}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarInitial}>
                                            {freelancer.name?.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.nameBlock}>
                                    <Text style={styles.cardTitle}>{freelancer.name}</Text>
                                    <Text style={styles.skillText}>{freelancer.skillset || '-'}</Text>
                                </View>

                                <View
                                    style={[
                                        styles.availabilityBadge,
                                        {
                                            backgroundColor: freelancer.availability ? '#28a745' : '#dc3545',
                                        },
                                    ]}
                                >
                                    <Text style={styles.availabilityText}>
                                        {freelancer.availability ? 'Available' : 'Unavailable'}
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
});
