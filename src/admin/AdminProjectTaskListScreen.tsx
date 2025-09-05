import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Image, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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
import DraggableBottomSheet from '../components/DraggableBottomSheet';

const { height, width } = Dimensions.get('window');
type AdminProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'AdminProjectTaskListScreen'>;

// Type definitions
type ProjectFreelancer = {
    freelancer_id: number;
    user_id: number;
    freelancer_avatar_url: string | null;
    skillset: string;
    freelancer_status: string;
    freelancer_name: string;
    freelancer_email: string;
};

// SVG Progress Ring Constants
const RING_SIZE = 80;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

// Bottom sheet snap points
const SNAP_POINTS = [
    0, // Top - full screen
    Math.round(height * 0.25), // Middle - 75% visible
    height - 100, // Bottom - almost closed (just a small peek)
];

// Filter options
const FILTERS = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Ongoing', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
] as const;
type FilterValue = (typeof FILTERS)[number]['value'];

// Theme
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
        l: 16,
        pill: 999,
    },
};

// Utility functions
const getRingColor = (percentage: number) => {
    if (percentage >= 75) return '#4aa9ff';
    if (percentage >= 40) return '#FFC107';
    return '#DC3545';
};

const formatDate = (date?: string | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getAvatarSource = (avatarUrl: string | null) => {
    if (!avatarUrl) {
        return require('../assets/user.png');
    }
    const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`;
    return { uri: fullUrl };
};

const AdminProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<AdminProjectTaskListScreenRouteProp>();

    // State management
    const [tasksAll, setTasksAll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectDetails, setProjectDetails] = useState<any>(null);
    const [projectFreelancers, setProjectFreelancers] = useState<ProjectFreelancer[]>([]);
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({});
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');
    const [showOptions, setShowOptions] = useState(false);
    const [currentSnapIndex, setCurrentSnapIndex] = useState(1);

    // Prevent double taps
    const pendingIdsRef = React.useRef<Set<number>>(new Set());

    // Calculate progress
    const progressPercentage = useMemo(() => {
        if (projectDetails?.progress_percent) {
            return projectDetails.progress_percent;
        }
        const completedTasks = tasksAll.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / Math.max(tasksAll.length, 1)) * 100);
    }, [projectDetails?.progress_percent, tasksAll]);

    const pct = Math.max(0, Math.min(100, progressPercentage));
    const dash = CIRC * (1 - pct / 100);

    // Filtered tasks
    const tasks = useMemo(() => {
        if (selectedFilter === 'all') return tasksAll;
        return tasksAll.filter(t => (t.status || '').toLowerCase() === selectedFilter);
    }, [tasksAll, selectedFilter]);

    // Handle snap change
    const handleSnapChange = useCallback((index: number) => {
        setCurrentSnapIndex(index);
    }, []);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) throw new Error('Token not found');

                const [tasksData, projectData, freelancersData] = await Promise.all([
                    getTasksByProject(token, route.params.project_id),
                    getProjectDetails(token, route.params.project_id),
                    getProjectFreelancers(token, route.params.project_id)
                ]);

                const tasksList = Array.isArray(tasksData) ? tasksData : [];
                setTasksAll(tasksList);
                setProjectDetails(projectData);
                setProjectFreelancers(Array.isArray(freelancersData?.freelancers) ? freelancersData.freelancers : []);

                // Initialize checkbox states
                const checkboxStates: Record<number, boolean> = {};
                tasksList.forEach(task => {
                    const id = Number(task.id);
                    const isCompleted = String(task.status || '').toLowerCase() === 'completed';
                    checkboxStates[id] = isCompleted;
                });
                setCheckedById(checkboxStates);
            } catch (error: any) {
                console.error('Fetch data error:', error?.message || error);
                Alert.alert('Error', 'Failed to load project data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [route.params.project_id]);

    // Handle task toggle
    const handleToggleCheck = useCallback(async (taskId: number) => {
        const task = tasksAll.find(t => t.id === taskId);
        if (!task || pendingIdsRef.current.has(taskId)) return;

        pendingIdsRef.current.add(taskId);

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'Token is missing. Please log in again.');
                return;
            }

            const currentStatus = (task.status || '').toLowerCase();
            const isCurrentlyCompleted = currentStatus === 'completed';
            const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';

            // Optimistic update
            setCheckedById(prev => ({ ...prev, [taskId]: !isCurrentlyCompleted }));
            setTasksAll(prev => prev.map(t => 
                t.id === taskId ? { ...t, status: newStatus } : t
            ));

            await updateTaskStatus(token, taskId, newStatus);

            // Refresh data for consistency
            const updatedTasks = await getTasksByProject(token, route.params.project_id);
            const tasksList = Array.isArray(updatedTasks) ? updatedTasks : [];
            setTasksAll(tasksList);

            // Update checkbox states
            const checkboxStates: Record<number, boolean> = {};
            tasksList.forEach(task => {
                const id = Number(task.id);
                const isCompleted = String(task.status || '').toLowerCase() === 'completed';
                checkboxStates[id] = isCompleted;
            });
            setCheckedById(checkboxStates);

        } catch (error: any) {
            Alert.alert('Failed', error?.message || 'Failed to update task status');
        } finally {
            pendingIdsRef.current.delete(taskId);
        }
    }, [tasksAll, route.params.project_id]);

    // Handle task delete
    const handleTaskDelete = useCallback((taskId: number) => {
        setTasksAll(prev => prev.filter(t => t.id !== taskId));
        setCheckedById(prev => {
            const next = { ...prev };
            delete next[taskId];
            return next;
        });
    }, []);

    // Always enable scroll for task list
    const scrollEnabled = true;

    return (
        <View style={styles.container}>
            {/* Top Project Card */}
            <View style={styles.topCard}>
                <View style={styles.cardLeft}>
                    <Text style={styles.title}>
                        {projectDetails?.title || route.params.project_title}
                    </Text>
                    <Text style={styles.subtitle}>
                        {projectDetails?.description || 'Project description'}
                    </Text>

                    <Text style={styles.label}>Assigned to</Text>
                    <View style={styles.avatarGroup}>
                        {projectFreelancers.length > 0 ? (
                            projectFreelancers.slice(0, 3).map((freelancer, index) => (
                                <Image
                                    key={freelancer.freelancer_id || index}
                                    source={getAvatarSource(freelancer.freelancer_avatar_url)}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ))
                        ) : (
                            <Text style={styles.noFreelancersText}>
                                No freelancers assigned
                            </Text>
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
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke="rgba(255, 255, 255, 0.3)"
                                    strokeWidth={STROKE}
                                    fill="none"
                                />
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

            {/* Draggable Bottom Sheet */}
            <DraggableBottomSheet
                snapPoints={SNAP_POINTS}
                initialSnapIndex={1}
                onSnapChange={handleSnapChange}
                backgroundColor={theme.colors.background}
                borderRadius={30}
                handleColor="#999"
            >
                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>Tasks</Text>
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
                </View>

                {/* Filter Dropdown */}
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

                {/* Task List */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 4 }}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={styles.taskListContainer}
                    decelerationRate="fast"
                    bounces={true}
                    overScrollMode="auto"
                    alwaysBounceVertical={false}
                    scrollEventThrottle={16}
                    directionalLockEnabled={true}
                    removeClippedSubviews={false}
                >
                    {loading ? (
                        <Text style={styles.loadingText}>Loading...</Text>
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
                                onToggle={() => handleToggleCheck(task.id)}
                                onDelete={handleTaskDelete}
                                onUpdate={(taskId) => {
                                    navigation.navigate('AddTaskScreen', { task_id: taskId });
                                }}
                            />
                        ))
                    ) : (
                        <Text style={styles.noTasksText}>No tasks found.</Text>
                    )}
                </ScrollView>
            </DraggableBottomSheet>

            {/* Floating Action Menu */}
            {showOptions && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AdminCreateProjectScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AddTaskScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Navigation */}
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
    container: {
        flex: 1,
        backgroundColor: theme.colors.textPrimary,
    },
    topCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    cardLeft: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#e1e1e1',
        marginTop: 2,
        marginBottom: 10,
    },
    label: {
        color: '#fff',
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 6,
    },
    avatarGroup: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 50,
        marginRight: -4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    noFreelancersText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        color: '#fff',
        fontSize: 13,
    },
    progressRing: {
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    progressText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
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
        color: theme.colors.textPrimary,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'transparent',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    filterButtonText: {
        color: theme.colors.textSecondary,
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
        width: 180,
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
        backgroundColor: theme.colors.primary,
    },
    dropdownItemText: {
        fontSize: 14,
        color: theme.colors.primary,
    },
    dropdownItemTextActive: {
        color: '#fff',
    },
    taskListContainer: {
        flex: 1,
        marginTop: 8,
    },
    loadingText: {
        textAlign: 'center',
        color: '#073B61',
        marginTop: 12,
    },
    noTasksText: {
        textAlign: 'center',
        color: '#073B61',
        marginTop: 12,
    },
    bottomTab: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
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
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 4,
        width: 140,
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
});