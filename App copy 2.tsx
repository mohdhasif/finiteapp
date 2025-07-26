import { AuthProvider, useAuth } from './src/context/AuthContext'; // adjust path
import ClientStack from './src/navigation/ClientStack';
import AdminStack from './src/navigation/AdminStack';
import FreelancerStack from './src/navigation/FreelancerStack';
import AuthStack from './src/navigation/AuthStack'; // for login/splash
import { NavigationContainer } from '@react-navigation/native';

function RootNavigator() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <AuthStack />;

  switch (role) {
    case 'client':
      return <ClientStack />;
    case 'admin':
      return <AdminStack />;
    case 'freelancer':
      return <FreelancerStack />;
    default:
      return <AuthStack />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
