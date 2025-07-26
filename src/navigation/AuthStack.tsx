import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ServiceScreen from '../screens/ServiceScreen';
import DiscoveryForm from '../screens/DiscoveryForm';
import AboutUs from '../screens/AboutUs';
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import FreelancerFormScreen from '../screens/FreelancerFormScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="SplashScreen"
                component={SplashScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="ServiceScreen"
                component={ServiceScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="DiscoveryForm"
                component={DiscoveryForm}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="AboutUs"
                component={AboutUs}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="LoadingScreen"
                component={LoadingScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
            <Stack.Screen
                name="FreelancerFormScreen"
                component={FreelancerFormScreen}
                options={{ headerShown: false }} // ✅ buang header
            />
        </Stack.Navigator>
    );
}
