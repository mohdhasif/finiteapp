import {
    ProjectListScreen,
    ProjectTaskListScreen,
    TaskDetailsScreen,
    NotificationsScreen,
    ProfileScreen,
    MyProfileScreen,
    ChangePasswordScreen,
    FAQScreen,
    BarredInfoScreen,
} from '../client';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function ClientStack() {
    const navigation = useNavigation();
    const { clientStatus } = useAuth();

    useEffect(() => {
        // if barred → reset to info screen once
        if (clientStatus === 'barred') {
            // @ts-ignore
            navigation.reset({ index: 0, routes: [{ name: 'BarredInfoScreen' as any }] });
        }
    }, [clientStatus, navigation]);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {clientStatus === 'barred' ? (
                <>
                    <Stack.Screen name="BarredInfoScreen" component={BarredInfoScreen} />
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                    <Stack.Screen name="MyProfileScreen" component={MyProfileScreen} />
                    <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
                    <Stack.Screen name="FAQScreen" component={FAQScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="ProjectListScreen" component={ProjectListScreen} />
                    <Stack.Screen name="ProjectTaskListScreen" component={ProjectTaskListScreen} />
                    <Stack.Screen name="TaskDetailsScreen" component={TaskDetailsScreen} />
                    <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                    <Stack.Screen name="MyProfileScreen" component={MyProfileScreen} />
                    <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
                    <Stack.Screen name="FAQScreen" component={FAQScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
