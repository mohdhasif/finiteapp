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



export type ProjectSummary = {
    project_id: number;
    project_title: string;
    client_name: string;
    due_date: string | null;
    total_tasks: number;
    completed_tasks: number;
    progress_percent: number;
    freelancer_count: number;
    freelancer_avatars: string[];
    extra_freelancers: number;
};

const toJson = async (res: Response) => {
    const raw = await res.text();
    try { return JSON.parse(raw); } catch { throw new Error('Server tidak mengembalikan JSON yang sah'); }
};

const auth = (t: string) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${t}`,
});


export const getProjectSummaries = async (userToken: string): Promise<ProjectSummary[]> => {
    const token = userToken?.trim();
    if (!token) throw new Error('Missing userToken');

    const res = await fetch(API_ENDPOINTS.projectSummaries, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    console.log(text);

    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error('Server tidak mengembalikan JSON yang sah'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

    return Array.isArray(json) ? json as ProjectSummary[] : (json ? [json as ProjectSummary] : []);
};

export const getProjectSummaryById = async (userToken: string, projectId: number): Promise<ProjectSummary> => {
    const token = (userToken ?? '').trim();
    if (!token) throw new Error('Missing userToken');
    if (!projectId || projectId <= 0) throw new Error('projectId tidak sah');

    const res = await fetch(API_ENDPOINTS.projectSummary(projectId), { headers: auth(token) });
    const json = await toJson(res);
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json as ProjectSummary;
};
