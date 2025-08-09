export type RootStackParamList = {
  Splash: undefined;
  HomeScreen: undefined;
  ServiceScreen: undefined;
  NotificationsScreen: undefined;
  DiscoveryForm: { selectedServices: string[] }; // ✅ betul di sini
  TaskDetailsScreen: { task: string }; // ✅ betul di sini
  ProfileScreen: undefined; // ✅ betul di sini
  LoginScreen: undefined; // ✅ betul di sini
  FabMenu: undefined; // ✅ betul di sini
  AboutUs: undefined; // ✅ betul di sini
  MyProfileScreen: undefined; // ✅ betul di sini
  ChangePasswordScreen: undefined; // ✅ betul di sini
  FAQScreen: undefined; // ✅ betul di sini
  FreelancerFormScreen: undefined; // ✅ betul di sini
  LoadingScreen: { role: string }; // ✅ betul di sini
  AdminHomeScreen: undefined;
  AdminProjectListScreen: undefined;
  AdminProjectTaskListScreen: { project_title: string, project_id: number }; // ✅ betul di sini
  AdminTaskDetailsScreen: { task_title: string, task_id: number }; // ✅ betul di sini



  AdminProfileScreen: undefined;
  AdminChangePasswordScreen: undefined;
  AdminMyProfileScreen: undefined;
  AdminFAQScreen: undefined;

  AdminCreateProjectScreen: undefined;
  AdminCreateTaskScreen: undefined;


  ProjectListScreen: undefined;
  ProjectTaskListScreen: {
    projectId: number;
    projectTitle: string;
  };
  ProjectDetailsScreen: { projectId: number };


  ClientListScreen: undefined;

  ClientApprovalScreen: { client: any }; // tukar `any` ke type sebenar kalau ada

  FreelancerListScreen: undefined;



  FreelancerApprovalScreen: { freelancer: any }; // tukar `any` ke type sebenar kalau ada
};
