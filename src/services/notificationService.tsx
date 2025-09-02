// src/services/notificationService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

export type NotificationItem = {
    id: number;
    user_id: number;
    title: string;
    body: string;
    type?: string | null;
    data?: any;
    created_at: string;   // ISO
    read_at?: string | null;
};

type ListOptions = {
    page?: number;       // 1-based
    per_page?: number;   // default 20
    status?: 'all' | 'unread' | 'read';
};

const parseJson = async (res: Response) => {
    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error('Server did not return valid JSON'); }
    if (!res.ok) {
        const msg = json?.error || `Error (HTTP ${res.status})`;
        throw new Error(msg);
    }
    return json;
};

export const getBadgeCount = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.notificationsBadge, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const json = await parseJson(res);
    return json?.unread ?? 0;
};

export const markAsRead = async (token: string, id: number) => {
    const res = await fetch(`${API_ENDPOINTS.notificationsMarkRead}?id=${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    await parseJson(res);
    return true;
};

export const markAllAsRead = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.notificationsMarkAllRead, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    await parseJson(res);
    return true;
};

// Optional: create notification from client (admin panel use case)
export const createNotification = async (
    token: string,
    payload: { user_id: number; title: string; body: string; type?: string; data?: any; push?: boolean }
) => {
    const res = await fetch(API_ENDPOINTS.notificationsCreate, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const json = await parseJson(res);
    return json;
};




const qs = (obj: Record<string, any>) =>
    Object.entries(obj)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

export const getNotifications = async (
    token: string,
    opts: { page: number; per_page: number; status: 'all' | 'unread' }
) => {
    // sokong dua bentuk: endpoint string ATAU function
    const endpoint = (API_ENDPOINTS as any).notificationsList;
    const url =
        typeof endpoint === 'function'
            ? endpoint(opts.page, opts.per_page, opts.status)
            : `${endpoint}?${qs({ page: opts.page, per_page: opts.per_page, status: opts.status })}`;

    // console.log('[SVC][REQ]', { url, tokenLen: token?.length || 0 });

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token || ''}`, Accept: 'application/json' },
    });
    const raw = await res.text();
    // console.log('[SVC][RES]', { status: res.status, ok: res.ok });
    // console.log('[SVC][RAW]', raw.slice(0, 200));

    let json: any;
    try { json = JSON.parse(raw); }
    catch { throw new Error('Invalid JSON from server: ' + raw.slice(0, 120)); }

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

    const data =
        (Array.isArray(json?.data) && json.data) ||
        (Array.isArray(json?.notifications) && json.notifications) ||
        (Array.isArray(json?.items) && json.items) ||
        (Array.isArray(json) && json) ||
        [];

    const total =
        typeof json?.total === 'number' ? json.total :
            typeof json?.count === 'number' ? json.count :
                (Array.isArray(data) ? data.length : 0);

    return { data, total };
};
