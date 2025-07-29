const API_BASE = 'https://fd9315becb7e.ngrok-free.app';

export const getTasksByProject = async (token: string, projectId: number) => {
    const res = await fetch(`${API_BASE}/project_tasks.php?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil tugasan');
    return await res.json();
};

export const getTaskDetails = async (token: string, taskId: number) => {
    const res = await fetch(`${API_BASE}/task_details.php?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil detail task');
    return await res.json();
};
