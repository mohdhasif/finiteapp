// src/services/freelancerService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const getFreelancers = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.getFreelancers, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return parse(res);
};

export const updateFreelancer = async (token: string, payload: {
    freelancer_id: number;
    name: string; email: string; skillset: string;
    avatar: string | null; availability: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
}) => {
    const res = await fetch(API_ENDPOINTS.updateFreelancer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({
            freelancer_id: payload.freelancer_id,
            name: payload.name,
            email: payload.email,
            skillset: payload.skillset,
            avatar_url: payload.avatar,
            availability: payload.availability ? 1 : 0,
            status: payload.status,
        }),
    });
    return parse(res); // { success, error? }
};

export const approveFreelancer = async (token: string, freelancer_id: number) => {
    const res = await fetch(API_ENDPOINTS.approveFreelancer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ freelancer_id }),
    });
    return parse(res);
};
