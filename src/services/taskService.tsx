import { API_ENDPOINTS } from '../constants/apiConfig';

export const getTasksByProject = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil tugasan');
    return await res.json();
};

export const getTaskDetails = async (token: string, taskId: number) => {
    const res = await fetch(API_ENDPOINTS.taskDetails(taskId), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil detail task');
    return await res.json();
};
