// src/services/joinService.ts

import { API_ENDPOINTS } from '../constants/apiConfig';

export interface JoinFormPayload {
    name: string;
    email: string;
    phone: string;
    portfolio?: string;
    roles: string[];
}

export const submitJoinForm = async (payload: JoinFormPayload) => {
    try {
        const response = await fetch(API_ENDPOINTS.submitJoinForm, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Submission failed');
        }

        return await response.json();
    } catch (error) {
        // Remove console.error for production
        throw error;
    }
};
