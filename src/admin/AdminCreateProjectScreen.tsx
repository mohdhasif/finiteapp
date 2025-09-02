import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createProject } from '../services/projectService';
import { getClientsOptions } from '../services/adminService';
import SelectionModal from '../component/SelectionModal';
import { performanceMonitor } from '../utils/performance';

const BLUE = '#0B7EBE';
const BG = '#EFEFEF';
const TEXT = '#1A2A35';
const SUB = '#6B7C8F';
const BORDER = '#E1E6EC';

const PRIORITIES = [
  { label: 'High', value: 'high' as const },
  { label: 'Medium', value: 'medium' as const },
  { label: 'Low', value: 'low' as const },
];

const STATUSES = [
  { label: 'Pending', value: 'pending' as const },
  { label: 'In Progress', value: 'in_progress' as const },
  { label: 'Completed', value: 'completed' as const },
];

const CreateProjectScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [progress, setProgress] = useState<string>('0');

  // Client selection
  const [clients, setClients] = useState<Array<{ label: string; value: number }>>([]);
  const [selectedClient, setSelectedClient] = useState<{ label: string; value: number } | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // Date/time states
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD HH:MM:SS
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD HH:MM:SS

  // Modal states
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Date/time pickers
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [tmpStartDate, setTmpStartDate] = useState<Date | null>(null);

  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [tmpEndDate, setTmpEndDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);

  // helpers
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toMySQLDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMySQLDateTime = (d: Date) =>
    `${toMySQLDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  // Load clients from API
  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      performanceMonitor.startTimer('loadClients');
      const token = await AsyncStorage.getItem('userToken');
      const options = await getClientsOptions(token ?? undefined, {
        statusIn: ['approved', 'active'],
        sort: 'label',
      });
      setClients(options.map(o => ({ label: o.label, value: o.value })));
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
      performanceMonitor.endTimer('loadClients');
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

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
    setStartDate(toMySQLDateTime(final));
    setShowStartTime(false);
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
    setEndDate(toMySQLDateTime(final));
    setShowEndTime(false);
  };

  const canSubmit = useMemo(() => {
    return projectName.trim().length > 0 && selectedClient && startDate && endDate;
  }, [projectName, selectedClient, startDate, endDate]);

  const onSubmit = async () => {
    if (!canSubmit || !selectedClient) {
              Alert.alert('Warning', 'Please fill in Project Name, select Client, and set Start/End date');
      return;
    }

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        Alert.alert('Error', 'End time must be after Start time');
        return;
      }
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
              if (!token) throw new Error('No token found. Please log in again.');

      const payload = {
        title: projectName.trim(),
        client_id: selectedClient.value,
        description: description || null,
        priority: priority ?? null,
        start_at: startDate,
        end_at: endDate,
        status,
        progress: Math.max(0, Math.min(100, parseInt(progress || '0', 10) || 0)),
      };

      await createProject(token, payload);
              Alert.alert('Success', 'Project has been created', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Items for Client modal
  const clientItems = useMemo(
    () =>
      clients.map(c => ({
        label: c.label,
        value: c.value,
      })),
    [clients]
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Create Project</Text>

          {/* Project Name */}
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter project name"
            placeholderTextColor={SUB}
            value={projectName}
            onChangeText={setProjectName}
          />

          {/* Client */}
          <Text style={styles.label}>Client</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowClientPicker(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.selectText}>
              {selectedClient ? selectedClient.label : 'Select client'}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Project description..."
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

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowPriorityPicker(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.selectText}>
              {priority ? PRIORITIES.find(p => p.value === priority)?.label : 'Select priority'}
            </Text>
          </TouchableOpacity>

          {/* Progress */}
          {/* <Text style={styles.label}>Progress</Text>
          <TextInput
            style={styles.input}
            placeholder="0 - 100"
            placeholderTextColor={SUB}
            value={progress}
            onChangeText={(t) => setProgress(t.replace(/[^\d]/g, '').slice(0, 3))}
            keyboardType="number-pad"
            maxLength={3}
          /> */}

          {/* Start Date/Time */}
          <Text style={styles.label}>Start Date/Time</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowStartDate(true)}>
            <Text style={styles.selectText}>{startDate || 'Select start date & time'}</Text>
          </TouchableOpacity>

          {/* End Date/Time */}
          <Text style={styles.label}>End Date/Time</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowEndDate(true)}>
            <Text style={styles.selectText}>{endDate || 'Select end date & time'}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit || loading ? styles.btnDisabled : undefined]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.submitText}>{loading ? 'Saving...' : 'Create Project'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Client Modal */}
        <SelectionModal
          visible={showClientPicker}
          title="Select Client"
          items={clientItems}
          value={selectedClient?.value ?? null}
          onClose={() => setShowClientPicker(false)}
          onSelect={(it) => {
            const found = clients.find(c => c.value === it.value);
            if (found) setSelectedClient(found);
          }}
          showSearch
          placeholder="Search client"
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

        {/* Priority Modal */}
        <SelectionModal
          visible={showPriorityPicker}
          title="Select Priority"
          items={PRIORITIES}
          value={priority}
          onClose={() => setShowPriorityPicker(false)}
          onSelect={(it) => setPriority(it.value as any)}
          showSearch={false}
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

export default CreateProjectScreen;
