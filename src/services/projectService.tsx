// src/services/projectService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';
import { resolveWithLocalIfUnchanged, fallbackToLocal } from './localDb';

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

const parse = async (res: Response) => {
    const raw = await res.text();
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Server did not return valid JSON'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

const parseText = (text: string) => {
    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error('Server did not return valid JSON');
    }
    return json;
};

const auth = (t: string) => ({ Accept: 'application/json', Authorization: `Bearer ${t}` });

export const getClientProjects = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.clientProjects, { headers: auth(token) });
    const text = await res.text();
    // console.log(text);
    if (!res.ok) {
        const json = parseText(text);
        throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return parseText(text);
};

export const getProjectDetails = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectDetails(projectId), { headers: auth(token) });
    const text = await res.text();
    // console.log('raw project details: ', text);
    
    if (!res.ok) {
        const json = parseText(text);
        throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return parseText(text);
};

export const getProjectFreelancers = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectFreelancers(projectId), { headers: auth(token) });
    const text = await res.text();
    // console.log('projectFreelancers', text);

    if (!res.ok) {
        const json = parseText(text);
        throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return parseText(text);
};

export const fetchProjectTasks = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), { headers: auth(token) });
    const json = await parse(res);
    return Array.isArray(json?.tasks) ? json.tasks : (Array.isArray(json) ? json : []);
};

export const getProjectSummaries = async (userToken: string): Promise<ProjectSummary[]> => {
    try {
        const res = await fetch(API_ENDPOINTS.projectSummaries, { headers: auth(userToken) });
        const json = await parse(res);
        const projects = Array.isArray(json) ? json as ProjectSummary[] : (json ? [json as ProjectSummary] : []);
        const projectsWithAvatars = projects.map(project => ({
            ...project,
            freelancer_avatars: project.freelancer_avatars || [],
            freelancer_count: project.freelancer_count || 0,
            extra_freelancers: project.extra_freelancers || 0,
        }));
        return await resolveWithLocalIfUnchanged('projectSummaries', projectsWithAvatars, (p) => p.project_id);
    } catch (e) {
        return await fallbackToLocal<ProjectSummary>('projectSummaries', []);
    }
};

export const getProjectSummaryById = async (userToken: string, projectId: number): Promise<ProjectSummary> => {
    const res = await fetch(API_ENDPOINTS.projectSummary(projectId), { headers: auth(userToken) });
    return await parse(res) as ProjectSummary;
};




type CreateProjectPayload = {
    title: string;
    client_id: number;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | null;
    start_at: string | null; // 'YYYY-MM-DD HH:mm:ss' or null
    end_at: string | null;   // ✅ ensure exists
    status: 'pending' | 'in_progress' | 'completed';
    progress: number; // 0-100
    // Optional if backend support:
    // due_date?: string | null; // 'YYYY-MM-DD'
};

export const createProject = async (token: string, body: CreateProjectPayload) => {
    const res = await fetch(API_ENDPOINTS.createProject, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const raw = await res.text();
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server did not return valid JSON');
    }

    if (!res.ok || json?.success === false) {
        const msg = json?.error || `Failed to create project (HTTP ${res.status})`;
        throw new Error(msg);
    }
    return json;
};

type UpdateProjectPayload = CreateProjectPayload & { project_id: number };

export const updateProject = async (token: string, body: UpdateProjectPayload) => {
    const res = await fetch(API_ENDPOINTS.updateProject, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const raw = await res.text();
    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new Error('Server did not return valid JSON');
    }

    if (!res.ok || json?.success === false) {
        const msg = json?.error || `Failed to update project (HTTP ${res.status})`;
        throw new Error(msg);
    }
    return json;
};

export const deleteProject = async (token: string, projectId: number) => {
    const t = (token ?? '').trim();
    if (!t) throw new Error('Missing userToken');
    if (!projectId) throw new Error('Invalid projectId');

    const res = await fetch(API_ENDPOINTS.deleteProject, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${t}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
    });

    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error('Server did not return valid JSON'); }

    if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Failed to delete project (HTTP ${res.status})`);
    }

    return json as {
        success: true;
        message?: string;
        project_title?: string;
        client_company?: string;
        notification_sent?: boolean;
    };
};

export const getProjectSummariesClient = async (userToken: string): Promise<ProjectSummary[]> => {
    const res = await fetch(API_ENDPOINTS.projectSummariesClient, { headers: auth(userToken) });
    const json = await parse(res);
    // console.log('getProjectSummaries raw response:', JSON.stringify(json, null, 2));

    const projects = Array.isArray(json) ? json as ProjectSummary[] : (json ? [json as ProjectSummary] : []);

    // Ensure freelancer_avatars is properly set for each project
    const projectsWithAvatars = projects.map(project => ({
        ...project,
        freelancer_avatars: project.freelancer_avatars || [],
        freelancer_count: project.freelancer_count || 0,
        extra_freelancers: project.extra_freelancers || 0,
    }));

    return projectsWithAvatars;
};



export type ProjectOption = {
    id: number;
    title: string;
    client_id: number | null;
    client_name: string | null;
};

export const getProjectsOptions = async (token: string): Promise<ProjectOption[]> => {
    const res = await fetch(API_ENDPOINTS.projectsOptions, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch {
        throw new Error('Server did not return valid JSON');
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to fetch project (HTTP ${res.status})`);
    }

    return Array.isArray(json.data) ? json.data : [];
};