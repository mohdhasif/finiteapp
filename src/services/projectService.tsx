// src/services/projectService.ts
import { API_ENDPOINTS } from '../constants/apiConfig';

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
    let json: any; try { json = JSON.parse(raw); } catch { throw new Error('Server tidak mengembalikan JSON yang sah'); }
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
};

const auth = (t: string) => ({ Accept: 'application/json', Authorization: `Bearer ${t}` });

export const getClientProjects = async (token: string) => {
    const res = await fetch(API_ENDPOINTS.clientProjects, { headers: auth(token) });
    return parse(res);
};

export const getProjectDetails = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectDetails(projectId), { headers: auth(token) });
    return parse(res);
};

export const fetchProjectTasks = async (token: string, projectId: number) => {
    const res = await fetch(API_ENDPOINTS.projectTasks(projectId), { headers: auth(token) });
    const json = await parse(res);
    return Array.isArray(json?.tasks) ? json.tasks : (Array.isArray(json) ? json : []);
};

export const getProjectSummaries = async (userToken: string): Promise<ProjectSummary[]> => {
    const res = await fetch(API_ENDPOINTS.projectSummaries, { headers: auth(userToken) });
    const json = await parse(res);
    return Array.isArray(json) ? json as ProjectSummary[] : (json ? [json as ProjectSummary] : []);
};

export const getProjectSummaryById = async (userToken: string, projectId: number): Promise<ProjectSummary> => {
    const res = await fetch(API_ENDPOINTS.projectSummary(projectId), { headers: auth(userToken) });
    return await parse(res) as ProjectSummary;
};
