// src/services/clientService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/apiConfig';

// ✅ Get clients
export const getClients = async () => {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(API_ENDPOINTS.getClients, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
    }

    return await response.json();
};

// ✅ Update client
export const updateClient = async ({
    client_id,
    company_name,
    phone,
    status,
    client_type,
    logo_url,
}: {
    client_id: number;
    company_name: string;
    phone: string;
    status: string;
    client_type: string;
    logo_url: string | null;
}) => {
    try {
        const response = await fetch(API_ENDPOINTS.updateClient, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id,
                company_name,
                phone,
                status,
                client_type,
                logo_url,
            }),
        });

        return await response.json(); // { success: true/false, error: "" }
    } catch (error) {
        console.error('Update Client Error:', error);
        return { success: false, error: 'Server error' };
    }
};

// ✅ Approve client
export const approveClient = async (client_id: number) => {
    try {
        const response = await fetch(API_ENDPOINTS.approveClient, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id }),
        });

        const resText = await response.text();
        console.log('Server response:', resText);

        try {
            return JSON.parse(resText);
        } catch (error) {
            console.error('JSON Parse Error:', error);
            return { success: false, error: 'Invalid server response (not JSON)' };
        }
    } catch (error) {
        console.error('Approve Client Error:', error);
        return { success: false, error: 'Server error' };
    }
};
