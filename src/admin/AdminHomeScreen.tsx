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
    Alert,
    Animated,
    Easing,
    DeviceEventEmitter,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchClientsOnlyApproved, fetchFreelancersOnlyApproved } from '../services/adminService';
import AdminTaskCard from '../component/AdminTaskCard';
import SwipeableTaskCard from '../component/SwipeableTaskCard';
import { getAllTasks, updateTaskStatus, type Task } from '../services/taskService';

import ProjectCard from '../component/ProjectCard';
import { getProjectSummaries, getProjectFreelancers, type ProjectSummary } from '../services/projectService';
import { useAsyncState } from '../hooks/useOptimizedState';
import { performanceMonitor } from '../utils/performance';
import { api } from '../services/apiClient';
import OptimizedBottomTab from '../components/OptimizedBottomTab';


const { width } = Dimensions.get('window');
const CARD = Math.round(width * 0.62); // shows >1 card
const GAP = 12;
const SIDE = 20;

import { BASE_URL } from '../constants/apiConfig';

// ===== Finite Brand Theme =====
const theme = {
    colors: {
        primaryDeep: '#003865',
        primary: '#0072B5',
        accent: '#00A3FF',
        background: '#F2F6FA',
        surface: '#FFFFFF',
        textPrimary: '#073B61',
        textSecondary: '#6B7A90',
        border: '#E1E8F0',
    },
    radius: {
        m: 12,
        l: 16,
        pill: 999,
    },
};

