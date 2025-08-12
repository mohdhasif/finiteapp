// src/services/calendarService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

export type ProjectCalendarEvent = {
    id: number;
    title: string;
    status: string | null;
    start_at: string | null;
    end_at: string | null;
    client_display: string | null;
};

export type GetCalendarOpts = {
    start_date?: string;
    end_date?: string;
};

export const getProjectsCalendar = async (
    token: string,
    opts: GetCalendarOpts = {},
): Promise<ProjectCalendarEvent[]> => {
    let url = API_ENDPOINTS.projectsCalendar;
    const queryParts: string[] = [];

    if (opts.start_date) queryParts.push(`start_date=${encodeURIComponent(opts.start_date)}`);
    if (opts.end_date) queryParts.push(`end_date=${encodeURIComponent(opts.end_date)}`);

    if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text();
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }

    if (!res.ok || json?.success === false) {
        const msg = json?.error || `Gagal ambil data calendar (HTTP ${res.status})`;
        throw new Error(msg);
    }

    return Array.isArray(json?.data) ? json.data : [];
};

export const toYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};
