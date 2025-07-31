import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../admin/AdminHomeScreen';
import AdminProjectListScreen from '../admin/AdminProjectListScreen';
import AdminProjectTaskListScreen from '../admin/AdminProjectTaskListScreen';
import AdminTaskDetailsScreen from '../admin/AdminTaskDetailsScreen';

import AdminProfileScreen from '../admin/AdminProfileScreen';
import AdminChangePasswordScreen from '../admin/AdminChangePasswordScreen';
import AdminMyProfileScreen from '../admin/AdminMyProfileScreen';
import AdminFAQScreen from '../admin/AdminFAQScreen';
import AdminCreateProjectScreen from '../admin/AdminCreateProjectScreen';
import ClientListScreen from '../admin/ClientListScreen';
import ClientApprovalScreen from '../admin/ClientApprovalScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} />
            <Stack.Screen name="AdminProjectListScreen" component={AdminProjectListScreen} />
            <Stack.Screen name="AdminProjectTaskListScreen" component={AdminProjectTaskListScreen} />
            <Stack.Screen name="AdminTaskDetailsScreen" component={AdminTaskDetailsScreen} />
            <Stack.Screen name="AdminProfileScreen" component={AdminProfileScreen} />
            <Stack.Screen name="AdminChangePasswordScreen" component={AdminChangePasswordScreen} />
            <Stack.Screen name="AdminMyProfileScreen" component={AdminMyProfileScreen} />
            <Stack.Screen name="AdminFAQScreen" component={AdminFAQScreen} />
            <Stack.Screen name="AdminCreateProjectScreen" component={AdminCreateProjectScreen} />
            <Stack.Screen name="ClientListScreen" component={ClientListScreen} />
            <Stack.Screen name="ClientApprovalScreen" component={ClientApprovalScreen} />
        </Stack.Navigator>
    );
}
