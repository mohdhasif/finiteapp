// src/services/uploadService.tsx
import { API_ENDPOINTS } from '../constants/apiConfig';

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; 
    try { 
        json = JSON.parse(raw); 
    } catch { 
        throw new Error('Invalid JSON'); 
    }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

export const uploadLogo = async (
    token: string,
    logo: {
        uri: string;
        fileName?: string;
        type?: string;
    }
): Promise<{ success: boolean; message?: string; logo_url?: string }> => {
    const formData = new FormData();
    formData.append('logo', {
        uri: logo.uri,
        name: logo.fileName || 'logo.jpg',
        type: logo.type || 'image/jpeg',
    } as any);

    const res = await fetch(API_ENDPOINTS.uploadLogo, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return parse(res);
};

export const uploadAvatar = async (
    token: string,
    avatar: {
        uri: string;
        fileName?: string;
        type?: string;
    }
): Promise<{ success: boolean; message?: string; avatar_url?: string }> => {
    const formData = new FormData();
    formData.append('avatar', {
        uri: avatar.uri,
        name: avatar.fileName || 'avatar.jpg',
        type: avatar.type || 'image/jpeg',
    } as any);

    const res = await fetch(API_ENDPOINTS.uploadAvatar, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return parse(res);
};
