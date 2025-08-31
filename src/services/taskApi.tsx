// src/services/taskService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Server tidak mengembalikan JSON yang sah'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

const auth = (t: string) => ({ Authorization: `Bearer ${t}`, Accept: 'application/json' });

const appendQuery = (base: string, params?: Record<string, unknown>) => {
    const pairs = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (!pairs.length) return base;
    const q = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return `${base}${base.includes('?') ? '&' : '?'}${q}`;
};

export const getTasksByProject = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), { headers: auth(token) });
    return parse(res); // normalize di caller jika perlu
};

export const getAllTasks = async (
    token: string,
    opts: { status?: 'pending' | 'in_progress' | 'completed'; projectId?: number } = {}
) => {
    const url = appendQuery(API_ENDPOINTS.allTasks, { status: opts.status, project_id: opts.projectId });
    const res = await fetch(url, { headers: auth(token) });
    const json = await parse(res);
    return Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
};

export const getTaskDetails = async (token: string, taskId: number) => {
    const res = await fetch(API_ENDPOINTS.taskDetails(taskId), { headers: auth(token) });
    return parse(res);
};