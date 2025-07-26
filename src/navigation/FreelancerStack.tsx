import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FreelancersHomeScreen from '../freelancers/FreelancersHomeScreen';

const Stack = createNativeStackNavigator();

export default function FreelancerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FreelancersHomeScreen" component={FreelancersHomeScreen} />
        </Stack.Navigator>
    );
}
