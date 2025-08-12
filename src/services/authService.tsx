// src/services/authService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

type ChangePasswordResponse = {
    success: boolean;
    message?: string;
};

export const changePassword = async (
    token: string,
    oldPassword: string,
    newPassword: string
): Promise<ChangePasswordResponse> => {
    const res = await fetch(API_ENDPOINTS.changePassword, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
        }),
    });

    const raw = await res.text();
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch (e) {
        throw new Error('Server mengembalikan respons tidak sah.');
    }

    if (!res.ok || json?.success !== true) {
        throw new Error(json?.message || `Gagal tukar kata laluan (HTTP ${res.status})`);
    }

    return json as ChangePasswordResponse;
};
