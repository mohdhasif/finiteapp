// src/services/taskDetailsService.tsx
import { API_ENDPOINTS } from '../constants/apiConfig';

// ==== Types ====
export type TaskAttachment = {
    id: number;
    task_id: number;
    file_name: string;
    file_url: string;          // boleh jadi relative; paparkan dengan BASE_URL jika perlu
    mime_type?: string | null;
    size_bytes?: number | null;
    created_at?: string;
};

export type TaskLink = {
    task_id: number;
    url: string;
    updated_at?: string;
} | null;

export type TaskNote = {
    id: number;
    task_id: number;
    sender_type: 'admin' | 'client';
    sender_id?: number | null;
    message: string;
    created_at: string;
};

// ==== Helpers ====
const parseJsonSafe = (raw: string) => {
    try { return JSON.parse(raw); } catch { return undefined; }
};

const handleErrors = async (res: Response, raw: string) => {
    const json = parseJsonSafe(raw);

    // API-level error (our unified shape)
    if (json && json.success === false) {
        throw new Error(json.error || 'Server returned an error');
    }
    // HTTP-level error
    if (!res.ok) {
        throw new Error((json && json.error) || `HTTP ${res.status}`);
    }
    return json;
};

// Optional: timeout wrapper (avoid hanging requests on mobile networks)
const withTimeout = <T,>(p: Promise<T>, ms = 20000) => {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Request timeout')), ms);
        p.then(v => { clearTimeout(t); resolve(v); })
            .catch(e => { clearTimeout(t); reject(e); });
    });
};

// Centralized fetch (adds common headers + timeout)
const apiFetch = async (url: string, init: RequestInit = {}, token?: string) => {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as any),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await withTimeout(fetch(url, { ...init, headers }));
    const raw = await (res as Response).text();
    const json = await handleErrors(res as Response, raw);
    return json;
};

// ==== Service API ====
// Attachments
export const listAttachments = async (
    token: string,
    taskId: number
): Promise<TaskAttachment[]> => {
    const url = `${API_ENDPOINTS.listAttachments}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);

    if (Array.isArray(json)) return json as TaskAttachment[];
    if (Array.isArray(json?.data)) return json.data as TaskAttachment[];
    return [];
};

export const uploadAttachment = async (
    token: string,
    taskId: number,
    file: { uri: string; name: string; type: string }
): Promise<TaskAttachment> => {
    const form = new FormData();
    form.append('task_id', String(taskId));
    form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as any);

    const json = await apiFetch(API_ENDPOINTS.uploadAttachment, {
        method: 'POST',
        // IMPORTANT: jangan set 'Content-Type' untuk FormData (biar RN set boundary)
        body: form,
    }, token);

    if (json?.attachment) return json.attachment as TaskAttachment;
    return json as TaskAttachment;
};

export const deleteAttachment = async (
    token: string,
    attachmentId: number
): Promise<boolean> => {
    const form = new FormData();
    form.append('id', String(attachmentId));

    const json = await apiFetch(API_ENDPOINTS.deleteAttachment, {
        method: 'POST',
        body: form,
    }, token);

    return json?.success !== false;
};

// Single Link (1 per task)
export const getTaskLink = async (
    token: string,
    taskId: number
): Promise<TaskLink> => {
    const url = `${API_ENDPOINTS.getTaskLink}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);
    return (json ?? null) as TaskLink;
};

export const setTaskLink = async (
    token: string,
    taskId: number,
    urlValue: string
): Promise<TaskLink> => {
    const json = await apiFetch(API_ENDPOINTS.setTaskLink, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, url: urlValue }),
    }, token);

    if (json?.success === true) {
        return { task_id: taskId, url: urlValue } as TaskLink;
    }
    return json as TaskLink;
};

// Notes / Conversation
export const listNotes = async (
    token: string,
    taskId: number
): Promise<TaskNote[]> => {
    const url = `${API_ENDPOINTS.listNotes}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);

    if (Array.isArray(json)) return json as TaskNote[];
    if (Array.isArray(json?.data)) return json.data as TaskNote[];
    return [];
};

export const addNote = async (
    token: string,
    payload: {
        task_id: number;
        sender_type: 'admin' | 'client';
        message: string;
        sender_id?: number;
    }
): Promise<TaskNote> => {
    const json = await apiFetch(API_ENDPOINTS.addNote, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, token);

    if (json?.note) return json.note as TaskNote;
    return json as TaskNote;
};
