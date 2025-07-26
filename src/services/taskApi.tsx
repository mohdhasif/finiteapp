const BASE_URL = 'https://your-backend-url.com/api';

export const getTasksByProjectId = async (projectId: number) => {
    try {
        const response = await fetch(`${BASE_URL}/projects/${projectId}/tasks`);
        if (!response.ok) throw new Error('Gagal dapatkan task projek');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const updateTaskStatus = async (taskId: number, status: string) => {
    try {
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
