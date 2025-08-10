import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getProjects } from '../services/projectApi';

const { width } = Dimensions.get('window');

type Project = {
    id: number;
    title: string;
    subtitle?: string | null;
    client_name?: string | null;
    progress?: number;            // 0..100
    status?: 'Ongoing' | 'Completed' | 'Pending' | string;
    start_date?: string | null;   // optional
    due_date?: string | null;     // optional
    logo_url?: string | null;     // client/project logo (optional)
};

const tabs = ['All', 'Ongoing', 'Completed'] as const;
type Tab = (typeof tabs)[number];

const getProgressColor = (p: number) => {
    if (p >= 75) return '#28a745';
    if (p >= 40) return '#ffc107';
    return '#dc3545';
};

const AdminProjectListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const fetchData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const result = await getProjects(); // pastikan return array of Project
            setProjects(Array.isArray(result) ? result : []);
        } catch (err: any) {
            // console.log('getProjects error:', err?.message || err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // refresh bila screen focus (ringan, sebab API dipanggil sekali lagi)
            fetchData(true);
        }, [activeTab])
    );

    const filteredProjects =
        activeTab === 'All'
            ? projects
            : projects.filter(p => (p.status || '').toLowerCase() === activeTab.toLowerCase());

    const goToTasks = (p: Project) => {
        navigation.navigate('AdminProjectTaskListScreen', { project_title: p.title, project_id: p.id });
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ongoing':
                return { backgroundColor: '#17a2b8' }; // biru cyan
            case 'completed':
                return { backgroundColor: '#28a745' }; // hijau
            case 'pending':
                return { backgroundColor: '#ffc107' }; // kuning
            case 'rejected':
                return { backgroundColor: '#dc3545' }; // merah
            case 'active':
                return { backgroundColor: '#007bff' }; // biru
            case 'non-active':
                return { backgroundColor: '#6c757d' }; // kelabu
            default:
                return { backgroundColor: '#999' }; // kelabu default
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Projects</Text>
                <TouchableOpacity>
                    <Image source={require('../assets/search-icon.png')} style={styles.searchIcon} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchData(true);
                        }}
                    />
                }
            >
                {filteredProjects.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada projek dijumpai.</Text>
                ) : (
                    filteredProjects.map((item) => {
                        const progress = Math.max(0, Math.min(100, item.progress ?? 0));
                        const progressColor = getProgressColor(progress);

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.cardWrapper}
                                onPress={() => goToTasks(item)}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#0aa2ff', '#004e92']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.card}
                                >
                                    {/* status pill di tepi */}
                                    {item.status ? (
                                        <View style={[styles.statusPill, getStatusStyle(item.status)]}>
                                            <Text style={styles.statusPillText}>
                                                {item.status.replace(/_/g, ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    ) : null}

                                    {/* Header: avatar, title, client */}
                                    <View style={styles.row}>
                                        {item.logo_url ? (
                                            <Image source={{ uri: item.logo_url }} style={styles.avatarImage} />
                                        ) : (
                                            <View style={styles.avatarCircle}>
                                                <Text style={styles.avatarInitial}>
                                                    {(item.title ?? 'P').charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <Text style={styles.cardSubtitle} numberOfLines={1}>
                                                {item.client_name ?? '—'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date + Progress dalam satu row */}
                                    <View style={styles.dateProgressRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.dateIcon}>📅</Text>
                                            <Text style={styles.dateText}>
                                                {item.start_date || '—'}  →  {item.due_date || '—'}
                                            </Text>
                                        </View>

                                        <Text style={styles.progressLabel}>
                                            Progress: {Math.max(0, Math.min(100, item.progress ?? 0))}%
                                        </Text>
                                    </View>


                                    {/* Progress bar */}
                                    <View style={styles.progressOuter}>
                                        <View
                                            style={[
                                                styles.progressInner,
                                                { width: `${Math.max(0, Math.min(100, item.progress ?? 0))}%` },
                                            ]}
                                        />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                        );
                    })
                )}
            </ScrollView>

            {/* FAB dropdown */}
            {showOptions && (
                <View style={styles.dropdown}>
                    <TouchableOpacity style={styles.option} onPress={() => setShowOptions(false)}>
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.option} onPress={() => setShowOptions(false)}>
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Tab (sticky) */}
            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab} onPress={() => setShowOptions(prev => !prev)}>
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>

                <TouchableOpacity>
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AdminProjectListScreen;

const styles = StyleSheet.create({
    // LAYOUT
    container: { flex: 1, backgroundColor: '#eef4fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // HEADER
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    greeting: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
    searchIcon: { width: 22, height: 22, tintColor: '#fff' },

    // TABS
    tabs: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 6,
    },
    tabChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#e2e2e2',
        borderRadius: 20,
        marginHorizontal: 6,
    },
    tabChipActive: { backgroundColor: '#007bff' },
    tabText: { color: '#333', fontWeight: '500' },
    tabTextActive: { color: '#fff', fontWeight: '700' },

    // LIST
    listContent: { padding: 16, paddingBottom: 100 },
    emptyText: { textAlign: 'center', color: '#666', marginTop: 24 },

    // CARD
    cardWrapper: { marginBottom: 16 },
    card: {
        borderRadius: 24,
        padding: 16,
        width: width - 32,
        alignSelf: 'center',
        overflow: 'hidden', // penting utk rounded bar & pill
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    // ROWS
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

    // AVATAR
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#cfe1ff',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarInitial: { fontSize: 18, fontWeight: '700', color: '#0aa2ff' },

    // TEXTS
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    cardSubtitle: { color: '#cde1ff', fontSize: 13, marginTop: 2 },

    // DATE ROW
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 6 },
    dateIcon: { color: '#fff', marginRight: 8 },
    dateText: { color: '#eaf2ff', letterSpacing: 0.3 },

    // PROGRESS BAR (BERSIH – guna satu set je)
    progressOuter: {
        height: 10,
        backgroundColor: '#6fb1ff55', // biru muda (track)
        borderRadius: 8,
        overflow: 'hidden',            // supaya hujung rounded betul
        marginTop: 6,
    },
    progressInner: {
        height: 10,
        backgroundColor: '#FFC107',    // kuning (fill)
        borderRadius: 8,
    },

    // BOTTOM TAB + FAB
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

    // DROPDOWN (FAB menu)
    dropdown: {
        position: 'absolute',
        bottom: 100,
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
    option: { paddingVertical: 12, paddingHorizontal: 20 },
    optionText: { fontSize: 14, fontWeight: '600', color: '#0072B5' },

    // TAMBAH ini
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // label di sebelah kanan
        marginTop: 4,
        marginBottom: 4,            // jarak kecil dari bar
    },

    // UBAH kalau perlu (biar konsisten)
    progressLabel: { color: '#eaf6ff', fontWeight: '700', fontSize: 13, marginLeft: 8 },
    // PROGRESS LABEL (kanan)
    dateProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 6,
    },

    statusPill: {
        position: 'absolute',
        right: 12,
        top: 18,
        borderRadius: 14,          // kecil radius
        paddingHorizontal: 8,      // kecil padding kiri kanan
        paddingVertical: 3,        // kecil padding atas bawah
        alignSelf: 'flex-end',
        backgroundColor: '#ffffff2a',
    },
    statusPillText: {
        color: '#fff',
        fontWeight: '600',         // tak terlalu bold
        letterSpacing: 0.3,
        fontSize: 10,
    },
});
