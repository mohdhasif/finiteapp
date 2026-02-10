// src/services/freelancerService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';
import { resolveWithLocalIfUnchanged, fallbackToLocal } from './localDb';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const getFreelancers = async (token?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const res = await fetch(API_ENDPOINTS.getFreelancers, { headers });
        const json = await parse(res);
        const items = Array.isArray(json) ? (json as any[]) : Array.isArray((json as any)?.data) ? (json as any).data : [];
        const persisted = await resolveWithLocalIfUnchanged('allFreelancers', items, (x: any) => x.id ?? x.user_id ?? JSON.stringify(x));
        return Array.isArray(json) ? persisted : { ...(json as any), data: persisted } as any;
    } catch (e) {
        const persisted = await fallbackToLocal<any>('allFreelancers', []);
        return { success: true, data: persisted } as any;
    }
};

export const updateFreelancer = async (token: string, payload: {
    freelancer_id: number;
    name: string; email: string; skillset: string;
    avatar?: { uri: string; name: string; type: string } | null; // file baru
    avatar_url?: string | null; // old url if keep existing
    availability: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
}) => {
    
    // Check if freelancer_id is provided
    if (!payload.freelancer_id) {
        throw new Error('freelancer_id is required');
    }
    
    const formData = new FormData();

    formData.append('freelancer_id', String(payload.freelancer_id));
    formData.append('name', payload.name ?? '');
    formData.append('email', payload.email ?? '');
    formData.append('skillset', payload.skillset ?? '');
    formData.append('availability', payload.availability ? '1' : '0');
    formData.append('status', payload.status ?? 'pending');

    if (payload.avatar) {
        formData.append('avatar', payload.avatar as any);
    } else if (payload.avatar_url) {
        formData.append('avatar', payload.avatar_url);
    }

    const res = await fetch(API_ENDPOINTS.updateFreelancer, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            // ❌ Don't set 'Content-Type' manually for FormData
        },
        body: formData,
    });

    const text = await res.text();
    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(`Invalid server response: ${text}`);
    }

    if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `HTTP ${res.status}`);
    }

    return json; // { success, message?, avatar_url? }
};

export const approveFreelancer = async (token: string, freelancer_id: number) => {
    const res = await fetch(API_ENDPOINTS.approveFreelancer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ freelancer_id }),
    });
    return parse(res);
};
