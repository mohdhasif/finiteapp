// src/screens/AdminNotificationsScreen.tsx
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getNotifications,
    getBadgeCount,
    markAsRead,
    markAllAsRead,
    type NotificationItem,
} from '../services/notificationService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import OptimizedBottomTab from '../components/OptimizedBottomTab';
import { performanceMonitor } from '../utils/performance';

const BLUE = '#0B7EBE';
const SUB = '#6B7C8F';

const timeAgo = (iso?: string | null) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} minutes ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ago`;
    const d = Math.floor(h / 24);
    return `${d} days ago`;
};

const NotificationRow: React.FC<{
    item: NotificationItem;
    onPress: () => void;
}> = React.memo(({ item, onPress }) => {
    const unread = !item.read_at;
    const timeAgoText = useMemo(() => timeAgo(item.created_at), [item.created_at]);
    
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.avatar}>
                <Icon name="person" size={20} color="#1F2D3D" />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={[styles.title, unread && { color: BLUE }]} numberOfLines={2}>
                    {item.title || 'Notification'}
                </Text>
                {!!item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
                {!!item.created_at && <Text style={styles.time}>{timeAgoText}</Text>}
            </View>

            {unread && <View style={styles.dot} />}
        </TouchableOpacity>
    );
});

const AdminNotificationsScreen: React.FC = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    const [list, setList] = useState<NotificationItem[]>([]);
    const [loadingFirst, setLoadingFirst] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [badge, setBadge] = useState(0);

    // ✅ paging 0-based
    const [page, setPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [noData, setNoData] = useState(false);
    const perPage = 20;

    const tokenRef = useRef<string>('');
    const inFlightRef = useRef(false);
    const lastLoadTsRef = useRef(0);

    useEffect(() => {
        (async () => {
            tokenRef.current = (await AsyncStorage.getItem('userToken')) || '';
            await refresh();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto refresh every time screen is focused
    useFocusEffect(
        useCallback(() => {
            refresh();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );

    const loadPage = useCallback(
        async (p: number) => {
            try {
                performanceMonitor.startTimer('loadNotifications');
                const resp = await getNotifications(tokenRef.current, {
                    page: p,
                    per_page: perPage,
                    status: 'all',
                });

                const data = Array.isArray(resp?.data) ? resp.data : [];
                const total: number | null = typeof resp?.total === 'number' ? resp.total : null;

                if (p === 0) {
                    setList(data);
                    setNoData((total ?? data.length) === 0);
                } else {
                    setList(prev => [...prev, ...data]);
                }

                if (total != null) {
                    const loaded = (p + 1) * perPage;
                    setHasMore(loaded < total);
                } else {
                    setHasMore(data.length === perPage);
                }

                return true;
            } catch (e: any) {
                setHasMore(false);
                return false;
            } finally {
                performanceMonitor.endTimer('loadNotifications');
            }
        },
        [perPage]
    );

    const refresh = useCallback(async () => {
        try {
            setRefreshing(true);
            // Get badge first (doesn't depend on paging)
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const badgeCount = await getBadgeCount(token);
                setBadge(badgeCount);
            }

            setPage(0);
            await loadPage(0);
        } finally {
            setRefreshing(false);
            setLoadingFirst(false);
        }
    }, [loadPage]);

    const loadMore = useCallback(async () => {
        if (inFlightRef.current || loadingMore || !hasMore || noData) return;
        inFlightRef.current = true;
        setLoadingMore(true);
        const next = page + 1;
        try {
            const ok = await loadPage(next);
            if (ok) setPage(next);
        } finally {
            setLoadingMore(false);
            inFlightRef.current = false;
        }
    }, [hasMore, loadPage, loadingMore, noData, page]);

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
        const pad = 120;
        const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - pad;
        const now = Date.now();
        if (nearBottom && now - lastLoadTsRef.current > 800) {
            lastLoadTsRef.current = now;
            loadMore().catch(() => { });
        }
    }, [loadMore]);

    const onPressItem = useCallback(async (it: NotificationItem) => {
        if (!it.read_at) {
            await markAsRead(tokenRef.current, it.id);
            setList(prev =>
                prev.map(x => (x.id === it.id ? { ...x, read_at: new Date().toISOString() } : x)),
            );
            setBadge(b => Math.max(0, b - 1));
        }
        // TODO: navigate ikut it.type / it.data jika perlu
    }, []);

    const onMarkAll = useCallback(async () => {
        await markAllAsRead(tokenRef.current);
        setList(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
        setBadge(0);
    }, []);

    return (
        <View style={styles.container}>



            <View style={styles.header}>
                <Text style={styles.h1}>Notifications</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={onMarkAll} style={[styles.markAllBtn, { marginRight: 12 }]}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                    <View style={styles.badgeWrap}>
                        <Icon name="notifications-outline" size={24} color={BLUE} />
                        {!!badge && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {loadingFirst ? (
                <ActivityIndicator style={{ marginTop: 40 }} />
            ) : noData ? (
                <View style={styles.empty}>
                    <Icon name="notifications-off-outline" size={48} color={SUB} />
                    <Text style={styles.emptyText}>No notifications</Text>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
                    contentContainerStyle={{ paddingBottom: 24 }}
                >
                    {list.map((item, idx) => (
                        <View key={`${item.id ?? 'idx'}-${idx}`}>
                            <NotificationRow item={item} onPress={() => onPressItem(item)} />
                            <View style={styles.sep} />
                        </View>
                    ))}

                    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                        {loadingMore ? (
                            <ActivityIndicator />
                        ) : hasMore ? (
                            <TouchableOpacity onPress={() => loadMore()} style={styles.loadMoreBtn}>
                                <Text style={styles.loadMoreText}>Load more</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.endText}>No more notifications</Text>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* Optimized Bottom Tab */}
            <OptimizedBottomTab
                tabs={[
                    {
                        id: 'home',
                        icon: 'home',
                        screen: 'AdminHomeScreen' as keyof RootStackParamList,
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
                        isActive: true,
                    },
                    {
                        id: 'profile',
                        icon: 'person',
                        screen: 'AdminProfileScreen' as keyof RootStackParamList,
                    },
                ]}
                quickActions={[
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
                ]}
                activeTab="notifications"
            />
        </View>
    );
};

export default AdminNotificationsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF3F7', paddingHorizontal: 20, paddingTop: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    h1: { fontSize: 32, fontWeight: '800', color: BLUE },
    headerRight: { flexDirection: 'row', alignItems: 'center' }, // remove 'gap' for compatibility
    markAllBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#D9ECF8' },
    markAllText: { color: BLUE, fontWeight: '600' },

    badgeWrap: { marginLeft: 6 },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ff3b30',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#BFD8E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    title: { fontSize: 16, fontWeight: '700', color: '#1F2D3D' },
    body: { fontSize: 14, color: '#1F2D3D', opacity: 0.8, marginTop: 2 },
    time: { fontSize: 13, color: SUB, marginTop: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE, marginLeft: 10 },
    sep: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },

    loadMoreBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#D9ECF8' },
    loadMoreText: { color: BLUE, fontWeight: '600' },
    endText: { color: SUB },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: SUB, marginTop: 8, fontSize: 16 },


});
