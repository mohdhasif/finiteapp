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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
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
} from '../../services/taskDetailsService';
import { BASE_URL } from '../../constants/apiConfig';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { types } from 'react-native-document-picker';
import { getTaskDetails } from '../../services/taskService';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetailsScreen'>;

// Normalise tarikh → milliseconds (handle "YYYY-MM-DD HH:mm:ss" atau ISO)
const toMs = (s?: string) => {
    if (!s) return 0;
    const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
};
// Sort helper: oldest → newest (guna masa load sahaja)
const sortOldest = (arr: TaskNote[]) => arr.slice().sort((a, b) => toMs(a.created_at) - toMs(b.created_at));

const TaskDetailsScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<TaskDetailsScreenRouteProp>();
    const taskId = route.params?.task_id as number || 0;
    const taskTitle = route.params?.task_title ?? 'Task';

    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [uploading, setUploading] = useState(false);

    // Single Link
    const [linkUrl, setLinkUrlState] = useState<string>('');
    const [savingLink, setSavingLink] = useState(false);

    // Notes
    const [notes, setNotes] = useState<TaskNote[]>([]);
    const [noteText, setNoteText] = useState('');
    const [sendingNote, setSendingNote] = useState(false);
    const canSend = useMemo(() => noteText.trim().length > 0, [noteText]);

    const outerScrollRef = useRef<ScrollView>(null); // scroll keseluruhan
    const notesBottomAnchor = useRef<View>(null);     // anchor untuk scroll ke bawah

    const [taskDetails, setTaskDetails] = useState<any>(null);

    const toAbs = useCallback((u?: string | null) => {
        if (!u) return '';
        if (/^https?:\/\//i.test(u)) return u;
        return `${BASE_URL.replace(/\/+$/, '')}/${String(u).replace(/^\/+/, '')}`;
    }, []);

    const loadAll = useCallback(async (tk: string) => {
        try {
            setLoading(true);
            const [att, lk, ns, td] = await Promise.all([
                listAttachments(tk, taskId),
                getTaskLink(tk, taskId),
                listNotes(tk, taskId),
                getTaskDetails(tk, taskId),
            ]);
            setAttachments(att ?? []);
            setLinkUrlState(lk?.url ?? '');
            setNotes(sortOldest(ns ?? []));
            setTaskDetails(td ?? null);
        } catch (e: any) {
            Alert.alert('Gagal memuat', e?.message || 'Ralat tidak diketahui');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

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
                Alert.alert('Ralat', 'taskId tiada.');
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
            setAttachments((prev) => [uploaded, ...prev]);
            Alert.alert('Berjaya', 'Attachment dimuat naik.');
        } catch (err: any) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Gagal upload', err?.message || 'Ralat tidak diketahui');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = (id: number) => {
        if (!token) return;
        Alert.alert('Padam lampiran?', 'Tindakan ini tidak boleh dipulihkan.', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Padam',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const ok = await deleteAttachment(token, id);
                        if (ok) setAttachments((prev) => prev.filter((x) => x.id !== id));
                        else Alert.alert('Gagal', 'Tidak dapat padam lampiran.');
                    } catch (e: any) {
                        Alert.alert('Gagal', e?.message || 'Ralat tidak diketahui');
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
            Alert.alert('Link tidak sah', 'URL tidak boleh dibuka. Pastikan ada browser atau cuba lagi.');
        }
    };

    const handleSaveLink = async () => {
        if (!token) return;
        setSavingLink(true);
        try {
            await setTaskLink(token, taskId, linkUrl.trim());
            Alert.alert('Berjaya', 'Link telah disimpan.');
        } catch (e: any) {
            Alert.alert('Gagal', e?.message || 'Ralat tidak diketahui');
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
                sender_type: 'client',
                message: noteText.trim(),
            });

            // Fallback created_at kalau server tak bagi, supaya tak tersort pelik
            const safeNote: TaskNote = {
                ...note,
                created_at: note.created_at && note.created_at.trim() ? note.created_at : new Date().toISOString(),
            };

            // JANGAN sort di sini — terus APPEND untuk kekalkan di bawah
            setNotes((prev) => [...prev, safeNote]);
            setNoteText('');

            // Auto-scroll ke bawah supaya nampak nota baru
            requestAnimationFrame(() => {
                outerScrollRef.current?.scrollToEnd({ animated: true });
            });
        } catch (e: any) {
            Alert.alert('Gagal hantar nota', e?.message || 'Ralat tidak diketahui');
        } finally {
            setSendingNote(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={outerScrollRef}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Text style={styles.header}>Task Details</Text>
                <Text style={styles.title}>{taskTitle}</Text>

                {/* Description */}
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
                        {/* <TouchableOpacity style={styles.iconBtn} onPress={handlePickAndUpload} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Icon name="cloud-upload-outline" size={18} color="#fff" />
                            )}
                            <Text style={styles.iconBtnText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
                        </TouchableOpacity> */}
                    </View>

                    {loading && attachments.length === 0 ? (
                        <Text style={styles.muted}>Loading attachments…</Text>
                    ) : attachments.length === 0 ? (
                        <Text style={styles.muted}>Tiada lampiran.</Text>
                    ) : (
                        attachments.map((att) => (
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
                                <TouchableOpacity onPress={() => Linking.openURL(toAbs(att.file_url))} style={styles.viewBtn}>
                                    <Icon name="open-outline" size={20} color="#fff" />
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
                            editable={false}
                        />
                    </View>
                    <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenLink} disabled={!linkUrl}>
                            <Icon name="open-outline" size={18} color="#fff" />
                            <Text style={styles.secondaryBtnText}>Open</Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveLink} disabled={savingLink}>
                            {savingLink ? (
                                <ActivityIndicator size="small" color="#0B2C3F" />
                            ) : (
                                <Icon name="save-outline" size={18} color="#0B2C3F" />
                            )}
                            <Text style={styles.primaryBtnText}>{savingLink ? 'Saving…' : 'Save'}</Text>
                        </TouchableOpacity> */}
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.cardBlock}>
                    <Text style={styles.cardTitle}>● Notes</Text>

                    {/* Senarai nota (oldest → newest) — disusun masa load */}
                    {loading && notes.length === 0 ? (
                        <Text style={styles.muted}>Loading notes…</Text>
                    ) : notes.length === 0 ? (
                        <Text style={styles.muted}>Belum ada nota.</Text>
                    ) : (
                        notes.map((n) => (
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

                <View style={{ height: 90 }} />
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('ProjectListScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('ProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TaskDetailsScreen;

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
    viewBtn: {
        backgroundColor: '#1DA1F2',
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

    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: 70,
        backgroundColor: '#007baf',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    navItem: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
