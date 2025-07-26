import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import AuthStack from './AuthStack';
import ClientStack from './ClientStack';
import AdminStack from './AdminStack';
import FreelancerStack from './FreelancerStack';

const AppNavigator = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0072B5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userRole === 'client' && <ClientStack />}
      {userRole === 'admin' && <AdminStack />}
      {userRole === 'freelancer' && <FreelancerStack />}
      {!['client', 'admin', 'freelancer'].includes(userRole || '') && <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
