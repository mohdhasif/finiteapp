import ProjectListScreen from '../client/ProjectListScreen';
import ProjectTaskListScreen from '../client/ProjectTaskListScreen';
import TaskDetailsScreen from '../client/TaskDetailsScreen';
import NotificationsScreen from '../client/NotificationsScreen';
import ProfileScreen from '../client/ProfileScreen';
import MyProfileScreen from '../client/MyProfileScreen';
import ChangePasswordScreen from '../client/ChangePasswordScreen';
import FAQScreen from '../client/FAQScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function ClientStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="ProjectListScreen"
                component={ProjectListScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="ProjectTaskListScreen"
                component={ProjectTaskListScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="TaskDetailsScreen"
                component={TaskDetailsScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="NotificationsScreen"
                component={NotificationsScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="MyProfileScreen"
                component={MyProfileScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="ChangePasswordScreen"
                component={ChangePasswordScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="FAQScreen"
                component={FAQScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
        </Stack.Navigator>
    );
}
