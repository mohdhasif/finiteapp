// src/screens/AdminCalendarScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Agenda, AgendaEntry, DateData } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getProjectsCalendar,
    ProjectCalendarEvent,
    toYMD,
} from '../services/calendarService';

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
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);
    const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
    const [selectedDay, setSelectedDay] = useState<string>(toYMD(new Date()));

    const fetchData = useCallback(async (centerDate?: string) => {
        try {
            const token = (await AsyncStorage.getItem('userToken')) || '';
            const refDate = centerDate ? new Date(centerDate) : new Date();

            const start = new Date(refDate);
            start.setDate(start.getDate() - 30);
            const end = new Date(refDate);
            end.setDate(end.getDate() + 30);

            setLoading(true);
            const data = await getProjectsCalendar(token, {
                start_date: toYMD(start),
                end_date: toYMD(end),
            });
            setEvents(data);
        } catch (e: any) {
            console.log('[CAL][ERR]', e?.message || e);
        } finally {
            setLoading(false);
        }
    }, []);

    const buildAgendaItems = useCallback(
        (evts: ProjectCalendarEvent[]): Record<string, CalendarItem[]> => {
            const map: Record<string, CalendarItem[]> = {};

            const clampToDates = (startISO?: string | null, endISO?: string | null) => {
                if (!startISO && !endISO) return [];
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
            };

            evts.forEach((evt) => {
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
        setItems(buildAgendaItems(events));
    }, [events, buildAgendaItems]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData(selectedDay);
        setRefreshing(false);
    };

    const renderItem = (item: CalendarItem) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {prettyStatus(item.status)}
                    </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
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
    };

    const renderEmptyDate = () => (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Tiada projek pada tarikh ini.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.h1}>Project Calendar</Text>
                <Text style={styles.h2}>Lihat start & end date projek</Text>
            </View>

            {loading && events.length === 0 ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={BLUE} />
                    <Text style={styles.loadingText}>Memuatkan kalendar…</Text>
                </View>
            ) : (
                <Agenda
                    items={items}
                    selected={selectedDay}
                    onDayPress={(day: DateData) => {
                        setSelectedDay(day.dateString);
                    }}
                    onCalendarToggled={(_opened: boolean) => { }}
                    onVisibleMonthsChange={(months: DateData[]) => {
                        if (months?.[0]?.dateString) fetchData(months[0].dateString);
                    }}
                    renderItem={(item: CalendarItem) => renderItem(item)}
                    renderEmptyDate={renderEmptyDate}
                    refreshing={refreshing}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    theme={{
                        agendaTodayColor: BLUE,
                        dotColor: BLUE,
                        selectedDayBackgroundColor: BLUE,
                        todayTextColor: BLUE,
                    }}
                />
            )}
        </View>
    );
};

const getStatusStyle = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: '#18B968', text: '#fff' };
    if (s === 'in_progress' || s === 'ongoing') return { bg: '#7E8AA0', text: '#fff' };
    if (s === 'pending') return { bg: '#FFB800', text: '#1F2D3D' };
    return { bg: '#D0D5DD', text: '#1A2A35' };
};

const prettyStatus = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'in_progress') return 'In Progress';
    return v ? v[0].toUpperCase() + v.slice(1) : 'Unknown';
};

const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso.replace(' ', 'T'));
    if (isNaN(d.getTime())) return iso;
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${DD}/${MM}/${YYYY} ${hh}:${mm}`;
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
});

export default AdminCalendarScreen;
