// src/services/projectService.ts

import { API_ENDPOINTS } from '../constants/apiConfig';

export const getClientProjects = async (token: string) => {
    try {
        const response = await fetch(API_ENDPOINTS.clientProjects, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Gagal ambil senarai projek');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getClientProjects:', error);
        throw error;
    }
};

export const getProjectDetails = async (token: string, projectId: number) => {
    try {
        const res = await fetch(API_ENDPOINTS.projectDetails(projectId), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error('Gagal ambil detail projek');
        }

        return await res.json();
    } catch (error) {
        console.error('Error getProjectDetails:', error);
        throw error;
    }
};

export const fetchProjectTasks = async (projectId: number) => {
    try {
        const response = await fetch(API_ENDPOINTS.projectTasks(projectId));
        const json = await response.json();

        if (!response.ok) throw new Error(json.error || 'Failed to fetch tasks');
        return json.tasks; // Assuming response structure is { tasks: [...] }
    } catch (error) {
        console.error('Fetch Project Tasks Error:', error);
        throw error;
    }
};
