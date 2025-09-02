// src/screens/AdminCalendarScreen.tsx
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    BackHandler,
    ScrollView,
} from 'react-native';
import { CalendarList, AgendaEntry, DateData } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getProjectsCalendar,
    ProjectCalendarEvent,
    toYMD,
} from '../services/calendarService';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import OptimizedBottomTab from '../components/OptimizedBottomTab';
import { performanceMonitor } from '../utils/performance';

const BLUE = '#0B7EBE';
const BG = '#F4F7FB';
const TEXT = '#1A2A35';
const MUTED = '#6B7C8F';

type CalendarItem = AgendaEntry & {
    status?: string;
    subtitle?: string;
    meta?: {
        id?: number;
        start_at?: string | null;
        end_at?: string | null;
        client_display?: string | null;
    };
};

const AdminCalendarScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const agendaRef = useRef<any>(null);
    const isMountedRef = useRef(true);

    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);
    const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
    const [selectedDay, setSelectedDay] = useState<string>(toYMD(new Date()));

    const monthChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle back button press safely
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (navigation.canGoBack()) {
                navigation.goBack();
                return true;
            }
            return false;
        });

        return () => {
            backHandler.remove();
        };
    }, [navigation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchData = useCallback(async (centerDate?: string) => {
        if (!isMountedRef.current) return;
        
        try {
            performanceMonitor.startTimer('fetchCalendarData');
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const refDate = centerDate ? new Date(centerDate) : new Date();

            const start = new Date(refDate);
            start.setDate(start.getDate() - 30);
            const end = new Date(refDate);
            end.setDate(end.getDate() + 30);

            if (isMountedRef.current) {
                setLoading(true);
            }
            
            const data = await getProjectsCalendar(token, {
                start_date: toYMD(start),
                end_date: toYMD(end),
            });
            
            if (isMountedRef.current) {
                setEvents(data || []);
            }
        } catch (e: any) {
            console.log('[CAL][ERR]', e?.message || e);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                performanceMonitor.endTimer('fetchCalendarData');
            }
        }
    }, []);

    const buildAgendaItems = useCallback(
        (evts: ProjectCalendarEvent[]): Record<string, CalendarItem[]> => {
            if (!evts || !Array.isArray(evts)) return {};
            
            const map: Record<string, CalendarItem[]> = {};

            const clampToDates = (startISO?: string | null, endISO?: string | null) => {
                if (!startISO && !endISO) return [];
                
                try {
                    const start = startISO ? new Date(startISO.replace(' ', 'T')) : null;
                    const end = endISO ? new Date(endISO.replace(' ', 'T')) : null;

                    const s = start ? new Date(start) : end ? new Date(end) : new Date();
                    const e = end ? new Date(end) : new Date(s);

                    const d0 = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                    const d1 = new Date(e.getFullYear(), e.getMonth(), e.getDate());

                    const days: string[] = [];
                    let cur = new Date(d0);
                    while (cur <= d1) {
                        days.push(toYMD(cur));
                        cur.setDate(cur.getDate() + 1);
                    }
                    return days;
                } catch (error) {
                    console.log('[CAL] Date parsing error:', error);
                    return [];
                }
            };

            evts.forEach((evt) => {
                if (!evt) return;
                
                try {
                    const dayKeys = clampToDates(evt.start_at, evt.end_at);
                    dayKeys.forEach((key) => {
                        if (!map[key]) map[key] = [];
                        const subtitle = evt.client_display ? `• ${evt.client_display}` : '';
                        map[key].push({
                            name: evt.title || 'Untitled Project',
                            height: 64,
                            day: key,
                            status: (evt.status || '').toLowerCase(),
                            subtitle,
                            meta: {
                                id: evt.id,
                                start_at: evt.start_at,
                                end_at: evt.end_at,
                                client_display: evt.client_display,
                            },
                        });
                    });
                } catch (error) {
                    console.log('[CAL] Event processing error:', error);
                }
            });

            if (!map[selectedDay]) map[selectedDay] = [];
            return map;
        },
        [selectedDay],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (isMountedRef.current) {
            setItems(buildAgendaItems(events));
        }
    }, [events, buildAgendaItems]);

    const onRefresh = useCallback(async () => {
        if (!isMountedRef.current) return;
        
        setRefreshing(true);
        await fetchData(selectedDay);
        if (isMountedRef.current) {
            setRefreshing(false);
        }
    }, [fetchData, selectedDay]);

    const renderItem = useCallback((item: CalendarItem) => {
        if (!item) return null;
        
        try {
            const statusStyle = getStatusStyle(item.status);
            return (
                <TouchableOpacity style={styles.card} activeOpacity={0.85}>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {prettyStatus(item.status)}
                        </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.name || 'Untitled'}
                    </Text>
                    {!!item.subtitle && (
                        <Text style={styles.cardSub} numberOfLines={1}>
                            {item.subtitle}
                        </Text>
                    )}
                    <Text style={styles.cardMeta}>
                        {fmtDateTime(item.meta?.start_at)} → {fmtDateTime(item.meta?.end_at)}
                    </Text>
                </TouchableOpacity>
            );
        } catch (error) {
            console.log('[CAL] Render item error:', error);
            return null;
        }
    }, []);

    const renderEmptyDate = useCallback(() => (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No projects on this date.</Text>
        </View>
    ), []);

    const selectedDayEvents: CalendarItem[] = useMemo(() => {
        const list = items[selectedDay];
        return Array.isArray(list) ? list : [];
    }, [items, selectedDay]);

    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        try {
            Object.keys(items || {}).forEach((dateKey) => {
                const hasEvents = Array.isArray(items[dateKey]) && items[dateKey].length > 0;
                if (hasEvents) {
                    marks[dateKey] = { ...(marks[dateKey] || {}), marked: true, dotColor: BLUE };
                }
            });
            // always mark the selected day as selected
            marks[selectedDay] = { ...(marks[selectedDay] || {}), selected: true, selectedColor: BLUE };
        } catch (e) {
            // fallback: only selected day marked if anything goes wrong
            marks[selectedDay] = { selected: true, selectedColor: BLUE };
        }
        return marks;
    }, [items, selectedDay]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.h1}>Project Calendar</Text>
                <Text style={styles.h2}>View project start & end dates</Text>
                {loading && (
                    <View style={styles.headerLoaderWrap}>
                        <ActivityIndicator size="small" color={BLUE} />
                        <Text style={styles.headerLoaderText}>Loading…</Text>
                    </View>
                )}
            </View>

            <View style={{ flex: 1 }}>
                {/* Calendar always visible */}
                <CalendarList
                    pastScrollRange={12}
                    futureScrollRange={12}
                    onVisibleMonthsChange={(months: any) => {
                        const first = months?.[0]?.dateString;
                        if (!first) return;
                        // debounce fetch to avoid rapid mount/unmount thrashing
                        if (monthChangeTimeoutRef.current) clearTimeout(monthChangeTimeoutRef.current);
                        monthChangeTimeoutRef.current = setTimeout(() => {
                            fetchData(first);
                        }, 250);
                    }}
                    onDayPress={(day: DateData) => setSelectedDay(day.dateString)}
                    markedDates={markedDates}
                    theme={{
                        selectedDayBackgroundColor: BLUE,
                        todayTextColor: BLUE,
                        dotColor: BLUE,
                    }}
                    style={{ height: 300 }}
                    removeClippedSubviews={false}
                    scrollEnabled
                    showsVerticalScrollIndicator={false}
                />

                {/* Events list for selected day */}
                <Text style={styles.sectionTitle}>Events for {selectedDay}</Text>
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {selectedDayEvents.length === 0 ? (
                        renderEmptyDate()
                    ) : (
                        selectedDayEvents.map((evt, idx) => (
                            <View key={`${evt?.meta?.id ?? 'evt'}-${idx}`}>
                                {renderItem(evt)}
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

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
                        isActive: true,
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
                activeTab="calendar"
            />
        </View>
    );
};

const getStatusStyle = (status?: string) => {
    try {
        const s = (status || '').toLowerCase();
        if (s === 'completed') return { bg: '#18B968', text: '#fff' };
        if (s === 'in_progress' || s === 'ongoing') return { bg: '#7E8AA0', text: '#fff' };
        if (s === 'pending') return { bg: '#FFB800', text: '#1F2D3D' };
        return { bg: '#D0D5DD', text: '#1A2A35' };
    } catch (error) {
        console.log('[CAL] Status style error:', error);
        return { bg: '#D0D5DD', text: '#1A2A35' };
    }
};

const prettyStatus = (s?: string) => {
    try {
        const v = (s || '').toLowerCase();
        if (v === 'in_progress') return 'In Progress';
        return v ? v[0].toUpperCase() + v.slice(1) : 'Unknown';
    } catch (error) {
        console.log('[CAL] Pretty status error:', error);
        return 'Unknown';
    }
};

const fmtDateTime = (iso?: string | null) => {
    try {
        if (!iso) return '-';
        const d = new Date(iso.replace(' ', 'T'));
        if (isNaN(d.getTime())) return iso;
        const DD = String(d.getDate()).padStart(2, '0');
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const YYYY = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${DD}/${MM}/${YYYY} ${hh}:${mm}`;
    } catch (error) {
        console.log('[CAL] Date formatting error:', error);
        return iso || '-';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: BG,
    },
    h1: { fontSize: 22, fontWeight: '700', color: TEXT },
    h2: { fontSize: 13, color: MUTED, marginTop: 4 },
    headerLoaderWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    headerLoaderText: { marginLeft: 8, color: MUTED, fontSize: 12 },
 
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 8, color: MUTED },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginRight: 10,
        marginTop: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    statusPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 8,
    },
    statusText: { fontSize: 11, fontWeight: '600' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
    cardSub: { marginTop: 4, fontSize: 12, color: MUTED },
    cardMeta: { marginTop: 6, fontSize: 12, color: MUTED },

    emptyWrap: {
        backgroundColor: 'transparent',
        padding: 16,
        marginTop: 8,
    },
    emptyText: { color: MUTED, fontSize: 13 },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: TEXT,
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    noEventsWrap: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG,
        borderRadius: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    noEventsText: {
        fontSize: 16,
        fontWeight: '600',
        color: MUTED,
        textAlign: 'center',
    },
    noEventsSubtext: {
        fontSize: 13,
        color: MUTED,
        textAlign: 'center',
        marginTop: 4,
    },

});

export default AdminCalendarScreen;
