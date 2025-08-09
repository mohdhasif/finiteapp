import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export type Task = {
    id: number;
    title?: string | null;
    name?: string | null;          // fallback
    status?: string | null;        // 'completed' | 'in_progress' | 'pending' | etc
    progress?: number | string | null; // 0..100
};

type Props = {
    task: Task;
    checked: boolean;
    onToggle: () => void;   // toggle checkbox
    onPress: () => void;    // open details
};

const TaskCard = memo(({ task, checked, onToggle, onPress }: Props) => {
    const title = task.title || task.name || 'Untitled Task';
    const progress = Math.max(0, Math.min(100, Number(task.progress ?? 0)));

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.taskCard}
        >
            <LinearGradient
                colors={['#0072B5', '#002B4F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.taskCardInner}
            >
                <View style={styles.rowWrapper}>
                    <View style={styles.row}>
                        {/* Checkbox (live) */}
                        <View style={styles.leftColumn}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation(); // jangan trigger onPress kad
                                    onToggle();
                                }}
                                style={[
                                    styles.checkboxWrapper,
                                    { backgroundColor: checked ? '#28a745' : '#ccc' },
                                ]}
                            >
                                {checked && <Icon name="checkmark" size={16} color="#fff" />}
                            </TouchableOpacity>
                        </View>

                        {/* Title + (placeholder) assignees + Progress */}
                        <View style={styles.rightColumn}>
                            <View style={styles.titleRow}>
                                <Text style={styles.taskTitle} numberOfLines={1}>
                                    {title}
                                </Text>

                                {/* avatars placeholder — bindkan ikut assignees kalau ada */}
                                <View style={styles.avatarGroup}>
                                    <View style={[styles.avatar, { backgroundColor: '#0066a2' }]} />
                                    <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                    <View style={[styles.avatar, { backgroundColor: '#00aaff' }]} />
                                </View>
                            </View>

                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                        </View>

                        <View style={styles.leftColumn}>
                            <Icon name="chevron-forward" size={16} color="#fff" />
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

export default TaskCard;

const styles = StyleSheet.create({
    taskCard: {
        marginBottom: 14,
        borderRadius: 16,
        overflow: 'hidden',
    },
    taskCardInner: {
        padding: 12,
        borderRadius: 16,
        height: 100,
    },
    rowWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: { flexDirection: 'row' },
    leftColumn: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxWrapper: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    taskTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    avatarGroup: { flexDirection: 'row' },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginLeft: -3,
        borderWidth: 1,
        borderColor: '#fff',
    },
    progressBar: {
        marginTop: 8,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        overflow: 'hidden',
        width: '70%',
    },
    progressFill: {
        width: '60%',
        height: '100%',
        backgroundColor: '#4aa9ff',
    },
});
