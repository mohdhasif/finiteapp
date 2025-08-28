// src/screens/AdminTaskDetailsScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Linking,
    Alert,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    listAttachments,
    uploadAttachment,
    deleteAttachment,
    getTaskLink,
    setTaskLink,
    listNotes,
    addNote,
    type TaskAttachment,
    type TaskNote,
} from '../services/taskDetailsService';
import { BASE_URL } from '../constants/apiConfig';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { types } from 'react-native-document-picker';
import { getTaskDetails } from '../services/taskService';
import Modal from 'react-native-modal';
import {
    listTaskAssignees,
    assignTaskAssignee,
    removeTaskAssignee,
    updateTaskAssigneeRole,
    type Assignee,
    searchFreelancersSimple,
    type NewAssignee,
} from '../services/taskAssigneesService';
import { useAsyncState } from '../hooks/useOptimizedState';
import { performanceMonitor } from '../utils/performance';

const { width } = Dimensions.get('window');
type ScreenRoute = RouteProp<RootStackParamList, 'AdminTaskDetailsScreen'>;

// Normalise tarikh → milliseconds (handle "YYYY-MM-DD HH:mm:ss" atau ISO)
const toMs = (s?: string) => {
    if (!s) return 0;
    const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
};
// Sort helper: oldest → newest (guna masa load sahaja)
const sortOldest = (arr: TaskNote[]) => arr.slice().sort((a, b) => toMs(a.created_at) - toMs(b.created_at));

const AdminTaskDetailsScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ScreenRoute>();
    const taskId = route.params?.task_id as number;
    const taskTitle = route.params?.task_title ?? 'Task';

    const [token, setToken] = useState<string>('');
    const [refreshing, setRefreshing] = useState(false);

    // Performance optimized state management
    const { data: taskDetails, loading, error, execute: fetchTaskDetails } = useAsyncState<any>(null);
    const { data: attachments, execute: fetchAttachments } = useAsyncState<TaskAttachment[]>([]);
    const { data: notes, execute: fetchNotes } = useAsyncState<TaskNote[]>([]);
    const { data: assignees, execute: fetchAssignees } = useAsyncState<Assignee[]>([]);
    
    // UI states
    const [uploading, setUploading] = useState(false);
    const [linkUrl, setLinkUrlState] = useState<string>('');
    const [savingLink, setSavingLink] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [sendingNote, setSendingNote] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [options, setOptions] = useState<NewAssignee[]>([]);

    const ROLE_OPTIONS: Assignee['role'][] = ['designer', 'editor', 'strategist', 'pm', 'other'];

    const outerScrollRef = useRef<ScrollView>(null); // scroll keseluruhan
    const notesBottomAnchor = useRef<View>(null);     // anchor untuk scroll ke bawah

    const canSend = useMemo(() => noteText.trim().length > 0, [noteText]);
    
    // Performance monitoring
    const renderCount = useRef(0);
    renderCount.current++;
    const [searchQ, setSearchQ] = useState('');
    const [loadingOptions, setLoadingOptions] = useState(false);

    const toAbs = useCallback((u?: string | null) => {
        if (!u) return '';
        if (/^https?:\/\//i.test(u)) return u;
        return `${BASE_URL.replace(/\/+$/, '')}/${String(u).replace(/^\/+/, '')}`;
    }, []);

    const loadAll = useCallback(async (tk: string) => {
        performanceMonitor.startTimer('loadTaskDetails');
        
        try {
            // Load all data in parallel using optimized async state
            await Promise.all([
                fetchTaskDetails(async () => {
                    return await getTaskDetails(tk, taskId);
                }),
                fetchAttachments(async () => {
                    return await listAttachments(tk, taskId);
                }),
                fetchNotes(async () => {
                    const notesData = await listNotes(tk, taskId);
                    return sortOldest(notesData ?? []);
                }),
                fetchAssignees(async () => {
                    return await listTaskAssignees(tk, taskId);
                })
            ]);
            
            // Load link separately since it's not part of async state
            const linkData = await getTaskLink(tk, taskId);
            setLinkUrlState(linkData?.url ?? '');
            
        } catch (e: any) {
            Alert.alert('Failed to load', e?.message || 'Unknown error');
        } finally {
            performanceMonitor.endTimer('loadTaskDetails');
        }
    }, [taskId, fetchTaskDetails, fetchAttachments, fetchNotes, fetchAssignees]);


    const onRefresh = useCallback(async () => {
        if (!token) return;
        setRefreshing(true);
        try {
            await loadAll(token);
        } finally {
            setRefreshing(false);
        }
    }, [token, loadAll]);

    useEffect(() => {
        (async () => {
            const tk = (await AsyncStorage.getItem('userToken')) || '';
            setToken(tk);
            if (!taskId) {
                Alert.alert('Error', 'task_id is missing.');
                return;
            }
            await loadAll(tk);
        })();
    }, [taskId, loadAll]);

    // ===== Actions =====
    const handlePickAndUpload = async () => {
        if (!token) return;
        try {
            const res = await DocumentPicker.pickSingle({
                type: [types.allFiles], // semua jenis file
            });

            const uri = res.uri;
            if (!uri) return;

            setUploading(true);
            const name = res.name || `attachment_${Date.now()}`;
            const type = res.type || 'application/octet-stream';

            const uploaded = await uploadAttachment(token, taskId, { uri, name, type });
            // Update attachments using the async state execute function
            await fetchAttachments(async () => {
                const currentAttachments = await listAttachments(token, taskId);
                return [uploaded, ...(currentAttachments ?? [])];
            });
            Alert.alert('Success', 'Attachment uploaded successfully.');
        } catch (err: any) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Upload failed', err?.message || 'Unknown error');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = (id: number) => {
        if (!token) return;
        Alert.alert('Delete attachment?', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const ok = await deleteAttachment(token, id);
                        if (ok) {
                            // Update attachments using the async state execute function
                            await fetchAttachments(async () => {
                                const currentAttachments = await listAttachments(token, taskId);
                                return (currentAttachments ?? []).filter((x: TaskAttachment) => x.id !== id);
                            });
                        } else {
                            Alert.alert('Failed', 'Cannot delete attachment.');
                        }
                    } catch (e: any) {
                        Alert.alert('Failed', e?.message || 'Unknown error');
                    }
                },
            },
        ]);
    };

    const normalizeUrl = (s: string) => {
        const trimmed = (s || '').trim();
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    const handleOpenLink = async () => {
        if (!linkUrl?.trim()) return;
        const url = normalizeUrl(linkUrl);

        try {
            await Linking.openURL(url); // terus cuba
        } catch (e) {
            Alert.alert('Invalid link', 'URL cannot be opened. Make sure you have a browser or try again.');
        }
    };

    const handleSaveLink = async () => {
        if (!token) return;
        setSavingLink(true);
        try {
            await setTaskLink(token, taskId, linkUrl.trim());
            Alert.alert('Success', 'Link has been saved.');
        } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Unknown error');
        } finally {
            setSavingLink(false);
        }
    };

    const handleSendNote = async () => {
        if (!token || !canSend) return;
        setSendingNote(true);
        try {
            const note = await addNote(token, {
                task_id: taskId,
                sender_type: 'admin',
                message: noteText.trim(),
            });

            // Fallback created_at kalau server tak bagi, supaya tak tersort pelik
            const safeNote: TaskNote = {
                ...note,
                created_at: note.created_at && note.created_at.trim() ? note.created_at : new Date().toISOString(),
            };

            // JANGAN sort di sini — terus APPEND untuk kekalkan di bawah
            await fetchNotes(async () => {
                const currentNotes = await listNotes(token, taskId);
                return [...(currentNotes ?? []), safeNote];
            });
            setNoteText('');

            // Auto-scroll ke bawah supaya nampak nota baru
            requestAnimationFrame(() => {
                outerScrollRef.current?.scrollToEnd({ animated: true });
            });
        } catch (e: any) {
            Alert.alert('Failed to send note', e?.message || 'Unknown error');
        } finally {
            setSendingNote(false);
        }
    };

    const openAddAssignee = () => { setShowAddModal(true); /* panggil fetch options di sini kalau perlu */ };

    const fetchOptions = useCallback(async () => {
        if (!token) return;
        try {
            setLoadingOptions(true);
            const rows = await searchFreelancersSimple(token, {
                q: searchQ.trim(),
                only_active: 1,
                page: 1,
                per_page: 20,
            });
            setOptions(rows);
        } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Cannot load freelancer list.');
            setOptions([]);
        } finally {
            setLoadingOptions(false);
        }
    }, [token, searchQ]);

    useEffect(() => {
        if (showAddModal) {
            fetchOptions();
        } else {
            setOptions([]);
            setSearchQ('');
        }
    }, [showAddModal, fetchOptions]);


    const handleRemoveAssignee = (fid: number) => {
        if (!token) return;
        Alert.alert('Buang freelancer?', 'Freelancer akan dibuang dari task ini.', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Buang', style: 'destructive',
                onPress: async () => {
                    try {
                        await removeTaskAssignee(token, taskId, fid);
                        await fetchAssignees(async () => {
                            const currentAssignees = await listTaskAssignees(token, taskId);
                            return (currentAssignees ?? []).filter((x: Assignee) => x.id !== fid);
                        });
                    } catch (e: any) {
                        Alert.alert('Gagal', e?.message || 'Tidak dapat buang.');
                    }
                }
            }
        ]);
    };

    const handleChangeRole = async (fid: number, role: Assignee['role']) => {
        if (!token) return;
        try {
            await updateTaskAssigneeRole(token, taskId, fid, role);
            await fetchAssignees(async () => {
                const currentAssignees = await listTaskAssignees(token, taskId);
                return (currentAssignees ?? []).map((x: Assignee) => x.id === fid ? { ...x, role } : x);
            });
        } catch (e: any) {
            Alert.alert('Gagal', e?.message || 'Tidak dapat kemas kini role.');
        }
    };

    const handleSelectToAdd = async (f: NewAssignee) => {
        if (!token) return;
        try {
            setAdding(true);
            await assignTaskAssignee(token, taskId, f.id, 'other'); // default role
            await fetchAssignees(async () => {
                const currentAssignees = await listTaskAssignees(token, taskId);
                return [...(currentAssignees ?? []), { ...f, role: 'other' } as Assignee];
            });
            setShowAddModal(false);
            setOptions([]);
            setSearchQ('');
        } catch (e: any) {
            Alert.alert('Gagal', e?.message || 'Tidak dapat assign.');
        } finally {
            setAdding(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Quick Add dropdown */}
            {showDropdown && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AdminCreateProjectScreen'); }}>
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => { setShowDropdown(false); navigation.navigate('AddTaskScreen'); }}>
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                ref={outerScrollRef}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                {/* Header */}
                <Text style={styles.header}>Task Details</Text>
                <Text style={styles.title}>{taskTitle}</Text>

                {/* Description (placeholder) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Text style={styles.bullet}>● </Text>Description
                    </Text>
                    <Text style={styles.description}>
                        {taskDetails?.description || 'Tiada deskripsi.'}
                    </Text>
                </View>

                {/* Attachments */}
                <View style={styles.cardBlock}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>● Attachments</Text>
                        <TouchableOpacity style={styles.iconBtn} onPress={handlePickAndUpload} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Icon name="cloud-upload-outline" size={18} color="#fff" />
                            )}
                            <Text style={styles.iconBtnText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && (attachments || []).length === 0 ? (
                        <Text style={styles.muted}>Loading attachments…</Text>
                    ) : (attachments || []).length === 0 ? (
                        <Text style={styles.muted}>Tiada lampiran.</Text>
                    ) : (
                        (attachments || []).map((att) => (
                            <View key={att.id} style={styles.attachmentRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                        {att.file_name || 'file'}
                                    </Text>
                                    <TouchableOpacity onPress={() => Linking.openURL(toAbs(att.file_url))}>
                                        <Text style={styles.attachmentUrl} numberOfLines={1}>
                                            {toAbs(att.file_url)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteAttachment(att.id)} style={styles.deleteBtn}>
                                    <Icon name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Single Link */}
                <View style={styles.cardBlock}>
                    <Text style={styles.cardTitle}>● Link</Text>
                    <View style={styles.linkRow}>
                        <TextInput
                            placeholder="https://contoh.com/doc"
                            placeholderTextColor="#9dc9e4"
                            style={styles.input}
                            value={linkUrl}
                            onChangeText={setLinkUrlState}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenLink} disabled={!linkUrl}>
                            <Icon name="open-outline" size={18} color="#fff" />
                            <Text style={styles.secondaryBtnText}>Open</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveLink} disabled={savingLink}>
                            {savingLink ? (
                                <ActivityIndicator size="small" color="#0B2C3F" />
                            ) : (
                                <Icon name="save-outline" size={18} color="#0B2C3F" />
                            )}
                            <Text style={styles.primaryBtnText}>{savingLink ? 'Saving…' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* START ASSIGNEE */}
                {/* Assignees */}
                <View style={styles.cardBlock}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>● Assignees</Text>
                        <TouchableOpacity style={styles.iconBtn} onPress={openAddAssignee}>
                            <Icon name="person-add-outline" size={18} color="#fff" />
                            <Text style={styles.iconBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && (assignees || []).length === 0 ? (
                        <Text style={styles.muted}>Loading assignees…</Text>
                    ) : (assignees || []).length === 0 ? (
                        <Text style={styles.muted}>Belum ada freelancer ditugaskan.</Text>
                    ) : (
                        (assignees || []).map(a => (
                            <View key={a.id} style={styles.attachmentRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.attachmentName} numberOfLines={1}>{a.name}</Text>
                                    <Text style={styles.attachmentUrl} numberOfLines={1}>{a.email || '—'}</Text>
                                    {/* Role picker ringkas */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                                        {ROLE_OPTIONS.map(r => (
                                            <TouchableOpacity
                                                key={r}
                                                onPress={() => handleChangeRole(a.id, r)}
                                                style={{
                                                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 6,
                                                    backgroundColor: a.role === r ? '#1DA1F2' : '#0E4766', borderWidth: 1, borderColor: '#1DA1F2'
                                                }}
                                            >
                                                <Text style={{ color: a.role === r ? '#0B2C3F' : '#9dc9e4', fontWeight: '700', fontSize: 12 }}>
                                                    {r.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveAssignee(a.id)} style={styles.deleteBtn}>
                                    <Icon name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* END ASSIGNEE */}

                {/* Notes */}
                <View style={styles.cardBlock}>
                    <Text style={styles.cardTitle}>● Notes</Text>

                    {/* Senarai nota (oldest → newest) — disusun masa load */}
                    {loading && (notes || []).length === 0 ? (
                        <Text style={styles.muted}>Loading notes…</Text>
                    ) : (notes || []).length === 0 ? (
                        <Text style={styles.muted}>Belum ada nota.</Text>
                    ) : (
                        (notes || []).map((n) => (
                            <View key={n.id} style={styles.noteRow}>
                                <View style={styles.noteBadge}>
                                    <Text style={styles.noteBadgeText}>{n.sender_type === 'admin' ? 'A' : 'C'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.noteMeta}>
                                        {n.sender_type.toUpperCase()} · {new Date(toMs(n.created_at)).toLocaleString()}
                                    </Text>
                                    <Text style={styles.noteText}>{n.message}</Text>
                                </View>
                            </View>
                        ))
                    )}

                    {/* INPUT di PALING BAWAH */}
                    <View style={[styles.noteInputBox, { marginTop: 12 }]}>
                        <TextInput
                            placeholder="Tulis nota…"
                            placeholderTextColor="#9dc9e4"
                            style={styles.textarea}
                            value={noteText}
                            onChangeText={setNoteText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.primaryBtn, { alignSelf: 'flex-end', marginTop: 10, opacity: canSend ? 1 : 0.6 }]}
                            onPress={handleSendNote}
                            disabled={!canSend || sendingNote}
                        >
                            {sendingNote ? (
                                <ActivityIndicator size="small" color="#0B2C3F" />
                            ) : (
                                <Icon name="send-outline" size={18} color="#0B2C3F" />
                            )}
                            <Text style={styles.primaryBtnText}>{sendingNote ? 'Sending…' : 'Send'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Anchor untuk scrollToEnd yang tepat */}
                    <View ref={notesBottomAnchor} />
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => setShowDropdown(v => !v)}>
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <Modal isVisible={showAddModal} onBackdropPress={() => setShowAddModal(false)} backdropOpacity={0.4} useNativeDriver>
                <View style={{ backgroundColor: '#12668C', borderRadius: 12, padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Tambah Freelancer</Text>
                    <View style={styles.linkRow}>
                        <TextInput
                            placeholder="Cari nama / email…"
                            placeholderTextColor="#9dc9e4"
                            style={styles.input}
                            value={searchQ}
                            onChangeText={setSearchQ}
                            autoCapitalize="none"
                            onSubmitEditing={fetchOptions}
                        />
                    </View>

                    {loadingOptions ? (
                        <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color="#fff" /></View>
                    ) : options.length === 0 ? (
                        <Text style={styles.muted}>Tiada result.</Text>
                    ) : (
                        <ScrollView style={{ maxHeight: 280, marginTop: 10 }}>
                            {options.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.attachmentRow, { backgroundColor: '#0E4766' }]}
                                    onPress={() => handleSelectToAdd(opt)}
                                    disabled={adding}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.attachmentName} numberOfLines={1}>{opt.name}</Text>
                                        {!!opt.email && <Text style={styles.attachmentUrl} numberOfLines={1}>{opt.email}</Text>}
                                    </View>
                                    <Icon name="add-circle-outline" size={22} color="#9ddcff" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowAddModal(false)} disabled={adding}>
                            <Icon name="close-outline" size={18} color="#fff" />
                            <Text style={styles.secondaryBtnText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
};

export default AdminTaskDetailsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B2C3F' },
    scrollContent: { padding: 20 },
    header: { fontSize: 26, color: '#fff', fontWeight: 'bold' },
    title: { fontSize: 20, color: '#fff', marginBottom: 20 },

    section: {
        backgroundColor: '#0E4766',
        padding: 15,
        borderRadius: 10,
        borderColor: '#1DA1F2',
        borderWidth: 1,
        marginBottom: 20,
    },
    sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
    bullet: { color: '#fff', fontSize: 16 },
    description: { color: '#ccc', fontSize: 14, lineHeight: 20 },

    cardBlock: {
        backgroundColor: '#12668C',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { color: '#fff', fontSize: 16, marginBottom: 10 },

    iconBtn: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#0B2C3F',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    iconBtnText: { color: '#fff', fontWeight: '600' },

    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#0E4766',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    attachmentUrl: { color: '#9ddcff', fontSize: 12, marginTop: 2 },
    deleteBtn: {
        backgroundColor: '#d9534f',
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
        flex: 1,
        backgroundColor: '#0E4766',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#1DA1F2',
    },
    rowActions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end' },
    secondaryBtn: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#0E4766',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1DA1F2',
    },
    secondaryBtnText: { color: '#fff', fontWeight: '600' },
    primaryBtn: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#0B2C3F', fontWeight: '700' },

    noteInputBox: {
        backgroundColor: '#0E4766',
        borderRadius: 10,
        borderColor: '#1DA1F2',
        borderWidth: 1,
        padding: 12,
        marginBottom: 0,
    },
    textarea: {
        minHeight: 80,
        color: '#fff',
        textAlignVertical: 'top',
    },
    noteRow: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#0E4766',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    noteBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1DA1F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteBadgeText: { color: '#0B2C3F', fontWeight: '800' },
    noteMeta: { color: '#9dc9e4', fontSize: 11, marginBottom: 4 },
    noteText: { color: '#fff', fontSize: 14 },
    muted: { color: '#cfe7f6', opacity: 0.7 },

    bottomTab: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 10,
    },
    fab: {
        backgroundColor: '#fff',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40,
    },


    dropdown: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 4,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 10,
    },

    option: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0072B5',
    },
});
