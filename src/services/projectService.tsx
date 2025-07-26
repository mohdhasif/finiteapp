const API_BASE = 'https://f57d73d76263.ngrok-free.app';

export const getClientProjects = async (token: string) => {
    const res = await fetch(`${API_BASE}/client_projects.php`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil senarai projek');
    return await res.json();
};

export const getProjectDetails = async (token: string, projectId: number) => {
    const res = await fetch(`${API_BASE}/project_details.php?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil detail projek');
    return await res.json();
};
