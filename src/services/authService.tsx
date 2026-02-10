// src/services/authService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

export type UserDetails = {
    id: number;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    gender?: 'male' | 'female' | '';
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
};

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
        throw new Error('Server returned invalid response.');
    }

    if (!res.ok || json?.success !== true) {
        throw new Error(json?.message || `Failed to change password (HTTP ${res.status})`);
    }

    return json as ChangePasswordResponse;
};

export const getUserDetails = async (token: string): Promise<UserDetails> => {
    const res = await fetch(API_ENDPOINTS.me, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const raw = await res.text();
    // console.log('API Response Status:', res.status);
    // console.log('API Response Headers:', res.headers);
    // console.log('Raw Response:', raw);

    let json: any;
    try {
        json = JSON.parse(raw);
    } catch (e) {
        // console.log('JSON Parse Error:', e);
        throw new Error('Server returned invalid response.');
    }

    // console.log('Parsed JSON:', json);
    // console.log('JSON keys:', Object.keys(json));

    // Only check HTTP status, not success field (like other services)
    if (!res.ok) {
        throw new Error(json?.message || json?.error || `Failed to get user information (HTTP ${res.status})`);
    }

    // Try different possible data structures
    const userData = json.data || json.user || json;
    
    // Validate that we have the required fields
    if (!userData || !userData.id || !userData.name) {
        // console.log('Invalid user data structure:', userData);
        throw new Error('User data is incomplete');
    }

    return userData as UserDetails;
};

export const login = async (email: string, password: string): Promise<{ token: string; user: any }> => {
    const res = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const raw = await res.text();
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch (e) {
        throw new Error('Server returned invalid response.');
    }

    if (!res.ok || !json?.token) {
        throw new Error(json?.message || json?.error || `Failed to login (HTTP ${res.status})`);
    }

    return json;
};

export const claimInstallSubscriptions = async (token: string, installId: string): Promise<any> => {
    try {
        const res = await fetch(API_ENDPOINTS.claimInstallSubscriptions, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ install_id: installId }),
        });

        const raw = await res.text();
        let json: any;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            // Remove console.warn for production
            throw new Error('Invalid server response format');
        }

        if (!res.ok) {
            // Remove console.warn for production
            throw new Error(json?.message || json?.error || `Request failed (HTTP ${res.status})`);
        }

        return json;
    } catch (error) {
        // Remove console.warn for production
        if (error instanceof Error) {
            throw new Error(`Installation claim failed: ${error.message}`);
        }
        throw new Error('Installation claim failed');
    }
};
