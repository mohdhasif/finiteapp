// src/constants/apiConfig.ts

export const BASE_URL = 'https://fd9315becb7e.ngrok-free.app/';

export const API_ENDPOINTS = {

    approveClient: `${BASE_URL}approve_client.php`,
    approveFreelancer: `${BASE_URL}approve_freelancer.php`,
    getFreelancers: `${BASE_URL}get_freelancers.php`,
    getClients: `${BASE_URL}get_clients.php`,
    updateClient: `${BASE_URL}update_client.php`,
    updateFreelancer: `${BASE_URL}update_freelancer.php`,

    clientProjects: `${BASE_URL}/client_projects.php`,
    projectDetails: (projectId: number) => `${BASE_URL}/project_details.php?project_id=${projectId}`,

    projects: `${BASE_URL}/get_projects.php`,
    projectById: (id: number) => `${BASE_URL}/projects/${id}`,
    // Tambah lagi bila perlu

    projectTasks: (projectId: number) => `${BASE_URL}/project_tasks.php?project_id=${projectId}`,
    projectTasksPublic: (projectId: number) => `${BASE_URL}/project_tasks_public.php?project_id=${projectId}`,
    taskDetails: (taskId: number) => `${BASE_URL}/task_details.php?task_id=${taskId}`,
    getTasksByProjectId: (projectId: number) => `${BASE_URL}/projects/${projectId}/tasks`,
    updateTaskStatus: (taskId: number) => `${BASE_URL}/tasks/${taskId}`,



    submitJoinForm: `${BASE_URL}/freelancers.php`,

    submitDiscoveryForm: `${BASE_URL}/submit_discovery.php`,


    login: `${BASE_URL}/login.php`,
    uploadLogo: `${BASE_URL}/upload_logo.php`,







    allTasks: `${BASE_URL}/tasks_all.php`,

};
