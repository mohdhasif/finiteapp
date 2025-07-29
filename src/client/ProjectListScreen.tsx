import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { RouteProp } from '@react-navigation/native';

import { getClientProjects } from '../services/projectService';

const { width } = Dimensions.get('window');

type ProjectListScreeRouteProp = RouteProp<RootStackParamList, 'ProjectListScreen'>;

type Project = {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    progress: number;
    created_at: string;
    task_count?: number;
};

const ProjectListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ProjectListScreeRouteProp>();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'All' | 'Ongoing' | 'Completed'>('All');
    const [projects, setProjects] = useState<Project[]>([]);

    const [greetingName, setGreetingName] = useState('Guest');

    const isMatchingTab = (statusFromDB: string, activeTab: string) => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Ongoing') return ['pending', 'in_progress'].includes(statusFromDB);
        if (activeTab === 'Completed') return statusFromDB === 'completed';
        return false;
    };

    const filteredProjects = projects.filter(project => isMatchingTab(project.status, activeTab));

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const userInfoString = await AsyncStorage.getItem('userInfo');

                if (!token) {
                    Alert.alert('Ralat', 'Token tidak dijumpai');
                    setLoading(false);
                    return;
                }

                console.log('token:', token);

                // Fetch projek dari API
                const data = await getClientProjects(token);
                setProjects(data);
                console.log('DATA:', data);

                // Set greeting
                const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
                setGreetingName(userInfo?.client?.company_name ?? 'Guest');
                console.log('company:', userInfo?.client?.company_name);
                console.log('name:', userInfo?.name);
            } catch (err: any) {
                console.log('ERROR loading projects:', err);
                Alert.alert('Ralat', err.message || 'Gagal ambil projek');
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {greetingName}!</Text>

                <TouchableOpacity>
                    <Image source={require('../assets/search-icon.png')} style={styles.searchIcon} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['All', 'Ongoing', 'Completed'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab as 'All' | 'Ongoing' | 'Completed')}
                    >
                        <Text style={activeTab === tab ? styles.tabActiveText : styles.tabText}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* <ScrollView contentContainerStyle={styles.projectList}>
                {filteredProjects.map(project => (
                    <TouchableOpacity
                        key={project.id}
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate('ProjectTaskListScreen', {
                                projectId: project.id,
                                projectTitle: project.title,
                            })
                        }
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardLeft}>
                            <Text style={styles.cardTitle}>{project.title}</Text>
                            <Text style={styles.cardSubtitle}>{project.description || '-'}</Text>
                            <Text style={styles.cardAssigned}>Assigned to</Text>
                            <View style={styles.avatarRow}>
                                <View style={styles.avatar} />
                                <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                <View style={[styles.avatar, { backgroundColor: '#007bff' }]} />
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.dateText}>📅 {project.created_at?.split(' ')[0]}</Text>
                                <Text style={styles.taskText}>✔️ {project.task_count || 0} Tasks</Text>
                            </View>
                        </View>
                        <View style={styles.progressRing}>
                            <Text style={styles.progressText}>{project.progress}%</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView> */}

            <ScrollView contentContainerStyle={styles.projectList}>
                {loading ? (
                    <View style={{ alignItems: 'center', marginTop: 30 }}>
                        <ActivityIndicator size="large" />
                        <Text style={{ marginTop: 10 }}>Loading projek...</Text>
                    </View>
                ) : filteredProjects.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 30 }}>
                        <Text>Tiada projek dijumpai.</Text>
                    </View>
                ) : (
                    filteredProjects.map(project => (
                        <TouchableOpacity
                            key={project.id}
                            style={styles.card}
                            onPress={() =>
                                navigation.navigate('ProjectTaskListScreen', {
                                    projectId: project.id,
                                    projectTitle: project.title,
                                })
                            }
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={styles.cardTitle}>{project.title}</Text>
                                <Text style={styles.cardSubtitle}>{project.description || '-'}</Text>
                                <Text style={styles.cardAssigned}>Assigned to</Text>
                                <View style={styles.avatarRow}>
                                    <View style={styles.avatar} />
                                    <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                    <View style={[styles.avatar, { backgroundColor: '#007bff' }]} />
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.dateText}>📅 {project.created_at?.split(' ')[0]}</Text>
                                    <Text style={styles.taskText}>✔️ {project.task_count || 0} Tasks</Text>
                                </View>
                            </View>
                            <View style={styles.progressRing}>
                                <Text style={styles.progressText}>{project.progress}%</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProjectListScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ProjectListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000015',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0066b2',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    greeting: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    searchIcon: {
        width: 22,
        height: 22,
        tintColor: '#fff',
    },
    tabs: {
        flexDirection: 'row',
        marginVertical: 16,
        justifyContent: 'center',
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#e2e2e2',
        borderRadius: 20,
        marginHorizontal: 6,
    },
    tabActive: {
        backgroundColor: '#007bff',
    },
    tabText: {
        color: '#333',
        fontWeight: '500',
    },
    tabActiveText: {
        color: '#fff',
        fontWeight: '700',
    },
    projectList: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#f2f2f2',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    cardLeft: {
        flex: 1,
        paddingRight: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007bff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
    },
    cardAssigned: {
        fontSize: 12,
        color: '#222',
        marginBottom: 6,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#444',
        marginRight: 6,
    },
    addAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#007bff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plus: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 12,
        color: '#777',
    },
    taskText: {
        fontSize: 12,
        color: '#007bff',
    },
    progressRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        borderColor: '#007bff',
        borderLeftColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontWeight: 'bold',
        color: '#000',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: 70,
        backgroundColor: '#007baf',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    navItem: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    redDot: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
    },
});
