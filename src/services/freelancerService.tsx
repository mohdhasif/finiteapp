// src/services/freelancerService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/apiConfig';

// ✅ Get freelancers
export const getFreelancers = async () => {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(API_ENDPOINTS.getFreelancers, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch freelancers');
    }

    return await response.json();
};

// ✅ Update freelancer
export const updateFreelancer = async ({
    freelancer_id,
    name,
    email,
    skillset,
    avatar,
    availability,
    status,
}: {
    freelancer_id: number;
    name: string;
    email: string;
    skillset: string;
    avatar: string | null;
    availability: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
}) => {
    try {
        const response = await fetch(API_ENDPOINTS.updateFreelancer, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                freelancer_id,
                name,
                email,
                skillset,
                avatar_url: avatar,
                availability: availability ? 1 : 0,
                status,
            }),
        });

        return await response.json(); // Expected format: { success: true/false, error: "" }
    } catch (error) {
        console.error('Update Freelancer Error:', error);
        return { success: false, error: 'Server error' };
    }
};

// ✅ Approve freelancer
export const approveFreelancer = async (freelancer_id: number) => {
    try {
        const response = await fetch(API_ENDPOINTS.approveFreelancer, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ freelancer_id }),
        });

        const text = await response.text();

        if (!response.ok) {
            return {
                success: false,
                error: `Server returned status ${response.status}`,
                raw: text,
            };
        }

        try {
            const data = JSON.parse(text);
            return data;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            return {
                success: false,
                error: 'Invalid server response (not valid JSON)',
                raw: text,
            };
        }
    } catch (error: any) {
        console.error('Approve Freelancer Error:', error);
        return {
            success: false,
            error: error.message || 'Server error',
        };
    }
};

