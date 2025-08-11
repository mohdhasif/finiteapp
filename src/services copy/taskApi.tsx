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

export const getTasksByProject = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), {
        headers: { Authorization: `Bearer ${token}` },
    });

    // Baca sebagai text dulu
    const raw = await res.text();

    let data;
    try {
        data = JSON.parse(raw);
    } catch (err) {
        console.error('JSON parse error:', err);
        throw new Error('Server tidak mengembalikan JSON yang sah');
    }

    if (!res.ok) {
        throw new Error(data?.error || `Gagal ambil tugasan (HTTP ${res.status})`);
    }

    return data;
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
