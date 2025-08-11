import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
    Dimensions, SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchClients, fetchFreelancers } from '../services/adminService';
import AdminTaskCard from '../component/AdminTaskCard';
import { getAllTasks, type Task } from '../services/taskService';

import ProjectCard from '../component/ProjectCard';
import { getProjectSummaries, type ProjectSummary } from '../services/projectService';

const { width } = Dimensions.get('window');
const CARD = Math.round(width * 0.62); // nampak >1 kad
const GAP = 12;
const SIDE = 20;

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

    // UI states
    const [showDropdown, setShowDropdown] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    type FilterValue = 'All' | 'Pending' | 'in_progress' | 'completed';
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('All');

    // Data states
    const [clients, setClients] = useState<Client[]>([]);
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projError, setProjError] = useState<string | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [checkedStates, setCheckedStates] = useState<boolean[]>([]);

    // Utils
    const formatDate = (d?: string | null) =>
        !d ? 'No due date' :
            new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Load clients + freelancers
    useEffect(() => {
        let alive = true;
        (async () => {

            const token = (await AsyncStorage.getItem('userToken'))?.trim();
            if (!token) throw new Error('No userToken');

            const [clientData, freelancerData] = await Promise.all([
                fetchClients(token),
                fetchFreelancers(token),
            ]);
            if (!alive) return;
            setClients(clientData);
            setFreelancers(freelancerData);
        })();
        return () => { alive = false; };
    }, []);

    // Filter mapping for tasks
    const resolveStatus = (f: FilterValue): 'pending' | 'in_progress' | 'completed' | undefined => {
        if (f === 'All') return undefined;
        if (f === 'Pending') return 'pending';
        return f; // 'in_progress' | 'completed'
    };

    // Load tasks when filter changes
    const loadTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const status = resolveStatus(selectedFilter);
            const data = await getAllTasks(token, status ? { status } : {});

            setTasks(data);
            setCheckedStates(Array(data.length).fill(false));
        } catch {
            setTasks([]);
            setCheckedStates([]);
        } finally {
            setLoadingTasks(false);
        }
    }, [selectedFilter]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    // Load projects (once)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingProjects(true);
                setProjError(null);
                const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
                if (!token) throw new Error('No userToken');
                const data = await getProjectSummaries(token);
                if (!alive) return;
                setProjects(Array.isArray(data) ? data : []);
            } catch (e: any) {
                if (!alive) return;
                setProjError(e?.message || 'Failed to load projects');
                setProjects([]);
            } finally {
                if (alive) setLoadingProjects(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Quick Add dropdown */}
            {showDropdown && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AdminCreateProjectScreen'); }}>
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AdminCreateProjectScreen'); }}>
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
                        {clients.map(c => (
                            <View key={c.client_id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={typeof c.logo_url === 'string' && c.logo_url.startsWith('http')
                                            ? { uri: c.logo_url }
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
                        {freelancers.map(f => (
                            <View key={f.id} style={styles.clientCard}>
                                <View style={styles.clientCircle}>
                                    <Image
                                        source={typeof f.avatar === 'string' && f.avatar.startsWith('http')
                                            ? { uri: f.avatar }
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
                    ) : projects.length === 0 ? (
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
                            {projects.map(p => (
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
                                    <Text style={{ marginTop: 6, color: '#607D8B' }}>
                                        📅 {formatDate(p.due_date)}   •   ✅ {p.total_tasks} tasks
                                    </Text>
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

                    {tasks.map((t, idx) => {
                        const isCompleted = (t.status || '').toLowerCase() === 'completed';
                        return (
                            <AdminTaskCard
                                key={t.id ?? idx}
                                task={t}
                                checked={isCompleted ? true : !!checkedStates[idx]}
                                onToggleCheck={() => {
                                    if (isCompleted) return;
                                    const next = [...checkedStates];
                                    next[idx] = !next[idx];
                                    setCheckedStates(next);
                                }}
                                onPress={() =>
                                    navigation.push('AdminTaskDetailsScreen', {
                                        task_title: t.title ?? 'Task',
                                        task_id: t.id,
                                    })}
                            />
                        );
                    })}
                    {!loadingTasks && tasks.length === 0 && (
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
                <TouchableOpacity style={styles.fab} onPress={() => setShowDropdown(v => !v)}>
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
    safeArea: { flex: 1, backgroundColor: '#f0f4f7' },
    scrollContent: { paddingBottom: 100 },

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

    // Bottom tab
    bottomTab: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: '#0072B5', height: 60, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10,
    },
    fab: {
        backgroundColor: '#fff', width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center', marginTop: -40,
    },

    // Filter/dropdown (Tasks)
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#073B61' },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    filterButtonText: { color: '#999', fontSize: 14, marginRight: 6 },
    dropdownMenu: {
        position: 'absolute', top: 45, right: 20, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, width: 160, zIndex: 10,
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

    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'transparent' },
    dropdownItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    dropdownItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    dropdownItemActive: { backgroundColor: '#0072B5' },
    dropdownItemText: { fontSize: 14, color: '#0072B5' },
    dropdownItemTextActive: { color: '#fff' },
});
