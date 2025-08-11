import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Task } from '../services/taskService';

type Props = {
  task: Task;
  checked: boolean;
  onToggleCheck: () => void;
  onPress: () => void;
};

const statusStyles = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return { bg: '#18B968', text: '#fff' };
  if (s === 'in_progress') return { bg: '#7E8AA0', text: '#fff' };
  return { bg: '#FFB800', text: '#1F2D3D' }; // pending / default
};

const AdminTaskCard: React.FC<Props> = ({ task, checked, onToggleCheck, onPress }) => {
  const title = task.title || 'Untitled Task';
  // const clientName = task.client?.display_name || 'No Client';
  const clientName = task.client?.display_name;
  const projTitle = task.project?.title || 'No Project';
  const pill = statusStyles(task.status);

  return (
    <TouchableOpacity style={styles.cardWrap} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#0580C7', '#004A84']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* LEFT: centered checkbox */}
        <TouchableOpacity
          onPress={onToggleCheck}
          style={[
            styles.checkbox,
            { backgroundColor: checked ? '#28a745' : '#E3E8EF' },
          ]}
          activeOpacity={0.8}
        >
          {checked && <Icon name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>

        {/* MIDDLE: titles (vertically centered with checkbox) */}
        <View style={styles.middleCol}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{clientName}</Text>
          <Text style={styles.subDim} numberOfLines={1}>{projTitle}</Text>
        </View>

        {/* RIGHT: status pill + chevron */}
        <View style={styles.rightCol}>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.pillText, { color: pill.text }]}>
              {(task.status || '').replace('_', ' ').toUpperCase() || 'PENDING'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={22} color="#ffffff" style={{ marginTop: 10 }} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default AdminTaskCard;

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',            // <-- center everything vertically
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    alignSelf: 'center',             // <-- ensure the box itself is centered
  },

  middleCol: {
    flex: 1,
    justifyContent: 'center',        // <-- center titles vertically to checkbox
    paddingRight: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sub: {
    color: '#E6F2FF',
    fontSize: 13,
    marginTop: 2,
  },
  subDim: {
    color: '#BFD9F2',
    fontSize: 12,
    marginTop: 2,
  },

  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 110,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
