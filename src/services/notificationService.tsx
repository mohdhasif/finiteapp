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
    try { json = JSON.parse(raw); } catch { throw new Error('Server tidak mengembalikan JSON yang sah'); }
    if (!res.ok) {
        const msg = json?.error || `Ralat (HTTP ${res.status})`;
        throw new Error(msg);
    }
    return json;
};

export const getNotifications = async (token: string, opts: ListOptions = {}) => {
    const params = new URLSearchParams();
    if (opts.page) params.set('page', String(opts.page));
    if (opts.per_page) params.set('per_page', String(opts.per_page));
    if (opts.status) params.set('status', opts.status);

    const url = params.toString()
        ? `${API_ENDPOINTS.notificationsList}?${params.toString()}`
        : API_ENDPOINTS.notificationsList;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    const json = await parseJson(res);
    return {
        data: (json?.data ?? []) as NotificationItem[],
        total: json?.total ?? 0,
        page: json?.page ?? 1,
        per_page: json?.per_page ?? 20,
    };
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
