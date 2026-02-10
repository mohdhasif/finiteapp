import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  FreelancersHomeScreen,
  FreelancerProjectListScreen,
  FreelancerProjectTaskListScreen,
  FreelancerTaskDetailsScreen,
  FreelancerNotificationsScreen,
  FreelancerProfileScreen,
  FreelancerMyProfileScreen,
  FreelancerChangePasswordScreen,
  FreelancerFAQScreen
} from '../freelancers';

const Stack = createNativeStackNavigator();

export default function FreelancerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FreelancersHomeScreen" component={FreelancersHomeScreen} />
            <Stack.Screen name="FreelancerProjectListScreen" component={FreelancerProjectListScreen} />
            <Stack.Screen name="FreelancerProjectTaskListScreen" component={FreelancerProjectTaskListScreen} />
            <Stack.Screen name="FreelancerTaskDetailsScreen" component={FreelancerTaskDetailsScreen} />
            <Stack.Screen name="FreelancerNotificationsScreen" component={FreelancerNotificationsScreen} />
            <Stack.Screen name="FreelancerProfileScreen" component={FreelancerProfileScreen} />
            <Stack.Screen name="FreelancerMyProfileScreen" component={FreelancerMyProfileScreen} />
            <Stack.Screen name="FreelancerChangePasswordScreen" component={FreelancerChangePasswordScreen} />
            <Stack.Screen name="FreelancerFAQScreen" component={FreelancerFAQScreen} />
        </Stack.Navigator>
    );
}
