// src/services/taskDetailsService.tsx

import { API_ENDPOINTS } from '../constants/apiConfig';

// ==== Types ====
export type TaskAttachment = {
    id: number;
    task_id: number;
    file_name: string;
    file_url: string;
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
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
};

const handleErrors = async (res: Response, raw: string) => {
    const json = parseJsonSafe(raw);

    // API-level error
    if (json && json.success === false) {
        throw new Error(json.error || 'Server returned an error');
    }
    // HTTP-level error
    if (!res.ok) {
        throw new Error((json && json.error) || `HTTP ${res.status}`);
    }

    return json;
};

// ==== Service API ====
// Attachments
export const listAttachments = async (
    token: string,
    taskId: number
): Promise<TaskAttachment[]> => {
    const params = new URLSearchParams();
    params.set('task_id', String(taskId));

    const url = `${API_ENDPOINTS.listAttachments}?${params.toString()}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    const raw = await res.text();
    const json = await handleErrors(res, raw);

    // Normalized
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

    const res = await fetch(API_ENDPOINTS.uploadAttachment, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            // IMPORTANT: jangan set 'Content-Type' untuk FormData (biar RN set boundary)
        },
        body: form,
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);

    // Normalized
    if (json?.attachment) return json.attachment as TaskAttachment;
    return json as TaskAttachment;
};

export const deleteAttachment = async (
    token: string,
    attachmentId: number
): Promise<boolean> => {
    const form = new FormData();
    form.append('id', String(attachmentId));

    const res = await fetch(API_ENDPOINTS.deleteAttachment, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        body: form,
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);
    return json?.success !== false;
};

// Single Link (1 per task)
export const getTaskLink = async (
    token: string,
    taskId: number
): Promise<TaskLink> => {
    const params = new URLSearchParams();
    params.set('task_id', String(taskId));

    const url = `${API_ENDPOINTS.getTaskLink}?${params.toString()}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);

    if (!json) return null;
    return json as TaskLink;
};

export const setTaskLink = async (
    token: string,
    taskId: number,
    urlValue: string
): Promise<TaskLink> => {
    const res = await fetch(API_ENDPOINTS.setTaskLink, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId, url: urlValue }),
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);

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
    const params = new URLSearchParams();
    params.set('task_id', String(taskId));

    const url = `${API_ENDPOINTS.listNotes}?${params.toString()}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);

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
    const res = await fetch(API_ENDPOINTS.addNote, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const raw = await res.text();
    const json = await handleErrors(res, raw);

    if (json?.note) return json.note as TaskNote;
    return json as TaskNote;
};
