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
    const text = await res.text();
    try {
        const result = JSON.parse(text);
        return result;
    } catch (error) {
        console.log('Error parsing JSON:', error);
    }
    // return parse(res);
};

export const fetchFreelancers = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.getFreelancers, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const text = await res.text();
    try {
        const result = JSON.parse(text);
        return result;
    } catch (error) {
        console.log('Error parsing JSON:', error);
    }
    // return parse(res);
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


























const jsonHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function getMyProfile(token: string): Promise<MyProfile> {
    const res = await fetch(API_ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const raw = await res.text();
    
    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error('JSON tidak sah'); }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Gagal dapatkan profil (HTTP ${res.status})`);
    }
    return json.data as MyProfile;
}

export async function updateMyProfile(
    token: string,
    payload: Partial<MyProfile>
): Promise<MyProfile> {
    const res = await fetch(API_ENDPOINTS.updateMe, {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
    });
    const raw = await res.text();
    console.log('raw:', raw);

    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error('JSON tidak sah'); }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Gagal kemaskini profil (HTTP ${res.status})`);
    }
    return json.data as MyProfile;
}

export async function uploadAvatar(
    token: string,
    fileUri: string,
    filename = 'avatar.jpg',
    mimeType = 'image/jpeg'
): Promise<string> {
    const form = new FormData();
    form.append('avatar', {
        // @ts-ignore - React Native FormData file
        uri: fileUri,
        name: filename,
        type: mimeType,
    });

    const res = await fetch(API_ENDPOINTS.uploadAvatar, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error('JSON tidak sah'); }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Gagal upload avatar (HTTP ${res.status})`);
    }
    return json.url as string; // URL avatar baru
}




export type MyProfile = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    gender?: 'male' | 'female' | null;
    dob?: string | null;
    avatar_url?: string | null;
};

// Tambah fungsi multipart
export async function updateMyProfileForm(
    token: string,
    form: FormData
): Promise<{ success: boolean; message?: string; error?: string; data?: MyProfile }> {
    const res = await fetch(API_ENDPOINTS.updateMe, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
        body: form,
    });

    const text = await res.text();
    console.log(text);

    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error('Invalid server response');
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Gagal kemaskini profil (HTTP ${res.status})`);
    }

    return json as any;
}
