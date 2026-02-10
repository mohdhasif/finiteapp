// src/services/adminService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';
import { resolveWithLocalIfUnchanged, fallbackToLocal, computeDigest } from './localDb';

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
        // Return the data array from the response
        return result.data || [];
    } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid JSON response');
    }
};

export const fetchFreelancers = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.getFreelancers, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const text = await res.text();
    try {
        const result = JSON.parse(text);
        // Freelancers API returns data directly, not wrapped in data property
        return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid JSON response');
    }
};



export const fetchClientsOnlyApproved = async (token: string) => {
    try {
        const res = await fetch(API_ENDPOINTS.getApprovedClients, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const text = await res.text();
        const result = JSON.parse(text);
        const items = result.data || [];
        // If server returns same content (by digest), serve locally stored list instead
        return await resolveWithLocalIfUnchanged('approvedClients', items, (x: any) => x.client_id ?? x.id ?? JSON.stringify(x));
    } catch (error) {
        // Network or parse failed → fallback to local NoSQL
        return await fallbackToLocal('approvedClients', []);
    }
};

export const fetchFreelancersOnlyApproved = async (token: string) => {
    try {
        const res = await fetch(API_ENDPOINTS.getApprovedFreelancers, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const text = await res.text();
        const result = JSON.parse(text);
        const items = Array.isArray(result) ? result : (result.data || []);
        return await resolveWithLocalIfUnchanged('approvedFreelancers', items, (x: any) => x.id ?? x.user_id ?? JSON.stringify(x));
    } catch (error) {
        return await fallbackToLocal('approvedFreelancers', []);
    }
};


export type AdminRawClient = {
    client_id: number | string;
    name: string | null;
    company_name: string | null;
    client_type: 'company' | 'individual';
    status?: 'pending' | 'approved' | 'rejected' | 'active' | 'non-active';
    // other fields exist but not used here
};

export type AdminClientOption = {
    value: number; // clients.id
    label: string; // company_name (company) or users.name (individual)
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

/** Get raw clients from get_clients.php */
export async function fetchAdminClients(token?: string): Promise<AdminRawClient[]> {
    console.log('fetchAdminClients called with token:', !!token);

    try {
        const res = await fetch(API_ENDPOINTS.getApprovedClients, {
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        console.log('Response status:', res.status);
        console.log('Response headers:', Object.fromEntries(res.headers.entries()));

        const raw = await res.text();
        console.log('Raw response text:', raw);

        if (!raw || raw.trim() === '') {
            console.error('Empty response received');
            return [];
        }

        let json: unknown;
        try {
            json = JSON.parse(raw);
            console.log('Parsed JSON:', json);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw text that failed to parse:', raw);
            throw new Error('Server did not return valid JSON');
        }

        if (!res.ok) {
            console.error('HTTP error:', res.status, json);
            throw new Error(`Failed to fetch clients (HTTP ${res.status})`);
        }

        // Handle different response formats
        let clients: AdminRawClient[] = [];

        if (Array.isArray(json)) {
            clients = json as AdminRawClient[];
        } else if (json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)) {
            clients = json.data as AdminRawClient[];
        } else if (json && typeof json === 'object' && 'clients' in json && Array.isArray(json.clients)) {
            clients = json.clients as AdminRawClient[];
        } else {
            console.error('Unexpected response format:', json);
            return [];
        }

        console.log('Extracted clients:', clients);
        console.log('Clients count:', clients.length);

        return clients;

    } catch (error) {
        console.error('fetchAdminClients error:', error);
        throw error;
    }
}

/**
 * Return list ready for picker: {label, value}
 * opts.statusIn → filter by status (client_status) in frontend (optional)
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

    let json: any; try { json = JSON.parse(raw); } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid JSON response');
    }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to get profile (HTTP ${res.status})`);
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
    // console.log('raw:', raw);

    let json: any; try { json = JSON.parse(raw); } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid JSON response');
    }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to update profile (HTTP ${res.status})`);
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
    let json: any; try { json = JSON.parse(raw); } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid JSON response');
    }
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to upload avatar (HTTP ${res.status})`);
    }
    return json.url as string; // New avatar URL
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

// Add multipart function
export async function updateMyProfileForm(
    token: string,
    form: FormData
): Promise<{ success: boolean; message?: string; error?: string; data?: MyProfile }> {
    const res = await fetch(API_ENDPOINTS.updateMe, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: form,
    });

    const text = await res.text();
    // console.log(text);

    let json: any; try {
        json = JSON.parse(text);
    } catch (error) {
        // Remove console.log for production
        throw new Error('Invalid server response');
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to update profile (HTTP ${res.status})`);
    }

    return json as any;
}
