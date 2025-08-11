// src/services/adminService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const fetchClients = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.getClients, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return parse(res);
};

export const fetchFreelancers = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.getFreelancers, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return parse(res);
};
