const API_BASE = 'https://fd9315becb7e.ngrok-free.app';

// export const getClientProjects = async (token: string) => {
//     const res = await fetch(`${API_BASE}/client_projects.php`, {
//         headers: { Authorization: `Bearer ${token}` },
//     });
//     if (!res.ok) throw new Error('Gagal ambil senarai projek');
//     return await res.json();
// };

export const getClientProjects = async (token: string) => {
    const response = await fetch(`${API_BASE}/client_projects.php`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    console.log('dapat token:', token);
    
    if (!response.ok) {
        throw new Error('Gagal ambil senarai projek');
    }

    const data = await response.json();
    return data;
};

export const getProjectDetails = async (token: string, projectId: number) => {
    const res = await fetch(`${API_BASE}/project_details.php?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Gagal ambil detail projek');
    return await res.json();
};

// services/projectService.ts
export const fetchProjectTasks = async (projectId: number) => {
    try {
        const response = await fetch(`${API_BASE}/project_tasks.php?project_id=${projectId}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to fetch tasks');
        return json.tasks; // Assuming server returns { tasks: [...] }
    } catch (error) {
        console.error('Fetch Project Tasks Error:', error);
        throw error;
    }
};
