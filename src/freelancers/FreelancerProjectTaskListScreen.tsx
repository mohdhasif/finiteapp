import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Dimensions, PanResponder, Alert, ActivityIndicator, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getTasksByProjectPublic, updateTaskStatus } from '../services/taskService';
import { getProjectDetails, getProjectFreelancers } from '../services/projectService';
import { BASE_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskCard from '../component/TaskCard';

// Type definitions for API responses
type ProjectFreelancer = {
    freelancer_id: number;
    user_id: number;
    avatar_url: string | null;
    skillset: string;
    freelancer_status: string;
    freelancer_name: string;
    freelancer_email: string;
};

const { height, width } = Dimensions.get('window');
type ProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'ProjectTaskListScreen'>;

const FILTERS = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Ongoing', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
] as const;
type FilterValue = (typeof FILTERS)[number]['value'];

const ProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ProjectTaskListScreenRouteProp>();

    // Drawer positions
    const BOTTOM_TOP = height * 0.25;
    const slideAnim = useRef(new Animated.Value(BOTTOM_TOP)).current;
    const lastPosition = useRef(BOTTOM_TOP);

    // UI states
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');

    // Data states
    const [tasksAll, setTasksAll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectDetails, setProjectDetails] = useState<any>(null);
    const [projectFreelancers, setProjectFreelancers] = useState<ProjectFreelancer[]>([]);

    // Checkbox states (keyed by task.id)
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({});
    
    // Prevent double taps while pending
    const pendingIdsRef = useRef<Set<number>>(new Set());

    // ================= Utils
    const formatDate = (d?: string | null) =>
        !d
            ? 'No due date'
            : new Date(d).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

    const getAvatarSource = (avatarUrl: string | null) => {
        if (!avatarUrl) {
            return require('../assets/user.png');
        }
        // Construct full URL if it's a relative path
        const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`;
        return { uri: fullUrl };
    };

    // Calculate progress percentage
    const progressPercentage = projectDetails?.progress_percent || Math.round((tasksAll.filter(t => t.status === 'completed').length / Math.max(tasksAll.length, 1)) * 100) || 0;
    const progressRotation = Math.min(progressPercentage * 3.6, 360);

    useEffect(() => {
        slideAnim.setValue(BOTTOM_TOP);
    }, [BOTTOM_TOP, slideAnim]);

    // Fetch tasks, project details, and freelancers on mount
    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) throw new Error('Token not found');

                // Fetch tasks, project details, and freelancers in parallel
                const [arr, projectData, freelancersData] = await Promise.all([
                    getTasksByProjectPublic(token, route.params.projectId),
                    getProjectDetails(token, route.params.projectId),
                    getProjectFreelancers(token, route.params.projectId)
                ]);

                // console.log('arr: ', arr);
                // console.log('projectData: ', projectData);
                // console.log('freelancersData: ', freelancersData);
                
                const list = Array.isArray(arr) ? arr : [];
                setTasksAll(list);
                setProjectDetails(projectData);
                setProjectFreelancers(Array.isArray(freelancersData?.freelancers) ? freelancersData.freelancers : []);

                // init checkbox by id (preserve when re-fetching)
                setCheckedById(() => {
                    const next: Record<number, boolean> = {};
                    for (const t of list) {
                        const id = Number(t.id);
                        const isCompleted =
                            String(t.status || '').toLowerCase() === 'completed';
                        next[id] = isCompleted; // force ikut server
                    }
                    return next;
                });
            } catch (err: any) {
                console.error('Fetch data error:', err?.message || err);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [route.params.projectId]);

    // Filtered tasks (client-side)
    const tasks = useMemo(() => {
        if (selectedFilter === 'all') return tasksAll;
        return tasksAll.filter(t => (t.status || '').toLowerCase() === selectedFilter);
    }, [tasksAll, selectedFilter]);

    // Handle checkbox toggle with API update
    const handleToggleCheck = async (taskId: number) => {
        const task = tasksAll.find(t => t.id === taskId);
        if (!task) return;

        // if already completed, ignore
        if ((task.status || '').toLowerCase() === 'completed') return;

        // Prevent double taps while pending
        if (pendingIdsRef.current.has(taskId)) return;
        pendingIdsRef.current.add(taskId);

        // Grab token
        const token = (await AsyncStorage.getItem('userToken')) || '';
        if (!token) {
            pendingIdsRef.current.delete(taskId);
            Alert.alert('Error', 'Token is missing. Please log in again.');
            return;
        }

        // --- Optimistic UI ---
        const prevTasks = [...tasksAll];
        const prevChecked = { ...checkedById };

        const nextChecked = { ...checkedById, [taskId]: true }; // checking means completed
        setCheckedById(nextChecked);

        const nextTasks = tasksAll.map(t => 
            t.id === taskId ? { ...t, status: 'completed' } : t
        );
        setTasksAll(nextTasks);

        try {
            await updateTaskStatus(token, taskId, 'completed');
            // success: keep optimistic state
            // Optionally refetch tasks to ensure consistency
            const arr = await getTasksByProjectPublic(token, route.params.projectId);
            const list = Array.isArray(arr) ? arr : [];
            setTasksAll(list);
            
            // Update checkbox states based on new data
            setCheckedById(() => {
                const next: Record<number, boolean> = {};
                for (const t of list) {
                    const id = Number(t.id);
                    const isCompleted = String(t.status || '').toLowerCase() === 'completed';
                    next[id] = isCompleted;
                }
                return next;
            });

        } catch (e: any) {
            // rollback
            setTasksAll(prevTasks);
            setCheckedById(prevChecked);
            Alert.alert('Failed', e?.message || 'Failed to update task status');
        } finally {
            pendingIdsRef.current.delete(taskId);
        }
    };

    // Drawer pan responder
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newY = lastPosition.current + gestureState.dy;
                const minY = 0;
                const maxY = BOTTOM_TOP;
                newY = Math.max(minY, Math.min(newY, maxY));
                slideAnim.setValue(newY);
            },
            onPanResponderRelease: (_, gestureState) => {
                const threshold = 80;
                if (gestureState.dy < -threshold) {
                    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false })
                        .start(() => (lastPosition.current = 0));
                } else if (gestureState.dy > threshold) {
                    Animated.spring(slideAnim, { toValue: BOTTOM_TOP, useNativeDriver: false })
                        .start(() => (lastPosition.current = BOTTOM_TOP));
                } else {
                    Animated.spring(slideAnim, { toValue: lastPosition.current, useNativeDriver: false })
                        .start();
                }
            }
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Top Card */}
            <View style={styles.topCard}>
                <View style={styles.cardLeft}>
                    <Text style={styles.title}>{projectDetails?.title || route.params.projectTitle}</Text>
                    <Text style={styles.subtitle}>{projectDetails?.description || 'Project description'}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="calendar-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>
                                {formatDate(projectDetails?.end_at)}
                            </Text>
                        </View>

                        <View style={styles.metaItem}>
                            <Icon name="checkmark-circle" size={16} color="#4aa9ff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>{tasksAll.length} Tasks</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.progressRing}>
                    <View style={styles.circle}>
                        <View style={styles.progressCircle}>
                            <View style={styles.progressBackground} />
                            <View style={[
                                styles.progressArc,
                                {
                                    transform: [{
                                        rotate: `${progressRotation}deg`
                                    }]
                                }
                            ]} />
                        </View>
                        <Text style={styles.progressText}>
                            {progressPercentage}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom Task Drawer */}
            <Animated.View style={[styles.taskContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View {...panResponder.panHandlers} style={styles.handle}>
                    <Icon name="remove-outline" size={40} color="#999" />
                </View>

                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>Tasks</Text>

                    {/* Filter Button */}
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterVisible(!filterVisible)}
                    >
                        <Text style={styles.filterButtonText}>
                            {FILTERS.find(f => f.value === selectedFilter)?.label ?? 'All Tasks'}
                        </Text>
                        <Icon
                            name={filterVisible ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={16}
                            color="#999"
                        />
                    </TouchableOpacity>

                    {/* Dropdown */}
                    {filterVisible && (
                        <View style={styles.dropdownMenu}>
                            {FILTERS.map((option, index) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.dropdownItem,
                                        selectedFilter === option.value && styles.dropdownItemActive,
                                        index === 0 && styles.dropdownItemFirst,
                                        index === FILTERS.length - 1 && styles.dropdownItemLast,
                                    ]}
                                    onPress={() => {
                                        setSelectedFilter(option.value);
                                        setFilterVisible(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownItemText,
                                            selectedFilter === option.value && styles.dropdownItemTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Task List */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 150 }}
                >
                    {loading ? (
                        <Text style={{ textAlign: 'center', color: '#073B61', marginTop: 12 }}>
                            Loading...
                        </Text>
                    ) : Array.isArray(tasks) && tasks.length > 0 ? (
                        tasks.map((task: any) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                checked={!!checkedById[task.id]}
                                onToggleCheck={() => handleToggleCheck(task.id)}
                                onPress={() =>
                                    navigation.push('TaskDetailsScreen', {
                                        task_id: task.id,
                                        task_title: task.title,
                                    } as any)
                                }
                            />
                        ))
                    ) : (
                        <Text style={{ textAlign: 'center', color: '#073B61', marginTop: 12 }}>
                            No tasks found.
                        </Text>
                    )}
                </ScrollView>
            </Animated.View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancerNotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancersHomeScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancerProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ProjectTaskListScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#073B61' },
    taskContainer: {
        position: 'absolute',
        left: 0, right: 0, height: height,
        backgroundColor: '#e1e1e1',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        elevation: 10,
    },
    handle: { alignSelf: 'center', marginBottom: 10, width: '100%', alignItems: 'center' },
    taskHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#073B61' },
    bottomNav: {
        position: 'absolute', bottom: 0, width: width, height: 70, backgroundColor: '#007baf',
        borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row',
        justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10,
    },
    navItem: { position: 'relative', alignItems: 'center', justifyContent: 'center' },

    // Task card
    taskCard: { marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
    taskCardInner: { padding: 12, borderRadius: 16, height: 100 },
    row: { flexDirection: 'row' },
    leftColumn: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    right2Column: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    checkboxWrapper: {
        width: 24, height: 24, borderRadius: 6, backgroundColor: '#007bff',
        justifyContent: 'center', alignItems: 'center',
    },
    rightColumn: { flex: 1, justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    taskTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 8 },
    progressBar: {
        marginTop: 8, height: 5, backgroundColor: '#ccc', borderRadius: 3, overflow: 'hidden', width: '70%'
    },
    progressFill: { width: '60%', height: '100%', backgroundColor: '#4aa9ff' },
    rowWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    taskFilter: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: '#fff', borderRadius: 8, elevation: 2,
    },
    taskFilterText: { marginRight: 6, fontSize: 14, color: '#333' },
    filterButton: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
        backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    },
    filterButtonText: { color: '#999', fontSize: 14, marginRight: 6 },

    dropdownMenu: {
        position: 'absolute', top: 45, right: 20, backgroundColor: '#fff',
        borderRadius: 12, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, width: 180, zIndex: 10,
    },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'transparent' },
    dropdownItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    dropdownItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    dropdownItemActive: { backgroundColor: '#0072B5' },
    dropdownItemText: { fontSize: 14, color: '#0072B5' },
    dropdownItemTextActive: { color: '#fff' },

    topCard: {
        flexDirection: 'row', justifyContent: 'space-between', padding: 20,
        borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    },
    cardLeft: { flex: 1 },
    title: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#e1e1e1', marginTop: 2, marginBottom: 10 },
    label: { color: '#fff', fontWeight: '600', marginTop: 10, marginBottom: 6 },
    avatarGroup: { flexDirection: 'row', marginBottom: 14 },
    avatar: { width: 50, height: 50, borderRadius: 50, marginRight: -4, borderWidth: 1, borderColor: '#fff' },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    metaText: { color: '#fff', fontSize: 13 },
    progressRing: { justifyContent: 'center', alignItems: 'center' },
    circle: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    progressCircle: {
        position: 'absolute',
        width: 80, height: 80, borderRadius: 40,
    },
    progressBackground: {
        position: 'absolute',
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 8, borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressArc: {
        position: 'absolute',
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 8, borderColor: 'transparent',
        borderTopColor: '#4aa9ff',
        borderRightColor: '#4aa9ff',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
        transform: [{ rotate: '0deg' }],
    },
    progressText: { fontWeight: 'bold', color: '#fff', fontSize: 16 },
});
