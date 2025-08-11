// src/services/taskService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

export type Task = {
    id: number;
    project_id: number | null;
    title: string | null;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed' | string;
    due_date: string | null;
    created_at?: string;
    updated_at?: string;
    progress?: number | null;
    project?: { id: number; title: string | null } | null;
    client?: {
        user_id: number | null;
        display_name: string | null;
        client_type: 'company' | 'individual' | null;
        company_name: string | null;
        logo_url: string | null;
        name: string | null;
    } | null;
    freelancers?: Array<{
        freelancer_id: number;
        user_id: number;
        name: string | null;
        email: string | null;
        avatar: string | null;
    }>;
};

export type GetAllTasksOptions = {
    status?: 'pending' | 'in_progress' | 'completed';
    projectId?: number;
};

// --- helpers ---
const safeJson = async (res: Response) => {
    const raw = await res.text();
    try {
        return { json: JSON.parse(raw), raw };
    } catch {
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }
};

const appendQuery = (base: string, params?: Record<string, unknown>) => {
    const pairs = Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (!pairs.length) return base;
    const q = pairs
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
    return `${base}${base.includes('?') ? '&' : '?'}${q}`;
};

// --- APIs ---
export const getTasksByProject = async (token: string, projectId: number) => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');
    if (!projectId) throw new Error('projectId tidak sah');

    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
    });

    const { json } = await safeJson(res);
    if (!res.ok) throw new Error(json?.error || `Gagal ambil tugasan (HTTP ${res.status})`);

    return Array.isArray(json) ? json : (json?.data ?? []);
};

export const getTasksByProjectPublic = async (
    token: string,
    projectId: number
): Promise<Task[]> => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');
    if (!projectId) throw new Error('projectId tidak sah');

    const res = await fetch(API_ENDPOINTS.projectTasksPublic(projectId), {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
    });

    const { json } = await safeJson(res);

    if (json && json.success === false) {
        throw new Error(json.error || 'Server returned an error');
    }
    if (!res.ok) throw new Error((json && json.error) || `HTTP ${res.status}`);

    return Array.isArray(json?.data) ? (json.data as Task[]) : [];
};

export const getTaskDetails = async (token: string, taskId: number) => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');
    if (!taskId) throw new Error('taskId tidak sah');

    const res = await fetch(API_ENDPOINTS.taskDetails(taskId), {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Gagal ambil detail task');
    return await res.json();
};

export const getAllTasks = async (
    token: string,
    opts: GetAllTasksOptions = {}
): Promise<Task[]> => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');

    // Kekal guna API_ENDPOINTS (string). Kita hanya tambah query di sini.
    const url = appendQuery(API_ENDPOINTS.allTasks, {
        status: opts.status,
        project_id: opts.projectId,
    });

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
    });

    const { json } = await safeJson(res);

    if (json && json.success === false) {
        throw new Error(json.error || 'Server returned an error');
    }
    if (!res.ok) throw new Error((json && json.error) || `HTTP ${res.status}`);

    return Array.isArray(json?.data) ? (json.data as Task[]) : [];
};





export type CreateTaskPayload = {
    title: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    due_date?: string;              // 'YYYY-MM-DD'
    start_at?: string;              // 'YYYY-MM-DD HH:MM:SS'
    end_at?: string;                // 'YYYY-MM-DD HH:MM:SS'
    project_id: number;
};

export const createTask = async (token: string, payload: CreateTaskPayload) => {
    const res = await fetch(API_ENDPOINTS.createTask, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch {
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Gagal tambah task (HTTP ${res.status})`);
    }

    return json;
};