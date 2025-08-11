import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProject } from '../services/projectService';
import { getClientsOptions } from '../services/adminService';

const BLUE = '#0B7EBE';
const BG = '#EFEFEF';
const TEXT = '#1A2A35';
const SUB = '#6B7C8F';

type PickerItem<T extends string | number = string> = { label: string; value: T };

const PRIORITIES: PickerItem<'low' | 'medium' | 'high'>[] = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const STATUSES: PickerItem<'pending' | 'in_progress' | 'completed'>[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

/** 🔧 Module-scope Underline (elak re-mount) */
const Underline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.underline}>{children}</View>
);

const CreateProjectScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const [client, setClient] = useState<number | null>(null);
  const [clients, setClients] = useState<PickerItem<number>[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [progress, setProgress] = useState<string>('0'); // input-friendly

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickingStartDate, setPickingStartDate] = useState(true);

  const [saving, setSaving] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  // active modal picker: 'client' | 'priority' | 'status' | null
  const [activePicker, setActivePicker] = useState<null | 'client' | 'priority' | 'status'>(null);

  const toSQLDateTime = (d: Date | null) =>
    d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
        2,
        '0'
      )} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
      : null;

  const getLabel = <T extends string | number>(list: PickerItem<T>[], val: T | null) =>
    list.find(i => i.value === val)?.label ?? undefined;

  // load clients from API
  useEffect(() => {
    (async () => {
      setLoadingClients(true);
      try {
        const token = await AsyncStorage.getItem('userToken'); // 🔄 standardize key
        const options = await getClientsOptions(token ?? undefined, {
          statusIn: ['approved', 'active'],
          sort: 'label',
        });
        setClients(options.map(o => ({ label: o.label, value: o.value })));
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    })();
  }, []);

  const handleDateConfirm = (date: Date) => {
    if (pickingStartDate) setStartDate(date);
    else setEndDate(date);
    setDatePickerVisible(false);
  };

  const modalData = useMemo(() => {
    switch (activePicker) {
      case 'client':
        return { title: 'Select Client', list: clients as PickerItem<number>[], value: client, set: setClient };
      case 'priority':
        return { title: 'Select Priority', list: PRIORITIES as PickerItem[], value: priority, set: setPriority };
      case 'status':
        return { title: 'Select Status', list: STATUSES as PickerItem[], value: status, set: setStatus };
      default:
        return null;
    }
  }, [activePicker, client, priority, status, clients]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Project name is required.');
      return;
    }
    if (!client) {
      Alert.alert('Validation', 'Please select a client.');
      return;
    }
    // ✅ validation date
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      Alert.alert('Validation', 'End date/time must be after Start date/time.');
      return;
    }

    setSaving(true);
    try {
      const token = (await AsyncStorage.getItem('userToken')) ?? ''; // 🔄 standardize
      const payload = {
        title: projectName.trim(),
        client_id: client,
        description: description || null,
        priority: priority ?? null,
        start_at: toSQLDateTime(startDate),
        end_at: toSQLDateTime(endDate), // ✅ ensure sent
        status,
        progress: Math.max(0, Math.min(100, parseInt(progress || '0', 10) || 0)),
        // Optional: due_date if anda mahu simpan pada table projects atau untuk compat backend
        // due_date: endDate ? toSQLDateTime(endDate)?.slice(0, 10) : null, // YYYY-MM-DD
      } as const;

      await createProject(token, payload);
      setSuccessVisible(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setSuccessVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create new project</Text>

          <Text style={styles.label}>Project Name</Text>
          <Underline>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Enter project name"
              placeholderTextColor={SUB}
              style={styles.inputText}
              autoCorrect={false}
              blurOnSubmit={false}
              returnKeyType="next"
            />
          </Underline>

          <Text style={styles.label}>Client</Text>
          <Underline>
            <TouchableOpacity
              style={styles.pickerField}
              onPress={() => !loadingClients && setActivePicker('client')}
              disabled={loadingClients}
            >
              <Text style={[styles.pickerValue, !client && styles.placeholder]}>
                {loadingClients ? 'Loading clients…' : getLabel(clients, client) ?? 'Select client'}
              </Text>
              <Text style={styles.chev}>▾</Text>
            </TouchableOpacity>
          </Underline>

          <Text style={styles.label}>Description</Text>
          <Underline>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Project description"
              placeholderTextColor={SUB}
              style={[styles.inputText, { height: 88 }]}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
            />
          </Underline>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Start date/time</Text>
              <Underline>
                <TouchableOpacity
                  onPress={() => {
                    setPickingStartDate(true);
                    setDatePickerVisible(true);
                  }}
                  style={styles.pickerField}
                >
                  <Text style={[styles.pickerValue, !startDate && styles.placeholder]}>
                    {startDate ? startDate.toLocaleString() : 'Select start date'}
                  </Text>
                  <Text style={styles.chev}>▾</Text>
                </TouchableOpacity>
              </Underline>
            </View>

            <View style={[styles.col, { marginLeft: 18 }]}>
              <Text style={styles.label}>End date/time</Text>
              <Underline>
                <TouchableOpacity
                  onPress={() => {
                    setPickingStartDate(false);
                    setDatePickerVisible(true);
                  }}
                  style={styles.pickerField}
                >
                  <Text style={[styles.pickerValue, !endDate && styles.placeholder]}>
                    {endDate ? endDate.toLocaleString() : 'Select end date'}
                  </Text>
                  <Text style={styles.chev}>▾</Text>
                </TouchableOpacity>
              </Underline>
            </View>
          </View>

          <Text style={styles.label}>Status</Text>
          <Underline>
            <TouchableOpacity style={styles.pickerField} onPress={() => setActivePicker('status')}>
              <Text style={styles.pickerValue}>{getLabel(STATUSES, status)}</Text>
              <Text style={styles.chev}>▾</Text>
            </TouchableOpacity>
          </Underline>

          <Text style={styles.label}>Progress</Text>
          <Underline>
            <TextInput
              value={progress}
              onChangeText={(t) => setProgress(t.replace(/[^\d]/g, '').slice(0, 3))}
              placeholder="0 - 100"
              placeholderTextColor={SUB}
              style={styles.inputText}
              keyboardType="number-pad"
              maxLength={3}
            />
          </Underline>

          <Text style={styles.label}>Priority</Text>
          <Underline>
            <TouchableOpacity style={styles.pickerField} onPress={() => setActivePicker('priority')}>
              <Text style={[styles.pickerValue, !priority && styles.placeholder]}>
                {getLabel(PRIORITIES, priority) ?? 'Select priority'}
              </Text>
              <Text style={styles.chev}>▾</Text>
            </TouchableOpacity>
          </Underline>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.sticky}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          isVisible={isSuccessVisible}
          onBackdropPress={() => setSuccessVisible(false)}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.modalTitle}>Successfully Saved!</Text>
            <Text style={styles.modalSub}>Your project has been created.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleNext}>
              <Text style={styles.modalButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <DateTimePickerModal
          isVisible={datePickerVisible}
          mode="datetime"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />

        <Modal
          isVisible={!!modalData}
          onBackdropPress={() => setActivePicker(null)}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
          style={styles.selectorModal}
        >
          <View style={styles.selectorSheet}>
            <Text style={styles.selectorTitle}>{modalData?.title}</Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {activePicker === 'client' && loadingClients ? (
                <Text style={{ alignSelf: 'center', paddingVertical: 16, color: SUB }}>Loading…</Text>
              ) : (modalData?.list ?? []).length === 0 ? (
                <Text style={{ alignSelf: 'center', paddingVertical: 16, color: SUB }}>No options</Text>
              ) : (
                (modalData?.list ?? []).map((opt) => {
                  const isActive = (modalData?.value as any) === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={styles.optionRow}
                      onPress={() => (modalData as any)?.set(opt.value)}
                    >
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                      <Text style={[styles.tick, { opacity: isActive ? 1 : 0 }]}>✓</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.selectorClose} onPress={() => setActivePicker(null)}>
              <Text style={styles.selectorCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 22, paddingTop: 28 },
  title: { fontSize: 28, fontWeight: '800', color: BLUE, marginBottom: 26 },
  label: { fontSize: 16, color: TEXT, marginBottom: 8 },
  underline: { borderBottomWidth: 2, borderBottomColor: BLUE, paddingBottom: 6, marginBottom: 18 },
  inputText: { fontSize: 16, color: TEXT, padding: 0 },
  pickerField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerValue: { fontSize: 16, color: TEXT },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1 },
  placeholder: { color: SUB },
  chev: { fontSize: 18, color: BLUE },
  sticky: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 22, paddingVertical: 18, backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D6DEE6',
  },
  saveButton: { width: '100%', paddingVertical: 16, borderRadius: 28, backgroundColor: BLUE, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalContent: { backgroundColor: BLUE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 30, alignItems: 'center' },
  checkmark: { fontSize: 56, color: '#fff', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalSub: { fontSize: 14, color: '#fff', marginTop: 6, marginBottom: 18 },
  modalButton: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 24 },
  modalButtonText: { color: BLUE, fontWeight: '700', fontSize: 16 },
  selectorModal: { justifyContent: 'flex-end', margin: 0 },
  selectorSheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 10 },
  selectorTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 8, alignSelf: 'center' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E1E7EE', justifyContent: 'space-between',
  },
  optionLabel: { fontSize: 16, color: TEXT },
  tick: { fontSize: 18, color: BLUE },
  selectorClose: { marginTop: 10, alignSelf: 'center', backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 22 },
  selectorCloseText: { color: '#fff', fontWeight: '700' },
});

export default CreateProjectScreen;
