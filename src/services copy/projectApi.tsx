import { API_ENDPOINTS } from '../constants/apiConfig';

export const getProjects = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.projects);
        if (!response.ok) throw new Error('Gagal dapatkan projek');
        return await response.json();
    } catch (error) {
        console.error('Error getProjects:', error);
        throw error;
    }
};

export const createProject = async (payload: any) => {
    try {
        const response = await fetch(API_ENDPOINTS.projects, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Gagal cipta projek');
        return await response.json();
    } catch (error) {
        console.error('Error createProject:', error);
        throw error;
    }
};

export const getProjectById = async (id: number) => {
    try {
        const response = await fetch(API_ENDPOINTS.projectById(id));
        if (!response.ok) throw new Error('Gagal dapatkan projek');
        return await response.json();
    } catch (error) {
        console.error('Error getProjectById:', error);
        throw error;
    }
};
