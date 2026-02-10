import { API_ENDPOINTS } from '../constants/apiConfig';
import { resolveWithLocalIfUnchanged, fallbackToLocal } from './localDb';

export type Assignee = {
    id: number;           // freelancer_id
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'non-active';
    role: 'designer' | 'editor' | 'strategist' | 'pm' | 'other';
    assigned_at?: string;
};

export async function listTaskAssignees(token: string, taskId: number): Promise<Assignee[]> {
    const url = `${API_ENDPOINTS.urlListTaskAssignees}?task_id=${encodeURIComponent(taskId)}`;
    try {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const text = await r.text();
        let j;
        try { j = JSON.parse(text); } catch { throw new Error('Response is not valid JSON'); }
        if (!j.success) throw new Error(j.error || 'Failed to load assignees');
        const items: Assignee[] = j.data || [];
        const key = `taskAssignees:${taskId}`;
        return await resolveWithLocalIfUnchanged<Assignee>(key, items, (x) => x.id);
    } catch (e) {
        const key = `taskAssignees:${taskId}`;
        return await fallbackToLocal<Assignee>(key, []);
    }
}


export async function assignTaskAssignee(token: string, taskId: number, freelancerId: number, role: Assignee['role']) {
    const url = `${API_ENDPOINTS.urlAssignTaskAssignee}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, freelancer_id: freelancerId, role }),
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error || 'Failed to assign freelancer');
}

export async function updateTaskAssigneeRole(token: string, taskId: number, freelancerId: number, role: Assignee['role']) {
    const url = `${API_ENDPOINTS.urlUpdateTaskAssigneeRole}?task_id=${encodeURIComponent(taskId)}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, freelancer_id: freelancerId, role }),
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error || 'Failed to update role');
}

export async function removeTaskAssignee(token: string, taskId: number, freelancerId: number) {
    const url = `${API_ENDPOINTS.urlRemoveTaskAssignee}?task_id=${encodeURIComponent(taskId)}&freelancer_id=${encodeURIComponent(freelancerId)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    if (!j.success) throw new Error(j.error || 'Failed to remove assignee');
}


export type NewAssignee = {
    id: number;
    name: string;
    email?: string | null;
    role?: 'designer' | 'editor' | 'strategist' | 'pm' | 'other';
    avatar_url?: string | null;
};

type SearchFreelancersParams = {
    q?: string;
    status?: string;       // 'active'|'approved'|...
    only_active?: 0 | 1;   // 1 = hanya active/approved
    page?: number;
    per_page?: number;
};

export async function searchFreelancersSimple(
    token: string,
    params: SearchFreelancersParams = {}
): Promise<NewAssignee[]> {
    // build querystring manually to avoid dependency on URLSearchParams (issue in RN Hermes)
    const qs = Object.entries({
        q: params.q ?? '',
        status: params.status ?? '',
        only_active: params.only_active ?? 1,
        page: params.page ?? 1,
        per_page: params.per_page ?? 20,
    })
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

    const url = qs ? `${API_ENDPOINTS.urlGetFreelancers}?${qs}` : API_ENDPOINTS.urlGetFreelancers;

    const resp = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Failed to load freelancers (${resp.status}) ${txt}`);
    }

    const data = await resp.json();
    // console.log('[ASSIGNEES][FREELANCERS]', data);

    const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
                ? data.data
                : [];

    // (Optional) guard if API uses success=false
    if (!Array.isArray(list) && data?.success === false) {
        throw new Error(data?.error || 'Failed to load freelancers');
    }

    // Normalise → NewAssignee
    const mapped: NewAssignee[] = list.map((x: any): NewAssignee => ({
        id: Number(x.id ?? x.freelancer_id ?? x.user_id ?? 0),
        name: String(x.name ?? x.full_name ?? x.display_name ?? 'Freelancer'),
        email: x.email ?? null,
        avatar_url: x.avatar_url ?? null,
    }));

    // console.log('[ASSIGNEES][FREELANCERS][MAPPED]', mapped);

    return mapped;
}