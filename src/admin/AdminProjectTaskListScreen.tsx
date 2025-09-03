import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Dimensions, PanResponder, Alert, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getTasksByProject, updateTaskStatus } from '../services/taskService';
import { getProjectDetails, getProjectFreelancers } from '../services/projectService';
import { BASE_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwipeableTaskCard from '../component/SwipeableTaskCard';
import Svg, { G, Circle } from 'react-native-svg';
import { performanceMonitor } from '../utils/performance';

// Type definitions for API responses
type ProjectFreelancer = {
    freelancer_id: number;
    user_id: number;
    freelancer_avatar_url: string | null;
    skillset: string;
    freelancer_status: string;
    freelancer_name: string;
    freelancer_email: string;
};

const { height, width } = Dimensions.get('window');
type AdminProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'AdminProjectTaskListScreen'>;

// SVG Progress Ring Constants
const RING_SIZE = 80;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const getRingColor = (p: number) => {
    if (p >= 75) return '#4aa9ff';
    if (p >= 40) return '#FFC107';
    return '#DC3545';
};

const FILTERS = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Ongoing', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
] as const;
type FilterValue = (typeof FILTERS)[number]['value'];

const AdminProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<AdminProjectTaskListScreenRouteProp>();

    // Drawer positions
    const BOTTOM_TOP = height * 0.25;
    const slideAnim = useRef(new Animated.Value(BOTTOM_TOP)).current;
    const lastPosition = useRef(BOTTOM_TOP);

    // UI states
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');
    const [showMenu, setShowMenu] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

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
    const pct = Math.max(0, Math.min(100, progressPercentage));
    const dash = CIRC * (1 - pct / 100);
    
    // console.log('Progress Debug:', {
    //     projectProgress: projectDetails?.progress_percent,
    //     completedTasks: tasksAll.filter(t => t.status === 'completed').length,
    //     totalTasks: tasksAll.length,
    //     calculatedPercentage: progressPercentage,
    //     pct: pct,
    //     dash: dash
    // });

    useEffect(() => {
        slideAnim.setValue(BOTTOM_TOP);
    }, [BOTTOM_TOP, slideAnim]);

    // Fetch tasks and project details on mount
    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken'); // change if actual key is different
                if (!token) throw new Error('Token not found');

                // Fetch tasks, project details, and freelancers in parallel
                const [arr, projectData, freelancersData] = await Promise.all([
                    getTasksByProject(token, route.params.project_id),
                    getProjectDetails(token, route.params.project_id),
                    getProjectFreelancers(token, route.params.project_id)
                ]);

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
    }, [route.params.project_id]);

    // Filtered tasks (client-side)
    const tasks = useMemo(() => {
        if (selectedFilter === 'all') return tasksAll;
        return tasksAll.filter(t => (t.status || '').toLowerCase() === selectedFilter);
    }, [tasksAll, selectedFilter]);

    // Handle checkbox toggle with API update
    const handleToggleCheck = async (taskId: number) => {
        const task = tasksAll.find(t => t.id === taskId);
        if (!task) return;

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

        // Determine new status based on current state
        const currentStatus = (task.status || '').toLowerCase();
        const isCurrentlyCompleted = currentStatus === 'completed';
        const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';

        // --- Optimistic UI ---
        const prevTasks = [...tasksAll];
        const prevChecked = { ...checkedById };

        const nextChecked = { ...checkedById, [taskId]: !isCurrentlyCompleted };
        setCheckedById(nextChecked);

        const nextTasks = tasksAll.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        setTasksAll(nextTasks);

        try {
            await updateTaskStatus(token, taskId, newStatus);
            // success: keep optimistic state
            // Optionally refetch tasks to ensure consistency
            const arr = await getTasksByProject(token, route.params.project_id);
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
            {/* Floating Action Button Menu */}
            {showOptions && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AdminCreateProjectScreen'); // Ganti ikut nama sebenar
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AddTaskScreen'); // Ganti ikut nama sebenar
                        }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Top Card */}
            <View style={styles.topCard}>
                <View style={styles.cardLeft}>
                    <Text style={styles.title}>{projectDetails?.title || route.params.project_title}</Text>
                    <Text style={styles.subtitle}>{projectDetails?.description || 'Project description'}</Text>

                    <Text style={styles.label}>Assigned to</Text>
                    <View style={styles.avatarGroup}>
                        {projectFreelancers.length > 0 ? (
                            projectFreelancers.slice(0, 3).map((freelancer: ProjectFreelancer, index: number) => (
                                <Image
                                    key={freelancer.freelancer_id || index}
                                    source={getAvatarSource(freelancer.freelancer_avatar_url)}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ))
                        ) : (
                            <Text style={styles.noFreelancersText}>No freelancers set up yet</Text>
                        )}
                    </View>

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
                    <View style={styles.donutWrap}>
                        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                            <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
                                {/* track */}
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke="rgba(255, 255, 255, 0.3)"
                                    strokeWidth={STROKE}
                                    fill="none"
                                />
                                {/* progress */}
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke={getRingColor(pct)}
                                    strokeWidth={STROKE}
                                    strokeDasharray={`${CIRC} ${CIRC}`}
                                    strokeDashoffset={dash}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </G>
                        </Svg>
                        <View style={styles.centerLabel}>
                            <Text style={styles.progressText}>{pct}%</Text>
                        </View>
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
                            <SwipeableTaskCard
                                key={task.id}
                                task={task}
                                onPress={() =>
                                    navigation.push('AdminTaskDetailsScreen', {
                                        task_title: task.title,
                                        task_id: task.id,
                                    })
                                }
                                onDelete={(taskId) => {
                                    console.log('Delete task:', taskId);
                                    Alert.alert('Delete Task', 'Delete functionality will be implemented here');
                                }}
                                onUpdate={(taskId) => {
                                    navigation.navigate('AddTaskScreen', { task_id: taskId });
                                }}
                            />
                        ))
                    ) : (
                        <Text style={{ textAlign: 'center', color: '#073B61', marginTop: 12 }}>
                            No tasks found.
                        </Text>
                    )}


                </ScrollView>
            </Animated.View>

            {/* Floating Menu */}
            {showMenu && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowMenu(false);
                            navigation.navigate('AdminCreateProjectScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowMenu(false);
                            navigation.navigate('AddTaskScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminCalendarScreen')}>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab} onPress={() => setShowOptions(!showOptions)}>
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AdminNotificationsScreen')}>
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AdminProjectTaskListScreen;

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
    progressFillBar: { width: '60%', height: '100%', backgroundColor: '#4aa9ff' },
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
    noFreelancersText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, fontStyle: 'italic' },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    metaText: { color: '#fff', fontSize: 13 },
    progressRing: { justifyContent: 'center', alignItems: 'center' },
    donutWrap: {
        position: 'relative',
        width: RING_SIZE,
        height: RING_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerLabel: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: { fontWeight: 'bold', color: '#fff', fontSize: 16 },

    bottomTab: {
        flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0072B5',
        paddingVertical: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        position: 'absolute', bottom: 0, width: '100%', alignItems: 'center',
    },
    fab: {
        backgroundColor: '#fff', width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center', marginTop: -40,
    },
    dropdown: {
        position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: '#fff',
        borderRadius: 10, paddingVertical: 4, width: 140, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 10, zIndex: 10,
    },
    option: { paddingVertical: 10, paddingHorizontal: 20 },
    optionText: { fontSize: 14, fontWeight: '600', color: '#0072B5' },
});
