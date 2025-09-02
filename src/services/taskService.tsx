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
        throw new Error('Server did not return valid JSON');
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
    if (!projectId) throw new Error('Invalid projectId');

    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
    });

    const { json } = await safeJson(res);
    if (!res.ok) throw new Error(json?.error || `Failed to fetch tasks (HTTP ${res.status})`);

    return Array.isArray(json) ? json : (json?.data ?? []);
};

export const getTasksByProjectPublic = async (
    token: string,
    projectId: number
): Promise<Task[]> => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');
    if (!projectId) throw new Error('Invalid projectId');

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
    if (!taskId) throw new Error('Invalid taskId');

    let res: Response | undefined;
    let raw = '';

    try {
        res = await fetch(API_ENDPOINTS.taskDetails(taskId), {
            headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
        });

        // Important: read body only once
        raw = await res.text();

        // Try to parse JSON
        let json: any;
        try {
            json = JSON.parse(raw);
        } catch {
            // Server didn't return valid JSON
            throw new Error(`Invalid JSON from server (first 300 chars): ${raw.slice(0, 300)}`);
        }

        // HTTP-level error
        if (!res.ok) {
            const msg = json?.error || `HTTP ${res.status}`;
            throw new Error(msg);
        }

        // API-level error (if server returns { success:false, error:"..." })
        if (json?.success === false) {
            throw new Error(json?.error || 'Server returned an error');
        }

        return json; // success
    } catch (err: any) {
        // Add additional details for tracing
        console.error('[getTaskDetails] ERROR:', err?.message);
        if (res) {
            console.error('[getTaskDetails] HTTP status:', res.status);
        }
        if (raw) {
            console.error('[getTaskDetails] RAW kept for debug (first 500):', raw.slice(0, 500));
        }
        throw err;
    }
};

export const getAllTasks = async (
    token: string,
    opts: GetAllTasksOptions = {}
): Promise<Task[]> => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');

    // Keep using API_ENDPOINTS (string). We only add query here.
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

export const getAllTasksFreelancer = async (
    token: string,
    opts: GetAllTasksOptions = {}
): Promise<Task[]> => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');

    // Keep using API_ENDPOINTS (string). We only add query here.
    const url = appendQuery(API_ENDPOINTS.allTasksFreelancer, {
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
    // console.log('raw:', raw);

    let json: any;
    try { json = JSON.parse(raw); } catch {
        throw new Error('Server did not return valid JSON');
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to create task (HTTP ${res.status})`);
    }

    return json;
};




export type NewTask = {
    id: number;
    title?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    // ... your other fields
};

export const updateTaskStatus = async (
    token: string,
    taskId: number,
    status: 'pending' | 'in_progress' | 'completed'
): Promise<Task> => {
    const res = await fetch(API_ENDPOINTS.taskStatus(taskId), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error('Server returned invalid JSON'); }

    if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Failed to update status (HTTP ${res.status})`);
    }

    return json.data as Task;
};
