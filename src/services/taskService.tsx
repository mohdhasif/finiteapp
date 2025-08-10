import { API_ENDPOINTS } from '../constants/apiConfig';

export const getTasksByProject = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), {
        headers: { Authorization: `Bearer ${token}` },
    });

    const raw = await res.text();

    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }

    if (!res.ok) {
        const msg = json?.error || `Gagal ambil tugasan (HTTP ${res.status})`;
        throw new Error(msg);
    }

    // Normalize supaya caller selalu dapat array
    return Array.isArray(json) ? json : (json?.data ?? []);
};


export const getTasksByProjectPublic = async (
    token: string,
    projectId: number
): Promise<Task[]> => {
    const res = await fetch(API_ENDPOINTS.projectTasksPublic(projectId), {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text(); // read once
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server did not return valid JSON');
    }

    // API-level error
    if (json && json.success === false) {
        const msg = json.error || 'Server returned an error';
        throw new Error(msg);
    }

    // HTTP-level error
    if (!res.ok) {
        const msg = (json && json.error) || `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return Array.isArray(json?.data) ? (json.data as Task[]) : [];
};

export const getTaskDetails = async (token: string, taskId: number) => {
    const res = await fetch(API_ENDPOINTS.taskDetails(taskId), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil detail task');
    return await res.json();
};









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
    } | null;

    freelancers?: Array<{
        freelancer_id: number;     // PK freelancers
        user_id: number;           // users.id
        name: string | null;
        email: string | null;
        avatar: string | null;
    }>;
};

export type GetAllTasksOptions = {
    status?: 'pending' | 'in_progress' | 'completed';
    projectId?: number;
};

/**
 * Ambil semua task (public/all) dengan filter opsyenal.
 * Gaya sama macam getTasksByProjectPublic: robust JSON parse, API-level & HTTP-level error handling.
 */
export const getAllTasks = async (
    token: string,
    opts: GetAllTasksOptions = {}
): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.projectId) params.set('project_id', String(opts.projectId));

    const url =
        params.toString().length > 0
            ? `${API_ENDPOINTS.allTasks}?${params.toString()}`
            : API_ENDPOINTS.allTasks;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch {
        // console.log('RAW RESPONSE (not JSON):', raw); throw new Error('Server did not return valid JSON');
    }

    // API-level error
    if (json && json.success === false) {
        throw new Error(json.error || 'Server returned an error');
    }
    // HTTP-level error
    if (!res.ok) {
        throw new Error((json && json.error) || `HTTP ${res.status}`);
    }

    // data normalised
    return Array.isArray(json?.data) ? (json.data as Task[]) : [];
};
