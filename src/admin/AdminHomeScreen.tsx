import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchClients, fetchFreelancers } from '../services/adminService';
import AdminTaskCard from '../component/AdminTaskCard';
import { getAllTasks, updateTaskStatus, type Task } from '../services/taskService';

import ProjectCard from '../component/ProjectCard';
import { getProjectSummaries, getProjectFreelancers, type ProjectSummary } from '../services/projectService';
import { useAsyncState } from '../hooks/useOptimizedState';
import { performanceMonitor } from '../utils/performance';
import { api } from '../services/apiClient';
import OptimizedBottomTab from '../components/OptimizedBottomTab';


const { width } = Dimensions.get('window');
const CARD = Math.round(width * 0.62); // nampak >1 kad
const GAP = 12;
const SIDE = 20;

import { BASE_URL } from '../constants/apiConfig';

type Client = {
    client_id: string;
    name: string;
    avatar_url: string | null;
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

type ProjectFreelancer = {
    freelancer_id: number;
    user_id: number;
    avatar_url: string | null;
    skillset: string;
    freelancer_status: string;
    freelancer_name: string;
    freelancer_email: string;
    freelancer_avatar_url: string | null;
};

const AdminHomeScreen = () => {
    // --- Navigation (dah ada dalam file anda)
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // ================= UI states
    const [filterVisible, setFilterVisible] = useState(false);
    type FilterValue = 'All' | 'Pending' | 'in_progress' | 'completed';
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('All');

    // ================= Performance optimized data states
    const { data: clients, execute: fetchClientsData } = useAsyncState<Client[]>([]);
    const { data: freelancers, execute: fetchFreelancersData } = useAsyncState<Freelancer[]>([]);
    const { data: projects, loading: loadingProjects, error: projError, execute: fetchProjectsData } = useAsyncState<ProjectSummary[]>([]);
    const { data: tasks, loading: loadingTasks, execute: fetchTasksData } = useAsyncState<Task[]>([]);
    
    // User profile data
    const [userInfo, setUserInfo] = useState<any>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    
    // Checkbox states (keyed by task.id)
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({});
    
    // Performance monitoring
    const renderCount = useRef(0);
    renderCount.current++;

    // Memoized user avatar source for better performance
    const userAvatarSource = useMemo(() => {
        return userAvatar ? { uri: userAvatar } : require('../assets/user.png');
    }, [userAvatar]);

    // ================= Utils
    const formatDate = (d?: string | null) =>
        !d
            ? 'No due date'
            : new Date(d).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

    // Load user profile data
    const loadUserData = useCallback(async () => {
        try {
            performanceMonitor.startTimer('loadUserData');
            const userInfoRaw = await AsyncStorage.getItem('userInfo');
            if (userInfoRaw) {
                const parsedUserInfo = JSON.parse(userInfoRaw);
                setUserInfo(parsedUserInfo);
                
                // Set avatar URL
                if (parsedUserInfo.avatar_url) {
                    const avatarUrl = parsedUserInfo.avatar_url.startsWith('http')
                        ? parsedUserInfo.avatar_url
                        : `${BASE_URL}${parsedUserInfo.avatar_url}`;
                    setUserAvatar(avatarUrl);
                }
            }
        } catch (error) {
            console.log('Error loading user data:', error);
        } finally {
            performanceMonitor.endTimer('loadUserData');
        }
    }, []);

    // ================= Filter mapping
    const resolveStatus = (
        f: FilterValue
    ): 'pending' | 'in_progress' | 'completed' | undefined => {
        if (f === 'All') return undefined;
        if (f === 'Pending') return 'pending';
        return f; // 'in_progress' | 'completed'
    };

    // ================= Loaders
    // Optimized data fetching with performance monitoring
    const loadMasters = useCallback(async () => {
        performanceMonitor.startTimer('loadMasters');
        
        try {
            const token = (await AsyncStorage.getItem('userToken'))?.trim();
            if (!token) throw new Error('No userToken');

            // Fetch all data in parallel for better performance
            await Promise.all([
                fetchClientsData(async () => {
                    return await fetchClients(token);
                }),
                fetchFreelancersData(async () => {
                    return await fetchFreelancers(token);
                }),
                fetchProjectsData(async () => {
                    const projectData = await getProjectSummaries(token);
                    
                    // OPTIMIZATION: Instead of N+1 queries, fetch all project freelancers in one call
                    // This is a temporary fix - ideally create a batch endpoint on the server
                    const projectIds = projectData.map(p => p.project_id);
                    
                    // Fetch freelancers for all projects in parallel (much better than sequential)
                    const freelancersPromises = projectIds.map(async (projectId) => {
                        try {
                            const freelancersData = await getProjectFreelancers(token, projectId);
                            return {
                                projectId,
                                freelancers: Array.isArray(freelancersData?.freelancers) ? freelancersData.freelancers : []
                            };
                        } catch (error) {
                            console.error(`Error fetching freelancers for project ${projectId}:`, error);
                            return { projectId, freelancers: [] };
                        }
                    });
                    
                    const freelancersResults = await Promise.all(freelancersPromises);
                    
                    // Create a map for quick lookup
                    const freelancersMap = new Map(
                        freelancersResults.map(result => [result.projectId, result.freelancers])
                    );
                    
                    // Process projects with their freelancers
                    return projectData.map(project => {
                        const freelancers = freelancersMap.get(project.project_id) || [];
                        
                        const avatarUrls = freelancers.map((f: ProjectFreelancer) => {
                            if (!f.freelancer_avatar_url) return null;
                            return f.freelancer_avatar_url.startsWith('http') 
                                ? f.freelancer_avatar_url 
                                : `${BASE_URL}${f.freelancer_avatar_url}`;
                        });

                        return {
                            ...project,
                            projectFreelancers: freelancers,
                            freelancer_avatars: avatarUrls,
                            freelancer_count: freelancers.length,
                        };
                    });
                })
            ]);
            
        } catch (e: any) {
            console.error('Load masters error:', e);
        } finally {
            performanceMonitor.endTimer('loadMasters');
        }
    }, [fetchClientsData, fetchFreelancersData, fetchProjectsData]);

    const loadTasks = useCallback(async (filter?: FilterValue) => {
        performanceMonitor.startTimer('loadTasks');
        
        try {
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const currentFilter = filter || selectedFilter;
            const status = resolveStatus(currentFilter);
            
            await fetchTasksData(async () => {
                const data = await getAllTasks(token, status ? { status } : {});
                
                // Initialize checkbox states based on task completion
                const newCheckedStates: Record<number, boolean> = {};
                data.forEach(task => {
                    newCheckedStates[task.id] = task.status === 'completed';
                });
                setCheckedById(newCheckedStates);
                
                return data;
            });
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            performanceMonitor.endTimer('loadTasks');
        }
    }, [selectedFilter, fetchTasksData]);

    // ================= Refresh setiap kali screen FOKUS
    useFocusEffect(
        useCallback(() => {
            // bila masuk screen / kembali fokus -> tarik data latest
            loadMasters();
            loadTasks(); // Will use current selectedFilter
            loadUserData(); // Load user profile data

            // tiada cleanup khas diperlukan di sini
            return () => { };
        }, [loadMasters, loadUserData]) // Remove loadTasks from dependency to prevent reloading on filter change
    );

    // ================= Bila filter berubah (semasa screen aktif), refresh tasks sahaja
    useEffect(() => {
        // Only reload tasks when filter changes, not the entire screen
        loadTasks(selectedFilter);
    }, [selectedFilter]); // Only depend on selectedFilter, not loadTasks


    ///////////////////////////// START

    const refetchProjectsOnly = useCallback(async () => {
        try {
            const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
            if (!token) throw new Error('No userToken');
            
            await fetchProjectsData(async () => {
                const projectData = await getProjectSummaries(token);
                return Array.isArray(projectData) ? projectData : [];
            });
        } catch (error) {
            console.error('Refetch projects error:', error);
        }
    }, [fetchProjectsData]);

    const pendingIdsRef = useRef<Set<number>>(new Set());

    const handleToggleCheck = useCallback(async (idx: number, t: Task) => {
        const id = t.id;
        if (!id) return;

        // if already completed, ignore (your existing guard)
        if ((t.status || '').toLowerCase() === 'completed') return;

        // Prevent double taps while pending
        if (pendingIdsRef.current.has(id)) return;
        pendingIdsRef.current.add(id);

        // Grab token
        const token = (await AsyncStorage.getItem('userToken')) || '';
        if (!token) {
            pendingIdsRef.current.delete(id);
            Alert.alert('Error', 'Token is missing. Please log in again.');
            return;
        }

        // --- Optimistic UI ---
        const tasksList = tasks || [];
        const prevTasks = [...tasksList];
        const prevChecked = { ...checkedById };

        const nextChecked = { ...checkedById, [id]: true }; // checking means completed
        setCheckedById(nextChecked);

        try {
            await updateTaskStatus(token, id, 'completed');
            // success: refetch data to ensure consistency
            await Promise.all([refetchProjectsOnly(), loadTasks()]);

        } catch (e: any) {
            // rollback
            setCheckedById(prevChecked);
            Alert.alert('Failed', e?.message || 'Failed to update task status');
        } finally {
            pendingIdsRef.current.delete(id);
        }
    }, [tasks, checkedById, refetchProjectsOnly, loadTasks]);

    // Define tab configuration
    const tabConfig = [
        {
            id: 'home',
            icon: 'home',
            screen: 'AdminHomeScreen' as keyof RootStackParamList,
            isActive: true,
        },
        {
            id: 'calendar',
            icon: 'calendar',
            screen: 'AdminCalendarScreen' as keyof RootStackParamList,
        },
        {
            id: 'notifications',
            icon: 'notifications',
            screen: 'AdminNotificationsScreen' as keyof RootStackParamList,
        },
        {
            id: 'profile',
            icon: 'person',
            screen: 'AdminProfileScreen' as keyof RootStackParamList,
        },
    ];

    // Define quick actions
    const quickActions = [
        {
            id: 'new-project',
            title: 'New Project',
            icon: 'folder-open',
            onPress: () => navigation.navigate('AdminCreateProjectScreen'),
        },
        {
            id: 'new-task',
            title: 'New Task',
            icon: 'add-circle',
            onPress: () => navigation.navigate('AddTaskScreen'),
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient colors={['#003865', '#0072B5']} style={styles.header}>
                    <View style={styles.userRow}>
                        <Image 
                            source={userAvatarSource} 
                            style={styles.avatar} 
                        />
                        <View>
                            <Text style={styles.username}>{userInfo?.name || 'Admin User'}</Text>
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
                        {(clients || []).map(c => (
                            <View key={c.client_id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={typeof c.avatar_url === 'string'
                                            ? { uri: BASE_URL.replace(/\/+$/, '') + c.avatar_url }
                                            : require('../assets/user.png')}
                                        style={styles.clientLogo}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.clientName} numberOfLines={1}>{c.name}</Text>
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
                        {(freelancers || []).map(f => (
                            <View key={f.id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={typeof f.avatar === 'string'
                                            ? { uri: BASE_URL.replace(/\/+$/, '') + f.avatar }
                                            : require('../assets/user.png')}
                                        style={styles.clientLogo}
                                    />
                                </View>
                                <Text style={styles.freelancersName} numberOfLines={1}>{f.name}</Text>
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

                    {loadingProjects ? (
                        <Text style={{ paddingHorizontal: 20, color: '#666' }}>Loading…</Text>
                    ) : (projects || []).length === 0 ? (
                        <Text style={{ paddingHorizontal: 20, color: '#666' }}>
                            {projError ? `No projects (${projError})` : 'No projects found.'}
                        </Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: SIDE }}
                            snapToInterval={CARD + GAP}
                            snapToAlignment="start"
                            decelerationRate="fast"
                        >
                            {(projects || []).map(p => (
                                <View key={p.project_id} style={{ width: CARD, marginRight: GAP, flexShrink: 0 }}>
                                    <ProjectCard
                                        data={p}
                                        width={CARD}
                                        onPress={() =>
                                            navigation.navigate('AdminProjectTaskListScreen', {
                                                project_id: p.project_id,
                                                project_title: p.project_title,
                                            })}
                                    />
                                    {/* ringkasan kecil (optional) */}

                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Tasks */}
                <View style={styles.section}>
                    <View style={styles.taskHeader}>
                        <Text style={styles.taskHeaderTitle}>Tasks</Text>

                        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(v => !v)}>
                            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                            <Icon name={filterVisible ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color="#999" />
                        </TouchableOpacity>

                        {filterVisible && (
                            <View style={styles.dropdownMenu}>
                                {(['All', 'Pending', 'in_progress', 'completed'] as const).map((option, i, arr) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.dropdownItem,
                                            selectedFilter === option && styles.dropdownItemActive,
                                            i === 0 && styles.dropdownItemFirst,
                                            i === arr.length - 1 && styles.dropdownItemLast,
                                        ]}
                                        onPress={() => { setSelectedFilter(option); setFilterVisible(false); }}
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

                    {(tasks || []).map((t, idx) => {
                        const isCompleted = (t.status || '').toLowerCase() === 'completed';
                        return (
                            <AdminTaskCard
                                key={t.id ?? idx}
                                task={t}
                                checked={isCompleted ? true : !!checkedById[t.id]}
                                // onToggleCheck={() => {
                                //     if (isCompleted) return;
                                //     const next = [...checkedStates];
                                //     next[idx] = !next[idx];
                                //     setCheckedStates(next);
                                // }}
                                onToggleCheck={() => handleToggleCheck(idx, t)}
                                onPress={() =>
                                    navigation.push('AdminTaskDetailsScreen', {
                                        task_title: t.title ?? 'Task',
                                        task_id: t.id,
                                    })}
                            />
                        );
                    })}
                    {!loadingTasks && (tasks || []).length === 0 && (
                        <Text style={{ color: '#666' }}>No tasks found.</Text>
                    )}
                </View>
            </ScrollView>

            {/* Optimized Bottom Tab */}
            <OptimizedBottomTab
                tabs={tabConfig}
                quickActions={quickActions}
                activeTab="home"
            />
        </SafeAreaView>
    );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f4f7' },
    scrollContent: { paddingBottom: 200 },

    // Header
    header: { padding: 20, paddingTop: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    username: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
    welcome: { color: '#fff', fontSize: 13 },
    clientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clientTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    addText: { color: '#fff', textDecorationLine: 'underline' },

    // Client/Freelancer carousel
    clientScroll: { paddingHorizontal: 20, gap: 16 },
    clientCard: { alignItems: 'center', marginRight: 16 },
    clientCircle: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
    },
    clientLogo: { width: 50, height: 50, borderRadius: 25, resizeMode: 'cover' },
    clientName: { color: '#fff', fontSize: 12, marginTop: 6, maxWidth: 80, textAlign: 'center', alignSelf: 'center' },
    freelancersName: { color: 'black', fontSize: 12, marginTop: 6, maxWidth: 80, textAlign: 'center', alignSelf: 'center' },

    // Sections
    section: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    seeAll: { fontSize: 14, color: '#0072B5', fontWeight: '500' },

    // Filter/dropdown (Tasks)
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#073B61' },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    filterButtonText: { color: '#999', fontSize: 14, marginRight: 6 },
    dropdownMenu: {
        position: 'absolute', top: 45, right: 20, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, width: 160, zIndex: 10,
    },

    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'transparent' },
    dropdownItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    dropdownItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    dropdownItemActive: { backgroundColor: '#0072B5' },
    dropdownItemText: { fontSize: 14, color: '#0072B5' },
    dropdownItemTextActive: { color: '#fff' },
});
