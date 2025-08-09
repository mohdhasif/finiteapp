import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Dimensions, PanResponder, Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTasksByProjectPublic, type Task } from '../services/taskService';

const { height, width } = Dimensions.get('window');
type ProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'ProjectTaskListScreen'>;

const ProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ProjectTaskListScreenRouteProp>();

    const START_TOP = height * 0.25; // drawer start position
    const slideAnim = useRef(new Animated.Value(START_TOP)).current;
    const lastPosition = useRef(START_TOP);

    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'All Tasks' | 'Ongoing' | 'Completed'>('All Tasks');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [checkedStates, setCheckedStates] = useState<boolean[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        slideAnim.setValue(START_TOP);
    }, []);

    // Fetch tasks on open + when project changes
    useEffect(() => {
        const loadTasks = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    Alert.alert('Ralat', 'Token pengguna tidak dijumpai.');
                    return;
                }
                const result = await getTasksByProjectPublic(token, route.params.projectId);
                setTasks(result);
                setCheckedStates(result.map(() => false));
            } catch (error: any) {
                console.error('Task fetch error:', error);
                Alert.alert('Error', error?.message || 'Gagal memuatkan senarai tugas.');
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, [route.params.projectId]);

    // Filtered tasks by selectedFilter
    const filteredTasks = tasks.filter(t => {
        if (selectedFilter === 'All Tasks') return true;
        if (selectedFilter === 'Ongoing') return t.status !== 'completed';
        if (selectedFilter === 'Completed') return t.status === 'completed';
        return true;
    });

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_: any, gesture: any) => {
                let newY = lastPosition.current + gesture.dy;
                newY = Math.max(0, Math.min(newY, START_TOP));
                slideAnim.setValue(newY);
            },
            onPanResponderRelease: (_: any, gesture: any) => {
                const threshold = 80;
                const toValue = gesture.dy < -threshold ? 0 : START_TOP;
                Animated.spring(slideAnim, {
                    toValue,
                    useNativeDriver: false,
                }).start(() => (lastPosition.current = toValue));
            }
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Top Info */}
            <View style={styles.topCard}>
                <View style={styles.cardLeft}>
                    <Text style={styles.title}>{route.params.projectTitle}</Text>
                    <Text style={styles.subtitle}>August postings</Text>
                    <Text style={styles.label}>Assigned to</Text>

                    <View style={styles.avatarGroup}>
                        {['#0066a2', '#000', '#00aaff'].map((bg, i) => (
                            <View key={i} style={[styles.avatar, { backgroundColor: bg }]} />
                        ))}
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="calendar-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>Jan 13, 2025</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="checkmark-circle" size={16} color="#4aa9ff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>{tasks.length} Tasks</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.progressRing}>
                    <View style={styles.circle}>
                        <Text style={styles.progressText}>50%</Text>
                    </View>
                </View>
            </View>

            {/* Task Drawer */}
            <Animated.View style={[styles.taskContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View {...panResponder.panHandlers} style={styles.handle}>
                    <Icon name="remove-outline" size={40} color="#999" />
                </View>

                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>Tasks</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterVisible(!filterVisible)}
                    >
                        <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                        <Icon
                            name={filterVisible ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={16} color="#999"
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
                                    <Text style={[
                                        styles.dropdownItemText,
                                        selectedFilter === option && styles.dropdownItemTextActive
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" />
                        <Text style={{ marginTop: 10, color: '#073B61' }}>Memuatkan tugasan…</Text>
                    </View>
                ) : filteredTasks.length === 0 ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <Icon name="checkmark-done-outline" size={36} color="#0072B5" />
                        <Text style={{ marginTop: 10, color: '#073B61' }}>Tiada tugasan untuk paparan ini.</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {filteredTasks.map((task, idx) => {
                            // cari index sebenar task dalam tasks[] untuk sync checkbox
                            const realIndex = tasks.findIndex(t => t.id === task.id);
                            const checked = checkedStates[realIndex] ?? false;

                            return (
                                <TouchableOpacity
                                    key={task.id}
                                    style={styles.taskCard}
                                    onPress={() =>
                                        navigation.push('TaskDetailsScreen', {
                                            taskId: task.id,
                                            taskTitle: task.title,
                                        } as any)
                                    }
                                >
                                    <LinearGradient
                                        colors={['#0d87c8', '#002b4f']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                        style={styles.taskCardInner}
                                    >
                                        <View style={styles.taskRow}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const updated = [...checkedStates];
                                                    if (realIndex >= 0) {
                                                        updated[realIndex] = !checked;
                                                        setCheckedStates(updated);
                                                    }
                                                }}
                                                style={[
                                                    styles.checkboxWrapper,
                                                    { backgroundColor: checked ? '#28a745' : '#ccc' },
                                                ]}
                                            >
                                                {checked && <Icon name="checkmark" size={16} color="#fff" />}
                                            </TouchableOpacity>

                                            <Text style={styles.taskTitle} numberOfLines={1}>
                                                {task.title || 'Untitled Task'}
                                            </Text>

                                            <View style={styles.avatarGroup}>
                                                <View style={[styles.avatar, { backgroundColor: '#0066a2' }]} />
                                                <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                                <View style={[styles.avatar, { backgroundColor: '#00aaff' }]} />
                                            </View>
                                            <Icon name="chevron-forward" size={20} color="#fff" />
                                        </View>

                                        <View style={styles.progressBar}>
                                            <View style={styles.progressFill} />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </Animated.View>

            {/* Bottom Navigation */}
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

export default ProjectTaskListScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#073B61' },

    // Top Card
    topCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    cardLeft: { flex: 1 },
    title: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#e1e1e1', marginTop: 2, marginBottom: 10 },
    label: { color: '#fff', fontWeight: '600', marginTop: 10, marginBottom: 6 },

    avatarGroup: { flexDirection: 'row', marginVertical: 6 },
    avatar: { width: 16, height: 16, borderRadius: 8, marginLeft: -4, borderWidth: 1, borderColor: '#fff' },

    metaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    metaText: { color: '#fff', fontSize: 13 },

    // Progress Ring
    progressRing: { justifyContent: 'center', alignItems: 'center' },
    circle: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 8,
        borderColor: '#004d7a', borderTopColor: '#4aa9ff',
        justifyContent: 'center', alignItems: 'center',
    },
    progressText: { fontWeight: 'bold', color: '#fff', fontSize: 16 },

    // Bottom Drawer
    taskContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, height,
        backgroundColor: '#e1e1e1',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 20, elevation: 10,
    },
    handle: { alignSelf: 'center', marginBottom: 10, width: '100%', alignItems: 'center' },

    taskHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#073B61' },
    filterButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
        paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    },
    filterButtonText: { color: '#999', fontSize: 14, marginRight: 6 },

    dropdownMenu: {
        position: 'absolute', top: 45, right: 20, backgroundColor: '#fff',
        borderRadius: 12, paddingVertical: 4, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
        elevation: 4, width: 160, zIndex: 10,
    },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'transparent' },
    dropdownItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    dropdownItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    dropdownItemActive: { backgroundColor: '#0072B5' },
    dropdownItemText: { fontSize: 14, color: '#0072B5' },
    dropdownItemTextActive: { color: '#fff' },

    // Task Cards
    taskCard: {
        backgroundColor: '#0C4E86',
        flexDirection: 'row',
        padding: 3,
        alignItems: 'center',
        marginBottom: 18,
        borderRadius: 20,
        overflow: 'hidden',
    },
    taskCardInner: { padding: 16, borderRadius: 20, width: '100%' },
    taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    checkboxWrapper: {
        width: 26, height: 26, borderRadius: 6, backgroundColor: '#ccc',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    taskTitle: { color: '#fff', fontSize: 16, flex: 1, marginLeft: 10, fontWeight: 'bold' },

    progressBar: { height: 6, borderRadius: 5, backgroundColor: '#ccc', marginTop: 14, overflow: 'hidden' },
    progressFill: { width: '70%', height: '100%', backgroundColor: '#4aa9ff' },

    // Bottom Navigation
    bottomNav: {
        position: 'absolute', bottom: 0, width, height: 70, backgroundColor: '#007baf',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10,
    },
    navItem: { alignItems: 'center', justifyContent: 'center' },
});
