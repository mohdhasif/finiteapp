// src/services/taskDetailsService.tsx
import { API_ENDPOINTS, BASE_URL } from '../constants/apiConfig';

// ==== Types ====
export type TaskAttachment = {
    id: number;
    task_id: number;
    file_name: string;
    file_url: string; // boleh jadi relative; paparkan dengan BASE_URL jika perlu
    mime_type?: string | null;
    size_bytes?: number | null;
    created_at?: string;
};

export type TaskLink =
    | {
        task_id: number;
        url: string;
        updated_at?: string;
    }
    | null;

export type TaskNote = {
    id: number;
    task_id: number;
    sender_type: 'admin' | 'client';
    sender_id?: number | null;
    message: string;
    created_at: string;
};

// ==== Helpers ====
const toAbsoluteUrl = (u?: string | null) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    return `${BASE_URL.replace(/\/+$/, '')}/${String(u).replace(/^\/+/, '')}`;
};

const parseJsonSafe = (raw: string) => {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
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
        p.then((v) => {
            clearTimeout(t);
            resolve(v);
        }).catch((e) => {
            clearTimeout(t);
            reject(e);
        });
    });
};

// Centralized fetch (adds common headers + timeout)
const apiFetch = async (url: string, init: RequestInit = {}, token?: string) => {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as any),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = (await withTimeout(fetch(url, { ...init, headers }))) as Response;
    const raw = await res.text();
    const json = await handleErrors(res, raw);
    return json;
};

// ==== Service API ====
// Attachments
export const listAttachments = async (token: string, taskId: number): Promise<TaskAttachment[]> => {
    const url = `${API_ENDPOINTS.listAttachments}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);

    const rows: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    return rows.map((r) => ({
        id: Number(r.id),
        task_id: Number(r.task_id ?? taskId),
        file_name: String(r.file_name ?? 'file'),
        file_url: toAbsoluteUrl(r.file_url ?? r.path ?? r.url ?? ''),
        mime_type: r.mime_type ?? null,
        size_bytes: r.size_bytes != null ? Number(r.size_bytes) : null,
        created_at: r.created_at,
    })) as TaskAttachment[];
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

    const json = await apiFetch(
        API_ENDPOINTS.uploadAttachment,
        {
            method: 'POST',
            // IMPORTANT: jangan set 'Content-Type' untuk FormData (biar RN set boundary)
            body: form,
        },
        token
    );

    const att = json?.attachment ?? json;
    return {
        id: Number(att.id),
        task_id: Number(att.task_id ?? taskId),
        file_name: String(att.file_name ?? 'file'),
        file_url: toAbsoluteUrl(att.file_url ?? att.path ?? att.url ?? ''),
        mime_type: att.mime_type ?? null,
        size_bytes: att.size_bytes != null ? Number(att.size_bytes) : null,
        created_at: att.created_at,
    } as TaskAttachment;
};

export const deleteAttachment = async (token: string, attachmentId: number): Promise<boolean> => {
    const form = new FormData();
    form.append('id', String(attachmentId));

    const json = await apiFetch(
        API_ENDPOINTS.deleteAttachment,
        {
            method: 'POST',
            body: form,
        },
        token
    );

    return json?.success !== false;
};

// Single Link (1 per task)
export const getTaskLink = async (token: string, taskId: number): Promise<TaskLink> => {
    const url = `${API_ENDPOINTS.getTaskLink}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);

    if (!json) return null;
    // server mungkin return { task_id, url } atau { data: { task_id, url } }
    const r = json?.data ?? json;
    if (!r?.url) return null;
    return {
        task_id: Number(r.task_id ?? taskId),
        url: String(r.url),
        updated_at: r.updated_at,
    };
};

export const setTaskLink = async (token: string, taskId: number, urlValue: string): Promise<TaskLink> => {
    const json = await apiFetch(
        API_ENDPOINTS.setTaskLink,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, url: urlValue }),
        },
        token
    );

    if (json?.success === true) {
        return { task_id: taskId, url: urlValue };
    }
    // fallback kalau server reply terus {task_id,url}
    const r = json?.data ?? json;
    return r?.url ? { task_id: Number(r.task_id ?? taskId), url: String(r.url) } : null;
};

// Notes / Conversation
export const listNotes = async (token: string, taskId: number): Promise<TaskNote[]> => {
    const url = `${API_ENDPOINTS.listNotes}?task_id=${encodeURIComponent(taskId)}`;
    const json = await apiFetch(url, {}, token);

    const rows: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    const mapped = rows.map((r) => ({
        id: Number(r.id),
        task_id: Number(r.task_id ?? taskId),
        sender_type: (String(r.sender_type || 'admin').toLowerCase() === 'client' ? 'client' : 'admin') as
            | 'admin'
            | 'client',
        sender_id: r.sender_id != null ? Number(r.sender_id) : null,
        message: String(r.message ?? ''),
        created_at: String(r.created_at ?? new Date().toISOString()),
    })) as TaskNote[];

    // sort: terbaru dahulu
    mapped.sort(
        (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return mapped;
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
    const json = await apiFetch(
        API_ENDPOINTS.addNote,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        },
        token
    );

    const n = json?.note ?? json;
    return {
        id: Number(n.id),
        task_id: Number(n.task_id ?? payload.task_id),
        sender_type: (String(n.sender_type || payload.sender_type).toLowerCase() === 'client' ? 'client' : 'admin') as
            | 'admin'
            | 'client',
        sender_id: n.sender_id != null ? Number(n.sender_id) : payload.sender_id ?? null,
        message: String(n.message ?? payload.message ?? ''),
        created_at: String(n.created_at ?? new Date().toISOString()),
    };
};
