const BASE_URL = 'https://fd9315becb7e.ngrok-free.app/';

export const getProjects = async () => {
    try {
        const response = await fetch(`${BASE_URL}/projects`);
        if (!response.ok) throw new Error('Gagal dapatkan projek');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const createProject = async (payload: any) => {
    try {
        const response = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const getProjectById = async (id: number) => {
    try {
        const response = await fetch(`${BASE_URL}/projects/${id}`);
        if (!response.ok) throw new Error('Gagal dapatkan projek');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
