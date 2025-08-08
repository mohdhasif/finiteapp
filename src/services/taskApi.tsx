// src/services/taskService.ts

import { API_ENDPOINTS } from '../constants/apiConfig';

export const getTasksByProjectId = async (projectId: number) => {
    try {
        const response = await fetch(API_ENDPOINTS.getTasksByProjectId(projectId));
        if (!response.ok) throw new Error('Gagal dapatkan task projek');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const updateTaskStatus = async (taskId: number, status: string) => {
    try {
        const response = await fetch(API_ENDPOINTS.updateTaskStatus(taskId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Gagal kemas kini status task');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
