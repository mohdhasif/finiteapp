import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Task } from '../services/taskService';
import { deleteTask } from '../services/taskService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  task: Task;
  onPress: () => void;
  onDelete?: (taskId: number) => void;
  onUpdate?: (taskId: number) => void;
  onToggle?: () => void;
};

const SWIPE_THRESHOLD = 80;

const statusStyles = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return { bg: '#18B968', text: '#fff' };
  if (s === 'in_progress') return { bg: '#7E8AA0', text: '#fff' };
  return { bg: '#FFB800', text: '#1F2D3D' }; // pending / default
};

const SwipeableTaskCard: React.FC<Props> = ({ task, onPress, onDelete, onUpdate, onToggle }) => {
  const id = task.id ?? 0;
  const pill = statusStyles(task.status);

  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;

      // swipe left = update, swipe right = delete
      if (translationX > SWIPE_THRESHOLD && onDelete) {
        Animated.spring(translateX, { toValue: SWIPE_THRESHOLD, useNativeDriver: true }).start();
        setIsSwiped(true);
      } else if (translationX < -SWIPE_THRESHOLD && onUpdate) {
        Animated.spring(translateX, { toValue: -SWIPE_THRESHOLD, useNativeDriver: true }).start();
        setIsSwiped(true);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setIsSwiped(false);
      }
    }
  };

  const reset = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setIsSwiped(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', `Delete "${task.title || 'Task'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const token = (await AsyncStorage.getItem('userToken')) || '';
          if (!token) throw new Error('Missing token');
          await deleteTask(token, id);
          if (onDelete) onDelete(id);
        } catch (e: any) {
          Alert.alert('Failed', e?.message || 'Failed to delete task');
        } finally {
          reset();
        }
      } },
    ]);
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(id);
    }
    reset();
  };

  return (
    <View style={styles.wrapOuter}>
      {/* Left action (Update) */}
      {onUpdate && (
        <View style={styles.leftAction}>
          <TouchableOpacity style={[styles.actionBtn, styles.updateBtn]} onPress={handleUpdate} activeOpacity={0.9}>
            <Icon name="create-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Right action (Delete) */}
      {onDelete && (
        <View style={styles.rightAction}>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete} activeOpacity={0.9}>
            <Icon name="trash-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity style={styles.cardWrap} onPress={onPress} activeOpacity={0.9} onLongPress={reset}>
            <LinearGradient colors={['#0580C7', '#004A84']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              {/* LEFT: centered status checkbox lookalike (no toggle here) */}
              <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.8}
                style={[styles.checkbox, { backgroundColor: (task.status || '').toLowerCase() === 'completed' ? '#28a745' : '#E3E8EF' }]}
              >
                {(task.status || '').toLowerCase() === 'completed' && <Icon name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>

              {/* MIDDLE: titles */}
              <View style={styles.middleCol}>
                <Text style={styles.title} numberOfLines={1}>{task.title || 'Untitled Task'}</Text>
                <Text style={styles.sub} numberOfLines={1}>{task.client?.display_name}</Text>
                <Text style={styles.subDim} numberOfLines={1}>{task.project?.title || 'No Project'}</Text>
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
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.hintRow}>
        <Text style={styles.hintText}>Swipe left to edit, right to delete</Text>
      </View>
    </View>
  );
};

export default SwipeableTaskCard;

const styles = StyleSheet.create({
  wrapOuter: { marginBottom: 18 },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  middleCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sub: { color: '#E6F2FF', fontSize: 13, marginTop: 2 },
  subDim: { color: '#BFD9F2', fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 110, alignItems: 'center' },
  pillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // actions behind card
  leftAction: { position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' },
  rightAction: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-end' },
  actionBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  updateBtn: { backgroundColor: '#0A84FF' },
  deleteBtn: { backgroundColor: '#DC3545' },
  actionText: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 2 },

  hintRow: { alignItems: 'center', marginTop: 6 },
  hintText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
});