// Shimmer skeleton utilities
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const Shimmer: React.FC<{ style?: any }> = ({ style }) => {
    const shimmerX = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(shimmerX, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => { loop.stop(); };
    }, [shimmerX]);
    const translateX = shimmerX.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });
    return (
        <View style={[styles.shimmerBase, style]}>
            <AnimatedLinearGradient
                colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.35)',
                    'rgba(255,255,255,0)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject as any, { transform: [{ translateX }] }]}
            />
        </View>
    );
};

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
    // --- Navigation (already exists in your file)
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // ================= UI states
    const [filterVisible, setFilterVisible] = useState(false);
    type FilterValue = 'All' | 'Pending' | 'in_progress' | 'completed';
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('All');

    // ================= Performance optimized data states
    const { data: clients = [], loading: loadingClients, execute: fetchClientsData } = useAsyncState<Client[]>([]);
    const { data: freelancers = [], loading: loadingFreelancers, execute: fetchFreelancersData } = useAsyncState<Freelancer[]>([]);
    const { data: projects = [], loading: loadingProjects, error: projError, execute: fetchProjectsData } = useAsyncState<ProjectSummary[]>([]);
    const { data: tasks = [], loading: loadingTasks, execute: fetchTasksData } = useAsyncState<Task[]>([]);
    
    // User profile data
    const [userInfo, setUserInfo] = useState<any>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    
    // Checkbox states (keyed by task.id)
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({});
    
    // Performance monitoring
    const renderCount = useRef(0);
    renderCount.current++;

    // Swipe tutorial states
    const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
    const tutorialTranslateX = useRef(new Animated.Value(0)).current;
    const tutorialAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

    // Header clients entrance animation (safe on Android)
    const headerClientAnimMapRef = useRef<Map<string, Animated.Value>>(new Map());
    const headerClientsSignatureRef = useRef<string>('');
    const animateHeaderClients = useCallback(() => {
        const list = Array.isArray(clients) ? clients : [];
        const signature = list.map((c, i) => String(c?.client_id ?? i)).join('|');
        if (signature === headerClientsSignatureRef.current) return; // nothing new → don't re-animate
        headerClientsSignatureRef.current = signature;

        const animations: Animated.CompositeAnimation[] = [];
        list.forEach((c, idx) => {
            const key = String(c.client_id ?? idx);
            let v = headerClientAnimMapRef.current.get(key);
            if (!v) {
                v = new Animated.Value(1);
                headerClientAnimMapRef.current.set(key, v);
            }
            // animate from 0 → 1 for current run
            v.setValue(0);
            animations.push(
                Animated.timing(v, {
                    toValue: 1,
                    duration: 220,
                    delay: idx * 36,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            );
        });
        if (animations.length > 0) Animated.parallel(animations).start();
    }, [clients]);

    // Freelancers stagger animation (match clients behavior)
    const freelancersAnimMapRef = useRef<Map<string, Animated.Value>>(new Map());
    const freelancersSignatureRef = useRef<string>('');
    const animateFreelancers = useCallback(() => {
        const list = Array.isArray(freelancers) ? freelancers : [];
        const signature = list.map((f, i) => String(f?.id ?? f?.user_id ?? i)).join('|');
        if (signature === freelancersSignatureRef.current) return;
        freelancersSignatureRef.current = signature;

        const animations: Animated.CompositeAnimation[] = [];
        list.forEach((f, idx) => {
            const key = String(f?.id ?? f?.user_id ?? idx);
            let v = freelancersAnimMapRef.current.get(key);
            if (!v) {
                v = new Animated.Value(1);
                freelancersAnimMapRef.current.set(key, v);
            }
            v.setValue(0);
            animations.push(
                Animated.timing(v, {
                    toValue: 1,
                    duration: 220,
                    delay: idx * 36,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            );
        });
        if (animations.length > 0) Animated.parallel(animations).start();
    }, [freelancers]);

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

    // Check tutorial view state
    const checkAndShowTutorial = useCallback(async () => {
        try {
            const seen = await AsyncStorage.getItem('hasSeenSwipeTutorial');
            if (seen !== 'true') {
                setShowSwipeTutorial(true);
            }
        } catch (err) {
            // no-op
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
                    return await fetchClientsOnlyApproved(token);
                }),

                fetchFreelancersData(async () => {
                    return await fetchFreelancersOnlyApproved(token);
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
        try {
            performanceMonitor.startTimer('loadTasks');
            
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const currentFilter = filter || selectedFilter;
            const status = resolveStatus(currentFilter);
            
            await fetchTasksData(async () => {
                const data = await getAllTasks(token, status ? { status } : {});
                
                // Initialize checkbox states based on task completion
                const newCheckedStates: Record<number, boolean> = {};
                data.forEach(task => {
                    newCheckedStates[task.id] = (task.status || '').toLowerCase() === 'completed';
                });
                setCheckedById(newCheckedStates);
                
                return data;
            });
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            try {
                performanceMonitor.endTimer('loadTasks');
            } catch (timerError) {
                console.warn('Timer error in loadTasks:', timerError);
            }
        }
    }, [selectedFilter, fetchTasksData]);

    // ================= Refresh every time screen FOCUSES
    useFocusEffect(
        useCallback(() => {
            // when entering screen / regaining focus -> fetch latest data
            loadMasters();
            loadTasks(); // Will use current selectedFilter
            loadUserData(); // Load user profile data
            checkAndShowTutorial();

            // no special cleanup required here
            return () => { };
            // run once on focus to animate newly loaded header clients
            setTimeout(() => { try { animateHeaderClients(); } catch {} }, 0);

            setTimeout(() => { try { animateHeaderClients(); animateFreelancers(); } catch {} }, 0);

        }, [loadMasters, loadUserData, checkAndShowTutorial, animateHeaderClients, animateFreelancers]) // Remove loadTasks from dependency to prevent reloading on filter change
    );

    // ================= When filter changes (while screen active), refresh tasks only
    useEffect(() => {
        // Only reload tasks when filter changes, not the entire screen
        loadTasks(selectedFilter);
    }, [selectedFilter]); // Only depend on selectedFilter, not loadTasks
    // Listen for task saved events and update list immediately
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('TASK_SAVED', (payload: any) => {
            const savedId = Number(payload?.id);
            if (!savedId) return;
            // Update tasks list locally if present; otherwise refetch tasks
            fetchTasksData(async () => {
                const list = Array.isArray(tasks) ? [...tasks] : [];
                const idx = list.findIndex(t => Number(t.id) === savedId);
                if (idx >= 0) {
                    list[idx] = { ...list[idx], ...payload };
                    // Maintain checkbox state based on updated status
                    setCheckedById(prev => ({ ...prev, [savedId]: String(payload?.status || '').toLowerCase() === 'completed' }));
                    return list;
                }
                // If not found, just return old list and trigger a refetch
                setTimeout(() => { loadTasks(); }, 0);
                return list;
            });
        });
        return () => { sub.remove(); };
    }, [tasks, fetchTasksData, loadTasks]);

    // re-run header clients animation when clients list changes
    useEffect(() => { animateHeaderClients(); }, [clients, animateHeaderClients]);
    useEffect(() => { animateFreelancers(); }, [freelancers, animateFreelancers]);


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

        // Determine new status based on current state
        const currentStatus = (t.status || '').toLowerCase();
        const isCurrentlyCompleted = currentStatus === 'completed';
        const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';

        // --- Optimistic UI ---
        const tasksList = tasks || [];
        const prevTasks = [...tasksList];
        const prevChecked = { ...checkedById };

        const nextChecked = { ...checkedById, [id]: !isCurrentlyCompleted };
        setCheckedById(nextChecked);

        try {
            await updateTaskStatus(token, id, newStatus);

            // Smoothly update project progress without refetching whole projects list
            const projectId = t.project?.id;
            if (projectId) {
                await fetchProjectsData(async () => {
                    const currentProjects = Array.isArray(projects) ? projects : [];
                    return currentProjects.map(p => {
                        if (p.project_id !== projectId) return p;
                        const total = Math.max(0, Number(p.total_tasks) || 0);
                        let completed = Math.max(0, Number(p.completed_tasks) || 0);
                        if (!isCurrentlyCompleted && newStatus === 'completed') {
                            completed = Math.min(total, completed + 1);
                        } else if (isCurrentlyCompleted && newStatus !== 'completed') {
                            completed = Math.max(0, completed - 1);
                        }
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return { ...p, completed_tasks: completed, progress_percent: progress } as typeof p;
                    });
                });
            }

            // Refresh tasks list only (avoid project flicker)
            await loadTasks();

        } catch (e: any) {
            // rollback
            setCheckedById(prevChecked);
            Alert.alert('Failed', e?.message || 'Failed to update task status');
        } finally {
            pendingIdsRef.current.delete(id);
        }
    }, [projects, tasks, checkedById, fetchProjectsData, loadTasks]);

    // Start/stop tutorial animation
    useEffect(() => {
        if (showSwipeTutorial) {
            tutorialTranslateX.setValue(0);
            const distance = Math.round(width * 0.2);
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(tutorialTranslateX, {
                        toValue: distance,
                        duration: 700,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(tutorialTranslateX, {
                        toValue: -distance,
                        duration: 700,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(tutorialTranslateX, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ])
            );
            tutorialAnimationRef.current = anim;
            anim.start();
        } else {
            tutorialAnimationRef.current?.stop();
            tutorialAnimationRef.current = null;
            tutorialTranslateX.stopAnimation();
            tutorialTranslateX.setValue(0);
        }
        return () => {
            tutorialAnimationRef.current?.stop();
            tutorialAnimationRef.current = null;
        };
    }, [showSwipeTutorial, tutorialTranslateX]);

    const dismissSwipeTutorial = useCallback(async () => {
        try {
            await AsyncStorage.setItem('hasSeenSwipeTutorial', 'true');
        } catch (e) {
            // ignore
        }
        setShowSwipeTutorial(false);
    }, []);

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
                <LinearGradient colors={[theme.colors.primaryDeep, theme.colors.primary]} style={styles.header}>
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
                        <TouchableOpacity style={styles.headerSeeAllRow} onPress={() => navigation.navigate('ClientListScreen')}>
                            <Text style={styles.headerSeeAll}>See all</Text>
                            <Icon name="chevron-forward-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientScroll}>
                        {loadingClients && (clients?.length ?? 0) === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <View key={`client-skel-${i}`} style={styles.clientCard}>
                                    <View style={styles.clientCircleHeader}>
                                        <Shimmer style={{ width: 50, height: 50, borderRadius: 25 }} />
                                    </View>
                                    <Shimmer style={{ width: 70, height: 12, borderRadius: 6, marginTop: 6 }} />
                                </View>
                            ))
                        ) : (
                            Array.isArray(clients) && clients.map((c, idx) => {
                                const key = String(c.client_id ?? idx);
                                let v = headerClientAnimMapRef.current.get(key);
                                if (!v) {
                                    v = new Animated.Value(1);
                                    headerClientAnimMapRef.current.set(key, v);
                                }
                                const itemStyle = {
                                    opacity: v,
                                    transform: [
                                        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                                        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                                    ],
                                } as const;
                                return (
                                    <Animated.View key={c.client_id} style={[styles.clientCard, itemStyle]}>
                                        <View style={styles.clientCircleHeader}>
                                            <Image
                                                source={typeof c.avatar_url === 'string'
                                                    ? { uri: BASE_URL.replace(/\/+$/, '') + c.avatar_url }
                                                    : require('../assets/user.png')}
                                                style={styles.clientLogo}
                                                resizeMode="contain"
                                            />
                                        </View>
                                        <Text style={styles.clientNameHeader} numberOfLines={1}>{c.name}</Text>
                                    </Animated.View>
                                );
                            })
                        )}
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.clientScroll, { paddingVertical: 6 }]}>
                        {loadingFreelancers && (freelancers?.length ?? 0) === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <View key={`freelancer-skel-${i}`} style={styles.clientCard}>
                                    <View style={styles.clientCircleHeader}>
                                        <Shimmer style={{ width: 50, height: 50, borderRadius: 25 }} />
                                    </View>
                                    <Shimmer style={{ width: 70, height: 12, borderRadius: 6, marginTop: 6 }} />
                                </View>
                            ))
                        ) : (
                            Array.isArray(freelancers) && freelancers.map((f, idx) => {
                                const key = String(f?.id ?? f?.user_id ?? idx);
                                let v = freelancersAnimMapRef.current.get(key);
                                if (!v) {
                                    v = new Animated.Value(1);
                                    freelancersAnimMapRef.current.set(key, v);
                                }
                                const itemStyle = {
                                    opacity: v,
                                    transform: [
                                        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                                        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                                    ],
                                } as const;
                                return (
                                    <Animated.View key={f.id} style={[styles.clientCard, itemStyle]}>
                                        <View style={styles.clientCircleHeader}>
                                            <Image
                                                source={typeof f.avatar === 'string'
                                                    ? { uri: BASE_URL.replace(/\\+$/, '') + f.avatar }
                                                    : require('../assets/user.png')}
                                                style={styles.clientLogo}
                                            />
                                        </View>
                                        <Text style={styles.freelancersName} numberOfLines={1}>{f.name}</Text>
                                    </Animated.View>
                                );
                            })
                        )}
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

                    {loadingProjects && ((projects?.length ?? 0) === 0) ? (
                        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
                            <Shimmer style={{ height: 18, width: 120, borderRadius: 6, marginBottom: 12 }} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIDE }}>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <View key={`proj-skel-${i}`} style={{ width: CARD, marginRight: GAP }}>
                                        <Shimmer style={{ height: 140, width: CARD, borderRadius: 12 }} />
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    ) : (!Array.isArray(projects) || projects.length === 0) ? (
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
                            removeClippedSubviews={false}
                        >
                            {Array.isArray(projects) && projects.map(p => (
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

                    <View style={styles.card}>
                        {(tasks || []).map((t, idx) => (
                            <SwipeableTaskCard
                                key={t.id ?? idx}
                                task={t}
                                onPress={() =>
                                    navigation.push('AdminTaskDetailsScreen', {
                                        task_title: t.title ?? 'Task',
                                        task_id: t.id,
                                    })
                                }
                                onToggle={() => handleToggleCheck(idx, t)}
                                onDelete={(taskId) => {
                                    try {
                                        fetchTasksData(async () => {
                                            const list = Array.isArray(tasks) ? tasks : [];
                                            return list.filter((x) => x.id !== taskId);
                                        });
                                        setCheckedById((prev) => {
                                            const next = { ...prev };
                                            delete next[Number(taskId)];
                                            return next;
                                        });
                                        const projectId = t.project?.id;
                                        const wasCompleted = String(t.status || '').toLowerCase() === 'completed';
                                        if (projectId) {
                                            fetchProjectsData(async () => {
                                                const currentProjects = Array.isArray(projects) ? projects : [];
                                                return currentProjects.map(p => {
                                                    if (p.project_id !== projectId) return p;
                                                    const newTotal = Math.max(0, (Number(p.total_tasks) || 0) - 1);
                                                    let newCompleted = Math.max(0, (Number(p.completed_tasks) || 0) - (wasCompleted ? 1 : 0));
                                                    if (newCompleted > newTotal) newCompleted = newTotal;
                                                    const newProgress = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;
                                                    return { ...p, total_tasks: newTotal, completed_tasks: newCompleted, progress_percent: newProgress } as typeof p;
                                                });
                                            });
                                        }
                                        loadTasks();
                                    } catch (e) {}
                                }}
                                onUpdate={(taskId) => {
                                    navigation.navigate('AddTaskScreen', { task_id: taskId });
                                }}
                            />
                        ))}
                        {!loadingTasks && (tasks || []).length === 0 && (
                            <Text style={styles.mutedText}>No tasks found.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Optimized Bottom Tab */}
            <OptimizedBottomTab
                tabs={tabConfig}
                quickActions={quickActions}
                activeTab="home"
            />

            {showSwipeTutorial && (
                <View style={styles.tutorialOverlay} pointerEvents="auto">
                    <View style={styles.tutorialContent}>
                        <Text style={styles.tutorialTitle}>Swipe tasks left or right</Text>
                        <Text style={styles.tutorialSubtitle}>Swipe to reveal actions like Update or Delete.</Text>
                        <View style={styles.tutorialDemoArea}>
                            <Animated.View style={[styles.tutorialCard, { transform: [{ translateX: tutorialTranslateX }] }]}> 
                                <View style={styles.tutorialCardHeader} />
                                <View style={styles.tutorialCardLine} />
                                <View style={styles.tutorialCardLineShort} />
                            </Animated.View>
                            <View style={styles.tutorialArrowsRow}>
                                <Icon name="arrow-back-outline" size={22} color="#fff" />
                                <Text style={styles.tutorialSwipeText}>Swipe</Text>
                                <Icon name="arrow-forward-outline" size={22} color="#fff" />
                            </View>
                        </View>
                        <TouchableOpacity onPress={dismissSwipeTutorial} style={styles.tutorialButton}>
                            <Text style={styles.tutorialButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { paddingBottom: 200 },

    // Header
    header: { padding: 20, paddingTop: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    username: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
    welcome: { color: '#E4F0FA', fontSize: 13 },
    clientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clientTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    addText: { color: '#fff', textDecorationLine: 'underline' },
    headerSeeAll: { color: '#fff', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    headerSeeAllRow: { flexDirection: 'row', alignItems: 'center' },
    headerListCard: { },
    clientCircleHeader: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 0, borderColor: 'transparent',
    },
    clientNameHeader: { color: '#fff', fontSize: 12, marginTop: 6, maxWidth: 80, textAlign: 'center', alignSelf: 'center' },
    pillButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme.radius.pill,
    },
    pillButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },

    // Client/Freelancer carousel
    clientScroll: { paddingHorizontal: 20, gap: 16 },
    clientCard: { alignItems: 'center', marginRight: 16 },
    clientCircle: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    },
    clientLogo: { width: 50, height: 50, borderRadius: 25, resizeMode: 'cover' },
    clientName: { color: '#fff', fontSize: 12, marginTop: 6, maxWidth: 80, textAlign: 'center', alignSelf: 'center' },
    freelancersName: { color: theme.colors.textPrimary, fontSize: 12, marginTop: 6, maxWidth: 80, textAlign: 'center', alignSelf: 'center' },

    // Sections
    section: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
    seeAll: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 12,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    mutedText: { paddingHorizontal: 20, color: theme.colors.textSecondary },

    // Filter/dropdown (Tasks)
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    filterButtonText: { color: theme.colors.textSecondary, fontSize: 14, marginRight: 6 },
    dropdownMenu: {
        position: 'absolute', top: 45, right: 20, backgroundColor: theme.colors.surface, borderRadius: 12, paddingVertical: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, width: 160, zIndex: 10,
    },

    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'transparent' },
    dropdownItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    dropdownItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    dropdownItemActive: { backgroundColor: theme.colors.primary },
    dropdownItemText: { fontSize: 14, color: theme.colors.primary },
    dropdownItemTextActive: { color: '#fff' },

    // Tutorial overlay
    tutorialOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    tutorialContent: {
        width: '86%',
        backgroundColor: 'rgba(7,59,97,0.92)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#0a5b91',
    },
    tutorialTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    tutorialSubtitle: { color: '#d6e9f7', fontSize: 13, textAlign: 'center', marginTop: 6 },
    tutorialDemoArea: { marginTop: 16, paddingVertical: 16, alignItems: 'center' },
    tutorialCard: {
        width: '92%',
        height: 70,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 14,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tutorialCardHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 10,
        backgroundColor: '#e9f2fb',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    tutorialCardLine: { height: 8, backgroundColor: '#e6eef6', borderRadius: 4, marginTop: 16, width: '80%' },
    tutorialCardLineShort: { height: 8, backgroundColor: '#e6eef6', borderRadius: 4, marginTop: 8, width: '60%' },
    tutorialArrowsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    tutorialSwipeText: { color: '#fff', marginHorizontal: 10, fontSize: 14 },
    tutorialButton: { alignSelf: 'center', marginTop: 16, backgroundColor: theme.colors.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 },
    tutorialButtonText: { color: '#fff', fontWeight: 'bold' },
    shimmerBase: {
        backgroundColor: '#E6EEF6',
        overflow: 'hidden',
        borderRadius: 12,
    },
});
