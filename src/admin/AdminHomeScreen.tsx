import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { fetchClients, fetchFreelancers } from '../services/adminService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminTaskCard from '../component/AdminTaskCard';
import { getAllTasks, type Task } from '../services/taskService';

const { width } = Dimensions.get('window');

type Client = {
    client_id: string;
    name: string;
    logo_url: string | null;
};

export type Freelancer = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    skillset: string;
    availability: boolean;
    avatar: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
};

const AdminHomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [showDropdown, setShowDropdown] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'All Tasks' | 'Ongoing' | 'Completed'>('All Tasks');

    const [clients, setClients] = useState<Client[]>([]);
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [checkedStates, setCheckedStates] = useState<boolean[]>([]);

    const projects = [
        { id: 1, title: 'Social Media', client: 'Client A', progress: 60 },
        { id: 2, title: 'Website Redesign', client: 'Client B', progress: 35 },
    ];

    useEffect(() => {
        const loadData = async () => {
            const clientData = await fetchClients();
            const freelancerData = await fetchFreelancers();
            setClients(clientData);
            setFreelancers(freelancerData);
        };
        loadData();
    }, []);

    const resolveStatus = (f: typeof selectedFilter) => {
        if (f === 'Ongoing') return 'in_progress' as const;
        if (f === 'Completed') return 'completed' as const;
        return undefined;
    };

    const loadTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            // get your token (swap to AuthContext if you already have it there)
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const status = resolveStatus(selectedFilter);
            const data = await getAllTasks(token, status ? { status } : {});
            setTasks(data);
            setCheckedStates(Array(data.length).fill(false));
        } catch (e) {
            console.log('Failed to load tasks:', e);
            setTasks([]);
            setCheckedStates([]);
        } finally {
            setLoadingTasks(false);
        }
    }, [selectedFilter]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {showDropdown && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowDropdown(false);
                            navigation.navigate('AdminCreateProjectScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowDropdown(false);
                            navigation.navigate('AdminCreateProjectScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient colors={['#003865', '#0072B5']} style={styles.header}>
                    <View style={styles.userRow}>
                        <Image source={require('../assets/user.png')} style={styles.avatar} />
                        <View>
                            <Text style={styles.username}>User 1</Text>
                            <Text style={styles.welcome}>Welcome Back!</Text>
                        </View>
                    </View>

                    <View style={styles.clientHeader}>
                        <Text style={styles.clientTitle}>FINITE’s Clients</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ClientListScreen')}>
                            <Text style={styles.addText}>Add Client</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientScroll}>
                        {clients.map((client) => (
                            <View key={client.client_id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={
                                            typeof client.logo_url === 'string' && client.logo_url.startsWith('http')
                                                ? { uri: client.logo_url }
                                                : require('../assets/user.png')
                                        }
                                        style={styles.clientLogo}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.clientName} numberOfLines={1} ellipsizeMode="tail">
                                    {client.name}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </LinearGradient>

                {/* Freelancers */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Freelancers</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('FreelancerListScreen')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientScroll}>
                        {freelancers.map((freelancer) => (
                            <View key={freelancer.id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={
                                            typeof freelancer.avatar === 'string' && freelancer.avatar.startsWith('http')
                                                ? { uri: freelancer.avatar }
                                                : require('../assets/user.png')
                                        }
                                        style={styles.clientLogo}
                                    />
                                </View>
                                <Text style={styles.freelancersName} numberOfLines={1} ellipsizeMode="tail">
                                    {freelancer.name}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Projects */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminProjectListScreen')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectRow}>
                        {projects.map((proj, index) => (
                            <TouchableOpacity
                                key={proj.id}
                                style={[styles.projectCard, { marginRight: index === projects.length - 1 ? 20 : 16 }]}
                                onPress={() => navigation.navigate('AdminProjectTaskListScreen', { project_title: proj.title, project_id: proj.id })}
                            >
                                <Text style={styles.projectTitle}>{proj.title}</Text>
                                <Text style={styles.projectClient}>{proj.client}</Text>
                                <Text style={styles.projectTasks}>📅 Jan 13, 2025</Text>
                                <Text style={styles.projectTasks}>✅ 24 Tasks</Text>

                                <View style={styles.avatarGroup}>
                                    <View style={[styles.avatarMini, { backgroundColor: '#ccc' }]} />
                                    <View style={[styles.avatarMini, { backgroundColor: '#0af' }]} />
                                    <View style={[styles.avatarMini, { backgroundColor: '#0072B5' }]}>
                                        <Text style={{ color: '#fff', fontSize: 12 }}>+</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                                </View>
                                <Text style={styles.progressPercent}>{proj.progress}%</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tasks */}
                <View style={styles.section}>
                    <View style={styles.taskHeader}>
                        <Text style={styles.taskHeaderTitle}>Tasks</Text>

                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setFilterVisible(!filterVisible)}
                        >
                            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                            <Icon
                                name={filterVisible ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={16}
                                color="#999"
                            />
                        </TouchableOpacity>

                        {filterVisible && (
                            <View style={styles.dropdownMenu}>
                                {(['All Tasks', 'Ongoing', 'Completed'] as const).map((option, i) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.dropdownItem,
                                            selectedFilter === option && styles.dropdownItemActive,
                                            i === 0 && styles.dropdownItemFirst,
                                            i === 2 && styles.dropdownItemLast,
                                        ]}
                                        onPress={() => {
                                            setSelectedFilter(option);
                                            setFilterVisible(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.dropdownItemText,
                                                selectedFilter === option && styles.dropdownItemTextActive,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Render fetched tasks using AdminTaskCard */}
                    {tasks.map((task, idx) => {
                        const isCompleted = (task.status || '').toLowerCase() === 'completed';

                        return (
                            <AdminTaskCard
                                key={task.id ?? idx}
                                task={task}
                                checked={isCompleted ? true : !!checkedStates[idx]} // completed auto checked
                                onToggleCheck={() => {
                                    // Kalau dah completed, tak perlu toggle
                                    if (isCompleted) return;
                                    const updated = [...checkedStates];
                                    updated[idx] = !updated[idx];
                                    setCheckedStates(updated);
                                }}
                                onPress={() =>
                                    navigation.push('AdminTaskDetailsScreen', {
                                        task_title: task.title ?? 'Task',
                                        task_id: task.id,
                                    })
                                }
                            />
                        );
                    })}


                    {(!loadingTasks && tasks.length === 0) && (
                        <Text style={{ color: '#666' }}>No tasks found.</Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => setShowDropdown(!showDropdown)}>
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        padding: 20,
        paddingTop: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    username: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    welcome: {
        color: '#fff',
        fontSize: 13,
    },
    clientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clientTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addText: {
        color: '#fff',
        textDecorationLine: 'underline',
    },
    clientScroll: {
        paddingHorizontal: 20,
        gap: 16,
    },
    clientCard: {
        alignItems: 'center',
        marginRight: 16,
    },
    clientCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    clientLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        resizeMode: 'cover',
    },
    clientName: {
        color: '#fff',
        fontSize: 12,
        marginTop: 6,
        maxWidth: 80,
        textAlign: 'center',
        alignSelf: 'center',
    },
    freelancersName: {
        color: 'black',
        fontSize: 12,
        marginTop: 6,
        maxWidth: 80,
        textAlign: 'center',
        alignSelf: 'center',
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    seeAll: {
        fontSize: 14,
        color: '#0072B5',
        fontWeight: '500',
    },
    projectRow: {
        paddingLeft: 20,
        paddingRight: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    projectCard: {
        width: 180,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        elevation: 3,
        marginRight: 16,
    },
    projectTitle: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    projectClient: {
        fontSize: 12,
        color: '#888',
    },
    projectTasks: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    avatarGroup: {
        flexDirection: 'row',
        marginTop: 6,
    },
    avatarMini: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        height: 6,
        borderRadius: 5,
        backgroundColor: '#ccc',
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4aa9ff',
    },
    progressPercent: {
        fontSize: 12,
        color: '#0072B5',
        marginTop: 2,
        fontWeight: 'bold',
    },

    /* ---- AdminTaskCard shared styling kept in component ---- */
    bottomTab: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#0072B5',
        height: 60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 10,
    },
    fab: {
        backgroundColor: '#fff',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40,
    },
    dropdown: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 4,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 10,
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0072B5',
    },

    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    taskHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#073B61',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    filterButtonText: {
        color: '#999',
        fontSize: 14,
        marginRight: 6,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 45,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        width: 160,
        zIndex: 10,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },
    dropdownItemFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    dropdownItemLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    dropdownItemActive: {
        backgroundColor: '#0072B5',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#0072B5',
    },
    dropdownItemTextActive: {
        color: '#fff',
    },
});

