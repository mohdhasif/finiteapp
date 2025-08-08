// src/services/discoveryService.ts

import { API_ENDPOINTS } from '../constants/apiConfig';

export const submitDiscoveryForm = async (formData: {
    clientType: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    selectedServices: string[];
}) => {
    try {
        const response = await fetch(API_ENDPOINTS.submitDiscoveryForm, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const text = await response.text();
        console.log('RAW RESPONSE:', text); // Debug log

        let json: any = null;
        try {
            json = JSON.parse(text);
        } catch (err) {
            throw new Error('Server replied with invalid JSON: ' + text);
        }

        if (!response.ok) {
            throw new Error(json.message || 'Something went wrong');
        }

        return json;
    } catch (error: any) {
        console.error('API Error:', error);
        throw new Error(error.message || 'Unknown error');
    }
};
