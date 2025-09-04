// src/services/clientService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';
import { resolveWithLocalIfUnchanged, fallbackToLocal } from './localDb';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const getClients = async (token?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const res = await fetch(API_ENDPOINTS.getClients, { headers });
        const json = await parse(res);
        const items = Array.isArray((json as any)?.data) ? (json as any).data : Array.isArray(json) ? (json as any) : [];
        const persisted = await resolveWithLocalIfUnchanged('allClients', items, (x: any) => x.id ?? x.client_id ?? JSON.stringify(x));
        return { ...json, data: persisted };
    } catch (e) {
        const persisted = await fallbackToLocal<any>('allClients', []);
        return { success: true, data: persisted } as any;
    }
};

export const updateClient = async (
    token: string,
    payload: {
        client_id: number;
        company_name: string;
        phone: string;
        status: string;
        client_type: string;
        logo?: { uri: string; name: string; type: string } | null; // fail baru
        logo_url?: string | null; // old url if keep existing
    }
) => {
    const formData = new FormData();

    formData.append('client_id', String(payload.client_id));
    formData.append('company_name', payload.company_name ?? '');
    formData.append('phone', payload.phone ?? '');
    formData.append('status', payload.status ?? 'pending');
    formData.append('client_type', payload.client_type ?? 'company');

    if (payload.logo) {
        formData.append('logo', payload.logo as any);
    } else if (payload.logo_url) {
        formData.append('logo', payload.logo_url);
    }

    const res = await fetch(API_ENDPOINTS.updateClient, {
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

    return json; // { success, message?, logo_url? }
};


export const approveClient = async (token: string, client_id: number) => {
    const res = await fetch(API_ENDPOINTS.approveClient, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ client_id }),
    });
    return parse(res);
};
