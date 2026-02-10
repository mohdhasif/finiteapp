// src/services/projectApi.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const getProjects = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.projects, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return parse(res);
};

export const createProject = async (token: string, payload: any) => {
    const res = await fetch(API_ENDPOINTS.projects, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    return parse(res);
};