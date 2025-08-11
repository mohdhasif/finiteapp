import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Circle } from 'react-native-svg';

export type ProjectCardScreenProps = {
    id: number;
    title: string;
    subtitle?: string | null;       // e.g. "August postings"
    client_name?: string | null;
    progress?: number;              // 0..100
    status?: string;                // Ongoing | Completed | Pending | etc.
    start_date?: string | null;
    due_date?: string | null;
    logo_url?: string | null;
    total_tasks?: number | null;    // optional: show "24 Tasks"
    assignees?: Array<{ id: number | string; avatar_url?: string | null }>;
    onPress?: () => void;
};

const RING_SIZE = 96;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const getStatusStyle = (status?: string) => {
    switch ((status || '').toLowerCase()) {
        case 'ongoing': return { backgroundColor: '#17a2b8' };
        case 'completed': return { backgroundColor: '#28a745' };
        case 'pending': return { backgroundColor: '#ffc107' };
        case 'rejected': return { backgroundColor: '#dc3545' };
        case 'active': return { backgroundColor: '#007bff' };
        case 'non-active': return { backgroundColor: '#6c757d' };
        default: return { backgroundColor: '#999' };
    }
};

const getRingColor = (p: number) => {
    if (p >= 75) return '#1B7BBE';
    if (p >= 40) return '#FFC107';
    return '#DC3545';
};

const ProjectCardScreen: React.FC<ProjectCardScreenProps> = ({
    title,
    subtitle,
    client_name,
    progress = 0,
    status,
    start_date,
    due_date,
    logo_url,
    total_tasks,
    assignees = [],
    onPress,
}) => {
    const pct = Math.max(0, Math.min(100, progress));
    const dash = CIRC * (1 - pct / 100);

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrap}>
            <LinearGradient
                colors={['#e9eef5', '#e7eef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {/* status pill */}
                {!!status && (
                    <View style={[styles.statusPill, getStatusStyle(status)]}>
                        <Text style={styles.statusText}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                )}

                {/* left text content */}
                {/* left text content */}
                <View style={styles.left}>
                    <Text numberOfLines={1} style={styles.title}>{title}</Text>
                    {!!subtitle && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}

                    {!!client_name && (
                        <Text numberOfLines={1} style={styles.clientName}>{client_name}</Text>
                    )}

                    <Text style={styles.assignedLabel}>Assigned to</Text>
                    <View style={styles.assigneesRow}>
                        {assignees.slice(0, 3).map((a, i) =>
                            a.avatar_url ? (
                                <Image key={String(a.id)} source={{ uri: a.avatar_url }} style={[styles.avatar, { left: i * 18 }]} />
                            ) : (
                                <View key={String(a.id)} style={[styles.avatar, styles.avatarFallback, { left: i * 18 }]} />
                            )
                        )}
                        <View style={[styles.avatar, styles.plus, { left: Math.min(assignees.length, 3) * 18 }]}>
                            <Text style={styles.plusText}>+</Text>
                        </View>
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.bottomItem}>
                            <Text style={styles.bottomIcon}>📅</Text>
                            <Text style={styles.bottomText}>{due_date || start_date || '—'}</Text>
                        </View>

                        <View style={styles.bottomItem}>
                            <View style={styles.tick} />
                            <Text style={styles.bottomText}>
                                {typeof total_tasks === 'number' ? `${total_tasks} Tasks` : 'Tasks'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* right donut */}
                <View style={styles.right}>
                    <View style={styles.donutWrap}>
                        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                            <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
                                {/* track */}
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke="#ECEFF4"
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
                            <Text style={styles.percent}>{pct}%</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

export default ProjectCardScreen;

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    card: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: '#eef4fa',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    statusPill: {
        position: 'absolute',
        right: 12,
        top: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

    left: { flex: 1, paddingRight: 12 },
    title: { color: '#0b4a6f', fontSize: 20, fontWeight: '800' },
    subtitle: { color: '#5f7488', fontSize: 14, marginTop: 2 },

    assignedLabel: { marginTop: 14, color: '#17212b', fontSize: 14, fontWeight: '700' },
    assigneesRow: { height: 36, marginTop: 8, marginBottom: 6 },
    avatar: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0aa2ff',
        borderWidth: 2,
        borderColor: '#e6eef7',
    },
    avatarFallback: { backgroundColor: '#1f6ea5' },
    plus: { backgroundColor: '#2b8cc4', justifyContent: 'center', alignItems: 'center' },
    plusText: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: -1 },

    bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14 },
    bottomItem: { flexDirection: 'row', alignItems: 'center' },
    bottomIcon: { fontSize: 14, marginRight: 6 },
    tick: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#1B7BBE', marginRight: 6 },
    bottomText: { color: '#1b2a38', fontWeight: '600' },

    right: { justifyContent: 'center', alignItems: 'center' },
    donutWrap: { width: RING_SIZE, height: RING_SIZE, position: 'relative' },
    centerLabel: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
    },
    percent: { fontSize: 20, fontWeight: '800', color: '#0b0b0b' },

    clientName: {
        color: '#2f3a42',
        fontSize: 14,
        marginTop: 2,
        fontWeight: '500'
    },

});
