import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Alert, Platform
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const AddTaskScreen: React.FC<any> = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
    const [dueDate, setDueDate] = useState<string>('');

    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load projek utk dropdown
    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) throw new Error('Tiada token');

                const data = await getProjectsOptions(token);
                setProjects(data);
            } catch (e: any) {
                Alert.alert('Failed', e.message || 'Failed to get project list');
            }
        })();
    }, []);

    const handleConfirmDate = (date: Date) => {
        setDueDate(date.toISOString().slice(0, 10)); // YYYY-MM-DD
        setShowDatePicker(false);
    };

    const canSubmit = useMemo(() => {
        return title.trim().length > 0 && selectedProject;
    }, [title, selectedProject]);

    const onSubmit = async () => {
        if (!canSubmit || !selectedProject) {
            Alert.alert('Warning', 'Please fill in Title and select Project');
            return;
        }
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('Tiada token');

            await createTask(token, {
                title: title.trim(),
                description: description.trim(),
                status,
                due_date: dueDate, // kosong dibenarkan
                project_id: selectedProject.id,
            });

            Alert.alert('Success', 'Task has been added', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
                <Text style={styles.header}>Add Task</Text>

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

                <Text style={styles.label}>Task Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contoh: Setup CI/CD"
                    placeholderTextColor={SUB}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder="Butiran tugas..."
                    placeholderTextColor={SUB}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

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

                <Text style={styles.label}>Due Date (optional)</Text>
                <TouchableOpacity style={styles.select} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.selectText}>{dueDate || 'Pilih tarikh (jika ada)'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit || loading ? styles.btnDisabled : undefined]}
                    onPress={onSubmit}
                    disabled={!canSubmit || loading}
                >
                    <Text style={styles.submitText}>{loading ? 'Menyimpan...' : 'Tambah Task'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Project Picker */}
            <Modal
                isVisible={showProjectPicker}
                onBackdropPress={() => setShowProjectPicker(false)}
                useNativeDriver
            >
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Pilih Project</Text>
                    <ScrollView style={{ maxHeight: 380 }}>
                        {projects.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={styles.optionRow}
                                onPress={() => { setSelectedProject(p); setShowProjectPicker(false); }}
                            >
                                <Text style={styles.optionTitle}>{p.title}</Text>
                                {!!p.client_name && <Text style={styles.optionSub}>{p.client_name}</Text>}
                            </TouchableOpacity>
                        ))}
                        {projects.length === 0 && (
                            <Text style={styles.emptyText}>Tiada projek.</Text>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Status Picker */}
            <Modal
                isVisible={showStatusPicker}
                onBackdropPress={() => setShowStatusPicker(false)}
                useNativeDriver
            >
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Pilih Status</Text>
                    {STATUSES.map(s => (
                        <TouchableOpacity
                            key={s.value}
                            style={styles.optionRow}
                            onPress={() => { setStatus(s.value); setShowStatusPicker(false); }}
                        >
                            <Text style={styles.optionTitle}>{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* Date Picker */}
            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={() => setShowDatePicker(false)}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
            />
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

    modalCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 10 },
    optionRow: {
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F3F7',
    },
    optionTitle: { fontSize: 16, color: TEXT, fontWeight: '600' },
    optionSub: { fontSize: 13, color: SUB, marginTop: 2 },
    emptyText: { color: SUB, paddingVertical: 16, textAlign: 'center' },
});
