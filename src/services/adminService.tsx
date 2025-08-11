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






export type AdminRawClient = {
    client_id: number | string;
    name: string | null;
    company_name: string | null;
    client_type: 'company' | 'individual';
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'non-active';
    // field lain wujud tapi tak digunakan di sini
};

export type AdminClientOption = {
    value: number; // clients.id
    label: string; // company_name (company) atau users.name (individual)
    client_type: 'company' | 'individual';
    status?: AdminRawClient['status'];
};

function displayName(row: AdminRawClient): string {
    const company = (row.company_name ?? '').trim();
    const person = (row.name ?? '').trim();
    if (row.client_type === 'company') {
        return company || person || 'Unnamed';
    }
    return person || company || 'Unnamed';
}

/** Ambil raw clients dari get_clients.php */
export async function fetchAdminClients(token?: string): Promise<AdminRawClient[]> {
    const res = await fetch(API_ENDPOINTS.getClients, {
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const raw = await res.text();
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }

    if (!res.ok) {
        throw new Error(`Gagal ambil klien (HTTP ${res.status})`);
    }
    return Array.isArray(json) ? (json as AdminRawClient[]) : [];
}

/**
 * Pulangkan list yang siap untuk picker: {label, value}
 * opts.statusIn → tapis ikut status (client_status) di frontend (optional)
 * opts.sort → 'label' (default) | 'id'
 */
export async function getClientsOptions(
    token?: string,
    opts?: { statusIn?: AdminRawClient['status'][]; sort?: 'label' | 'id' }
): Promise<AdminClientOption[]> {
    const raw = await fetchAdminClients(token);

    let filtered = raw;
    if (opts?.statusIn && opts.statusIn.length) {
        const set = new Set(opts.statusIn);
        filtered = raw.filter(r => (r.status ? set.has(r.status) : true));
    }

    const mapped: AdminClientOption[] = filtered.map(r => ({
        value: Number(r.client_id),
        label: displayName(r),
        client_type: r.client_type,
        status: r.status,
    }));

    if ((opts?.sort ?? 'label') === 'label') {
        mapped.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    } else {
        mapped.sort((a, b) => a.value - b.value);
    }

    return mapped;
}
