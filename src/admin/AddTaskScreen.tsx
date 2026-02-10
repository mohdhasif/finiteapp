// src/screens/AddTaskScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform, KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SelectionModal from '../component/SelectionModal';
import { getProjectsOptions, type ProjectOption } from '../services/projectService';
import { saveTask, getTaskForForm } from '../services/taskService';
import { performanceMonitor } from '../utils/performance';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { DeviceEventEmitter } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const BLUE = '#0B7EBE';
const BG = '#EFEFEF';
const TEXT = '#1A2A35';
const SUB = '#6B7C8F';
const BORDER = '#E1E6EC';

const STATUSES = [
  { label: 'Pending', value: 'pending' as const },
  { label: 'In Progress', value: 'in_progress' as const },
  { label: 'Completed', value: 'completed' as const },
];

// helpers
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toMySQLDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMySQLDateTime = (d: Date) =>
  `${toMySQLDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

type ScreenRoute = RouteProp<RootStackParamList, 'AddTaskScreen'>;
const AddTaskScreen: React.FC<any> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ScreenRoute>();
  
  const taskId = route.params?.task_id as number | undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  const [dueDate, setDueDate] = useState<string>('');      // YYYY-MM-DD
  const [startAt, setStartAt] = useState<string>('');      // YYYY-MM-DD HH:MM:SS
  const [endAt, setEndAt] = useState<string>('');          // YYYY-MM-DD HH:MM:SS

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // date/time pickers
  const [showDueDate, setShowDueDate] = useState(false);

  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [tmpStartDate, setTmpStartDate] = useState<Date | null>(null);

  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [tmpEndDate, setTmpEndDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [projectsReady, setProjectsReady] = useState(false);

  // Load project list for dropdown
  const loadProjects = useCallback(async () => {
    try {
      performanceMonitor.startTimer('loadProjects');
      const token = await AsyncStorage.getItem('userToken'); // keep this key
      if (!token) throw new Error('No token found. Please log in again.');

      const data = await getProjectsOptions(token);
      setProjects(data);
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Failed to get project list');
    } finally {
      performanceMonitor.endTimer('loadProjects');
      setProjectsReady(true);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Prefill form when editing (reusable)
  const prefillFromServer = useCallback(async () => {
    if (!taskId) { setInitializing(false); return; }
    try {
      setInitializing(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found. Please log in again.');
      const t = await getTaskForForm(token, taskId);
      if (t) {
        setTitle(String(t.title || ''));
        setDescription(String(t.description || ''));
        const st = (t.status || 'pending') as 'pending' | 'in_progress' | 'completed';
        setStatus(st);
        if (t.due_date) setDueDate(String(t.due_date));
        if (t.start_at) setStartAt(String(t.start_at));
        if (t.end_at) setEndAt(String(t.end_at));
        const pid = t.project_id;
        if (pid && Array.isArray(projects) && projects.length > 0) {
          const found = projects.find(p => p.id === pid);
          if (found) setSelectedProject(found);
          else setSelectedProject({ id: pid, title: `Project #${pid}` } as any);
        }
      }
    } catch (e) {
      // silent; form still editable
    } finally {
      setInitializing(false);
    }
  }, [taskId, projects]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      if (projectsReady) {
        prefillFromServer();
      }
      return () => {};
    }, [prefillFromServer, projectsReady])
  );

  // Re-run when projects first finish loading
  useEffect(() => {
    if (projectsReady) prefillFromServer();
  }, [projectsReady, prefillFromServer]);

  // handlers — due date
  const onPickDueDate = (date: Date) => {
    setDueDate(toMySQLDate(date));
    setShowDueDate(false);
  };

  // handlers — start_at (date -> time)
  const onPickStartDate = (date: Date) => {
    setTmpStartDate(date);
    setShowStartDate(false);
    setShowStartTime(true);
  };
  const onPickStartTime = (time: Date) => {
    const base = tmpStartDate || new Date();
    const final = new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      time.getHours(), time.getMinutes(), 0, 0
    );
    setStartAt(toMySQLDateTime(final));
    setShowStartTime(false);
    // Optional UX: auto-suggest end = start + 1 hour if end is empty
    if (!endAt) {
      const suggest = new Date(final.getTime() + 60 * 60 * 1000);
      setEndAt(toMySQLDateTime(suggest));
    }
  };

  // handlers — end_at (date -> time)
  const onPickEndDate = (date: Date) => {
    setTmpEndDate(date);
    setShowEndDate(false);
    setShowEndTime(true);
  };
  const onPickEndTime = (time: Date) => {
    const base = tmpEndDate || new Date();
    const final = new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      time.getHours(), time.getMinutes(), 0, 0
    );
    setEndAt(toMySQLDateTime(final));
    setShowEndTime(false);
  };

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && selectedProject;
  }, [title, selectedProject]);

  const onSubmit = async () => {
    if (!canSubmit || !selectedProject) {
      Alert.alert('Warning', 'Please fill in Title and select Project');
      return;
    }
    if (!startAt || !endAt) {
      Alert.alert('Incomplete information', 'Please select start and end dates.');
      return;
    }

    if (startAt && endAt) {
      if (new Date(startAt) > new Date(endAt)) {
        Alert.alert('Error', 'End time must be after Start time');
        return;
      }
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found. Please log in again.');
      await saveTask(token, taskId ? {
        task_id: taskId,
        title: title.trim(),
        description: description.trim(),
        status,
        due_date: dueDate || undefined,
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        project_id: selectedProject?.id,
      } : {
        title: title.trim(),
        description: description.trim(),
        status,
        due_date: dueDate || undefined,
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        project_id: selectedProject.id,
      });
      // Emit event so AdminHomeScreen can update immediately
      if (taskId) {
        DeviceEventEmitter.emit('TASK_SAVED', {
          id: taskId,
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate || undefined,
          start_at: startAt || undefined,
          end_at: endAt || undefined,
          project_id: selectedProject?.id,
          project: selectedProject ? { id: selectedProject.id, title: selectedProject.title } : undefined,
        });
      }
      Alert.alert('Success', taskId ? 'Task has been updated' : 'Task has been added', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  // Item for Project modal
  const projectItems = useMemo(
    () =>
      projects.map(p => ({
        label: p.title,
        value: p.id,
        subLabel: p.client_name || undefined,
      })),
    [projects]
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>{taskId ? 'Edit Task' : 'Add Task'}</Text>

          {/* Project */}
          <Text style={styles.label}>Project</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowProjectPicker(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.selectText}>
              {selectedProject
                ? `${selectedProject.title}${selectedProject.client_name ? ' — ' + selectedProject.client_name : ''}`
                : 'Select project'}
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Setup CI/CD"
            placeholderTextColor={SUB}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Task details..."
            placeholderTextColor={SUB}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Status */}
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.selectText}>
              {STATUSES.find(s => s.value === status)?.label}
            </Text>
          </TouchableOpacity>

          {/* Due Date */}
          {/* <Text style={styles.label}>Due Date (optional)</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowDueDate(true)}>
            <Text style={styles.selectText}>{dueDate || 'Select date (if any)'}</Text>
          </TouchableOpacity> */}

          {/* Start / End */}
          <Text style={styles.label}>Start (optional)</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowStartDate(true)}>
            <Text style={styles.selectText}>{startAt || 'Select date & time start'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>End (optional)</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowEndDate(true)}>
            <Text style={styles.selectText}>{endAt || 'Select date & time end'}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit || loading ? styles.btnDisabled : undefined]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.submitText}>{loading ? 'Saving...' : (taskId ? 'Save Changes' : 'Add Task')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Project Modal */}
        <SelectionModal
          visible={showProjectPicker}
          title="Select Project"
          items={projectItems}
          value={selectedProject?.id ?? null}
          onClose={() => setShowProjectPicker(false)}
          onSelect={(it) => {
            const found = projects.find(p => p.id === it.value);
            if (found) setSelectedProject(found);
          }}
          showSearch
          placeholder="Search projects or clients"
        />

        {/* Status Modal */}
        <SelectionModal
          visible={showStatusPicker}
          title="Select Status"
          items={STATUSES}
          value={status}
          onClose={() => setShowStatusPicker(false)}
          onSelect={(it) => setStatus(it.value as any)}
          showSearch={false}
        />

        {/* Pickers */}
        <DateTimePickerModal
          isVisible={showDueDate}
          mode="date"
          onConfirm={onPickDueDate}
          onCancel={() => setShowDueDate(false)}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />

        {/* Start: date -> time */}
        <DateTimePickerModal
          isVisible={showStartDate}
          mode="date"
          onConfirm={onPickStartDate}
          onCancel={() => setShowStartDate(false)}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />
        <DateTimePickerModal
          isVisible={showStartTime}
          mode="time"
          is24Hour
          onConfirm={onPickStartTime}
          onCancel={() => setShowStartTime(false)}
        />

        {/* End: date -> time */}
        <DateTimePickerModal
          isVisible={showEndDate}
          mode="date"
          onConfirm={onPickEndDate}
          onCancel={() => setShowEndDate(false)}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />
        <DateTimePickerModal
          isVisible={showEndTime}
          mode="time"
          is24Hour
          onConfirm={onPickEndTime}
          onCancel={() => setShowEndTime(false)}
        />
      </KeyboardAvoidingView>
      {initializing && (
        <View style={styles.initOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.initText}>Loading…</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AddTaskScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 16, paddingBottom: 32 },
  header: { fontSize: 22, fontWeight: '700', color: TEXT, marginBottom: 12 },
  label: { fontSize: 14, color: SUB, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, color: TEXT,
  },
  multiline: { height: 110, textAlignVertical: 'top' },
  select: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 14,
  },
  selectText: { color: TEXT, fontSize: 16 },
  submitBtn: {
    marginTop: 22, backgroundColor: BLUE, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  initOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center'
  },
  initText: { marginTop: 8, color: SUB },
});
