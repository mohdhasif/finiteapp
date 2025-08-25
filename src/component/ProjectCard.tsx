import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { ProjectSummary } from '../services/projectService';

type Props = { data: ProjectSummary; onPress?: () => void; width?: number };
const BG = '#0A6FA7', WHITE = '#fff', WHITE70 = 'rgba(255,255,255,0.7)', TRACK = 'rgba(255,255,255,0.35)';

const ProjectCard: React.FC<Props> = ({ data, onPress, width = 220 }) => {
  const total = data.total_tasks ?? 0;
  const completed = data.completed_tasks ?? 0;
  const percent = typeof data.progress_percent === 'number'
    ? Math.max(0, Math.min(100, data.progress_percent))
    : (total > 0 ? Math.round((completed / total) * 100) : 0);

  const due = data.due_date
    ? new Date(data.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : 'No due date';

  return (
    <TouchableOpacity style={[styles.card, { width }]} activeOpacity={0.9} onPress={onPress}>
      <Text style={styles.title} numberOfLines={2}>{data.project_title}</Text>
      <Text style={styles.client} numberOfLines={1}>{data.client_name}</Text>

      <View style={[styles.row, { marginTop: 10 }]}>
        <Ionicons name="calendar-clear-outline" size={16} color={WHITE} />
        <Text style={styles.rowText}>{due}</Text>
      </View>
      <View style={[styles.row, { marginTop: 6 }]}>
        <Ionicons name="checkmark-done-circle-outline" size={16} color={WHITE} />
        <Text style={styles.rowText}>{total} Tasks</Text>
      </View>

      {/* <View style={[styles.row, { marginTop: 12 }]}>
        <View style={[styles.dot, { backgroundColor: '#B0BEC5' }]} />
        <View style={[styles.dot, { backgroundColor: WHITE, marginLeft: -8 }]} />
        <View style={[styles.dot, { backgroundColor: '#03A9F4', marginLeft: -8 }]} />
        <Text style={styles.plus}>+</Text>
      </View> */}

      <Text style={styles.bigPercent}>{percent}%</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    overflow: 'hidden',
  },
  title: { color: WHITE, fontSize: 18, fontWeight: '800', lineHeight: 22 },
  client: { color: WHITE70, fontSize: 14, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { color: WHITE, fontSize: 14, marginLeft: 6 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BG },
  plus: { color: WHITE, fontSize: 18, marginLeft: 6, fontWeight: '600' },
  bigPercent: { position: 'absolute', right: 14, bottom: 34, color: WHITE, fontSize: 18, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: TRACK, marginTop: 10 },
  progressFill: { height: 8, borderRadius: 8, backgroundColor: WHITE },
});

export default ProjectCard;
