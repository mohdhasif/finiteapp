// src/screens/AddTaskScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SelectionModal from '../component/SelectionModal';
import { getProjectsOptions, type ProjectOption } from '../services/projectService';
import { createTask } from '../services/taskService';

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

const AddTaskScreen: React.FC<any> = ({ navigation }) => {
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

  // Load senarai projek utk dropdown
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken'); // kekalkan key ini
        if (!token) throw new Error('Tiada token. Sila log masuk semula.');

        const data = await getProjectsOptions(token);
        setProjects(data);
      } catch (e: any) {
        Alert.alert('Gagal', e.message || 'Gagal ambil senarai projek');
      }
    })();
  }, []);

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
    // Optional UX: auto-suggest end = start + 1 jam kalau end kosong
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
      Alert.alert('Peringatan', 'Sila isi Title dan pilih Project');
      return;
    }
    if (!startAt || !endAt) {
      Alert.alert('Maklumat tidak lengkap', 'Sila pilih tarikh mula dan tamat.');
      return;
    }

    if (startAt && endAt) {
      if (new Date(startAt) > new Date(endAt)) {
        Alert.alert('Ralat', 'End time mesti selepas Start time');
        return;
      }
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Tiada token. Sila log masuk semula.');

      await createTask(token, {
        title: title.trim(),
        description: description.trim(),
        status,
        due_date: dueDate,   // optional
        start_at: startAt,   // optional
        end_at: endAt,       // optional
        project_id: selectedProject.id,
      });

      Alert.alert('Berjaya', 'Task telah ditambah', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ralat', e.message || 'Gagal menambah task');
    } finally {
      setLoading(false);
    }
  };

  // Item untuk modal Project
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
          <Text style={styles.header}>Add Task</Text>

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
                : 'Pilih project'}
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Setup CI/CD"
            placeholderTextColor={SUB}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Butiran tugas..."
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
            <Text style={styles.selectText}>{dueDate || 'Pilih tarikh (jika ada)'}</Text>
          </TouchableOpacity> */}

          {/* Start / End */}
          <Text style={styles.label}>Start (optional)</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowStartDate(true)}>
            <Text style={styles.selectText}>{startAt || 'Pilih tarikh & masa mula'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>End (optional)</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowEndDate(true)}>
            <Text style={styles.selectText}>{endAt || 'Pilih tarikh & masa tamat'}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit || loading ? styles.btnDisabled : undefined]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.submitText}>{loading ? 'Menyimpan...' : 'Tambah Task'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Project Modal */}
        <SelectionModal
          visible={showProjectPicker}
          title="Pilih Project"
          items={projectItems}
          value={selectedProject?.id ?? null}
          onClose={() => setShowProjectPicker(false)}
          onSelect={(it) => {
            const found = projects.find(p => p.id === it.value);
            if (found) setSelectedProject(found);
          }}
          showSearch
          placeholder="Cari project atau client"
        />

        {/* Status Modal */}
        <SelectionModal
          visible={showStatusPicker}
          title="Pilih Status"
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
});
