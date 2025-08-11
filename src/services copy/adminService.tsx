// src/services/adminService.ts (or wherever appropriate)

import { API_ENDPOINTS } from '../constants/apiConfig';

export const fetchClients = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.getClients);
        if (!response.ok) throw new Error('Gagal fetch clients');
        return await response.json();
    } catch (error) {
        console.error('Fetch clients error:', error);
        return [];
    }
};

export const fetchFreelancers = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.getFreelancers);
        if (!response.ok) throw new Error('Gagal fetch freelancers');
        return await response.json();
    } catch (error) {
        console.error('Fetch freelancers error:', error);
        return [];
    }
};
