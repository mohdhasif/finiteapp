// src/constants/apiConfig.ts

import { url } from "inspector";

// 1) Buang trailing slash untuk elak `//`
export const BASE_URL = 'https://a3d5e73f0172.ngrok-free.app';

// 2) Helper untuk build URL + query params dengan selamat
const join = (base: string, path: string) =>
    `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

const qs = (params?: Record<string, unknown>) =>
    Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

export const buildUrl = (path: string, params?: Record<string, unknown>) => {
    const url = join(BASE_URL, path);
    const query = qs(params);
    return query ? `${url}?${query}` : url;
};

export const API_ENDPOINTS = {
    // ---- Clients / Freelancers
    approveClient: buildUrl('approve_client.php'),
    approveFreelancer: buildUrl('approve_freelancer.php'),
    getFreelancers: buildUrl('get_freelancers.php'),
    getClients: buildUrl('get_clients.php'),
    updateClient: buildUrl('update_client.php'),
    updateFreelancer: buildUrl('update_freelancer.php'),

    // ---- Projects
    clientProjects: buildUrl('client_projects.php'),
    projectDetails: (projectId: number) => buildUrl('project_details.php', { project_id: projectId }),
    projectFreelancers: (projectId: number) => buildUrl('get_project_freelancers.php', { project_id: projectId }),
    projects: buildUrl('get_projects.php'),
    projectById: (id: number) => buildUrl(`projects/${id}`), // jika memang ada endpoint REST
    projectTasks: (projectId: number) => buildUrl('project_tasks.php', { project_id: projectId }),
    projectTasksPublic: (projectId: number) => buildUrl('project_tasks_public.php', { project_id: projectId }),
    taskDetails: (taskId: number) => buildUrl('task_details.php', { task_id: taskId }),
    getTasksByProjectId: (projectId: number) => buildUrl(`projects/${projectId}/tasks`), // kalau wujud
    updateTaskStatus: (taskId: number) => buildUrl(`tasks/${taskId}`), // kalau wujud

    // ---- Forms / Auth / Uploads
    submitJoinForm: buildUrl('freelancers.php'),
    submitDiscoveryForm: buildUrl('submit_discovery.php'),
    login: buildUrl('login.php'),
    uploadLogo: buildUrl('upload_logo.php'),

    // ---- Tasks list (admin/client)
    allTasks: buildUrl('tasks_all.php'),
    allTasksFreelancer: buildUrl('tasks_all_freelancer.php'),

    // ---- Task details features
    listAttachments: buildUrl('list_attachments.php'),
    uploadAttachment: buildUrl('upload_attachment.php'),
    deleteAttachment: buildUrl('delete_attachment.php'),
    getTaskLink: buildUrl('get_task_link.php'),
    setTaskLink: buildUrl('set_task_link.php'),
    listNotes: buildUrl('list_notes.php'),
    addNote: buildUrl('add_note.php'),

    projectSummariesClient: buildUrl('get_project_summaries_client.php'),
    projectSummaries: buildUrl('get_project_summaries.php'),
    projectSummary: (projectId: number) => buildUrl('get_project_summaries.php', { project_id: projectId }), // ❌ buang space + guna params

    createProject: buildUrl('create_project.php'),
    projectsOptions: buildUrl('get_projects_options.php'),
    createTask: buildUrl('create_task.php'),

    claimInstallSubscriptions: buildUrl('claim_install_subscriptions.php'),
    savePushNotifications: buildUrl('save_push_subscription.php'),

    savePrayerSettings: buildUrl('save_prayer_settings.php'),
    getPrayerSettings: buildUrl('get_prayer_settings.php'),

    // ---- Notifications (jadikan function supaya pass params dengan selamat)
    notificationsList: (page: number, per_page: number, status: 'all' | 'unread' = 'all') =>
        buildUrl('notifications_list.php', { page, per_page, status }),
    notificationsCreate: buildUrl('notifications_create.php'),
    notificationsMarkRead: buildUrl('notifications_mark_read.php'),
    notificationsMarkAllRead: buildUrl('notifications_mark_all_read.php'),
    notificationsBadge: buildUrl('notifications_badge.php'),
    notificationsSendPush: buildUrl('notifications_send_push.php'),



    projectsCalendar: buildUrl(`projects_calendar.php`),


    me: buildUrl('/get_my_profile.php'),
    updateMe: buildUrl('/update_my_profile.php'),
    uploadAvatar: buildUrl('/upload_avatar.php'),
    getUserDetails: buildUrl('get_user_details.php'),


    changePassword: buildUrl('/change_password.php'),

    taskStatus: (id: number) => buildUrl('/update_status.php', { id }),




    // task assignees
    addTaskAssignee: buildUrl('/task_assignees_add.php'),
    removeTaskAssignee: buildUrl('/task_assignees_remove.php'),
    listTaskAssignees: buildUrl('/task_assignees_list.php'),

    urlListTaskAssignees: buildUrl('/task_assignees_list.php'),
    urlAssignTaskAssignee: buildUrl('/task_assignees_assign.php'),
    urlUpdateTaskAssigneeRole: buildUrl('/task_assignees_update_role.php'),
    urlRemoveTaskAssignee: buildUrl('/task_assignees_remove.php'),

    urlGetFreelancers: buildUrl('/freelancers_simple.php'), // <--- TAMBAH INI
};


// buildUrl('/task_assignees_list.php', { task_id: taskId });
// buildUrl('/task_assignees_assign.php');
// buildUrl('/task_assignees_update_role.php');
// buildUrl('/task_assignees_remove.php', { task_id: taskId, freelancer_id: freelancerId });


// marketing.finite@gmail.com  dah ada
// admin.finite@gmail.com 011
// hr.finite@gmail.com 011

// pass finite123